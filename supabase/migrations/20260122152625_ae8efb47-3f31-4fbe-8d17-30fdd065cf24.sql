-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to call edge function on status change
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  supabase_url text;
  anon_key text;
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

    -- Call the edge function via HTTP
    PERFORM extensions.http_post(
      url := 'https://eecxwrxxtbaecbblpovl.supabase.co/functions/v1/notify-application-status',
      body := payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on applications table
DROP TRIGGER IF EXISTS on_application_status_change ON public.applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();