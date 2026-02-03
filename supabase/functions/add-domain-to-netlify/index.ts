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

        // Initialize Supabase client with service role
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get brand details from database (domains are stored in brands table)
        const { data: brand, error: fetchError } = await supabase
            .from('brands')
            .select('id, domain, domain_status, domain_verification_token, domain_verified_at, cloudflare_hostname_id')
            .eq('id', brand_id)
            .single()

        if (fetchError) {
            throw new Error(`Failed to fetch brand: ${fetchError.message}`)
        }

        if (!brand) {
            throw new Error('Brand not found')
        }

        if (!brand.domain) {
            throw new Error('No domain configured for this brand')
        }

        // Verify domain ownership was completed
        if (brand.domain_status !== 'verified' && brand.domain_status !== 'provisioning_ssl') {
            throw new Error('Domain must be verified before SSL provisioning')
        }

        console.log(`Adding domain ${brand.domain} to Netlify for brand ${brand_id}...`)

        // Update status to provisioning
        await supabase
            .from('brands')
            .update({ domain_status: 'provisioning_ssl' })
            .eq('id', brand_id)

        const netlifyToken = Deno.env.get('NETLIFY_ACCESS_TOKEN')
        const netlifySiteId = Deno.env.get('NETLIFY_SITE_ID')

        // If no Netlify credentials, simulate success for development
        if (!netlifyToken || !netlifySiteId) {
            console.log('Netlify credentials not configured, simulating success...')
            
            await supabase
                .from('brands')
                .update({
                    domain_status: 'active',
                    ssl_status: 'issued',
                    cloudflare_hostname_id: `simulated_${Date.now()}`,
                    domain_error: null,
                })
                .eq('id', brand_id)

            return new Response(
                JSON.stringify({
                    success: true,
                    simulated: true,
                    message: 'Domain configured (simulated - no Netlify credentials)',
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // Add domain to Netlify via API
        const netlifyResponse = await fetch(
            `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${netlifyToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    domain_name: brand.domain
                }),
            }
        )

        const netlifyData = await netlifyResponse.json()

        if (!netlifyResponse.ok) {
            console.error('Netlify API error:', netlifyData)

            // Update brand with error
            await supabase
                .from('brands')
                .update({
                    domain_status: 'failed',
                    domain_error: netlifyData.message || 'Failed to add domain to Netlify',
                })
                .eq('id', brand_id)

            throw new Error(`Netlify API error: ${JSON.stringify(netlifyData)}`)
        }

        console.log('Domain added to Netlify successfully:', netlifyData)

        // Update brand with Netlify ID and success status
        const { error: updateError } = await supabase
            .from('brands')
            .update({
                cloudflare_hostname_id: netlifyData.id, // Reusing this field for Netlify domain ID
                domain_status: 'active',
                ssl_status: netlifyData.ssl?.state || 'provisioning',
                domain_error: null,
            })
            .eq('id', brand_id)

        if (updateError) {
            console.error('Failed to update brand:', updateError)
            throw updateError
        }

        return new Response(
            JSON.stringify({
                success: true,
                netlify_domain_id: netlifyData.id,
                ssl_status: netlifyData.ssl?.state,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Error in add-domain-to-netlify:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
