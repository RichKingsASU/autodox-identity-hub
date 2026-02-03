import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerificationEmailRequest {
  email: string;
  userName?: string;
  brand_id?: string;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client early for error logging
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, userName, brand_id }: VerificationEmailRequest = await req.json();

    const displayName = userName || email.split("@")[0];
    const safeDisplayName = escapeHtml(displayName);

    // Get brand email settings for dynamic sender
    let fromName = "Autodox";
    let fromEmail = "noreply@email.agents-institute.com";

    const { data: settings } = await supabase
      .from("brand_email_settings")
      .select("from_name, from_email")
      .limit(1)
      .single();

    if (settings) {
      fromName = settings.from_name;
      fromEmail = settings.from_email;
    }

    const fromAddress = `${fromName} <${fromEmail}>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Verify Your Email - ${fromName}`,
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
                        ✉️ Verify Your Email
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <p style="margin: 0 0 20px; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        Hi ${safeDisplayName},
                      </p>
                      <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                        Welcome to ${fromName}! We're excited to have you on board. Please check your inbox for a verification link from Supabase to complete your registration.
                      </p>
                      
                      <!-- Info Box -->
                      <div style="background-color: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <p style="margin: 0; color: #e0e0e0; font-size: 15px; line-height: 1.6;">
                          <strong>📧 Next Steps:</strong>
                        </p>
                        <ol style="margin: 10px 0 0; padding-left: 20px; color: #b0b0b0; font-size: 14px; line-height: 1.8;">
                          <li>Check your inbox (and spam folder) for the verification email</li>
                          <li>Click the verification link in that email</li>
                          <li>You'll be redirected back to sign in</li>
                        </ol>
                      </div>
                      
                      <p style="margin: 20px 0; color: #888888; font-size: 14px; line-height: 1.6;">
                        If you don't see the verification email within a few minutes, check your spam folder or request a new verification link.
                      </p>
                      
                      <!-- Security Notice -->
                      <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-top: 20px;">
                        <p style="margin: 0; color: #888888; font-size: 13px; line-height: 1.5;">
                          🛡️ <strong style="color: #a0a0a0;">Security tip:</strong> This email was sent because someone registered with this address on ${fromName}. If this wasn't you, you can safely ignore this email.
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

    const data = await res.json();
    const status = res.ok ? "sent" : "failed";

    // Log to email_logs with required from_email field
    await supabase.from("email_logs").insert({
      to_email: email,
      from_email: fromAddress,
      subject: `Verify Your Email - ${fromName}`,
      resend_id: data.id || null,
      status: status,
      error_message: res.ok ? null : JSON.stringify(data),
    });

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(JSON.stringify({ error: data }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-signup-verification function:", error);
    
    // Log error to debug_logs for admin visibility
    await supabase.from("debug_logs").insert({
      function_name: "send-signup-verification",
      error_type: "error",
      error_message: error.message,
      error_stack: error.stack || null,
    });

    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
