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
        const { hostname } = await req.json()

        if (!hostname) {
            throw new Error('hostname is required')
        }

        // Initialize Supabase client (using anon key for public access)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        console.log(`Resolving domain: ${hostname}`)

        // Use the database function to lookup domain
        const { data, error } = await supabase
            .rpc('get_brand_by_domain', { hostname })

        if (error) {
            console.error('Database error:', error)
            throw error
        }

        if (!data || data.length === 0) {
            return new Response(
                JSON.stringify({
                    error: 'Domain not found or inactive',
                    hostname,
                }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        const brandConfig = data[0]

        // Fetch the full template details if template_id exists
        let template = null
        if (brandConfig.template_id) {
            const { data: templateData, error: templateError } = await supabase
                .from('landing_templates')
                .select('*')
                .eq('id', brandConfig.template_id)
                .single()

            if (!templateError && templateData) {
                template = templateData
            }
        }

        console.log(`Resolved ${hostname} to brand: ${brandConfig.brand_name}`)

        return new Response(
            JSON.stringify({
                brand_id: brandConfig.brand_id,
                brand_name: brandConfig.brand_name,
                brand_slug: brandConfig.brand_slug,
                template,
                settings: brandConfig.brand_settings,
                domain_id: brandConfig.domain_id,
                is_primary: brandConfig.is_primary,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Error in domain-resolver:', error)

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
