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
        const { brand_id } = await req.json()

        if (!brand_id) {
            throw new Error('brand_id is required')
        }

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get brand details
        const { data: brand, error: fetchError } = await supabase
            .from('brands')
            .select('id, name, domain, domain_status, ssl_status, cloudflare_hostname_id')
            .eq('id', brand_id)
            .single()

        if (fetchError || !brand) {
            throw new Error('Brand not found')
        }

        if (!brand.domain) {
            throw new Error('Brand has no domain configured')
        }

        if (!brand.cloudflare_hostname_id) {
            throw new Error('Domain not yet added to Netlify')
        }

        console.log(`Checking SSL status for domain ${brand.domain}...`)

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
        const domainSSL = sslData.domains?.find((d: any) => d.domain === brand.domain)
        const sslActive = domainSSL?.state === 'issued'
        const sslState = domainSSL?.state || 'pending'

        console.log(`SSL status for ${brand.domain}: ${sslState}`)

        // Update brand based on SSL status
        if (sslActive && brand.domain_status !== 'active') {
            // SSL is active, mark domain as active
            await supabase
                .from('brands')
                .update({
                    domain_status: 'active',
                    ssl_status: 'issued',
                    domain_error: null,
                })
                .eq('id', brand_id)

            console.log(`Domain ${brand.domain} activated successfully`)
        } else if (brand.domain_status === 'verified' && sslState !== 'issued') {
            // DNS verified but SSL not yet issued, update to provisioning
            await supabase
                .from('brands')
                .update({
                    domain_status: 'provisioning_ssl',
                    ssl_status: sslState,
                })
                .eq('id', brand_id)

            console.log(`Domain ${brand.domain} SSL provisioning in progress`)
        }

        return new Response(
            JSON.stringify({
                ssl_active: sslActive,
                ssl_state: sslState,
                ssl_data: domainSSL,
                brand_id: brand.id,
                domain: brand.domain,
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
