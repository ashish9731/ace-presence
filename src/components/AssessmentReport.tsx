import { useState } from "react";
import { ChevronDown, ChevronLeft, MessageSquare, Eye, BookOpen, Lightbulb, Info, BookmarkCheck, Target, ExternalLink, Award, Download, Clock, Hash, FileText, Crown, Zap } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FillerInstance {
  word: string;
  timestamp: string;
  start_seconds: number;
  end_seconds: number;
}

interface PauseInstance {
  after_word: string;
  before_word: string;
  timestamp: string;
  start_seconds: number;
  duration_seconds: number;
  pause_type: string;
}

interface SentenceData {
  sentence_number: number;
  text: string;
  word_count: number;
  clarity_rating: string;
}

interface GravitasMetrics {
  decisive_phrases: number;
  tentative_phrases: number;
  decisiveness_ratio: number;
  authority_indicators: {
    first_person_singular: number;
    first_person_plural: number;
    inclusive_ratio: number;
  };
  calculation: string;
  benchmark: string;
  benchmark_source: string;
}

interface FillerMetrics {
  total_count: number;
  filler_rate_percent: number;
  instances: FillerInstance[];
  breakdown: Record<string, number>;
  calculation: string;
  benchmark: string;
  benchmark_source: string;
}

interface PauseMetrics {
  total_pauses: number;
  pauses_per_minute: number;
  average_duration: number;
  total_pause_time: number;
  brief_pauses: number;
  strategic_pauses: number;
  long_pauses: number;
  instances: PauseInstance[];
  calculation: string;
  benchmark: string;
  benchmark_source: string;
}

interface SentenceMetrics {
  total_sentences: number;
  average_words_per_sentence: number;
  short_sentences_count: number;
  medium_sentences_count: number;
  long_sentences_count: number;
  sentence_breakdown: SentenceData[];
  calculation: string;
  benchmark: string;
  benchmark_source: string;
}

interface SpeakingRateMetrics {
  wpm: number;
  total_words: number;
  duration_seconds: number;
  calculation: string;
  optimal_range: string;
  benchmark_source: string;
}

interface LanguageInstance {
  phrase: string;
  type: string;
  count: number;
}

interface ConfidenceMetrics {
  hedge_count: number;
  confidence_count: number;
  confidence_ratio: number;
  language_breakdown: LanguageInstance[];
  calculation: string;
  benchmark: string;
  benchmark_source: string;
}

interface ParameterData {
  score: number;
  raw_value?: string;
  observation: string;
  coaching: string;
  reference?: string;
  metrics?: FillerMetrics | PauseMetrics | SentenceMetrics | SpeakingRateMetrics | ConfidenceMetrics | GravitasMetrics;
}

interface BucketData {
  overall_score: number;
  note?: string;
  methodology?: string;
  story_detected?: boolean;
  story_count?: number;
  gravitas_analysis?: BucketData;
  gravitas_score?: number;
  parameters: Record<string, ParameterData>;
}

interface StorytellingData extends BucketData {
  summary?: string;
  top_strengths?: string[];
  priority_development?: string;
}

interface Assessment {
  id: string;
  overall_score: number;
  communication_score: number;
  appearance_score: number;
  storytelling_score: number;
  communication_analysis: BucketData;
  appearance_analysis: BucketData;
  storytelling_analysis: StorytellingData;
  transcript: string;
  video_duration_seconds: number;
}

interface AssessmentReportProps {
  assessment: Assessment;
  onNewAssessment: () => void;
}

const bucketIcons = {
  gravitas: Crown,
  communication: MessageSquare,
  appearance: Eye,
  storytelling: BookOpen,
};

const bucketColors = {
  gravitas: "hsl(280, 60%, 50%)",
  communication: "hsl(222, 47%, 25%)",
  appearance: "hsl(38, 92%, 50%)",
  storytelling: "hsl(152, 69%, 40%)",
};

const parameterLabels: Record<string, string> = {
  commanding_presence: "Commanding Presence",
  decisiveness: "Decisiveness",
  poise_under_pressure: "Poise Under Pressure",
  emotional_intelligence: "Emotional Intelligence",
  vision_articulation: "Vision Articulation",
  speaking_rate: "Speaking Rate",
  vocal_variety: "Vocal Variety",
  verbal_clarity: "Verbal Clarity",
  filler_words: "Filler Words",
  pauses: "Pause Usage",
  strategic_pauses: "Strategic Pauses",
  confidence_language: "Confidence Language",
  presence_projection: "Presence Projection",
  engagement_cues: "Engagement Cues",
  first_impression: "First Impression",
  first_impression_impact: "First Impression Impact",
  energy_consistency: "Energy Consistency",
  narrative_structure: "Narrative Structure",
  narrative_flow: "Narrative Flow",
  cognitive_ease: "Cognitive Ease",
  self_disclosure: "Self-Disclosure",
  self_disclosure_authenticity: "Self-Disclosure & Authenticity",
  memorability: "Memorability",
  memorability_concreteness: "Memorability & Concreteness",
  story_placement: "Story Placement",
  story_placement_pacing: "Story Placement & Pacing",
};

function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Exceptional", color: "text-success" };
  if (score >= 80) return { label: "Strong", color: "text-success" };
  if (score >= 70) return { label: "Good", color: "text-accent" };
  if (score >= 60) return { label: "Developing", color: "text-warning" };
  if (score >= 50) return { label: "Needs Work", color: "text-warning" };
  return { label: "Focus Area", color: "text-destructive" };
}

function MetricsPanel({ paramKey, metrics }: { paramKey: string; metrics: ParameterData['metrics'] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!metrics) return null;

  const renderGravitasMetrics = (m: GravitasMetrics) => (
    <div className="space-y-4">
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-success/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-success">{m.decisive_phrases}</p>
          <p className="text-xs text-muted-foreground">Decisive Phrases</p>
        </div>
        <div className="bg-warning/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-warning">{m.tentative_phrases}</p>
          <p className="text-xs text-muted-foreground">Tentative Phrases</p>
        </div>
      </div>
      
      <div className="bg-muted/30 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">👤 Authority Indicators</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{m.authority_indicators.first_person_singular}</p>
            <p className="text-xs text-muted-foreground">"I" usage</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{m.authority_indicators.first_person_plural}</p>
            <p className="text-xs text-muted-foreground">"We" usage</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{m.authority_indicators.inclusive_ratio}</p>
            <p className="text-xs text-muted-foreground">Inclusive Ratio</p>
          </div>
        </div>
      </div>
      
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderFillerMetrics = (m: FillerMetrics) => (
    <div className="space-y-4">
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      {Object.keys(m.breakdown).length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">📊 Filler Word Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(m.breakdown).map(([word, count]) => (
              <span key={word} className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
                "{word}": {count}x
              </span>
            ))}
          </div>
        </div>
      )}
      
      {m.instances.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">⏱️ Filler Words with Timestamps</p>
          <div className="max-h-48 overflow-y-auto space-y-1 bg-muted/30 rounded-lg p-3">
            {m.instances.map((instance, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                <span className="font-medium text-destructive">"{instance.word}"</span>
                <span className="font-mono text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {instance.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderPauseMetrics = (m: PauseMetrics) => (
    <div className="space-y-4">
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-foreground">{m.brief_pauses}</p>
          <p className="text-xs text-muted-foreground">Brief Pauses</p>
          <p className="text-xs text-muted-foreground/70">(0.3-0.8s)</p>
        </div>
        <div className="bg-success/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-success">{m.strategic_pauses}</p>
          <p className="text-xs text-muted-foreground">Strategic</p>
          <p className="text-xs text-muted-foreground/70">(0.8-1.5s)</p>
        </div>
        <div className="bg-warning/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-warning">{m.long_pauses}</p>
          <p className="text-xs text-muted-foreground">Long Pauses</p>
          <p className="text-xs text-muted-foreground/70">({">"}1.5s)</p>
        </div>
      </div>
      
      {m.instances.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">⏱️ Strategic Pauses with Timestamps</p>
          <div className="max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">After Word</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {m.instances.map((pause, i) => (
                  <tr key={i} className="border-b border-border/30 last:border-0">
                    <td className="py-2 font-mono">{pause.timestamp}</td>
                    <td className="py-2 text-foreground/80">"{pause.after_word}"</td>
                    <td className="py-2 font-mono">{pause.duration_seconds}s</td>
                    <td className="py-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        pause.pause_type === 'Strategic Pause' && "bg-success/20 text-success",
                        pause.pause_type === 'Long Pause' && "bg-warning/20 text-warning",
                        pause.pause_type === 'Brief Pause' && "bg-muted text-muted-foreground"
                      )}>
                        {pause.pause_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderSentenceMetrics = (m: SentenceMetrics) => (
    <div className="space-y-4">
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-success/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-success">{m.short_sentences_count}</p>
          <p className="text-xs text-muted-foreground">Short</p>
          <p className="text-xs text-muted-foreground/70">(≤15 words)</p>
        </div>
        <div className="bg-accent/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-accent">{m.medium_sentences_count}</p>
          <p className="text-xs text-muted-foreground">Medium</p>
          <p className="text-xs text-muted-foreground/70">(16-25 words)</p>
        </div>
        <div className="bg-warning/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-warning">{m.long_sentences_count}</p>
          <p className="text-xs text-muted-foreground">Long</p>
          <p className="text-xs text-muted-foreground/70">({">"}25 words)</p>
        </div>
      </div>
      
      {m.sentence_breakdown.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">📝 Sentence Analysis</p>
          <div className="max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3 space-y-2">
            {m.sentence_breakdown.map((sentence) => (
              <div key={sentence.sentence_number} className="flex items-start gap-2 text-sm border-b border-border/30 pb-2 last:border-0">
                <span className="font-mono text-muted-foreground w-6">#{sentence.sentence_number}</span>
                <div className="flex-1">
                  <p className="text-foreground/80">{sentence.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs">{sentence.word_count} words</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      sentence.clarity_rating === 'Excellent' && "bg-success/20 text-success",
                      sentence.clarity_rating === 'Good' && "bg-accent/20 text-accent",
                      sentence.clarity_rating === 'Moderate' && "bg-warning/20 text-warning",
                      sentence.clarity_rating === 'Complex' && "bg-destructive/20 text-destructive"
                    )}>
                      {sentence.clarity_rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderSpeakingRateMetrics = (m: SpeakingRateMetrics) => (
    <div className="space-y-4">
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-primary">{m.wpm}</p>
          <p className="text-xs text-muted-foreground">WPM</p>
        </div>
        <div className="bg-muted/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-foreground">{m.total_words}</p>
          <p className="text-xs text-muted-foreground">Total Words</p>
        </div>
        <div className="bg-muted/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-foreground">{Math.round(m.duration_seconds / 60)}</p>
          <p className="text-xs text-muted-foreground">Minutes</p>
        </div>
      </div>
      
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Optimal Range</p>
        <p className="text-sm text-foreground">{m.optimal_range}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderConfidenceMetrics = (m: ConfidenceMetrics) => (
    <div className="space-y-4">
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-warning/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-warning">{m.hedge_count}</p>
          <p className="text-xs text-muted-foreground">Hedging Phrases</p>
        </div>
        <div className="bg-success/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-success">{m.confidence_count}</p>
          <p className="text-xs text-muted-foreground">Confidence Phrases</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-primary">{m.confidence_ratio}</p>
          <p className="text-xs text-muted-foreground">Ratio</p>
        </div>
      </div>
      
      {m.language_breakdown.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">📊 Language Usage</p>
          <div className="space-y-2">
            {m.language_breakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className={cn(
                  "font-medium",
                  item.type === 'Hedging' ? "text-warning" : "text-success"
                )}>
                  "{item.phrase}"
                </span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    item.type === 'Hedging' ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                  )}>
                    {item.type}
                  </span>
                  <span className="font-mono text-sm">{item.count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderMetricsContent = () => {
    if (paramKey === 'decisiveness' && 'decisive_phrases' in metrics) {
      return renderGravitasMetrics(metrics as GravitasMetrics);
    }
    if (paramKey === 'filler_words' && 'instances' in metrics && 'breakdown' in metrics) {
      return renderFillerMetrics(metrics as FillerMetrics);
    }
    if (paramKey === 'strategic_pauses' && 'instances' in metrics && 'strategic_pauses' in metrics) {
      return renderPauseMetrics(metrics as PauseMetrics);
    }
    if (paramKey === 'verbal_clarity' && 'sentence_breakdown' in metrics) {
      return renderSentenceMetrics(metrics as SentenceMetrics);
    }
    if (paramKey === 'speaking_rate' && 'wpm' in metrics) {
      return renderSpeakingRateMetrics(metrics as SpeakingRateMetrics);
    }
    if (paramKey === 'confidence_language' && 'language_breakdown' in metrics) {
      return renderConfidenceMetrics(metrics as ConfidenceMetrics);
    }
    return null;
  };

  const content = renderMetricsContent();
  if (!content) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <Hash className="w-4 h-4" />
        <span className="font-medium">View Detailed Metrics & Timestamps</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
      </button>
      
      {isExpanded && (
        <div className="mt-4 animate-fade-in">
          {content}
        </div>
      )}
    </div>
  );
}

function BucketSection({ 
  title, 
  icon: Icon, 
  color, 
  score, 
  data,
  weight 
}: { 
  title: string;
  icon: typeof MessageSquare;
  color: string;
  score: number;
  data: BucketData;
  weight: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const scoreLevel = getScoreLevel(score);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-md animate-slide-up">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div className="text-left">
            <h3 className="font-display text-xl font-semibold text-foreground">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{weight} weight</p>
              <span className="text-sm text-muted-foreground">•</span>
              <p className={cn("text-sm font-medium", scoreLevel.color)}>{scoreLevel.label}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={score} size="sm" showLabel={false} />
          <ChevronDown 
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} 
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-5 space-y-4">
          {data.note && (
            <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{data.note}</p>
            </div>
          )}

          {data.methodology && (
            <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-sm text-muted-foreground">
              <BookmarkCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
              <p><strong>Methodology:</strong> {data.methodology}</p>
            </div>
          )}

          {(data as StorytellingData).story_detected !== undefined && (
            <div className={cn(
              "flex items-start gap-2 p-3 rounded-lg text-sm",
              (data as StorytellingData).story_detected 
                ? "bg-success/10 text-success" 
                : "bg-warning/10 text-warning"
            )}>
              <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                {(data as StorytellingData).story_detected 
                  ? `${(data as StorytellingData).story_count || 1} narrative segment(s) detected in your presentation`
                  : "No clear narrative story detected. Consider adding a personal story for more impact."}
              </p>
            </div>
          )}
          
          {Object.entries(data.parameters).map(([key, param]) => (
            <ParameterCard 
              key={key} 
              paramKey={key}
              name={parameterLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} 
              data={param}
              color={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ParameterCard({ 
  paramKey,
  name, 
  data,
  color 
}: { 
  paramKey: string;
  name: string;
  data: ParameterData;
  color: string;
}) {
  const scoreLevel = getScoreLevel(data.score);

  return (
    <div className="p-4 bg-muted/20 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">{name}</h4>
          {data.raw_value && (
            <p className="text-sm text-muted-foreground font-mono">
              {data.raw_value}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", scoreLevel.color)}>
            {scoreLevel.label}
          </span>
          <ScoreRing score={data.score} size="sm" showLabel={false} />
        </div>
      </div>
      
      <div className="flex items-start gap-3 text-sm">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Observation</p>
          <p className="text-foreground/80">{data.observation}</p>
        </div>
      </div>
      
      <div className="flex items-start gap-3 text-sm">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}20` }}
        >
          <Lightbulb className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Coaching Recommendation</p>
          <p className="text-foreground/80">{data.coaching}</p>
        </div>
      </div>

      {data.reference && (
        <div className="flex items-start gap-3 text-sm pt-2 border-t border-border/50">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ExternalLink className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Research Reference</p>
            <p className="text-foreground/60 text-xs italic">{data.reference}</p>
          </div>
        </div>
      )}

      <MetricsPanel paramKey={paramKey} metrics={data.metrics} />
    </div>
  );
}

// Helper function to draw score circle in PDF
function drawScoreCircle(doc: jsPDF, x: number, y: number, score: number, size: number, color: number[]) {
  const radius = size / 2;
  
  // Background circle
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(3);
  doc.circle(x, y, radius, 'S');
  
  // Score arc (simplified as filled circle)
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(4);
  
  // Draw arc based on score
  const startAngle = -90;
  const endAngle = startAngle + (score / 100) * 360;
  
  // Simple arc approximation
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.circle(x, y, radius, 'S');
  
  // Score text
  doc.setFontSize(size * 0.8);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${Math.round(score)}`, x, y + 3, { align: 'center' });
}

// Helper function to draw horizontal bar chart
function drawBarChart(doc: jsPDF, x: number, y: number, width: number, score: number, color: number[], label: string) {
  const barHeight = 12;
  
  // Background bar
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(x, y, width, barHeight, 2, 2, 'F');
  
  // Score bar
  const scoreWidth = (score / 100) * width;
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, scoreWidth, barHeight, 2, 2, 'F');
  
  // Score text
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`${Math.round(score)}`, x + width + 5, y + 9);
  
  // Label
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(label, x, y - 2);
}

function generatePDF(assessment: Assessment) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor = [34, 45, 90];
  const gravitasColor = [147, 51, 234];
  const commColor = [34, 45, 90];
  const appColor = [245, 158, 11];
  const storyColor = [40, 167, 69];
  const successColor = [40, 167, 69];
  
  // Get gravitas data
  const gravitasData = assessment.communication_analysis?.gravitas_analysis;
  const gravitasScore = assessment.communication_analysis?.gravitas_score || 70;
  
  // ===== PAGE 1: Cover & Overview =====
  
  // Header gradient simulation
  doc.setFillColor(34, 45, 90);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Title
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("Executive Presence", pageWidth / 2, 25, { align: "center" });
  doc.setFontSize(16);
  doc.text("Assessment Report", pageWidth / 2, 38, { align: "center" });
  
  // Date & Duration
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Video Duration: ${Math.round(assessment.video_duration_seconds / 60)} minutes`, pageWidth / 2, 48, { align: "center" });
  
  // Overall Score Section
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("OVERALL EP SCORE", pageWidth / 2, 70, { align: "center" });
  
  // Large score display
  doc.setFontSize(60);
  doc.setTextColor(59, 130, 246);
  doc.text(`${Math.round(assessment.overall_score)}`, pageWidth / 2, 100, { align: "center" });
  doc.setFontSize(20);
  doc.setTextColor(150, 150, 150);
  doc.text("/100", pageWidth / 2 + 35, 100);
  
  // Score level
  const overallLevel = getScoreLevel(assessment.overall_score);
  doc.setFontSize(14);
  if (assessment.overall_score >= 70) {
    doc.setTextColor(40, 167, 69);
  } else if (assessment.overall_score >= 50) {
    doc.setTextColor(245, 158, 11);
  } else {
    doc.setTextColor(220, 53, 69);
  }
  doc.text(overallLevel.label, pageWidth / 2, 115, { align: "center" });
  
  // Bucket scores visualization
  const buckets = [
    { name: "Gravitas", score: gravitasScore, weight: "25%", color: gravitasColor },
    { name: "Communication", score: assessment.communication_score, weight: "30%", color: commColor },
    { name: "Appearance", score: assessment.appearance_score, weight: "25%", color: appColor },
    { name: "Storytelling", score: assessment.storytelling_score, weight: "20%", color: storyColor },
  ];
  
  let yPos = 140;
  const barWidth = 100;
  const barX = 50;
  
  doc.setFontSize(12);
  doc.setTextColor(34, 45, 90);
  doc.text("DIMENSION BREAKDOWN", pageWidth / 2, yPos - 10, { align: "center" });
  
  buckets.forEach((bucket) => {
    drawBarChart(doc, barX, yPos, barWidth, bucket.score, bucket.color, `${bucket.name} (${bucket.weight})`);
    yPos += 25;
  });
  
  // Summary box
  const storytellingData = assessment.storytelling_analysis as StorytellingData;
  if (storytellingData?.summary) {
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, yPos + 10, pageWidth - 30, 40, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(34, 45, 90);
    doc.text("SUMMARY", 20, yPos + 22);
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const summaryLines = doc.splitTextToSize(storytellingData.summary, pageWidth - 45);
    doc.text(summaryLines.slice(0, 3), 20, yPos + 32);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Executive Presence Assessment | Powered by AI Analysis", pageWidth / 2, pageHeight - 10, { align: "center" });
  
  // ===== PAGE 2: Gravitas Analysis =====
  doc.addPage();
  
  // Header
  doc.setFillColor(147, 51, 234);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAVITAS ANALYSIS", 20, 20);
  doc.setFontSize(12);
  doc.text(`Score: ${Math.round(gravitasScore)}/100`, pageWidth - 20, 20, { align: "right" });
  
  yPos = 45;
  
  if (gravitasData?.parameters) {
    const gravitasParams = gravitasData.parameters;
    const gravitasTableData: string[][] = [];
    
    Object.entries(gravitasParams).forEach(([key, param]) => {
      const paramData = param as ParameterData;
      gravitasTableData.push([
        parameterLabels[key] || key,
        `${Math.round(paramData.score)}/100`,
        paramData.raw_value || '-',
        paramData.observation.substring(0, 60) + (paramData.observation.length > 60 ? '...' : '')
      ]);
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Parameter', 'Score', 'Value', 'Observation']],
      body: gravitasTableData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [147, 51, 234] },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
      },
    });
    
    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 50;
    
    // Coaching recommendations for gravitas
    doc.setFontSize(11);
    doc.setTextColor(147, 51, 234);
    doc.text("Coaching Recommendations", 20, yPos);
    yPos += 8;
    
    Object.entries(gravitasParams).slice(0, 3).forEach(([key, param]) => {
      const paramData = param as ParameterData;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const coachLines = doc.splitTextToSize(`• ${parameterLabels[key] || key}: ${paramData.coaching}`, pageWidth - 40);
      doc.text(coachLines.slice(0, 2), 20, yPos);
      yPos += coachLines.slice(0, 2).length * 5 + 3;
    });
  }
  
  // ===== PAGE 3: Communication Analysis =====
  doc.addPage();
  
  doc.setFillColor(34, 45, 90);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("COMMUNICATION ANALYSIS", 20, 20);
  doc.setFontSize(12);
  doc.text(`Score: ${Math.round(assessment.communication_score)}/100`, pageWidth - 20, 20, { align: "right" });
  
  yPos = 45;
  
  const commParams = assessment.communication_analysis?.parameters || {};
  const commData: string[][] = [];
  
  Object.entries(commParams).forEach(([key, param]) => {
    const paramData = param as ParameterData;
    commData.push([
      parameterLabels[key] || key,
      `${Math.round(paramData.score)}/100`,
      paramData.raw_value || '-',
      paramData.observation.substring(0, 60) + (paramData.observation.length > 60 ? '...' : '')
    ]);
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Score', 'Value', 'Observation']],
    body: commData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [34, 45, 90] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20 },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
    },
  });
  
  // Filler Words Detail
  const fillerMetrics = commParams.filler_words?.metrics as FillerMetrics | undefined;
  if (fillerMetrics?.instances?.length > 0) {
    yPos = (doc as any).lastAutoTable?.finalY + 15 || 150;
    
    doc.setFontSize(11);
    doc.setTextColor(220, 53, 69);
    doc.text("Filler Words Detail (with timestamps)", 20, yPos);
    
    const fillerData = fillerMetrics.instances.slice(0, 15).map(f => [f.word, f.timestamp]);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Filler Word', 'Timestamp']],
      body: fillerData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 53, 69] },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 } },
      margin: { left: 20 },
      tableWidth: 100,
    });
  }
  
  // ===== PAGE 4: Pauses & Sentence Analysis =====
  doc.addPage();
  
  doc.setFillColor(40, 167, 69);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("DETAILED METRICS", 20, 20);
  
  yPos = 45;
  
  // Pauses Detail
  const pauseMetrics = commParams.strategic_pauses?.metrics as PauseMetrics | undefined;
  if (pauseMetrics?.instances?.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(40, 167, 69);
    doc.text("Strategic Pauses Timeline", 20, yPos);
    
    const pauseData = pauseMetrics.instances.slice(0, 12).map(p => [
      p.timestamp,
      p.after_word,
      `${p.duration_seconds}s`,
      p.pause_type
    ]);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Time', 'After Word', 'Duration', 'Type']],
      body: pauseData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 167, 69] },
      alternateRowStyles: { fillColor: [240, 255, 244] },
    });
    
    yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 80;
  }
  
  // Sentence Analysis
  const sentenceMetrics = commParams.verbal_clarity?.metrics as SentenceMetrics | undefined;
  if (sentenceMetrics) {
    doc.setFontSize(11);
    doc.setTextColor(34, 45, 90);
    doc.text("Sentence Clarity Analysis", 20, yPos);
    yPos += 10;
    
    // Stats boxes
    const boxWidth = 50;
    const boxHeight = 25;
    const boxY = yPos;
    
    // Short sentences
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(20, boxY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(40, 167, 69);
    doc.text(`${sentenceMetrics.short_sentences_count}`, 45, boxY + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Short (≤15 words)', 45, boxY + 20, { align: 'center' });
    
    // Medium sentences
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(75, boxY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(245, 158, 11);
    doc.text(`${sentenceMetrics.medium_sentences_count}`, 100, boxY + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Medium (16-25)', 100, boxY + 20, { align: 'center' });
    
    // Long sentences
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(130, boxY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setTextColor(220, 53, 69);
    doc.text(`${sentenceMetrics.long_sentences_count}`, 155, boxY + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Long (>25 words)', 155, boxY + 20, { align: 'center' });
    
    yPos = boxY + 35;
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Calculation: ${sentenceMetrics.calculation}`, 20, yPos);
    yPos += 6;
    doc.text(`Benchmark: ${sentenceMetrics.benchmark}`, 20, yPos);
  }
  
  // ===== PAGE 5: Appearance & Storytelling =====
  doc.addPage();
  
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("APPEARANCE & STORYTELLING", 20, 20);
  
  yPos = 45;
  
  // Appearance
  doc.setFontSize(12);
  doc.setTextColor(245, 158, 11);
  doc.text(`Appearance & Nonverbal | Score: ${Math.round(assessment.appearance_score)}/100`, 20, yPos);
  yPos += 8;
  
  const appParams = assessment.appearance_analysis?.parameters || {};
  const appData: string[][] = [];
  
  Object.entries(appParams).forEach(([key, param]) => {
    const paramData = param as ParameterData;
    appData.push([
      parameterLabels[key] || key,
      `${Math.round(paramData.score)}/100`,
      paramData.observation.substring(0, 70) + (paramData.observation.length > 70 ? '...' : '')
    ]);
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Score', 'Observation']],
    body: appData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [245, 158, 11] },
    alternateRowStyles: { fillColor: [255, 251, 235] },
  });
  
  yPos = (doc as any).lastAutoTable?.finalY + 15 || 140;
  
  // Storytelling
  doc.setFontSize(12);
  doc.setTextColor(40, 167, 69);
  doc.text(`Storytelling | Score: ${Math.round(assessment.storytelling_score)}/100`, 20, yPos);
  yPos += 8;
  
  const storyParams = assessment.storytelling_analysis?.parameters || {};
  const storyData: string[][] = [];
  
  Object.entries(storyParams).forEach(([key, param]) => {
    const paramData = param as ParameterData;
    storyData.push([
      parameterLabels[key] || key,
      `${Math.round(paramData.score)}/100`,
      paramData.observation.substring(0, 70) + (paramData.observation.length > 70 ? '...' : '')
    ]);
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Score', 'Observation']],
    body: storyData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [40, 167, 69] },
    alternateRowStyles: { fillColor: [240, 255, 244] },
  });
  
  // ===== PAGE 6: Summary & Recommendations =====
  doc.addPage();
  
  doc.setFillColor(34, 45, 90);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("SUMMARY & RECOMMENDATIONS", 20, 20);
  
  yPos = 50;
  
  // Top Strengths
  if (storytellingData?.top_strengths?.length > 0) {
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 10 + (storytellingData.top_strengths.length * 8), 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(40, 167, 69);
    doc.text("★ TOP STRENGTHS", 20, yPos + 5);
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    storytellingData.top_strengths.forEach((strength, i) => {
      doc.text(`• ${strength}`, 25, yPos + 15 + (i * 8));
    });
    
    yPos += 20 + (storytellingData.top_strengths.length * 8);
  }
  
  // Priority Development
  if (storytellingData?.priority_development) {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11);
    doc.text("⚡ PRIORITY FOCUS AREA", 20, yPos + 10);
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const devLines = doc.splitTextToSize(storytellingData.priority_development, pageWidth - 45);
    doc.text(devLines.slice(0, 2), 20, yPos + 20);
    
    yPos += 40;
  }
  
  // Key coaching points
  doc.setFontSize(11);
  doc.setTextColor(34, 45, 90);
  doc.text("KEY COACHING RECOMMENDATIONS", 20, yPos);
  yPos += 10;
  
  const allParams = { ...commParams, ...appParams, ...storyParams };
  let coachCount = 0;
  
  Object.entries(allParams).forEach(([key, param]) => {
    if (coachCount >= 5) return;
    const paramData = param as ParameterData;
    if (paramData.score < 75) {
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const coachText = `${parameterLabels[key] || key}: ${paramData.coaching}`;
      const lines = doc.splitTextToSize(`• ${coachText}`, pageWidth - 40);
      doc.text(lines.slice(0, 2), 20, yPos);
      yPos += lines.slice(0, 2).length * 4 + 4;
      coachCount++;
    }
  });
  
  // Disclaimer
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, pageHeight - 35, pageWidth - 30, 20, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("⚠️ DISCLAIMER: This assessment provides a point-in-time analysis based on a single video sample.", 20, pageHeight - 27);
  doc.text("It is not a personality diagnosis or comprehensive evaluation. Use this feedback as one data point in your leadership development journey.", 20, pageHeight - 22);
  
  // Save
  doc.save(`EP-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  toast.success("PDF report downloaded successfully!");
}

export function AssessmentReport({ assessment, onNewAssessment }: AssessmentReportProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  const storytellingData = assessment.storytelling_analysis as StorytellingData;
  const summary = storytellingData?.summary || 
    "Your Executive Presence assessment is complete. Review the detailed feedback below.";
  const topStrengths = storytellingData?.top_strengths || [];
  const priorityDevelopment = storytellingData?.priority_development;
  
  // Get gravitas data from communication_analysis
  const gravitasData = assessment.communication_analysis?.gravitas_analysis;
  const gravitasScore = assessment.communication_analysis?.gravitas_score || 70;

  const overallLevel = getScoreLevel(assessment.overall_score);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <Button
        onClick={onNewAssessment}
        variant="ghost"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Upload
      </Button>

      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full text-success text-sm font-medium mb-4">
          <Award className="w-4 h-4" />
          Analysis Complete
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Your Executive Presence Report
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Real-time AI analysis of your {Math.round(assessment.video_duration_seconds / 60)}-minute video with detailed metrics and timestamps.
        </p>
      </div>

      <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-lg animate-slide-up">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center">
            <ScoreRing 
              score={assessment.overall_score} 
              size="xl" 
              label="Overall EP Score"
            />
            <span className={cn("mt-2 text-lg font-semibold", overallLevel.color)}>
              {overallLevel.label}
            </span>
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-foreground/80 leading-relaxed">{summary}</p>

            {topStrengths.length > 0 && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Top Strengths
                </h4>
                <ul className="space-y-1">
                  {topStrengths.map((strength, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-success">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {priorityDevelopment && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Priority Focus Area
                </h4>
                <p className="text-sm text-foreground/80">{priorityDevelopment}</p>
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-xl font-display font-bold text-foreground">
                  {Math.round(gravitasScore)}
                </div>
                <div className="text-xs text-muted-foreground">Gravitas</div>
                <div className="text-xs text-muted-foreground/70">25%</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-bold text-foreground">
                  {Math.round(assessment.communication_score)}
                </div>
                <div className="text-xs text-muted-foreground">Communication</div>
                <div className="text-xs text-muted-foreground/70">30%</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-bold text-foreground">
                  {Math.round(assessment.appearance_score)}
                </div>
                <div className="text-xs text-muted-foreground">Appearance</div>
                <div className="text-xs text-muted-foreground/70">25%</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-display font-bold text-foreground">
                  {Math.round(assessment.storytelling_score)}
                </div>
                <div className="text-xs text-muted-foreground">Storytelling</div>
                <div className="text-xs text-muted-foreground/70">20%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Gravitas Section - NEW */}
        {gravitasData && (
          <BucketSection
            title="Gravitas"
            icon={bucketIcons.gravitas}
            color={bucketColors.gravitas}
            score={gravitasScore}
            data={gravitasData}
            weight="25%"
          />
        )}
        
        <BucketSection
          title="Communication"
          icon={bucketIcons.communication}
          color={bucketColors.communication}
          score={assessment.communication_score}
          data={assessment.communication_analysis}
          weight="30%"
        />
        
        <BucketSection
          title="Appearance & Nonverbal"
          icon={bucketIcons.appearance}
          color={bucketColors.appearance}
          score={assessment.appearance_score}
          data={assessment.appearance_analysis}
          weight="25%"
        />
        
        <BucketSection
          title="Storytelling"
          icon={bucketIcons.storytelling}
          color={bucketColors.storytelling}
          score={assessment.storytelling_score}
          data={assessment.storytelling_analysis}
          weight="20%"
        />
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-foreground">View Full Transcript</span>
            <span className="text-sm text-muted-foreground">
              ({assessment.transcript.split(/\s+/).length} words)
            </span>
          </div>
          <ChevronDown 
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              showTranscript && "rotate-180"
            )} 
          />
        </button>
        
        {showTranscript && (
          <div className="border-t border-border p-5">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {assessment.transcript}
            </p>
          </div>
        )}
      </div>

      <div className="text-center p-4 bg-muted/30 rounded-xl">
        <p className="text-xs text-muted-foreground">
          ⚠️ <strong>Important Disclaimer:</strong> This assessment provides a point-in-time analysis based on a single video sample. 
          It is not a personality diagnosis or comprehensive evaluation. Use this feedback as one data point in your leadership development journey.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <Button
          onClick={() => generatePDF(assessment)}
          variant="outline"
          className="h-12 px-8 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </Button>
        <Button
          onClick={onNewAssessment}
          className="h-12 px-8"
        >
          Record New Assessment
        </Button>
      </div>
    </div>
  );
}
