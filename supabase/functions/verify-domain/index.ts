import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyDomainRequest {
  brandId: string;
}

interface DNSResponse {
  Answer?: Array<{
    data: string;
    type: number;
  }>;
}

async function queryDNS(domain: string, recordType: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType}`;
  
  const response = await fetch(url, {
    headers: {
      "Accept": "application/dns-json",
    },
  });

  if (!response.ok) {
    throw new Error(`DNS query failed: ${response.status}`);
  }

  const data: DNSResponse = await response.json();
  
  if (!data.Answer) {
    return [];
  }

  // Extract TXT record values (remove surrounding quotes)
  return data.Answer
    .filter((answer) => answer.type === 16) // TXT record type
    .map((answer) => answer.data.replace(/^"|"$/g, ""));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { brandId }: VerifyDomainRequest = await req.json();

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: "Brand ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch brand details
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, domain, domain_verification_token, domain_status")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Brand not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!brand.domain || !brand.domain_verification_token) {
      return new Response(
        JSON.stringify({ error: "Domain not configured", verified: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to verifying
    await supabase
      .from("brands")
      .update({ domain_status: "verifying" })
      .eq("id", brandId);

    // Query DNS for TXT record
    const txtRecordName = `_autodox-verify.${brand.domain}`;
    console.log(`Checking DNS TXT record: ${txtRecordName}`);

    try {
      const txtRecords = await queryDNS(txtRecordName, "TXT");
      console.log(`Found TXT records:`, txtRecords);

      const expectedToken = brand.domain_verification_token;
      const verified = txtRecords.some((record) => record.includes(expectedToken));

      if (verified) {
        // Update brand as verified
        await supabase
          .from("brands")
          .update({
            domain_status: "verified",
            domain_verified_at: new Date().toISOString(),
            domain_error: null,
          })
          .eq("id", brandId);

        return new Response(
          JSON.stringify({ 
            verified: true, 
            message: "Domain ownership verified successfully" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Update with error
        await supabase
          .from("brands")
          .update({
            domain_status: "pending",
            domain_error: "TXT record not found or token mismatch. Please ensure the DNS record is properly configured.",
          })
          .eq("id", brandId);

        return new Response(
          JSON.stringify({
            verified: false,
            message: "TXT record not found. Please ensure you've added the correct DNS record.",
            expected: expectedToken,
            found: txtRecords,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (dnsError) {
      console.error("DNS query error:", dnsError);
      const dnsErrorMessage = dnsError instanceof Error ? dnsError.message : "Unknown DNS error";

      await supabase
        .from("brands")
        .update({
          domain_status: "pending",
          domain_error: `DNS lookup failed: ${dnsErrorMessage}`,
        })
        .eq("id", brandId);

      return new Response(
        JSON.stringify({
          verified: false,
          message: `DNS lookup failed: ${dnsErrorMessage}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
