import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HTML escape helper to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase admin client early for error logging
  const supabase = createClient(
    SUPABASE_URL ?? "",
    SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate recovery link using Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://id-preview--0a37aa5a-3fc4-4b72-b02f-57327c080f4b.lovable.app"}/reset-password`,
      },
    });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      // Return generic error to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = linkData.properties.action_link;
    const userName = email.split("@")[0];
    const safeUserName = escapeHtml(userName);

    // Get brand email settings for dynamic sender
    const { data: settings } = await supabase
      .from("brand_email_settings")
      .select("from_name, from_email")
      .limit(1)
      .single();

    const fromName = settings?.from_name || "Autodox";
    const fromEmail = settings?.from_email || "noreply@email.agents-institute.com";
    const fromAddress = `${fromName} <${fromEmail}>`;

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Reset Your Password - ${fromName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                          🔐 Password Reset
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 20px 40px;">
                        <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                          Hi ${safeUserName},
                        </p>
                        <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                          We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 10px 0 30px;">
                              <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 20px; color: #888888; font-size: 14px; line-height: 1.6;">
                          This link will expire in 24 hours. If you didn't request this reset, you can safely ignore this email.
                        </p>
                        
                        <!-- Security Notice -->
                        <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-top: 20px;">
                          <p style="margin: 0; color: #888888; font-size: 13px; line-height: 1.5;">
                            🛡️ <strong style="color: #a0a0a0;">Security tip:</strong> Never share your password or this link with anyone. ${fromName} will never ask for your password via email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                          © ${new Date().getFullYear()} ${fromName}. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0; color: #555555; font-size: 11px; text-align: center;">
                          If the button doesn't work, copy and paste this link into your browser:<br>
                          <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    const resendData = await res.json();
    const status = res.ok ? "sent" : "failed";

    // Log to email_logs with required from_email field
    await supabase.from("email_logs").insert({
      to_email: email,
      from_email: fromAddress,
      subject: `Reset Your Password - ${fromName}`,
      resend_id: resendData.id || null,
      status: status,
      error_message: res.ok ? null : JSON.stringify(resendData),
    });

    if (!res.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send reset email" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    
    // Log error to debug_logs for admin visibility
    await supabase.from("debug_logs").insert({
      function_name: "request-password-reset",
      error_type: "error",
      error_message: error.message,
      error_stack: error.stack || null,
    });

    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
