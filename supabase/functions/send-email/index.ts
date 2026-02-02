import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * SEND-EMAIL EDGE FUNCTION
 * 
 * Purpose: Core email sending function with brand resolution and template rendering
 * 
 * Architecture:
 * - Validates inputs
 * - Loads brand email settings
 * - Loads email template
 * - Merges brand variables + template data
 * - Sends via Resend API
 * - Logs to email_events (immutable audit trail)
 * - Fails explicitly (no silent failures)
 * 
 * Security:
 * - Resend API key only in Supabase secrets
 * - Uses service role for database access
 * - RLS policies enforce brand isolation
 */

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        // Parse request body
        const { brand_id, template_key, recipient_email, template_data = {}, reply_to } = await req.json()

        // Validate required inputs
        if (!brand_id) {
            throw new Error('brand_id is required')
        }
        if (!template_key) {
            throw new Error('template_key is required')
        }
        if (!recipient_email) {
            throw new Error('recipient_email is required')
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(recipient_email)) {
            throw new Error('Invalid recipient email format')
        }

        console.log(`[send-email] Processing email for brand ${brand_id}, template ${template_key}, recipient ${recipient_email}`)

        // Initialize Supabase client with service role
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Load brand email configuration with brand details
        const { data: brandConfig, error: brandError } = await supabase
            .rpc('get_brand_email_config', { target_brand_id: brand_id })

        if (brandError) {
            console.error('[send-email] Failed to load brand config:', brandError)
            throw new Error(`Failed to load brand configuration: ${brandError.message}`)
        }

        if (!brandConfig || brandConfig.length === 0) {
            throw new Error('Brand email settings not configured')
        }

        const config = brandConfig[0]

        // Check if brand email is active
        if (!config.is_active) {
            throw new Error('Brand email sending is disabled')
        }

        console.log(`[send-email] Loaded brand config for ${config.brand_name}`)

        // Load email template
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_key', template_key)
            .single()

        if (templateError || !template) {
            console.error('[send-email] Template not found:', template_key)
            throw new Error(`Email template '${template_key}' not found`)
        }

        console.log(`[send-email] Loaded template: ${template.name}`)

        // Prepare brand variables for template injection
        const brandVariables = {
            brand_name: config.brand_name,
            brand_logo: config.brand_logo,
            brand_color: config.brand_color,
            brand_domain: config.brand_domain || 'agents-institute.com',
            brand_support_email: config.reply_to || 'support@agents-institute.com',
        }

        // Merge brand variables with custom template data
        const allVariables = { ...brandVariables, ...template_data }

        // Simple Mustache-style variable replacement
        const renderTemplate = (text: string, variables: Record<string, any>): string => {
            let rendered = text
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`{{${key}}}`, 'g')
                rendered = rendered.replace(regex, String(value || ''))
            }
            // Handle conditional blocks {{#var}}...{{/var}}
            rendered = rendered.replace(/{{#(\w+)}}(.*?){{\/\1}}/gs, (match, key, content) => {
                return variables[key] ? content : ''
            })
            return rendered
        }

        // Render subject and body
        const renderedSubject = renderTemplate(template.subject, allVariables)
        const renderedHtml = renderTemplate(template.html_template, allVariables)
        const renderedText = renderTemplate(template.text_template, allVariables)

        console.log(`[send-email] Rendered templates for ${recipient_email}`)

        // Initialize Resend client
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

        // Determine from email (use sending domain if configured and verified)
        const fromEmail = config.sending_domain && config.sending_domain_status === 'verified'
            ? `${config.from_name} <noreply@${config.sending_domain}>`
            : `${config.from_name} <${config.from_email}>`

        console.log(`[send-email] Sending from: ${fromEmail}`)

        // Send email via Resend
        const { data: emailData, error: resendError } = await resend.emails.send({
            from: fromEmail,
            to: recipient_email,
            subject: renderedSubject,
            html: renderedHtml,
            text: renderedText,
            reply_to: reply_to || config.reply_to,
        })

        if (resendError) {
            console.error('[send-email] Resend API error:', resendError)

            // Log failed email event
            await supabase.from('email_events').insert({
                brand_id,
                recipient: recipient_email,
                template_key,
                subject: renderedSubject,
                status: 'failed',
                error_message: resendError.message || 'Resend API error',
                metadata: { template_data, resend_error: resendError },
            })

            throw new Error(`Failed to send email: ${resendError.message}`)
        }

        console.log(`[send-email] Email sent successfully, Resend ID: ${emailData?.id}`)

        // Log successful email event
        await supabase.from('email_events').insert({
            brand_id,
            recipient: recipient_email,
            template_key,
            subject: renderedSubject,
            status: 'sent',
            resend_email_id: emailData?.id,
            metadata: { template_data },
        })

        return new Response(
            JSON.stringify({
                success: true,
                email_id: emailData?.id,
                message: 'Email sent successfully',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('[send-email] Error:', error)

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
