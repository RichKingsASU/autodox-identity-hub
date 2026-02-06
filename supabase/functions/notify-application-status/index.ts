import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WebhookPayload {
  type: "UPDATE";
  table: "applications";
  record: {
    id: string;
    user_id: string;
    company_name: string;
    status: "pending" | "approved" | "rejected";
  };
  old_record: {
    status: "pending" | "approved" | "rejected";
  };
}

// HTML escape helper to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Log error to debug_logs table
async function logError(
  supabase: any,
  functionName: string,
  error: Error,
  requestPayload?: any,
  userId?: string
) {
  try {
    await supabase.from('debug_logs').insert({
      function_name: functionName,
      error_type: 'error',
      error_message: error.message,
      error_stack: error.stack || null,
      request_payload: requestPayload ? { ...requestPayload, html: undefined } : null,
      user_id: userId || null,
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

// Log email to email_logs table
async function logEmail(
  supabase: any,
  options: {
    to_email: string;
    from_email: string;
    subject: string;
    resend_id?: string;
    status: 'sent' | 'failed';
    error_message?: string;
  }
) {
  try {
    await supabase.from('email_logs').insert(options);
  } catch (logError) {
    console.error('Failed to log email:', logError);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");
  let payload: WebhookPayload | null = null;

  try {
    // Validate internal webhook secret
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = Deno.env.get("INTERNAL_WEBHOOK_SECRET");
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.error("Unauthorized webhook request");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload));

    // Only process if status actually changed from pending
    if (payload!.old_record.status !== "pending") {
      return new Response(JSON.stringify({ skipped: true, reason: "old status was not pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = payload!.record.status;
    if (newStatus === "pending") {
      return new Response(JSON.stringify({ skipped: true, reason: "new status is still pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", payload!.record.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found: ${profileError?.message}`);
    }

    // Sanitize user inputs for HTML
    const safeFirstName = escapeHtml(profile.first_name || "");
    const safeCompanyName = escapeHtml(payload!.record.company_name || "");

    // Dynamic sender configuration
    const fromAddress = "Agent Institute <noreply@email.agents-institute.com>";

    // Build email HTML based on status
    const approvedEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${safeFirstName},</p>
            <p style="margin-bottom: 20px;">Great news! Your application for <strong>${safeCompanyName}</strong> has been <span style="color: #10b981; font-weight: bold;">approved</span>.</p>
            <p style="margin-bottom: 30px;">You now have full access to all features on your dashboard. Start sending messages and managing your communications right away!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://agents-institute.com" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Agent Institute Team</p>
          </div>
        </body>
      </html>
    `;

    const rejectedEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Application Update</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${safeFirstName},</p>
            <p style="margin-bottom: 20px;">Thank you for your interest. After reviewing your application for <strong>${safeCompanyName}</strong>, we were unable to approve it at this time.</p>
            <p style="margin-bottom: 20px;">This could be due to incomplete information or other requirements. If you believe this was an error or would like more information, please don't hesitate to reach out to our support team.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:hello@agents-institute.com" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Contact Support</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Agent Institute Team</p>
          </div>
        </body>
      </html>
    `;

    const emailHtml = newStatus === "approved" ? approvedEmailHtml : rejectedEmailHtml;
    const subject = newStatus === "approved"
      ? "🎉 Your Application Has Been Approved!"
      : "Application Status Update";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [profile.email],
        subject: subject,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    await logEmail(supabase, {
      to_email: profile.email,
      from_email: fromAddress,
      subject: subject,
      resend_id: data.id,
      status: res.ok ? 'sent' : 'failed',
      error_message: res.ok ? undefined : data.message,
    });

    if (!res.ok) {
      throw new Error(data.message || 'Resend API error');
    }

    // Update last_notified_at on the application
    await supabase
      .from('applications')
      .update({ last_notified_at: new Date().toISOString() })
      .eq('id', payload!.record.id);

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-application-status:", error);
    await logError(supabase, 'notify-application-status', error, payload, payload?.record?.user_id);

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
