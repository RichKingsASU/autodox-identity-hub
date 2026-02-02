# Pre-Production Certification Test Plan

## Phase 1 — Database Layer Tests (Automated)
- [ ] Schema integrity verification
- [ ] RLS policy enforcement tests
- [ ] Domain validation function tests
- [ ] Audit log immutability tests
- [ ] Constraint enforcement tests
- [ ] Cross-brand isolation tests

## Phase 2 — Domain Lifecycle Tests (Manual - Requires Netlify API)
- [ ] Add domain via edge function
- [ ] Retrieve DNS instructions
- [ ] Configure DNS and verify
- [ ] Monitor SSL provisioning
- [ ] Verify HTTPS access
- [ ] Test secondary domain routing

## Phase 3 — Email System Tests (Manual - Requires Resend API)
- [ ] Configure brand email settings
- [ ] Send test emails (all templates)
- [ ] Verify email delivery
- [ ] Test failure modes
- [ ] Verify audit logging

## Phase 4 — Brand Resolution Tests (Manual)
- [ ] Test domain-resolver function
- [ ] Verify unknown domain handling
- [ ] Test inactive domain blocking
- [ ] Verify multi-domain resolution

## Phase 5 — UI Contract Tests (Manual)
- [ ] Verify edge function error handling
- [ ] Test realtime updates
- [ ] Simulate API failures
- [ ] Verify state consistency

## Phase 6 — Audit & Observability (Automated)
- [ ] Query domain_events completeness
- [ ] Query email_events completeness
- [ ] Verify log integrity
- [ ] Check for exposed secrets

## Phase 7 — Final Report
- [ ] Generate test summary table
- [ ] Document blocking issues
- [ ] Document non-blocking issues
- [ ] Security risk assessment
- [ ] GO/NO-GO decision
