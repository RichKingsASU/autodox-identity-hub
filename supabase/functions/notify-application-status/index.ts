import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    
    console.log("Received payload:", JSON.stringify(payload));

    // Only process if status actually changed from pending
    if (payload.old_record.status !== "pending") {
      console.log("Skipping: old status was not pending");
      return new Response(JSON.stringify({ skipped: true, reason: "old status was not pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = payload.record.status;
    if (newStatus === "pending") {
      console.log("Skipping: new status is still pending");
      return new Response(JSON.stringify({ skipped: true, reason: "new status is still pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client to fetch user profile
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", payload.record.user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      throw new Error(`Profile not found: ${profileError?.message}`);
    }

    console.log("Sending email to:", profile.email);

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
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${profile.first_name},</p>
            <p style="margin-bottom: 20px;">Great news! Your application for <strong>${payload.record.company_name}</strong> has been <span style="color: #10b981; font-weight: bold;">approved</span>.</p>
            <p style="margin-bottom: 30px;">You now have full access to all features on your dashboard. Start sending messages and managing your communications right away!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://autodox.io" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Autodox Team</p>
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
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${profile.first_name},</p>
            <p style="margin-bottom: 20px;">Thank you for your interest in Autodox. After reviewing your application for <strong>${payload.record.company_name}</strong>, we were unable to approve it at this time.</p>
            <p style="margin-bottom: 20px;">This could be due to incomplete information or other requirements. If you believe this was an error or would like more information, please don't hesitate to reach out to our support team.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:hello@autodox.io" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Contact Support</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Autodox Team</p>
          </div>
        </body>
      </html>
    `;

    const emailHtml = newStatus === "approved" ? approvedEmailHtml : rejectedEmailHtml;
    const subject = newStatus === "approved"
      ? "🎉 Your Application Has Been Approved!"
      : "Application Status Update";

    const { data, error } = await resend.emails.send({
      from: "Autodox <onboarding@resend.dev>",
      to: [profile.email],
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-application-status:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
