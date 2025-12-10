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
    const { assessmentId, videoPath } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to analyzing
    await supabase
      .from('assessments')
      .update({ status: 'analyzing' })
      .eq('id', assessmentId);

    // Get video URL for analysis
    const { data: urlData } = await supabase.storage
      .from('videos')
      .createSignedUrl(videoPath, 3600);

    if (!urlData?.signedUrl) {
      throw new Error('Failed to get video URL');
    }

    console.log('Starting video analysis for:', assessmentId);

    // Download video and extract audio for transcription
    const videoResponse = await fetch(urlData.signedUrl);
    const videoBlob = await videoResponse.blob();
    
    // For video analysis, we'll use GPT-4o Vision to analyze frames
    // and Whisper for audio transcription
    
    // Step 1: Transcribe audio using Whisper
    console.log('Transcribing audio...');
    const formData = new FormData();
    formData.append('file', videoBlob, 'video.mp4');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    
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
    const duration = Math.round(transcriptData.duration || 180);
    const words = transcriptData.words || [];

    console.log('Transcript obtained, duration:', duration, 'seconds');
    console.log('Word count:', words.length);

    // Calculate speech metrics from transcript
    const wordCount = transcript.split(/\s+/).filter((w: string) => w.length > 0).length;
    const speakingRate = Math.round((wordCount / duration) * 60);
    
    // Count filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so', 'well'];
    const transcriptLower = transcript.toLowerCase();
    let fillerCount = 0;
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      fillerCount += matches ? matches.length : 0;
    });
    const fillerRate = (fillerCount / wordCount) * 100;

    // Count hedging words
    const hedgingWords = ['maybe', 'perhaps', 'i think', 'i guess', 'kind of', 'sort of', 'probably', 'might', 'could be'];
    let hedgeCount = 0;
    hedgingWords.forEach(hedge => {
      const regex = new RegExp(`\\b${hedge}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      hedgeCount += matches ? matches.length : 0;
    });

    // Calculate pause metrics from word timestamps
    let pauseCount = 0;
    let totalPauseDuration = 0;
    if (words.length > 1) {
      for (let i = 1; i < words.length; i++) {
        const gap = words[i].start - words[i-1].end;
        if (gap > 0.3) { // Pause threshold
          pauseCount++;
          totalPauseDuration += gap;
        }
      }
    }
    const avgPauseDuration = pauseCount > 0 ? totalPauseDuration / pauseCount : 0;
    const pausesPerMinute = (pauseCount / duration) * 60;

    // Step 2: Comprehensive AI analysis using GPT-4o
    console.log('Running comprehensive AI analysis...');
    
    const analysisPrompt = `You are an Executive Presence assessment expert. Analyze the following 3-minute video transcript from a leadership presentation and provide detailed scores and coaching feedback.

TRANSCRIPT:
"${transcript}"

AUDIO METRICS DETECTED:
- Speaking Rate: ${speakingRate} WPM (ideal: 130-170, optimal: 140-160)
- Filler Words: ${fillerCount} total (${fillerRate.toFixed(1)}% of words)
- Hedging Phrases: ${hedgeCount} instances
- Pauses: ${pauseCount} pauses, avg duration ${avgPauseDuration.toFixed(2)}s, ${pausesPerMinute.toFixed(1)} per minute
- Video Duration: ${duration} seconds

Provide a comprehensive Executive Presence assessment in the following JSON format. Be specific, actionable, and supportive in your coaching. Reference specific moments from the transcript when possible.

{
  "communication": {
    "overall_score": <0-100>,
    "parameters": {
      "speaking_rate": {
        "score": <0-100>,
        "raw_value": "${speakingRate} WPM",
        "observation": "<1 sentence observation with specific numbers>",
        "coaching": "<1 sentence actionable coaching tip>"
      },
      "vocal_variety": {
        "score": <0-100>,
        "observation": "<infer from language patterns, punctuation usage, sentence variety>",
        "coaching": "<specific tip>"
      },
      "verbal_clarity": {
        "score": <0-100>,
        "observation": "<assess sentence structure, word choice, readability>",
        "coaching": "<specific tip>"
      },
      "filler_words": {
        "score": <0-100>,
        "raw_value": "${fillerCount} fillers (${fillerRate.toFixed(1)}%)",
        "observation": "<observation about filler usage>",
        "coaching": "<specific tip to reduce fillers>"
      },
      "pauses": {
        "score": <0-100>,
        "raw_value": "${pausesPerMinute.toFixed(1)} pauses/min, avg ${avgPauseDuration.toFixed(2)}s",
        "observation": "<observation about pause usage>",
        "coaching": "<specific tip>"
      },
      "confidence_language": {
        "score": <0-100>,
        "raw_value": "${hedgeCount} hedging phrases",
        "observation": "<observation about confidence vs hedging language>",
        "coaching": "<specific tip to sound more confident>"
      }
    }
  },
  "appearance_nonverbal": {
    "overall_score": <0-100>,
    "note": "Inferred from speech patterns and language - full video analysis would provide more accurate nonverbal assessment",
    "parameters": {
      "presence_projection": {
        "score": <0-100>,
        "observation": "<infer from tone, language strength, opening impact>",
        "coaching": "<specific tip>"
      },
      "engagement_cues": {
        "score": <0-100>,
        "observation": "<infer from direct address, rhetorical questions, inclusive language>",
        "coaching": "<specific tip>"
      },
      "first_impression": {
        "score": <0-100>,
        "observation": "<analyze the first 30-40 seconds of transcript for impact>",
        "coaching": "<specific tip for stronger openings>"
      },
      "energy_consistency": {
        "score": <0-100>,
        "observation": "<assess energy level throughout based on language intensity>",
        "coaching": "<specific tip>"
      }
    }
  },
  "storytelling": {
    "overall_score": <0-100>,
    "story_detected": <true/false>,
    "parameters": {
      "narrative_structure": {
        "score": <0-100>,
        "observation": "<did they have setup, conflict, resolution?>",
        "coaching": "<specific tip for better story structure>"
      },
      "narrative_flow": {
        "score": <0-100>,
        "observation": "<assess use of connectors, logical progression>",
        "coaching": "<specific tip>"
      },
      "self_disclosure": {
        "score": <0-100>,
        "observation": "<did they share personal experiences, lessons learned?>",
        "coaching": "<specific tip for authentic storytelling>"
      },
      "memorability": {
        "score": <0-100>,
        "observation": "<presence of specific details, names, sensory language>",
        "coaching": "<specific tip for more memorable stories>"
      },
      "story_placement": {
        "score": <0-100>,
        "observation": "<was story well-timed in the presentation?>",
        "coaching": "<specific tip>"
      }
    }
  },
  "summary": "<2-3 sentences of overall supportive feedback highlighting top strengths and key area for development>"
}

Important guidelines:
- Scores should be realistic and differentiated (avoid giving everything 70-80)
- Observations must be specific to THIS transcript
- Coaching must be actionable and supportive, not generic
- Reference specific phrases or moments from the transcript when possible
- If no clear story is detected, note this but still score based on narrative elements present`;

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
            content: 'You are an expert executive coach specializing in Executive Presence assessment. Provide detailed, actionable feedback in valid JSON format only. Do not include markdown code blocks.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!analysisResponse.ok) {
      const error = await analysisResponse.text();
      console.error('GPT-4o analysis error:', error);
      throw new Error(`Analysis failed: ${error}`);
    }

    const analysisData = await analysisResponse.json();
    let analysisText = analysisData.choices[0].message.content;
    
    // Clean up any markdown formatting
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Raw analysis response:', analysisText.substring(0, 500));
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Full response:', analysisText);
      throw new Error('Failed to parse AI analysis response');
    }

    // Calculate weighted overall score
    const communicationScore = analysis.communication.overall_score;
    const appearanceScore = analysis.appearance_nonverbal.overall_score;
    const storytellingScore = analysis.storytelling.overall_score;
    
    const overallScore = Math.round(
      (communicationScore * 0.4) + 
      (appearanceScore * 0.35) + 
      (storytellingScore * 0.25)
    );

    // Update assessment with results
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed',
        overall_score: overallScore,
        communication_score: communicationScore,
        appearance_score: appearanceScore,
        storytelling_score: storytellingScore,
        communication_analysis: analysis.communication,
        appearance_analysis: analysis.appearance_nonverbal,
        storytelling_analysis: analysis.storytelling,
        transcript: transcript,
        video_duration_seconds: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update assessment: ${updateError.message}`);
    }

    console.log('Analysis completed successfully for:', assessmentId);

    return new Response(JSON.stringify({ 
      success: true, 
      assessmentId,
      overallScore,
      summary: analysis.summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-video:', errorMessage);

    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
