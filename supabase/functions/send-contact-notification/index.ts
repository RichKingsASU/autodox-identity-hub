import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactNotificationRequest {
  name: string;
  email: string;
  company?: string;
  message: string;
}

// HTML escape helper to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, message }: ContactNotificationRequest = await req.json();

    // Sanitize all user inputs
    const safeName = escapeHtml(name || "");
    const safeEmail = escapeHtml(email || "");
    const safeCompany = company ? escapeHtml(company) : "";
    const safeMessage = escapeHtml(message || "").replace(/\n/g, "<br>");

    // Send notification to admin
    const adminNotification = await resend.emails.send({
      from: "Autodox Contact <onboarding@resend.dev>",
      to: ["hello@autodox.io"], // Replace with your admin email
      subject: `New Contact Form Submission from ${safeName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        ${safeCompany ? `<p><strong>Company:</strong> ${safeCompany}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Sent from Autodox Contact Form</p>
      `,
    });

    console.log("Admin notification sent:", adminNotification);

    // Send confirmation to the user
    const userConfirmation = await resend.emails.send({
      from: "Autodox <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${safeName}!</h1>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p>Here's a copy of your message:</p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 16px; color: #555;">
          ${safeMessage}
        </blockquote>
        <p>Best regards,<br>The Autodox Team</p>
      `,
    });

    console.log("User confirmation sent:", userConfirmation);

    return new Response(
      JSON.stringify({ success: true, adminNotification, userConfirmation }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
