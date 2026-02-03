import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { domain_id } = await req.json()

        if (!domain_id) {
            throw new Error('domain_id is required')
        }

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get domain details
        const { data: domain, error: fetchError } = await supabase
            .from('domains')
            .select('*')
            .eq('id', domain_id)
            .single()

        if (fetchError || !domain) {
            throw new Error('Domain not found')
        }

        console.log(`Checking SSL status for domain ${domain.domain}...`)

        // Check SSL status via Netlify API
        const netlifyResponse = await fetch(
            `https://api.netlify.com/api/v1/sites/${Deno.env.get('NETLIFY_SITE_ID')}/ssl`,
            {
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('NETLIFY_ACCESS_TOKEN')}`,
                },
            }
        )

        if (!netlifyResponse.ok) {
            const errorData = await netlifyResponse.json()
            console.error('Netlify SSL API error:', errorData)
            throw new Error(`Netlify API error: ${JSON.stringify(errorData)}`)
        }

        const sslData = await netlifyResponse.json()
        console.log('Netlify SSL data:', sslData)

        // Find SSL cert for this domain
        const domainSSL = sslData.domains?.find((d: any) => d.domain === domain.domain)
        const sslActive = domainSSL?.state === 'issued'
        const sslState = domainSSL?.state || 'pending'

        console.log(`SSL status for ${domain.domain}: ${sslState}`)

        // Update domain based on SSL status
        if (sslActive && domain.status !== 'active') {
            // SSL is active, mark domain as active
            await supabase
                .from('domains')
                .update({
                    status: 'active',
                    ssl_status: 'issued',
                    error_message: null,
                })
                .eq('id', domain_id)

            // Log activation event
            await supabase.from('domain_events').insert({
                domain_id,
                event_type: 'activated',
                details: {
                    ssl_state: 'issued',
                    activated_at: new Date().toISOString(),
                },
            })

            console.log(`Domain ${domain.domain} activated successfully`)
        } else if (domain.status === 'verified' && sslState !== 'issued') {
            // DNS verified but SSL not yet issued, update to provisioning
            await supabase
                .from('domains')
                .update({
                    status: 'provisioning_ssl',
                    ssl_status: sslState,
                })
                .eq('id', domain_id)

            // Log SSL provisioning event
            await supabase.from('domain_events').insert({
                domain_id,
                event_type: 'ssl_provisioning',
                details: { ssl_state: sslState },
            })

            console.log(`Domain ${domain.domain} SSL provisioning in progress`)
        }

        return new Response(
            JSON.stringify({
                ssl_active: sslActive,
                ssl_state: sslState,
                ssl_data: domainSSL,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Error in check-ssl-status:', error)

        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
