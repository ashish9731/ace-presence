import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

// HTML escape function to prevent XSS in email content
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Authenticated user:", user.id);

    // Rate limiting using service role client
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentUsage } = await supabaseService
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', 'send-coaching-request')
      .gte('called_at', oneHourAgo);

    const maxRequestsPerHour = 5;
    if (recentUsage !== null && recentUsage >= maxRequestsPerHour) {
      console.error("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Record API usage
    await supabaseService.from('api_usage').insert({
      user_id: user.id,
      function_name: 'send-coaching-request'
    });

    const { name, email, primaryGoal, preferredTimes, notes }: CoachingRequest = await req.json();

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate input lengths for all fields
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedGoal = primaryGoal?.trim() || '';
    const trimmedTimes = preferredTimes?.trim() || '';
    const trimmedNotes = notes?.trim() || '';

    if (trimmedName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be 100 characters or less" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (trimmedEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email must be 255 characters or less" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (trimmedGoal.length > 500) {
      return new Response(
        JSON.stringify({ error: "Primary goal must be 500 characters or less" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (trimmedTimes.length > 200) {
      return new Response(
        JSON.stringify({ error: "Preferred times must be 200 characters or less" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (trimmedNotes.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Notes must be 1000 characters or less" }),
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

    // Escape all user input to prevent HTML injection
    const emailContent = `
      <h2>New Executive Coaching Request</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Primary Goal:</strong> ${escapeHtml(primaryGoal || "Not specified")}</p>
      <p><strong>Preferred Times:</strong> ${escapeHtml(preferredTimes || "Not specified")}</p>
      <p><strong>Additional Notes:</strong> ${escapeHtml(notes || "None")}</p>
      <p><strong>User ID:</strong> ${user.id}</p>
    `;

    await client.send({
      from: smtpUser,
      to: "info@c2x.co.in",
      subject: `Executive Coaching Request from ${escapeHtml(name)}`,
      content: "New coaching request received",
      html: emailContent,
    });

    await client.close();

    console.log("Email sent successfully");

    // Store the coaching request in the database with user_id
    const { error: insertError } = await supabaseService
      .from('coaching_requests')
      .insert({
        user_id: user.id,
        name: trimmedName,
        email: trimmedEmail,
        primary_goal: trimmedGoal || null,
        preferred_times: trimmedTimes || null,
        notes: trimmedNotes || null,
      });

    if (insertError) {
      console.error("Error storing coaching request:", insertError);
      // Don't fail the request since email was sent successfully
    } else {
      console.log("Coaching request stored in database");
    }

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
