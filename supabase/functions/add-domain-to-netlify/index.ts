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

        // Initialize Supabase client with service role
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get domain details from database
        const { data: domain, error: fetchError } = await supabase
            .from('domains')
            .select('*')
            .eq('id', domain_id)
            .single()

        if (fetchError) {
            throw new Error(`Failed to fetch domain: ${fetchError.message}`)
        }

        if (!domain) {
            throw new Error('Domain not found')
        }

        console.log(`Adding domain ${domain.domain} to Netlify...`)

        // Add domain to Netlify via API
        const netlifyResponse = await fetch(
            `https://api.netlify.com/api/v1/sites/${Deno.env.get('NETLIFY_SITE_ID')}/domains`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('NETLIFY_ACCESS_TOKEN')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    domain_name: domain.domain
                }),
            }
        )

        const netlifyData = await netlifyResponse.json()

        if (!netlifyResponse.ok) {
            console.error('Netlify API error:', netlifyData)

            // Update domain with error
            await supabase
                .from('domains')
                .update({
                    status: 'failed',
                    error_message: netlifyData.message || 'Failed to add domain to Netlify',
                })
                .eq('id', domain_id)

            // Log error event
            await supabase.from('domain_events').insert({
                domain_id,
                event_type: 'error',
                details: { error: netlifyData },
            })

            throw new Error(`Netlify API error: ${JSON.stringify(netlifyData)}`)
        }

        console.log('Domain added to Netlify successfully:', netlifyData)

        // Update domain with Netlify ID and DNS records
        const { error: updateError } = await supabase
            .from('domains')
            .update({
                netlify_domain_id: netlifyData.id,
                dns_records: netlifyData.dns_records || [],
                status: 'verifying',
                error_message: null,
            })
            .eq('id', domain_id)

        if (updateError) {
            console.error('Failed to update domain:', updateError)
            throw updateError
        }

        // Log event
        await supabase.from('domain_events').insert({
            domain_id,
            event_type: 'netlify_added',
            details: {
                netlify_domain_id: netlifyData.id,
                dns_records: netlifyData.dns_records
            },
        })

        return new Response(
            JSON.stringify({
                success: true,
                dns_records: netlifyData.dns_records,
                netlify_domain_id: netlifyData.id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Error in add-domain-to-netlify:', error)

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
