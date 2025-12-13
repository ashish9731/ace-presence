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
    // Extract and verify the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    // Create a client with the user's token to verify their identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Authenticated user:', user.id);

    const body = await req.json();
    const { assessmentId, videoPath } = body;

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!assessmentId || typeof assessmentId !== 'string' || !uuidRegex.test(assessmentId)) {
      console.error('Invalid assessmentId:', assessmentId);
      return new Response(JSON.stringify({ error: 'Invalid assessmentId: must be a valid UUID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!videoPath || typeof videoPath !== 'string') {
      console.error('Invalid videoPath:', videoPath);
      return new Response(JSON.stringify({ error: 'Invalid videoPath: must be a non-empty string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent path traversal attacks
    if (videoPath.includes('..') || videoPath.startsWith('/')) {
      console.error('Path traversal attempt detected:', videoPath);
      return new Response(JSON.stringify({ error: 'Invalid videoPath: path traversal not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user owns the assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('user_id')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      console.error('Assessment not found:', assessmentId);
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (assessment.user_id !== user.id) {
      console.error('User does not own assessment:', { userId: user.id, assessmentUserId: assessment.user_id });
      return new Response(JSON.stringify({ error: 'Forbidden: You do not own this assessment' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Handle edge case where no speech is detected
    if (words.length === 0 && (!transcript || transcript.trim() === '')) {
      console.log('No speech detected in the video');
      
      // Update assessment with minimal analysis for no-speech case
      await supabase
        .from('assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          transcript: 'No speech detected in the video. Please record a video with clear audio where you speak for at least 30 seconds.',
          video_duration_seconds: duration,
          overall_score: 0,
          communication_score: 0,
          appearance_score: 0,
          storytelling_score: 0,
          communication_analysis: {
            overall_score: 0,
            note: 'No speech detected - please record a video with clear spoken content for at least 30 seconds',
            parameters: {},
            gravitas_score: 0,
            gravitas_analysis: { overall_score: 0, parameters: {} }
          },
          appearance_analysis: { 
            overall_score: 0, 
            note: 'Unable to analyze without speech content',
            parameters: {} 
          },
          storytelling_analysis: { 
            overall_score: 0,
            summary: 'No speech was detected in your video. For a complete Executive Presence assessment, please record a 2-4 minute video where you speak clearly about your role, initiatives, and a leadership challenge.',
            top_strengths: [],
            priority_development: 'Record a new video with clear, audible speech',
            parameters: {} 
          }
        })
        .eq('id', assessmentId);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Analysis completed - no speech detected'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // REAL-TIME METRICS WITH TIMESTAMPS
    // ============================================
    
    // 1. Speaking Rate (WPM) - Real-time calculation
    const wordCount = words.length;
    const speakingRate = wordCount > 0 ? Math.round((wordCount / Math.max(duration, 1)) * 60) : 0;
    const speakingRateScore = calculateSpeakingRateScore(speakingRate);
    
    const speakingRateMetrics = {
      wpm: speakingRate,
      total_words: wordCount,
      duration_seconds: duration,
      calculation: `${wordCount} words ÷ ${(Math.max(duration, 1) / 60).toFixed(2)} minutes = ${speakingRate} WPM`,
      optimal_range: "140-160 WPM",
      benchmark_source: "Carmine Gallo, 'Talk Like TED' (2014)"
    };
    
    // 2. FILLER WORDS - Extract with exact timestamps
    const fillerPatterns = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so', 'i mean', 'kind of', 'sort of'];
    
    interface FillerInstance {
      word: string;
      timestamp: string;
      start_seconds: number;
      end_seconds: number;
    }
    
    const fillerInstances: FillerInstance[] = [];
    const fillerCounts: Record<string, number> = {};
    
    // Single word fillers
    words.forEach((w: any) => {
      const wordLower = w.word.toLowerCase().replace(/[.,!?]/g, '');
      if (['um', 'uh', 'like', 'basically', 'actually', 'literally', 'right', 'so'].includes(wordLower)) {
        fillerInstances.push({
          word: wordLower,
          timestamp: formatTimestamp(w.start),
          start_seconds: w.start,
          end_seconds: w.end
        });
        fillerCounts[wordLower] = (fillerCounts[wordLower] || 0) + 1;
      }
    });
    
    // Multi-word fillers (check consecutive words)
    for (let i = 0; i < words.length - 1; i++) {
      const twoWords = `${words[i].word.toLowerCase()} ${words[i+1].word.toLowerCase()}`.replace(/[.,!?]/g, '');
      if (['you know', 'i mean', 'kind of', 'sort of'].includes(twoWords)) {
        fillerInstances.push({
          word: twoWords,
          timestamp: formatTimestamp(words[i].start),
          start_seconds: words[i].start,
          end_seconds: words[i+1].end
        });
        fillerCounts[twoWords] = (fillerCounts[twoWords] || 0) + 1;
      }
    }
    
    // Sort by timestamp
    fillerInstances.sort((a, b) => a.start_seconds - b.start_seconds);
    
    const fillerRate = wordCount > 0 ? (fillerInstances.length / wordCount) * 100 : 0;
    const fillerScore = calculateFillerScore(fillerRate);
    
    const fillerMetrics = {
      total_count: fillerInstances.length,
      filler_rate_percent: parseFloat(fillerRate.toFixed(2)),
      instances: fillerInstances,
      breakdown: fillerCounts,
      calculation: wordCount > 0 ? `${fillerInstances.length} fillers ÷ ${wordCount} words × 100 = ${fillerRate.toFixed(2)}%` : 'N/A - no words detected',
      benchmark: "Professional speakers: <2% filler rate",
      benchmark_source: "Toastmasters International Speech Analysis Research"
    };
    
    // 3. STRATEGIC PAUSES - Extract with exact timestamps
    interface PauseInstance {
      after_word: string;
      before_word: string;
      timestamp: string;
      start_seconds: number;
      duration_seconds: number;
      pause_type: string;
    }
    
    const pauseInstances: PauseInstance[] = [];
    let totalPauseDuration = 0;
    let shortPauseCount = 0;
    let longPauseCount = 0;
    let strategicPauseCount = 0;
    
    if (words.length > 1) {
      for (let i = 1; i < words.length; i++) {
        const gap = words[i].start - words[i-1].end;
        if (gap > 0.3) { // Pause threshold
          const pauseType = gap > 1.5 ? 'Long Pause' : gap > 0.8 ? 'Strategic Pause' : 'Brief Pause';
          
          pauseInstances.push({
            after_word: words[i-1].word,
            before_word: words[i].word,
            timestamp: formatTimestamp(words[i-1].end),
            start_seconds: words[i-1].end,
            duration_seconds: parseFloat(gap.toFixed(2)),
            pause_type: pauseType
          });
          
          totalPauseDuration += gap;
          
          if (gap > 1.5) longPauseCount++;
          else if (gap > 0.8) strategicPauseCount++;
          else shortPauseCount++;
        }
      }
    }
    
    const avgPauseDuration = pauseInstances.length > 0 ? totalPauseDuration / pauseInstances.length : 0;
    const pausesPerMinute = (pauseInstances.length / duration) * 60;
    const pauseScore = calculatePauseScore(pausesPerMinute, avgPauseDuration);
    
    const pauseMetrics = {
      total_pauses: pauseInstances.length,
      pauses_per_minute: parseFloat(pausesPerMinute.toFixed(1)),
      average_duration: parseFloat(avgPauseDuration.toFixed(2)),
      total_pause_time: parseFloat(totalPauseDuration.toFixed(2)),
      brief_pauses: shortPauseCount,
      strategic_pauses: strategicPauseCount,
      long_pauses: longPauseCount,
      instances: pauseInstances.slice(0, 20), // Top 20 pauses
      calculation: `${pauseInstances.length} pauses ÷ ${(duration / 60).toFixed(2)} min = ${pausesPerMinute.toFixed(1)}/min`,
      benchmark: "Optimal: 3-5 strategic pauses per minute, 0.5-1.0s duration",
      benchmark_source: "Zellner (1994) Speech Timing Research"
    };
    
    // 4. SENTENCE ANALYSIS - For verbal clarity
    const sentences = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    
    interface SentenceData {
      sentence_number: number;
      text: string;
      word_count: number;
      clarity_rating: string;
    }
    
    const sentenceData: SentenceData[] = sentences.map((s: string, i: number) => {
      const sWordCount = s.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      return {
        sentence_number: i + 1,
        text: s.trim().substring(0, 100) + (s.trim().length > 100 ? '...' : ''),
        word_count: sWordCount,
        clarity_rating: sWordCount <= 15 ? 'Excellent' : sWordCount <= 20 ? 'Good' : sWordCount <= 25 ? 'Moderate' : 'Complex'
      };
    });
    
    const avgSentenceLength = wordCount / Math.max(sentences.length, 1);
    const sentenceLengths = sentences.map((s: string) => s.trim().split(/\s+/).filter((w: string) => w.length > 0).length);
    const shortSentences = sentenceLengths.filter((l: number) => l <= 15).length;
    const mediumSentences = sentenceLengths.filter((l: number) => l > 15 && l <= 25).length;
    const longSentences = sentenceLengths.filter((l: number) => l > 25).length;
    
    const sentenceMetrics = {
      total_sentences: sentences.length,
      average_words_per_sentence: parseFloat(avgSentenceLength.toFixed(1)),
      short_sentences_count: shortSentences,
      medium_sentences_count: mediumSentences,
      long_sentences_count: longSentences,
      sentence_breakdown: sentenceData.slice(0, 15), // First 15 sentences
      calculation: `${wordCount} words ÷ ${sentences.length} sentences = ${avgSentenceLength.toFixed(1)} words/sentence`,
      benchmark: "Optimal: 15-20 words per sentence for clarity",
      benchmark_source: "Flesch-Kincaid Readability Research"
    };
    
    // 5. Hedging/Confidence Language Analysis
    const hedgingPhrases = ['maybe', 'perhaps', 'i think', 'i guess', 'i believe', 'kind of', 'sort of', 'probably', 'might', 'could be', 'it seems', 'i suppose', 'not sure'];
    const confidencePhrases = ['i know', 'i am confident', 'definitely', 'certainly', 'absolutely', 'we will', 'i will', 'without doubt', 'clearly', 'undoubtedly'];
    
    const transcriptLower = transcript.toLowerCase();
    
    interface LanguageInstance {
      phrase: string;
      type: string;
      count: number;
    }
    
    const languageInstances: LanguageInstance[] = [];
    let hedgeCount = 0;
    let confidenceCount = 0;
    
    hedgingPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        languageInstances.push({ phrase, type: 'Hedging', count });
        hedgeCount += count;
      }
    });
    
    confidencePhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      const count = matches ? matches.length : 0;
      if (count > 0) {
        languageInstances.push({ phrase, type: 'Confidence', count });
        confidenceCount += count;
      }
    });
    
    const confidenceRatio = confidenceCount / Math.max(hedgeCount, 1);
    const confidenceScore = calculateConfidenceScore(hedgeCount, confidenceCount, wordCount);
    
    const confidenceMetrics = {
      hedge_count: hedgeCount,
      confidence_count: confidenceCount,
      confidence_ratio: parseFloat(confidenceRatio.toFixed(2)),
      language_breakdown: languageInstances.sort((a, b) => b.count - a.count),
      calculation: `${confidenceCount} confidence phrases ÷ ${Math.max(hedgeCount, 1)} hedging phrases = ${confidenceRatio.toFixed(2)} ratio`,
      benchmark: "High-EP leaders use confidence language 3x more than hedging",
      benchmark_source: "Amy Cuddy, Harvard Business School Presence Research"
    };
    
    // 6. First Impression Analysis (first 40 seconds)
    const firstImpressionWords = words.filter((w: any) => w.start <= 40);
    const firstImpressionText = firstImpressionWords.map((w: any) => w.word).join(' ');
    
    // 7. Vocal Variety Indicators
    const exclamationCount = (transcript.match(/!/g) || []).length;
    const questionCount = (transcript.match(/\?/g) || []).length;
    
    // ============================================
    // GRAVITAS METRICS - Command & Authority Analysis
    // ============================================
    
    // Decisive language patterns
    const decisivePatterns = ['will', 'must', 'shall', 'need to', 'have to', 'going to', 'commit', 'decide', 'choose', 'determine'];
    const tentativePatterns = ['might', 'maybe', 'perhaps', 'could', 'would', 'possibly', 'hopefully', 'try to', 'attempt'];
    
    let decisiveCount = 0;
    let tentativeCount = 0;
    
    decisivePatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      decisiveCount += matches ? matches.length : 0;
    });
    
    tentativePatterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = transcriptLower.match(regex);
      tentativeCount += matches ? matches.length : 0;
    });
    
    const decisivenessRatio = decisiveCount / Math.max(tentativeCount, 1);
    const decisivenessScore = Math.min(100, Math.round(50 + (decisivenessRatio * 15)));
    
    const gravitasMetrics = {
      decisive_phrases: decisiveCount,
      tentative_phrases: tentativeCount,
      decisiveness_ratio: parseFloat(decisivenessRatio.toFixed(2)),
      authority_indicators: {
        first_person_singular: (transcriptLower.match(/\bi\b/gi) || []).length,
        first_person_plural: (transcriptLower.match(/\bwe\b/gi) || []).length,
        inclusive_ratio: parseFloat(((transcriptLower.match(/\bwe\b/gi) || []).length / Math.max((transcriptLower.match(/\bi\b/gi) || []).length, 1)).toFixed(2))
      },
      calculation: `${decisiveCount} decisive phrases ÷ ${Math.max(tentativeCount, 1)} tentative = ${decisivenessRatio.toFixed(2)} ratio`,
      benchmark: "High-gravitas leaders use 2-3x more decisive language than tentative",
      benchmark_source: "Sylvia Ann Hewlett, 'Executive Presence' (2014)"
    };

    // ============================================
    // COMPREHENSIVE AI ANALYSIS WITH GPT-4o
    // ============================================
    
    console.log('Running comprehensive AI analysis with GPT-4o...');
    
    const analysisPrompt = `You are a world-class Executive Presence assessment expert. Analyze this leadership video transcript with scientific rigor.

TRANSCRIPT (${Math.round(duration / 60)} minutes, ${wordCount} words):
"${transcript}"

FIRST IMPRESSION TEXT (0-40 seconds):
"${firstImpressionText}"

===== REAL-TIME QUANTITATIVE METRICS =====

📊 GRAVITAS METRICS:
${JSON.stringify(gravitasMetrics, null, 2)}
Decisiveness Score: ${decisivenessScore}/100

📊 SPEAKING RATE:
${JSON.stringify(speakingRateMetrics, null, 2)}
Pre-calculated Score: ${speakingRateScore}/100

📊 FILLER WORDS (WITH TIMESTAMPS):
${JSON.stringify(fillerMetrics, null, 2)}
Pre-calculated Score: ${fillerScore}/100

📊 STRATEGIC PAUSES (WITH TIMESTAMPS):
${JSON.stringify(pauseMetrics, null, 2)}
Pre-calculated Score: ${pauseScore}/100

📊 SENTENCE ANALYSIS (VERBAL CLARITY):
${JSON.stringify(sentenceMetrics, null, 2)}

📊 CONFIDENCE LANGUAGE:
${JSON.stringify(confidenceMetrics, null, 2)}
Pre-calculated Score: ${confidenceScore}/100

===== RESPONSE REQUIREMENTS =====

Provide your analysis in the following JSON format. Include the real-time metrics data in your response:

{
  "gravitas": {
    "overall_score": <average of all gravitas parameters>,
    "methodology": "Gravitas assessment based on Sylvia Ann Hewlett's Executive Presence framework measuring command, authority, and emotional intelligence.",
    "parameters": {
      "commanding_presence": {
        "score": <0-100>,
        "observation": "<assess authority in tone and language>",
        "coaching": "<specific technique for commanding presence>",
        "reference": "Sylvia Ann Hewlett - Executive Presence: command the room"
      },
      "decisiveness": {
        "score": ${decisivenessScore},
        "raw_value": "${decisiveCount} decisive vs ${tentativeCount} tentative phrases",
        "metrics": ${JSON.stringify(gravitasMetrics)},
        "observation": "<specific observation about decisiveness in language>",
        "coaching": "<actionable tip to increase decisiveness>",
        "reference": "HBR Research - Decisive leaders use 'will' over 'might' 3x more"
      },
      "poise_under_pressure": {
        "score": <0-100 based on steady delivery patterns>,
        "observation": "<assess composure indicators>",
        "coaching": "<technique for maintaining poise>",
        "reference": "Amy Cuddy - Power posing and composure research"
      },
      "emotional_intelligence": {
        "score": <0-100>,
        "observation": "<assess emotional awareness in communication>",
        "coaching": "<EQ development technique>",
        "reference": "Daniel Goleman - Emotional Intelligence in Leadership"
      },
      "vision_articulation": {
        "score": <0-100>,
        "observation": "<assess ability to paint future picture>",
        "coaching": "<vision communication technique>",
        "reference": "Simon Sinek - Start With Why framework"
      }
    }
  },
  "communication": {
    "overall_score": <average of all communication parameters>,
    "parameters": {
      "speaking_rate": {
        "score": ${speakingRateScore},
        "raw_value": "${speakingRate} WPM",
        "metrics": ${JSON.stringify(speakingRateMetrics)},
        "observation": "<specific observation citing the ${speakingRate} WPM metric>",
        "coaching": "<actionable tip with specific technique>",
        "reference": "Carmine Gallo, 'Talk Like TED' (2014) - Optimal executive speaking rate: 140-160 WPM"
      },
      "vocal_variety": {
        "score": <0-100>,
        "observation": "<assess vocal patterns from transcript>",
        "coaching": "<specific technique>",
        "reference": "Dr. Albert Mehrabian - 38% of communication impact comes from vocal variety"
      },
      "verbal_clarity": {
        "score": <0-100 based on avg sentence length ${avgSentenceLength.toFixed(1)} words>,
        "raw_value": "Avg ${avgSentenceLength.toFixed(1)} words/sentence",
        "metrics": ${JSON.stringify(sentenceMetrics)},
        "observation": "<assess readability and sentence structure>",
        "coaching": "<specific clarity tip>",
        "reference": "Flesch-Kincaid readability research - Optimal: 15-20 words per sentence"
      },
      "filler_words": {
        "score": ${fillerScore},
        "raw_value": "${fillerInstances.length} fillers (${fillerRate.toFixed(1)}%)",
        "metrics": ${JSON.stringify(fillerMetrics)},
        "observation": "<observation about specific fillers used with timestamps>",
        "coaching": "<specific technique like 'pregnant pause' method>",
        "reference": "Toastmasters International - Professional benchmark: <2% filler rate"
      },
      "strategic_pauses": {
        "score": ${pauseScore},
        "raw_value": "${pausesPerMinute.toFixed(1)} pauses/min, avg ${avgPauseDuration.toFixed(2)}s",
        "metrics": ${JSON.stringify(pauseMetrics)},
        "observation": "<assess pause patterns with specific timestamps>",
        "coaching": "<specific technique like 'power pause'>",
        "reference": "Zellner (1994) Speech Timing - Optimal: 3-5 strategic pauses per minute"
      },
      "confidence_language": {
        "score": ${confidenceScore},
        "raw_value": "${hedgeCount} hedges vs ${confidenceCount} confidence markers",
        "metrics": ${JSON.stringify(confidenceMetrics)},
        "observation": "<specific examples from transcript>",
        "coaching": "<language substitution techniques>",
        "reference": "Amy Cuddy, Harvard Business School - Presence research"
      }
    }
  },
  "appearance_nonverbal": {
    "overall_score": <average>,
    "note": "Analysis based on speech patterns and linguistic cues.",
    "parameters": {
      "presence_projection": {
        "score": <0-100>,
        "observation": "<assess commanding language>",
        "coaching": "<presence technique>",
        "reference": "Sylvia Ann Hewlett, 'Executive Presence' - Gravitas scoring"
      },
      "engagement_cues": {
        "score": <0-100>,
        "observation": "<assess engagement techniques>",
        "coaching": "<engagement technique>",
        "reference": "Nancy Duarte, 'Resonate' - Audience engagement"
      },
      "first_impression_impact": {
        "score": <0-100>,
        "raw_value": "First 40s: ${firstImpressionWords.length} words",
        "observation": "<assess opening strength>",
        "coaching": "<opening technique>",
        "reference": "Princeton research - 7-second first impression"
      },
      "energy_consistency": {
        "score": <0-100>,
        "observation": "<assess energy level>",
        "coaching": "<energy management technique>",
        "reference": "Tony Robbins - State management"
      }
    }
  },
  "storytelling": {
    "overall_score": <average>,
    "story_detected": <true/false>,
    "story_count": <number>,
    "parameters": {
      "narrative_structure": {
        "score": <0-100>,
        "observation": "<story elements>",
        "coaching": "<structure technique>",
        "reference": "Joseph Campbell's Hero's Journey"
      },
      "cognitive_ease": {
        "score": <0-100>,
        "observation": "<flow assessment>",
        "coaching": "<flow technique>",
        "reference": "Daniel Kahneman - Cognitive fluency"
      },
      "self_disclosure_authenticity": {
        "score": <0-100>,
        "observation": "<authenticity assessment>",
        "coaching": "<authenticity technique>",
        "reference": "Brené Brown - Vulnerability in leadership"
      },
      "memorability_concreteness": {
        "score": <0-100>,
        "observation": "<concrete details assessment>",
        "coaching": "<memorability technique>",
        "reference": "Chip Heath, 'Made to Stick'"
      },
      "story_placement_pacing": {
        "score": <0-100>,
        "observation": "<pacing assessment>",
        "coaching": "<pacing technique>",
        "reference": "TED Talk analysis"
      }
    }
  },
  "summary": "<3-4 sentences with specific evidence>",
  "top_strengths": ["<strength 1>", "<strength 2>"],
  "priority_development": "<single most impactful area>"
}

CRITICAL: Include the full metrics objects in your response. All observations must cite specific data.`;

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
            content: 'You are an expert executive coach. Provide data-driven assessments backed by specific metrics. Always respond with valid JSON only, no markdown.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 6000,
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
    
    console.log('Raw analysis response length:', analysisText.length);
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response preview:', analysisText.substring(0, 1000));
      throw new Error('Failed to parse AI analysis response');
    }

    // Ensure metrics are included even if AI didn't include them
    if (analysis.gravitas?.parameters) {
      if (analysis.gravitas.parameters.decisiveness) {
        analysis.gravitas.parameters.decisiveness.metrics = gravitasMetrics;
      }
    }
    
    if (analysis.communication?.parameters) {
      if (analysis.communication.parameters.speaking_rate) {
        analysis.communication.parameters.speaking_rate.metrics = speakingRateMetrics;
      }
      if (analysis.communication.parameters.filler_words) {
        analysis.communication.parameters.filler_words.metrics = fillerMetrics;
      }
      if (analysis.communication.parameters.strategic_pauses) {
        analysis.communication.parameters.strategic_pauses.metrics = pauseMetrics;
      }
      if (analysis.communication.parameters.verbal_clarity) {
        analysis.communication.parameters.verbal_clarity.metrics = sentenceMetrics;
      }
      if (analysis.communication.parameters.confidence_language) {
        analysis.communication.parameters.confidence_language.metrics = confidenceMetrics;
      }
    }

    // Calculate weighted overall score (Gravitas: 25%, Communication: 30%, Appearance: 25%, Storytelling: 20%)
    const gravitasScore = analysis.gravitas?.overall_score || 70;
    const communicationScore = analysis.communication.overall_score;
    const appearanceScore = analysis.appearance_nonverbal.overall_score;
    const storytellingScore = analysis.storytelling.overall_score;
    
    const overallScore = Math.round(
      (gravitasScore * 0.25) +
      (communicationScore * 0.30) + 
      (appearanceScore * 0.25) + 
      (storytellingScore * 0.20)
    );

    console.log('Final scores - Overall:', overallScore, 'Gravitas:', gravitasScore, 'Comm:', communicationScore, 'App:', appearanceScore, 'Story:', storytellingScore);

    // Update assessment with results
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        status: 'completed',
        overall_score: overallScore,
        communication_score: communicationScore,
        appearance_score: appearanceScore,
        storytelling_score: storytellingScore,
        communication_analysis: {
          ...analysis.communication,
          gravitas_analysis: analysis.gravitas,
          gravitas_score: gravitasScore
        },
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
// HELPER FUNCTIONS
// ============================================

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}

function calculateSpeakingRateScore(wpm: number): number {
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
  if (fillerRate <= 1) return 95;
  if (fillerRate <= 2) return 85;
  if (fillerRate <= 3) return 75;
  if (fillerRate <= 4) return 65;
  if (fillerRate <= 5) return 55;
  if (fillerRate <= 7) return 45;
  return 35;
}

function calculateConfidenceScore(hedges: number, confidence: number, wordCount: number): number {
  const hedgeRate = (hedges / wordCount) * 100;
  const ratio = confidence / Math.max(hedges, 1);
  
  if (ratio >= 3 && hedgeRate < 1) return 95;
  if (ratio >= 2 && hedgeRate < 2) return 85;
  if (ratio >= 1.5 && hedgeRate < 3) return 75;
  if (ratio >= 1 && hedgeRate < 4) return 65;
  if (ratio >= 0.5) return 55;
  return 45;
}

function calculatePauseScore(pausesPerMinute: number, avgDuration: number): number {
  let score = 70;
  
  if (pausesPerMinute >= 3 && pausesPerMinute <= 5) score += 15;
  else if (pausesPerMinute >= 2 && pausesPerMinute <= 6) score += 8;
  else if (pausesPerMinute < 2) score -= 10;
  else if (pausesPerMinute > 8) score -= 10;
  
  if (avgDuration >= 0.5 && avgDuration <= 1.0) score += 15;
  else if (avgDuration >= 0.3 && avgDuration <= 1.5) score += 8;
  else if (avgDuration > 2.0) score -= 10;
  
  return Math.max(30, Math.min(100, score));
}
