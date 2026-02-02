import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * SEND-BRAND-EVENT-EMAIL EDGE FUNCTION
 * 
 * Purpose: System-triggered emails based on domain/brand lifecycle events
 * 
 * Architecture:
 * - Maps event_type to template_key
 * - Extracts relevant data from payload
 * - Calls send-email function internally
 * - Used by other system events (domain activation, SSL issuance, etc.)
 * 
 * Event Types:
 * - domain_activated: When custom domain becomes active
 * - brand_created: When new brand is created
 * - ssl_issued: When SSL certificate is issued
 * - domain_failed: When domain verification fails
 */

// Event type to template key mapping
const EVENT_TEMPLATE_MAP: Record<string, string> = {
    'domain_activated': 'domain_activated',
    'brand_created': 'brand_created',
    'ssl_issued': 'domain_activated', // Reuse domain_activated template
    'domain_failed': 'domain_verification_failed',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { event_type, brand_id, recipient_email, payload = {} } = await req.json()

        // Validate required inputs
        if (!event_type) {
            throw new Error('event_type is required')
        }
        if (!brand_id) {
            throw new Error('brand_id is required')
        }
        if (!recipient_email) {
            throw new Error('recipient_email is required')
        }

        console.log(`[send-brand-event-email] Processing event: ${event_type} for brand ${brand_id}`)

        // Map event type to template key
        const template_key = EVENT_TEMPLATE_MAP[event_type]

        if (!template_key) {
            throw new Error(`Unknown event type: ${event_type}`)
        }

        // Prepare template data based on event type
        let template_data: Record<string, any> = { ...payload }

        // Add event-specific data
        switch (event_type) {
            case 'domain_activated':
            case 'ssl_issued':
                template_data = {
                    domain_name: payload.domain_name || payload.domain,
                    activated_at: payload.activated_at || new Date().toISOString(),
                    ...payload,
                }
                break

            case 'brand_created':
                template_data = {
                    admin_url: payload.admin_url || 'https://agents-institute.com/admin',
                    ...payload,
                }
                break

            case 'domain_failed':
                template_data = {
                    domain_name: payload.domain_name || payload.domain,
                    error_details: payload.error_message || 'Unknown error',
                    ...payload,
                }
                break
        }

        console.log(`[send-brand-event-email] Calling send-email with template: ${template_key}`)

        // Call send-email function
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

        const sendEmailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-email`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    brand_id,
                    template_key,
                    recipient_email,
                    template_data,
                }),
            }
        )

        const result = await sendEmailResponse.json()

        if (!result.success) {
            console.error('[send-brand-event-email] send-email failed:', result.error)
            throw new Error(result.error || 'Failed to send email')
        }

        console.log(`[send-brand-event-email] Email sent successfully for event: ${event_type}`)

        return new Response(
            JSON.stringify({
                success: true,
                event_type,
                template_key,
                email_id: result.email_id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('[send-brand-event-email] Error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'An unexpected error occurred',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
