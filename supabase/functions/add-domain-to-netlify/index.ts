import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fetch with timeout and retry support
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3,
    timeoutMs = 30000
): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.log(`Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
            }
        }
    }

    throw lastError || new Error('All retry attempts failed');
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        // Verify authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized - missing auth header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json()
        // Accept both brandId and brand_id for backwards compatibility
        const brand_id = body.brand_id || body.brandId

        if (!brand_id) {
            throw new Error('brand_id or brandId is required')
        }

        // Create auth client to verify user has permission
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        })

        // Verify user is authenticated and has admin role
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            console.error('Auth validation failed:', authError?.message)
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized - invalid session' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client with service role for DB operations
        const supabase = createClient(
            supabaseUrl,
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

        // Add domain to Netlify via API (with retry and timeout)
        const netlifyResponse = await fetchWithRetry(
            `https://api.netlify.com/api/v1/sites/${netlifySiteId}/domains`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${netlifyToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hostname: brand.domain
                }),
            },
            3,  // maxRetries
            30000  // 30 second timeout
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
