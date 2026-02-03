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

        // Query brands table directly for active domain
        const { data: brand, error } = await supabase
            .from('brands')
            .select('id, name, slug, settings, domain, domain_status, active_template_id')
            .eq('domain', hostname)
            .eq('domain_status', 'active')
            .single()

        if (error || !brand) {
            console.log(`Domain not found or inactive: ${hostname}`)
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

        // Fetch the full template details if active_template_id exists
        let template = null
        if (brand.active_template_id) {
            const { data: templateData, error: templateError } = await supabase
                .from('landing_templates')
                .select('*')
                .eq('id', brand.active_template_id)
                .single()

            if (!templateError && templateData) {
                template = templateData
            }
        }

        console.log(`Resolved ${hostname} to brand: ${brand.name}`)

        return new Response(
            JSON.stringify({
                brand_id: brand.id,
                brand_name: brand.name,
                brand_slug: brand.slug,
                template,
                settings: brand.settings,
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
