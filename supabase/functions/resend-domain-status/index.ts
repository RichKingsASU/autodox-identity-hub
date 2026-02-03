import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * RESEND-DOMAIN-STATUS EDGE FUNCTION
 * 
 * Purpose: Check Resend domain verification status and update database
 * 
 * Architecture:
 * - Loads brand email settings
 * - Queries Resend API for domain verification status
 * - Updates sending_domain_status in database
 * - Returns current status and DNS records
 * 
 * Usage:
 * - Called by admin UI after DNS configuration
 * - Can be called periodically to check verification progress
 */

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { brand_id } = await req.json()

        if (!brand_id) {
            throw new Error('brand_id is required')
        }

        console.log(`[resend-domain-status] Checking domain status for brand ${brand_id}`)

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Load brand email settings
        const { data: settings, error: settingsError } = await supabase
            .from('brand_email_settings')
            .select('*')
            .eq('brand_id', brand_id)
            .single()

        if (settingsError || !settings) {
            throw new Error('Brand email settings not found')
        }

        if (!settings.sending_domain) {
            throw new Error('No sending domain configured for this brand')
        }

        console.log(`[resend-domain-status] Checking domain: ${settings.sending_domain}`)

        // Initialize Resend client
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

        // Get domain status from Resend
        const { data: domainData, error: resendError } = await resend.domains.get(settings.sending_domain)

        if (resendError) {
            console.error('[resend-domain-status] Resend API error:', resendError)

            // Update status to failed
            await supabase
                .from('brand_email_settings')
                .update({
                    sending_domain_status: 'failed',
                })
                .eq('brand_id', brand_id)

            throw new Error(`Failed to check domain status: ${resendError.message}`)
        }

        console.log(`[resend-domain-status] Domain data:`, domainData)

        // Determine verification status
        const isVerified = domainData?.status === 'verified'
        const newStatus = isVerified ? 'verified' : 'pending'

        // Update database with current status and DNS records
        const { error: updateError } = await supabase
            .from('brand_email_settings')
            .update({
                sending_domain_status: newStatus,
                sending_domain_dns_records: domainData?.records || [],
            })
            .eq('brand_id', brand_id)

        if (updateError) {
            console.error('[resend-domain-status] Failed to update database:', updateError)
            throw updateError
        }

        console.log(`[resend-domain-status] Updated domain status to: ${newStatus}`)

        return new Response(
            JSON.stringify({
                success: true,
                domain: settings.sending_domain,
                status: newStatus,
                verified: isVerified,
                dns_records: domainData?.records || [],
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('[resend-domain-status] Error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
