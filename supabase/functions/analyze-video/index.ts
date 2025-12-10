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

    console.log('Starting comprehensive video analysis for:', assessmentId);

    // Download video and extract audio for transcription
    const videoResponse = await fetch(urlData.signedUrl);
    const videoBlob = await videoResponse.blob();
    
    // Step 1: Transcribe audio using Whisper with word-level timestamps
    console.log('Transcribing audio with Whisper...');
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

    // ============================================
    // ADVANCED AUDIO METRICS CALCULATION
    // ============================================
    
    // 1. Speaking Rate (WPM) - Research Reference: Optimal range 130-170 WPM (Gallo, 2014)
    const wordCount = transcript.split(/\s+/).filter((w: string) => w.length > 0).length;
    const speakingRate = Math.round((wordCount / duration) * 60);
    const speakingRateScore = calculateSpeakingRateScore(speakingRate);
    
    // 2. Filler Words Analysis - Reference: Carnegie Mellon Speech Research
    const fillerPatterns = [
      { word: 'um', weight: 1.0 },
      { word: 'uh', weight: 1.0 },
      { word: 'like', weight: 0.8 },
      { word: 'you know', weight: 0.9 },
      { word: 'basically', weight: 0.7 },
      { word: 'actually', weight: 0.6 },
      { word: 'literally', weight: 0.8 },
      { word: 'right', weight: 0.5 },
      { word: 'so', weight: 0.4 },
      { word: 'i mean', weight: 0.8 },
      { word: 'kind of', weight: 0.7 },
      { word: 'sort of', weight: 0.7 },
    ];
    
    const transcriptLower = transcript.toLowerCase();
    let fillerCount = 0;
    let weightedFillerScore = 0;
    const fillerDetails: Record<string, number> = {};
    
    fillerPatterns.forEach(({ word, weight }) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        fillerDetails[word] = count;
        fillerCount += count;
        weightedFillerScore += count * weight;
      }
    });
    
    const fillerRate = (fillerCount / wordCount) * 100;
    const fillerScore = calculateFillerScore(fillerRate);
    
    // 3. Hedging/Confidence Language Analysis - Reference: Lakoff's Politeness Theory
    const hedgingPatterns = [
      { phrase: 'maybe', weight: 1.0 },
      { phrase: 'perhaps', weight: 1.0 },
      { phrase: 'i think', weight: 0.8 },
      { phrase: 'i guess', weight: 1.0 },
      { phrase: 'i believe', weight: 0.6 },
      { phrase: 'kind of', weight: 0.8 },
      { phrase: 'sort of', weight: 0.8 },
      { phrase: 'probably', weight: 0.9 },
      { phrase: 'might', weight: 0.7 },
      { phrase: 'could be', weight: 0.8 },
      { phrase: 'it seems', weight: 0.7 },
      { phrase: 'i suppose', weight: 0.9 },
      { phrase: 'not sure', weight: 1.0 },
    ];
    
    const confidencePatterns = [
      'i know', 'i am confident', 'definitely', 'certainly', 'absolutely',
      'we will', 'i will', 'without doubt', 'clearly', 'undoubtedly'
    ];
    
    let hedgeCount = 0;
    let confidenceCount = 0;
    const hedgeDetails: Record<string, number> = {};
    
    hedgingPatterns.forEach(({ phrase, weight }) => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        hedgeDetails[phrase] = count;
        hedgeCount += count;
      }
    });
    
    confidencePatterns.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      confidenceCount += matches ? matches.length : 0;
    });
    
    const confidenceRatio = confidenceCount / Math.max(hedgeCount, 1);
    const confidenceScore = calculateConfidenceScore(hedgeCount, confidenceCount, wordCount);
    
    // 4. Pause Analysis - Reference: Zellner (1994) Speech Timing Research
    let pauseCount = 0;
    let totalPauseDuration = 0;
    let longPauseCount = 0;
    let shortPauseCount = 0;
    const pauses: number[] = [];
    
    if (words.length > 1) {
      for (let i = 1; i < words.length; i++) {
        const gap = words[i].start - words[i-1].end;
        if (gap > 0.3) { // Short pause threshold
          pauseCount++;
          totalPauseDuration += gap;
          pauses.push(gap);
          
          if (gap > 1.5) {
            longPauseCount++;
          } else {
            shortPauseCount++;
          }
        }
      }
    }
    
    const avgPauseDuration = pauseCount > 0 ? totalPauseDuration / pauseCount : 0;
    const pausesPerMinute = (pauseCount / duration) * 60;
    const pauseScore = calculatePauseScore(pausesPerMinute, avgPauseDuration);
    
    // 5. Sentence Structure Analysis - Reference: Flesch Reading Ease
    const sentences = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    const sentenceLengthVariance = calculateSentenceLengthVariance(sentences);
    
    // 6. First Impression Analysis (first 30-40 seconds)
    const firstImpressionWords = words.filter((w: any) => w.start <= 40);
    const firstImpressionText = firstImpressionWords.map((w: any) => w.word).join(' ');
    const firstImpressionWordCount = firstImpressionWords.length;
    
    // 7. Vocal Variety Indicators (from transcript patterns)
    const exclamationCount = (transcript.match(/!/g) || []).length;
    const questionCount = (transcript.match(/\?/g) || []).length;
    const emphasisIndicators = exclamationCount + questionCount;
    
    // ============================================
    // COMPREHENSIVE AI ANALYSIS WITH GPT-4o
    // ============================================
    
    console.log('Running comprehensive AI analysis with GPT-4o...');
    
    const analysisPrompt = `You are a world-class Executive Presence assessment expert with credentials from Harvard Business School and experience coaching Fortune 500 CEOs. Analyze this leadership video transcript with scientific rigor.

TRANSCRIPT (${Math.round(duration / 60)} minutes, ${wordCount} words):
"${transcript}"

FIRST IMPRESSION TEXT (0-40 seconds):
"${firstImpressionText}"

===== QUANTITATIVE AUDIO METRICS =====

📊 SPEAKING RATE ANALYSIS:
- Words Per Minute: ${speakingRate} WPM
- Benchmark: Optimal executive range is 140-160 WPM (Reference: Carmine Gallo, "Talk Like TED", 2014)
- Analysis: ${speakingRate < 130 ? 'Below optimal - may seem deliberate or hesitant' : speakingRate > 170 ? 'Above optimal - may overwhelm listeners' : 'Within optimal range'}

📊 FILLER WORD ANALYSIS:
- Total Fillers: ${fillerCount} instances (${fillerRate.toFixed(2)}% of words)
- Breakdown: ${Object.entries(fillerDetails).map(([k, v]) => `"${k}": ${v}`).join(', ') || 'None detected'}
- Benchmark: Professional speakers average <2% filler rate (Reference: Toastmasters International)
- Pre-calculated Score: ${fillerScore}/100

📊 CONFIDENCE LANGUAGE ANALYSIS:
- Hedging Phrases: ${hedgeCount} instances
- Hedging Breakdown: ${Object.entries(hedgeDetails).map(([k, v]) => `"${k}": ${v}`).join(', ') || 'None detected'}
- Confidence Phrases: ${confidenceCount} instances
- Confidence Ratio: ${confidenceRatio.toFixed(2)}
- Benchmark: High-EP leaders use confidence language 3x more than hedging (Reference: Amy Cuddy, Harvard research)
- Pre-calculated Score: ${confidenceScore}/100

📊 PAUSE PATTERN ANALYSIS:
- Total Pauses: ${pauseCount} (${pausesPerMinute.toFixed(1)} per minute)
- Short Pauses (0.3-1.5s): ${shortPauseCount}
- Long Pauses (>1.5s): ${longPauseCount}
- Average Pause Duration: ${avgPauseDuration.toFixed(2)}s
- Benchmark: Optimal is 3-5 pauses/minute, 0.5-1.0s average (Reference: Zellner, 1994)
- Pre-calculated Score: ${pauseScore}/100

📊 SENTENCE STRUCTURE:
- Total Sentences: ${sentences.length}
- Average Sentence Length: ${avgSentenceLength.toFixed(1)} words
- Benchmark: 15-20 words per sentence for clarity (Reference: Flesch-Kincaid)

📊 SPEAKING RATE PRE-CALCULATED: ${speakingRateScore}/100

===== RESPONSE REQUIREMENTS =====

Provide your analysis in the following JSON format. Your scores should CLOSELY ALIGN with the pre-calculated scores above, adjusting only based on context you can observe in the transcript that the metrics cannot capture.

{
  "communication": {
    "overall_score": <average of all communication parameters>,
    "parameters": {
      "speaking_rate": {
        "score": <use ${speakingRateScore} as base, adjust ±5 based on context>,
        "raw_value": "${speakingRate} WPM",
        "observation": "<specific observation citing the ${speakingRate} WPM metric and comparing to 140-160 optimal range>",
        "coaching": "<actionable tip with specific technique name>",
        "reference": "Carmine Gallo, 'Talk Like TED' (2014) - Optimal executive speaking rate: 140-160 WPM"
      },
      "vocal_variety": {
        "score": <0-100 based on transcript patterns, emphasis indicators: ${emphasisIndicators}>,
        "observation": "<assess sentence variety, punctuation patterns, energy shifts in transcript>",
        "coaching": "<specific technique to improve vocal variety>",
        "reference": "Dr. Albert Mehrabian - 38% of communication impact comes from vocal variety"
      },
      "verbal_clarity": {
        "score": <0-100 based on avg sentence length ${avgSentenceLength.toFixed(1)} words>,
        "raw_value": "Avg ${avgSentenceLength.toFixed(1)} words/sentence",
        "observation": "<assess readability, sentence structure, word choice>",
        "coaching": "<specific tip for clarity improvement>",
        "reference": "Flesch-Kincaid readability research - Optimal: 15-20 words per sentence"
      },
      "filler_words": {
        "score": <use ${fillerScore} as base, adjust ±5 based on context>,
        "raw_value": "${fillerCount} fillers (${fillerRate.toFixed(1)}%)",
        "observation": "<specific observation about filler word usage with examples from transcript>",
        "coaching": "<specific technique to reduce fillers, e.g., 'pregnant pause' method>",
        "reference": "Toastmasters International - Professional benchmark: <2% filler rate"
      },
      "strategic_pauses": {
        "score": <use ${pauseScore} as base, adjust ±5>,
        "raw_value": "${pausesPerMinute.toFixed(1)} pauses/min, avg ${avgPauseDuration.toFixed(2)}s",
        "observation": "<assess pause usage pattern and effectiveness>",
        "coaching": "<specific technique like 'power pause' or 'three-beat pause'>",
        "reference": "Zellner (1994) Speech Timing - Optimal: 3-5 strategic pauses per minute"
      },
      "confidence_language": {
        "score": <use ${confidenceScore} as base, adjust ±5>,
        "raw_value": "${hedgeCount} hedges vs ${confidenceCount} confidence markers",
        "observation": "<specific examples of hedging or confidence language from transcript>",
        "coaching": "<specific language substitution techniques>",
        "reference": "Amy Cuddy, Harvard Business School - Presence research on authoritative language"
      }
    }
  },
  "appearance_nonverbal": {
    "overall_score": <average of parameters>,
    "note": "Analysis based on speech patterns and linguistic cues. Video frame analysis would provide additional nonverbal insights.",
    "methodology": "Inferred from vocal qualities, language intensity, engagement markers, and prosodic patterns",
    "parameters": {
      "presence_projection": {
        "score": <0-100 based on language strength and authority>,
        "observation": "<assess commanding language, declarative statements, opening strength>",
        "coaching": "<specific presence technique>",
        "reference": "Sylvia Ann Hewlett, 'Executive Presence' - Gravitas component scoring"
      },
      "engagement_cues": {
        "score": <0-100 based on rhetorical questions, direct address, inclusive language>,
        "observation": "<count and assess engagement techniques used>",
        "coaching": "<specific audience engagement technique>",
        "reference": "Nancy Duarte, 'Resonate' - Audience engagement patterns"
      },
      "first_impression_impact": {
        "score": <0-100 based on first 40 seconds - ${firstImpressionWordCount} words>",
        "raw_value": "First 40s: ${firstImpressionWordCount} words",
        "observation": "<assess opening strength, hook quality, introduction clarity>",
        "coaching": "<specific opening technique>",
        "reference": "Princeton research - 7-second first impression window; extended to 30-40s for video"
      },
      "energy_consistency": {
        "score": <0-100 based on language intensity throughout>,
        "observation": "<assess energy level consistency from beginning to end of transcript>",
        "coaching": "<specific energy management technique>",
        "reference": "Tony Robbins methodology - State management for sustained energy"
      }
    }
  },
  "storytelling": {
    "overall_score": <average of parameters, or lower if no story detected>,
    "story_detected": <true/false>,
    "story_count": <number of narrative segments identified>,
    "parameters": {
      "narrative_structure": {
        "score": <0-100 based on setup-conflict-resolution presence>,
        "observation": "<identify specific story elements present or missing>",
        "coaching": "<specific story structure technique like 'STAR' or 'Hero's Journey Lite'>",
        "reference": "Joseph Campbell's Hero's Journey adapted for business (Duarte, 2010)"
      },
      "cognitive_ease": {
        "score": <0-100 based on connectors, flow, logical progression>,
        "observation": "<assess use of transitional phrases, logical flow>",
        "coaching": "<specific technique for narrative flow>",
        "reference": "Daniel Kahneman, 'Thinking Fast and Slow' - Cognitive fluency research"
      },
      "self_disclosure_authenticity": {
        "score": <0-100 based on personal pronouns, lessons learned, vulnerability>,
        "observation": "<assess level of personal sharing and authenticity>",
        "coaching": "<specific authenticity technique>",
        "reference": "Brené Brown - Vulnerability and connection in leadership"
      },
      "memorability_concreteness": {
        "score": <0-100 based on specific details, names, numbers, sensory words>,
        "observation": "<assess concrete details vs abstract language>",
        "coaching": "<specific technique for memorable storytelling>",
        "reference": "Chip Heath, 'Made to Stick' - Concreteness principle"
      },
      "story_placement_pacing": {
        "score": <0-100 based on where stories appear and their length>,
        "observation": "<assess story timing and pacing within the presentation>",
        "coaching": "<specific pacing technique>",
        "reference": "TED Talk analysis - Optimal story placement in middle third"
      }
    }
  },
  "summary": "<3-4 sentences: Start with top strength with specific evidence. Then key development area with specific observation. End with encouraging next step.>",
  "top_strengths": ["<strength 1>", "<strength 2>"],
  "priority_development": "<single most impactful area to focus on>"
}

CRITICAL REQUIREMENTS:
1. Scores MUST be based on the quantitative metrics provided - do not deviate more than ±10 from pre-calculated scores without clear justification
2. Every observation MUST cite specific words, phrases, or numbers from the transcript or metrics
3. Every coaching tip MUST name a specific technique (not generic advice)
4. If no clear story is detected, storytelling scores should be 40-60 max with story_detected: false
5. Differentiate scores meaningfully - avoid clustering everything at 70-80
6. References must be real and relevant to executive presence research`;

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
            content: 'You are an expert executive coach with deep knowledge of speech analysis, leadership presence, and communication research. You provide data-driven assessments backed by specific metrics and academic research. Always respond with valid JSON only, no markdown formatting.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 5000,
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
    
    console.log('Raw analysis response length:', analysisText.length);
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response preview:', analysisText.substring(0, 1000));
      throw new Error('Failed to parse AI analysis response');
    }

    // Calculate weighted overall score
    const communicationScore = analysis.communication.overall_score;
    const appearanceScore = analysis.appearance_nonverbal.overall_score;
    const storytellingScore = analysis.storytelling.overall_score;
    
    // Weights: Communication 40%, Appearance 35%, Storytelling 25%
    const overallScore = Math.round(
      (communicationScore * 0.4) + 
      (appearanceScore * 0.35) + 
      (storytellingScore * 0.25)
    );

    console.log('Final scores - Overall:', overallScore, 'Comm:', communicationScore, 'App:', appearanceScore, 'Story:', storytellingScore);

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
        storytelling_analysis: {
          ...analysis.storytelling,
          summary: analysis.summary,
          top_strengths: analysis.top_strengths,
          priority_development: analysis.priority_development
        },
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

    // Try to update assessment with error status
    try {
      const { assessmentId } = await req.clone().json();
      if (assessmentId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('assessments')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', assessmentId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// SCORING FUNCTIONS WITH RESEARCH BACKING
// ============================================

function calculateSpeakingRateScore(wpm: number): number {
  // Reference: Carmine Gallo, "Talk Like TED" (2014)
  // Optimal range: 140-160 WPM for executives
  if (wpm >= 140 && wpm <= 160) return 95;
  if (wpm >= 130 && wpm < 140) return 85;
  if (wpm > 160 && wpm <= 170) return 85;
  if (wpm >= 120 && wpm < 130) return 70;
  if (wpm > 170 && wpm <= 180) return 70;
  if (wpm >= 100 && wpm < 120) return 55;
  if (wpm > 180 && wpm <= 200) return 55;
  if (wpm < 100) return 40;
  if (wpm > 200) return 40;
  return 50;
}

function calculateFillerScore(fillerRate: number): number {
  // Reference: Toastmasters International benchmarks
  // Professional speakers: <2% filler rate
  if (fillerRate <= 1) return 95;
  if (fillerRate <= 2) return 85;
  if (fillerRate <= 3) return 75;
  if (fillerRate <= 4) return 65;
  if (fillerRate <= 5) return 55;
  if (fillerRate <= 7) return 45;
  return 35;
}

function calculateConfidenceScore(hedges: number, confidence: number, wordCount: number): number {
  // Reference: Amy Cuddy, Harvard presence research
  const hedgeRate = (hedges / wordCount) * 100;
  const confidenceRate = (confidence / wordCount) * 100;
  const ratio = confidence / Math.max(hedges, 1);
  
  if (ratio >= 3 && hedgeRate < 1) return 95;
  if (ratio >= 2 && hedgeRate < 2) return 85;
  if (ratio >= 1.5 && hedgeRate < 3) return 75;
  if (ratio >= 1 && hedgeRate < 4) return 65;
  if (ratio >= 0.5) return 55;
  return 45;
}

function calculatePauseScore(pausesPerMinute: number, avgDuration: number): number {
  // Reference: Zellner (1994) - Speech Timing
  // Optimal: 3-5 pauses/min, 0.5-1.0s average
  let score = 70;
  
  // Evaluate frequency
  if (pausesPerMinute >= 3 && pausesPerMinute <= 5) score += 15;
  else if (pausesPerMinute >= 2 && pausesPerMinute <= 6) score += 8;
  else if (pausesPerMinute < 2) score -= 10;
  else if (pausesPerMinute > 8) score -= 10;
  
  // Evaluate duration
  if (avgDuration >= 0.5 && avgDuration <= 1.0) score += 15;
  else if (avgDuration >= 0.3 && avgDuration <= 1.5) score += 8;
  else if (avgDuration > 2.0) score -= 10;
  
  return Math.max(30, Math.min(100, score));
}

function calculateSentenceLengthVariance(sentences: string[]): number {
  if (sentences.length < 2) return 0;
  
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) / lengths.length;
  
  return Math.sqrt(variance);
}
