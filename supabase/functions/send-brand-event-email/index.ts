import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * SEND-BRAND-EVENT-EMAIL EDGE FUNCTION
 * 
 * Purpose: System-triggered emails based on domain/brand lifecycle events
 * Now with dynamic brand sender configuration and error logging
 */

// Event type to template mapping
const EVENT_TEMPLATES: Record<string, { subject: string; getHtml: (data: any, brandName: string) => string }> = {
    'domain_activated': {
        subject: '🌐 Your Domain is Now Active!',
        getHtml: (data, brandName) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🌐 Domain Active!</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                    <p>Great news! Your custom domain <strong>${data.domain_name}</strong> is now fully active with SSL.</p>
                    <p>Your site is now accessible at:</p>
                    <p style="text-align: center; margin: 20px 0;">
                        <a href="https://${data.domain_name}" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Visit ${data.domain_name}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The ${brandName} Team</p>
                </div>
            </body>
            </html>
        `
    },
    'brand_created': {
        subject: '🎉 Welcome to Your New Brand!',
        getHtml: (data, brandName) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎉 Welcome!</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                    <p>Your brand <strong>${brandName}</strong> has been successfully created!</p>
                    <p>You can now configure your domain, customize templates, and start building your presence.</p>
                    <p style="text-align: center; margin: 20px 0;">
                        <a href="${data.admin_url}" style="background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Admin</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Team</p>
                </div>
            </body>
            </html>
        `
    },
    'domain_failed': {
        subject: '⚠️ Domain Verification Issue',
        getHtml: (data, brandName) => `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">⚠️ Action Required</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
                    <p>We encountered an issue verifying your domain <strong>${data.domain_name}</strong>.</p>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <p style="margin: 0; color: #991b1b;"><strong>Error:</strong> ${data.error_details}</p>
                    </div>
                    <p>Please check your DNS settings and try again.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The ${brandName} Team</p>
                </div>
            </body>
            </html>
        `
    },
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
            request_payload: requestPayload ? { ...requestPayload, html: undefined } : null,
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
        template_key?: string;
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

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");
    let requestPayload: any = null;

    try {
        requestPayload = await req.json();
        const { event_type, brand_id, recipient_email, payload = {} } = requestPayload;

        if (!event_type || !brand_id || !recipient_email) {
            throw new Error('Missing required fields: event_type, brand_id, recipient_email')
        }

        console.log(`[send-brand-event-email] Processing event: ${event_type} for brand ${brand_id}`)

        const template = EVENT_TEMPLATES[event_type]
        if (!template) {
            throw new Error(`Unknown event type: ${event_type}`)
        }

        // Resolve brand info and email settings
        let brandName = "Agent Institute";
        let fromAddress = "Agent Institute <noreply@email.agents-institute.com>";

        const { data: brand } = await supabase
            .from('brands')
            .select('name')
            .eq('id', brand_id)
            .single();

        if (brand) {
            brandName = brand.name;
        }

        const { data: settings } = await supabase
            .from('brand_email_settings')
            .select('from_name, from_email')
            .eq('brand_id', brand_id)
            .single();

        if (settings) {
            fromAddress = `${settings.from_name} <${settings.from_email}>`;
        } else {
            fromAddress = `${brandName} <noreply@email.agents-institute.com>`;
        }

        // Build email content
        const subject = template.subject;
        const html = template.getHtml(payload, brandName);

        // Send via Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromAddress,
                to: [recipient_email],
                subject,
                html,
            }),
        });

        const data = await res.json();

        await logEmail(supabase, {
            brand_id,
            to_email: recipient_email,
            from_email: fromAddress,
            subject,
            template_key: event_type,
            resend_id: data.id,
            status: res.ok ? 'sent' : 'failed',
            error_message: res.ok ? undefined : data.message,
        });

        if (!res.ok) {
            throw new Error(data.message || 'Resend API error');
        }

        // Update brand's last_notified_at
        await supabase
            .from('brands')
            .update({ last_notified_at: new Date().toISOString() })
            .eq('id', brand_id);

        console.log(`[send-brand-event-email] Email sent successfully for event: ${event_type}`)

        return new Response(
            JSON.stringify({
                success: true,
                event_type,
                email_id: data.id,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        console.error('[send-brand-event-email] Error:', error)
        await logError(supabase, 'send-brand-event-email', error, requestPayload, requestPayload?.brand_id);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'An unexpected error occurred',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
