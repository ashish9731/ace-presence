import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CoachingRequest {
  name: string;
  email: string;
  primaryGoal: string;
  preferredTimes: string;
  notes: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, primaryGoal, preferredTimes, notes }: CoachingRequest = await req.json();

    // Validate required fields
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending coaching request email for:", name, email);

    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER")!;
    const smtpPass = Deno.env.get("SMTP_PASS")!;

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: false,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    const emailContent = `
      <h2>New Executive Coaching Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Primary Goal:</strong> ${primaryGoal || "Not specified"}</p>
      <p><strong>Preferred Times:</strong> ${preferredTimes || "Not specified"}</p>
      <p><strong>Additional Notes:</strong> ${notes || "None"}</p>
    `;

    await client.send({
      from: smtpUser,
      to: "info@c2x.co.in",
      subject: `Executive Coaching Request from ${name}`,
      content: "New coaching request received",
      html: emailContent,
    });

    await client.close();

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-coaching-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
