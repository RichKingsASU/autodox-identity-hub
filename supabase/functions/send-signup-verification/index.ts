import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: VerificationEmailRequest = await req.json();

    const displayName = userName || email.split("@")[0];
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "";

    const emailResponse = await resend.emails.send({
      from: "Autodox <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Email - Autodox",
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
                        Hi ${displayName},
                      </p>
                      <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                        Welcome to Autodox! We're excited to have you on board. Please check your inbox for a verification link from Supabase to complete your registration.
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
                          🛡️ <strong style="color: #a0a0a0;">Security tip:</strong> This email was sent because someone registered with this address on Autodox. If this wasn't you, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                      <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                        © ${new Date().getFullYear()} Autodox. All rights reserved.
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
    });

    console.log("Verification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-signup-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
