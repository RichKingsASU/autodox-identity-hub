
-- Update the notify_application_status_change trigger to include the INTERNAL_WEBHOOK_SECRET auth header
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
  webhook_secret text;
BEGIN
  -- Only trigger if status changed from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'applications',
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'company_name', NEW.company_name,
        'status', NEW.status
      ),
      'old_record', jsonb_build_object(
        'status', OLD.status
      )
    );

    -- Retrieve webhook secret from vault or app settings
    webhook_secret := current_setting('app.webhook_secret', true);

    -- Call the edge function via HTTP with authentication
    BEGIN
      PERFORM extensions.http_post(
        url := 'https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/notify-application-status',
        body := payload,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', CASE 
            WHEN webhook_secret IS NOT NULL AND webhook_secret != '' 
            THEN 'Bearer ' || webhook_secret
            ELSE ''
          END
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send application status webhook: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
