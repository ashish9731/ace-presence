import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioPath, scenario, duration } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting boardroom analysis for scenario:', scenario.id);

    // Get audio URL
    const { data: urlData } = await supabase.storage
      .from('videos')
      .createSignedUrl(audioPath, 3600);

    if (!urlData?.signedUrl) {
      throw new Error('Failed to get audio URL');
    }

    // Download audio for transcription
    const audioResponse = await fetch(urlData.signedUrl);
    const audioBlob = await audioResponse.blob();
    
    // Transcribe with Whisper
    console.log('Transcribing audio...');
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    
    const transcriptResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!transcriptResponse.ok) {
      const error = await transcriptResponse.text();
      console.error('Whisper error:', error);
      throw new Error(`Transcription failed: ${error}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcript = transcriptData.text;

    console.log('Transcript obtained, analyzing response...');

    // Analyze with GPT-4o
    const analysisPrompt = `You are an expert executive coach evaluating a leader's response to a high-stakes boardroom scenario.

SCENARIO CONTEXT:
Title: ${scenario.title}
Category: ${scenario.category}
Difficulty: ${scenario.difficulty}
Setting: ${scenario.context}

THE CHALLENGE PRESENTED:
"${scenario.question}"

LEADER'S RESPONSE (${duration} seconds):
"${transcript}"

Analyze this response and provide a comprehensive evaluation in the following JSON format:

{
  "score": <overall score 0-100>,
  "analysis": {
    "commanding_presence": {
      "score": <0-100>,
      "feedback": "<specific assessment of authority, confidence, and gravitas in response>"
    },
    "strategic_thinking": {
      "score": <0-100>,
      "feedback": "<assessment of strategic depth, long-term thinking, and problem-solving approach>"
    },
    "composure": {
      "score": <0-100>,
      "feedback": "<assessment of calmness, measured response, and poise under pressure>"
    },
    "decisiveness": {
      "score": <0-100>,
      "feedback": "<assessment of clear direction, commitment to action, and avoiding hedging>"
    },
    "stakeholder_management": {
      "score": <0-100>,
      "feedback": "<assessment of considering multiple perspectives and managing different interests>"
    }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}

SCORING GUIDELINES:
- 90-100: Exceptional executive response worthy of a Fortune 500 CEO
- 80-89: Strong leadership response with minor refinements needed
- 70-79: Good response but missing some key executive elements
- 60-69: Adequate but lacks gravitas or strategic depth
- Below 60: Needs significant development

Consider:
1. Does the response demonstrate COMMAND of the situation?
2. Is there DECISIVENESS without being reckless?
3. Does the leader show STRATEGIC THINKING beyond immediate crisis?
4. Is the response MEASURED and showing COMPOSURE?
5. Does it consider MULTIPLE STAKEHOLDERS?

Respond with valid JSON only, no markdown.`;

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert executive coach who has trained Fortune 500 CEOs. Provide rigorous but constructive feedback. Respond with valid JSON only.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      console.error('GPT-4o analysis error:', error);
      throw new Error(`Analysis failed: ${error}`);
    }

    const analysisData = await analysisResponse.json();
    let analysisText = analysisData.choices[0].message.content;
    
    // Clean up markdown
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse AI analysis response');
    }

    console.log('Analysis complete, score:', analysis.score);

    // Return the result
    const result = {
      scenarioId: scenario.id,
      transcript,
      score: analysis.score,
      analysis: analysis.analysis,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      duration,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-boardroom:', errorMessage);

    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
