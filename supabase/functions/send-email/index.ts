import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  brand_id?: string;
  template_key?: string;
}

interface BrandEmailSettings {
  from_name: string;
  from_email: string;
  reply_to_email: string | null;
  custom_api_key: string | null;
}

// Sanitize payload for logging (remove sensitive data)
function sanitizePayload(payload: any): any {
  if (!payload) return null;
  const sanitized = { ...payload };
  // Remove sensitive fields
  delete sanitized.html;
  delete sanitized.custom_api_key;
  if (sanitized.to && Array.isArray(sanitized.to)) {
    sanitized.to = sanitized.to.map((email: string) => 
      email.replace(/(.{3}).*@/, '$1***@')
    );
  } else if (typeof sanitized.to === 'string') {
    sanitized.to = sanitized.to.replace(/(.{3}).*@/, '$1***@');
  }
  return sanitized;
}

// Log error to debug_logs table
async function logError(
  supabase: any,
  functionName: string,
  error: Error,
  requestPayload?: any,
  brandId?: string,
  userId?: string,
  responseStatus?: number
) {
  try {
    await supabase.from('debug_logs').insert({
      function_name: functionName,
      error_type: 'error',
      error_message: error.message,
      error_stack: error.stack || null,
      request_payload: sanitizePayload(requestPayload),
      response_status: responseStatus || 500,
      brand_id: brandId || null,
      user_id: userId || null,
    });
  } catch (logError) {
    console.error('Failed to log error to debug_logs:', logError);
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
    template_key?: string;
    resend_id?: string;
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
    error_message?: string;
  }
) {
  try {
    await supabase.from('email_logs').insert({
      brand_id: options.brand_id || null,
      to_email: options.to_email,
      from_email: options.from_email,
      subject: options.subject,
      template_key: options.template_key || null,
      resend_id: options.resend_id || null,
      status: options.status,
      error_message: options.error_message || null,
    });
  } catch (logError) {
    console.error('Failed to log email to email_logs:', logError);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");
  let requestPayload: SendEmailRequest | null = null;

  try {
    requestPayload = await req.json();
    const { to, subject, html, brand_id, template_key } = requestPayload!;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Resolve brand email settings
    let fromAddress = "Agent Institute <noreply@email.agents-institute.com>";
    let replyTo: string | undefined;
    let apiKey = DEFAULT_RESEND_API_KEY;

    if (brand_id) {
      const { data: settings, error: settingsError } = await supabase
        .from('brand_email_settings')
        .select('from_name, from_email, reply_to_email, custom_api_key')
        .eq('brand_id', brand_id)
        .single();

      if (!settingsError && settings) {
        const brandSettings = settings as BrandEmailSettings;
        fromAddress = `${brandSettings.from_name} <${brandSettings.from_email}>`;
        if (brandSettings.reply_to_email) {
          replyTo = brandSettings.reply_to_email;
        }
        if (brandSettings.custom_api_key) {
          apiKey = brandSettings.custom_api_key;
        }
      } else {
        // Fallback: try to get brand name for sender
        const { data: brand } = await supabase
          .from('brands')
          .select('name')
          .eq('id', brand_id)
          .single();

        if (brand) {
          fromAddress = `${brand.name} <noreply@email.agents-institute.com>`;
        }
      }
    }

    if (!apiKey) {
      const error = new Error("No Resend API key configured");
      await logError(supabase, 'send-email', error, requestPayload, brand_id);
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend
    const emailPayload: any = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    if (replyTo) {
      emailPayload.reply_to = replyTo;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();
    const toEmail = Array.isArray(to) ? to.join(', ') : to;

    if (!res.ok) {
      const error = new Error(data.message || 'Resend API error');
      await logError(supabase, 'send-email', error, requestPayload, brand_id, undefined, res.status);
      await logEmail(supabase, {
        brand_id,
        to_email: toEmail,
        from_email: fromAddress,
        subject,
        template_key,
        status: 'failed',
        error_message: data.message || 'Resend API error',
      });

      return new Response(
        JSON.stringify({ success: false, error: "Email delivery failed" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log successful email
    await logEmail(supabase, {
      brand_id,
      to_email: toEmail,
      from_email: fromAddress,
      subject,
      template_key,
      resend_id: data.id,
      status: 'sent',
    });

    return new Response(
      JSON.stringify({ success: true, email_id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-email:", error);
    await logError(supabase, 'send-email', error, requestPayload);

    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
