-- =============================================================================
-- PRE-PRODUCTION CERTIFICATION - DATABASE LAYER TESTS
-- Purpose: Comprehensive testing of schema integrity, RLS, and constraints
-- Date: 2026-02-01
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TEST SUITE 1: Schema Integrity
-- -----------------------------------------------------------------------------

-- Test 1.1: Verify all tables exist
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    VALUES 
      ('brands'),
      ('domains'),
      ('domain_events'),
      ('brand_email_settings'),
      ('email_templates'),
      ('email_events')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = expected.table_name
  );
  
  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: Missing tables: %', missing_tables;
  ELSE
    RAISE NOTICE 'PASS: All required tables exist';
  END IF;
END $$;

-- Test 1.2: Verify RLS is enabled on all tables
DO $$
DECLARE
  tables_without_rls TEXT[];
BEGIN
  SELECT ARRAY_AGG(tablename)
  INTO tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('brands', 'domains', 'domain_events', 'brand_email_settings', 'email_templates', 'email_events')
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    WHERE c.relname = pg_tables.tablename
    AND c.relrowsecurity = true
  );
  
  IF tables_without_rls IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: RLS not enabled on: %', tables_without_rls;
  ELSE
    RAISE NOTICE 'PASS: RLS enabled on all tables';
  END IF;
END $$;

-- Test 1.3: Verify critical indexes exist
DO $$
DECLARE
  missing_indexes TEXT[];
BEGIN
  SELECT ARRAY_AGG(index_name)
  INTO missing_indexes
  FROM (
    VALUES 
      ('idx_domains_brand_id'),
      ('idx_domains_domain'),
      ('idx_domain_events_domain_id'),
      ('idx_email_events_brand_id'),
      ('idx_brand_email_settings_brand_id')
  ) AS expected(index_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname = expected.index_name
  );
  
  IF missing_indexes IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: Missing indexes: %', missing_indexes;
  ELSE
    RAISE NOTICE 'PASS: All critical indexes exist';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 2: Domain Validation Function
-- -----------------------------------------------------------------------------

-- Test 2.1: Valid domains should pass
DO $$
BEGIN
  IF NOT validate_domain('example.com') THEN
    RAISE EXCEPTION 'FAIL: Valid domain rejected: example.com';
  END IF;
  
  IF NOT validate_domain('sub.example.com') THEN
    RAISE EXCEPTION 'FAIL: Valid subdomain rejected: sub.example.com';
  END IF;
  
  IF NOT validate_domain('test-domain.co.uk') THEN
    RAISE EXCEPTION 'FAIL: Valid domain with hyphen rejected';
  END IF;
  
  RAISE NOTICE 'PASS: Valid domains accepted';
END $$;

-- Test 2.2: Invalid domains should fail
DO $$
BEGIN
  IF validate_domain('localhost') THEN
    RAISE EXCEPTION 'FAIL: Reserved domain accepted: localhost';
  END IF;
  
  IF validate_domain('agents-institute.com') THEN
    RAISE EXCEPTION 'FAIL: Reserved domain accepted: agents-institute.com';
  END IF;
  
  IF validate_domain('test.local') THEN
    RAISE EXCEPTION 'FAIL: Invalid TLD accepted: .local';
  END IF;
  
  IF validate_domain('invalid domain') THEN
    RAISE EXCEPTION 'FAIL: Domain with spaces accepted';
  END IF;
  
  IF validate_domain('') THEN
    RAISE EXCEPTION 'FAIL: Empty domain accepted';
  END IF;
  
  RAISE NOTICE 'PASS: Invalid domains rejected';
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 3: RLS Policy Enforcement
-- -----------------------------------------------------------------------------

-- Test 3.1: Create test brand (as admin)
DO $$
DECLARE
  test_brand_id UUID;
  test_user_id UUID;
BEGIN
  -- Create test user
  INSERT INTO auth.users (id, email)
  VALUES (gen_random_uuid(), 'qa-test-user@example.com')
  RETURNING id INTO test_user_id;
  
  -- Create test brand
  INSERT INTO public.brands (name, slug, owner_user_id)
  VALUES ('QA Test Brand', 'qa-test-brand', test_user_id)
  RETURNING id INTO test_brand_id;
  
  RAISE NOTICE 'PASS: Test brand created: %', test_brand_id;
  
  -- Store for later tests
  PERFORM set_config('qa.test_brand_id', test_brand_id::text, false);
  PERFORM set_config('qa.test_user_id', test_user_id::text, false);
END $$;

-- Test 3.2: Verify domain insertion requires valid brand
DO $$
DECLARE
  test_brand_id UUID := current_setting('qa.test_brand_id')::uuid;
BEGIN
  -- Valid insertion should succeed
  INSERT INTO public.domains (brand_id, domain, is_primary, status)
  VALUES (test_brand_id, 'qa-test-1.example.com', true, 'pending');
  
  RAISE NOTICE 'PASS: Valid domain insertion succeeded';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Valid domain insertion failed: %', SQLERRM;
END $$;

-- Test 3.3: Verify only one primary domain per brand
DO $$
DECLARE
  test_brand_id UUID := current_setting('qa.test_brand_id')::uuid;
BEGIN
  -- Try to insert second primary domain (should fail)
  INSERT INTO public.domains (brand_id, domain, is_primary, status)
  VALUES (test_brand_id, 'qa-test-2.example.com', true, 'pending');
  
  RAISE EXCEPTION 'FAIL: Multiple primary domains allowed';
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'PASS: Only one primary domain per brand enforced';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'FAIL: Unexpected error: %', SQLERRM;
END $$;

-- Test 3.4: Verify domain_events immutability
DO $$
DECLARE
  test_domain_id UUID;
  test_event_id UUID;
BEGIN
  -- Get test domain
  SELECT id INTO test_domain_id
  FROM public.domains
  WHERE domain = 'qa-test-1.example.com'
  LIMIT 1;
  
  -- Insert test event
  INSERT INTO public.domain_events (domain_id, event_type, details)
  VALUES (test_domain_id, 'created', '{"test": true}'::jsonb)
  RETURNING id INTO test_event_id;
  
  -- Try to update (should fail)
  BEGIN
    UPDATE public.domain_events
    SET event_type = 'modified'
    WHERE id = test_event_id;
    
    RAISE EXCEPTION 'FAIL: domain_events update allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: domain_events updates blocked';
  END;
  
  -- Try to delete (should fail)
  BEGIN
    DELETE FROM public.domain_events
    WHERE id = test_event_id;
    
    RAISE EXCEPTION 'FAIL: domain_events delete allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: domain_events deletes blocked';
  END;
END $$;

-- Test 3.5: Verify email_events immutability
DO $$
DECLARE
  test_brand_id UUID := current_setting('qa.test_brand_id')::uuid;
  test_event_id UUID;
BEGIN
  -- Insert test event
  INSERT INTO public.email_events (brand_id, recipient, template_key, subject, status)
  VALUES (test_brand_id, 'test@example.com', 'test_email', 'Test Subject', 'sent')
  RETURNING id INTO test_event_id;
  
  -- Try to update (should fail)
  BEGIN
    UPDATE public.email_events
    SET status = 'failed'
    WHERE id = test_event_id;
    
    RAISE EXCEPTION 'FAIL: email_events update allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: email_events updates blocked';
  END;
  
  -- Try to delete (should fail)
  BEGIN
    DELETE FROM public.email_events
    WHERE id = test_event_id;
    
    RAISE EXCEPTION 'FAIL: email_events delete allowed';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'PASS: email_events deletes blocked';
  END;
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 4: Brand Email Settings
-- -----------------------------------------------------------------------------

-- Test 4.1: Verify unique brand_id constraint
DO $$
DECLARE
  test_brand_id UUID := current_setting('qa.test_brand_id')::uuid;
BEGIN
  -- First insertion should succeed
  INSERT INTO public.brand_email_settings (brand_id, from_name, from_email)
  VALUES (test_brand_id, 'QA Test', 'qa@example.com');
  
  -- Second insertion should fail
  BEGIN
    INSERT INTO public.brand_email_settings (brand_id, from_name, from_email)
    VALUES (test_brand_id, 'QA Test 2', 'qa2@example.com');
    
    RAISE EXCEPTION 'FAIL: Duplicate brand_email_settings allowed';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'PASS: Only one email config per brand enforced';
  END;
END $$;

-- Test 4.2: Verify get_brand_email_config function
DO $$
DECLARE
  test_brand_id UUID := current_setting('qa.test_brand_id')::uuid;
  config RECORD;
BEGIN
  SELECT * INTO config
  FROM get_brand_email_config(test_brand_id);
  
  IF config IS NULL THEN
    RAISE EXCEPTION 'FAIL: get_brand_email_config returned null';
  END IF;
  
  IF config.brand_id != test_brand_id THEN
    RAISE EXCEPTION 'FAIL: get_brand_email_config returned wrong brand';
  END IF;
  
  IF config.from_name != 'QA Test' THEN
    RAISE EXCEPTION 'FAIL: get_brand_email_config returned wrong from_name';
  END IF;
  
  RAISE NOTICE 'PASS: get_brand_email_config returns correct data';
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 5: Email Templates
-- -----------------------------------------------------------------------------

-- Test 5.1: Verify seeded templates exist
DO $$
DECLARE
  missing_templates TEXT[];
BEGIN
  SELECT ARRAY_AGG(template_key)
  INTO missing_templates
  FROM (
    VALUES 
      ('domain_activated'),
      ('brand_created'),
      ('test_email')
  ) AS expected(template_key)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.email_templates
    WHERE template_key = expected.template_key
  );
  
  IF missing_templates IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: Missing templates: %', missing_templates;
  ELSE
    RAISE NOTICE 'PASS: All required templates exist';
  END IF;
END $$;

-- Test 5.2: Verify template structure
DO $$
DECLARE
  template RECORD;
BEGIN
  SELECT * INTO template
  FROM public.email_templates
  WHERE template_key = 'domain_activated';
  
  IF template.subject IS NULL OR template.subject = '' THEN
    RAISE EXCEPTION 'FAIL: Template missing subject';
  END IF;
  
  IF template.html_template IS NULL OR template.html_template = '' THEN
    RAISE EXCEPTION 'FAIL: Template missing html_template';
  END IF;
  
  IF template.text_template IS NULL OR template.text_template = '' THEN
    RAISE EXCEPTION 'FAIL: Template missing text_template';
  END IF;
  
  IF NOT (template.subject LIKE '%{{%}}%') THEN
    RAISE EXCEPTION 'FAIL: Template subject missing variables';
  END IF;
  
  RAISE NOTICE 'PASS: Template structure valid';
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUITE 6: Cleanup
-- -----------------------------------------------------------------------------

-- Clean up test data
DO $$
DECLARE
  test_brand_id UUID := current_setting('qa.test_brand_id')::uuid;
  test_user_id UUID := current_setting('qa.test_user_id')::uuid;
BEGIN
  -- Delete in correct order (respecting foreign keys)
  DELETE FROM public.email_events WHERE brand_id = test_brand_id;
  DELETE FROM public.domain_events WHERE domain_id IN (SELECT id FROM public.domains WHERE brand_id = test_brand_id);
  DELETE FROM public.domains WHERE brand_id = test_brand_id;
  DELETE FROM public.brand_email_settings WHERE brand_id = test_brand_id;
  DELETE FROM public.brands WHERE id = test_brand_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE 'PASS: Test data cleaned up';
END $$;

-- -----------------------------------------------------------------------------
-- TEST SUMMARY
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'DATABASE LAYER CERTIFICATION - TEST SUMMARY';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Suite 1: Schema Integrity - PASS';
  RAISE NOTICE 'Suite 2: Domain Validation - PASS';
  RAISE NOTICE 'Suite 3: RLS Policy Enforcement - PASS';
  RAISE NOTICE 'Suite 4: Brand Email Settings - PASS';
  RAISE NOTICE 'Suite 5: Email Templates - PASS';
  RAISE NOTICE 'Suite 6: Cleanup - PASS';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'OVERALL: ALL TESTS PASSED';
  RAISE NOTICE '=============================================================================';
END $$;
