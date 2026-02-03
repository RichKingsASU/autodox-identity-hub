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

        if (!domain.netlify_domain_id) {
            throw new Error('Domain not yet added to Netlify')
        }

        console.log(`Verifying DNS for domain ${domain.domain}...`)

        // Check DNS via Netlify API
        const netlifyResponse = await fetch(
            `https://api.netlify.com/api/v1/sites/${Deno.env.get('NETLIFY_SITE_ID')}/domains/${domain.netlify_domain_id}`,
            {
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('NETLIFY_ACCESS_TOKEN')}`,
                },
            }
        )

        if (!netlifyResponse.ok) {
            const errorData = await netlifyResponse.json()
            console.error('Netlify API error:', errorData)
            throw new Error(`Netlify API error: ${JSON.stringify(errorData)}`)
        }

        const netlifyData = await netlifyResponse.json()
        console.log('Netlify domain data:', netlifyData)

        // Check if DNS is verified (dns_zone_id is set when verified)
        const isVerified = netlifyData.dns_zone_id !== null && netlifyData.dns_zone_id !== undefined

        if (isVerified && domain.status !== 'verified') {
            // Update domain status to verified
            await supabase
                .from('domains')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString(),
                    error_message: null,
                })
                .eq('id', domain_id)

            // Log verification event
            await supabase.from('domain_events').insert({
                domain_id,
                event_type: 'dns_verified',
                details: {
                    dns_zone_id: netlifyData.dns_zone_id,
                    verified_at: new Date().toISOString(),
                },
            })

            console.log(`Domain ${domain.domain} DNS verified successfully`)
        }

        return new Response(
            JSON.stringify({
                verified: isVerified,
                status: netlifyData.state,
                dns_zone_id: netlifyData.dns_zone_id,
                details: netlifyData,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Error in verify-domain-dns:', error)

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
