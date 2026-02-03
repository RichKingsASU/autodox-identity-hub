import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

if (!RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not configured");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
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

  try {
    const { email, resetLink, userName, brand_id }: PasswordResetRequest = await req.json();

    const displayName = userName || email.split("@")[0];
    const safeDisplayName = escapeHtml(displayName);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Resolve brand and verified domain
    let brandName = "Autodox";
    let domain = "email.agents-institute.com";

    const query = supabase
      .from("brands")
      .select(`
        name,
        domains (
          domain,
          status
        )
      `)
      .eq("domains.is_primary", true)
      .eq("domains.status", "verified");

    if (brand_id) {
      query.eq("id", brand_id);
    } else {
      // Find the first verified brand
      query.limit(1);
    }

    const { data: brandData, error: brandError } = await query.single();

    if (!brandError && brandData) {
      brandName = brandData.name;
      domain = brandData.domains?.[0]?.domain || domain;
    }

    const fromAddress = `${brandName} <noreply@${domain}>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Reset Your Password - ${brandName}`,
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
                          Hi ${safeDisplayName},
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
                            🛡️ <strong style="color: #a0a0a0;">Security tip:</strong> Never share your password or this link with anyone. ${brandName} will never ask for your password via email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                          © ${new Date().getFullYear()} ${brandName}. All rights reserved.
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

    const data = await res.json();
    const status = res.ok ? "sent" : "failed";

    // Log to email_logs
    await supabase.from("email_logs").insert({
      to_email: email,
      subject: `Reset Your Password - ${brandName}`,
      resend_id: data.id || null,
      status: status,
      // Note: We'll need to add an error_details or similar column if we want to store the full JSON error,
      // but for now, we'll log the status to identify failures.
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
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
