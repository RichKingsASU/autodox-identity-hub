import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  name: string;
  email: string;
  company?: string;
  message: string;
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

// Sanitize payload for logging
function sanitizePayload(payload: any): any {
  if (!payload) return null;
  const sanitized = { ...payload };
  if (sanitized.email) {
    sanitized.email = sanitized.email.replace(/(.{3}).*@/, '$1***@');
  }
  if (sanitized.message && sanitized.message.length > 100) {
    sanitized.message = sanitized.message.substring(0, 100) + '...';
  }
  return sanitized;
}

// Log error to debug_logs table
async function logError(
  supabase: any,
  functionName: string,
  error: Error,
  requestPayload?: any,
  brandId?: string
) {
  try {
    await supabase.from('debug_logs').insert({
      function_name: functionName,
      error_type: 'error',
      error_message: error.message,
      error_stack: error.stack || null,
      request_payload: sanitizePayload(requestPayload),
      brand_id: brandId || null,
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

// Log email to email_logs table
async function logEmail(
  supabase: any,
  options: {
    brand_id?: string;
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");
  let requestPayload: ContactNotificationRequest | null = null;

  try {
    requestPayload = await req.json();
    const { name, email, company, message, brand_id } = requestPayload!;

    // Sanitize all user inputs
    const safeName = escapeHtml(name || "");
    const safeEmail = escapeHtml(email || "");
    const safeCompany = company ? escapeHtml(company) : "";
    const safeMessage = escapeHtml(message || "").replace(/\n/g, "<br>");

    // Resolve brand settings for dynamic sender
    let fromName = "Autodox Contact";
    let fromEmail = "noreply@email.agents-institute.com";
    let adminEmail = "hello@autodox.io";

    if (brand_id) {
      const { data: settings } = await supabase
        .from('brand_email_settings')
        .select('from_name, from_email, reply_to_email')
        .eq('brand_id', brand_id)
        .single();

      if (settings) {
        fromName = `${settings.from_name} Contact`;
        fromEmail = settings.from_email;
        if (settings.reply_to_email) {
          adminEmail = settings.reply_to_email;
        }
      } else {
        // Fallback to brand name
        const { data: brand } = await supabase
          .from('brands')
          .select('name')
          .eq('id', brand_id)
          .single();

        if (brand) {
          fromName = `${brand.name} Contact`;
        }
      }
    }

    const fromAddress = `${fromName} <${fromEmail}>`;

    // Send notification to admin
    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [adminEmail],
        subject: `New Contact Form Submission from ${safeName}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          ${safeCompany ? `<p><strong>Company:</strong> ${safeCompany}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Sent from Contact Form</p>
        `,
      }),
    });

    const adminData = await adminRes.json();

    await logEmail(supabase, {
      brand_id,
      to_email: adminEmail,
      from_email: fromAddress,
      subject: `New Contact Form Submission from ${safeName}`,
      resend_id: adminData.id,
      status: adminRes.ok ? 'sent' : 'failed',
      error_message: adminRes.ok ? undefined : adminData.message,
    });

    // Send confirmation to the user
    const userRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: "We received your message!",
        html: `
          <h1>Thank you for contacting us, ${safeName}!</h1>
          <p>We have received your message and will get back to you within 24 hours.</p>
          <p>Here's a copy of your message:</p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 16px; color: #555;">
            ${safeMessage}
          </blockquote>
          <p>Best regards,<br>The Team</p>
        `,
      }),
    });

    const userData = await userRes.json();

    await logEmail(supabase, {
      brand_id,
      to_email: email,
      from_email: fromAddress,
      subject: "We received your message!",
      resend_id: userData.id,
      status: userRes.ok ? 'sent' : 'failed',
      error_message: userRes.ok ? undefined : userData.message,
    });

    // Update last_notified_at on contact submission if it exists
    if (email) {
      await supabase
        .from('contact_submissions')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    return new Response(
      JSON.stringify({ success: true, adminNotification: adminData, userConfirmation: userData }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification:", error);
    await logError(supabase, 'send-contact-notification', error, requestPayload);

    return new Response(
      JSON.stringify({ success: false, error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
