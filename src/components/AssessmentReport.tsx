import { useState } from "react";
import { ChevronDown, ChevronLeft, MessageSquare, Eye, BookOpen, Lightbulb, Info, BookmarkCheck, Target, ExternalLink, Award, Download, Clock, Hash, FileText } from "lucide-react";
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
  metrics?: FillerMetrics | PauseMetrics | SentenceMetrics | SpeakingRateMetrics | ConfidenceMetrics;
}

interface BucketData {
  overall_score: number;
  note?: string;
  methodology?: string;
  story_detected?: boolean;
  story_count?: number;
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
  communication: MessageSquare,
  appearance: Eye,
  storytelling: BookOpen,
};

const bucketColors = {
  communication: "hsl(222, 47%, 25%)",
  appearance: "hsl(38, 92%, 50%)",
  storytelling: "hsl(152, 69%, 40%)",
};

const parameterLabels: Record<string, string> = {
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

  const renderFillerMetrics = (m: FillerMetrics) => (
    <div className="space-y-4">
      {/* Calculation */}
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      {/* Breakdown */}
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
      
      {/* Instances with Timestamps */}
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
      
      {/* Benchmark */}
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderPauseMetrics = (m: PauseMetrics) => (
    <div className="space-y-4">
      {/* Calculation */}
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      {/* Pause Statistics */}
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
          <p className="text-xs text-muted-foreground/70">{"(>1.5s)"}</p>
        </div>
      </div>
      
      {/* Pause Instances with Timestamps */}
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
      
      {/* Benchmark */}
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderSentenceMetrics = (m: SentenceMetrics) => (
    <div className="space-y-4">
      {/* Calculation */}
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      {/* Sentence Distribution */}
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
          <p className="text-xs text-muted-foreground/70">{"(>25 words)"}</p>
        </div>
      </div>
      
      {/* Sentence Breakdown */}
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
      
      {/* Benchmark */}
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderSpeakingRateMetrics = (m: SpeakingRateMetrics) => (
    <div className="space-y-4">
      {/* Calculation */}
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      {/* Metrics Grid */}
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
      
      {/* Optimal Range */}
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Optimal Range</p>
        <p className="text-sm text-foreground">{m.optimal_range}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderConfidenceMetrics = (m: ConfidenceMetrics) => (
    <div className="space-y-4">
      {/* Calculation */}
      <div className="bg-primary/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">📐 Calculation</p>
        <p className="font-mono text-sm text-foreground">{m.calculation}</p>
      </div>
      
      {/* Summary Stats */}
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
      
      {/* Language Breakdown */}
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
      
      {/* Benchmark */}
      <div className="bg-success/5 p-3 rounded-lg">
        <p className="text-xs text-muted-foreground mb-1 font-semibold">🎯 Benchmark</p>
        <p className="text-sm text-foreground">{m.benchmark}</p>
        <p className="text-xs text-muted-foreground italic mt-1">Source: {m.benchmark_source}</p>
      </div>
    </div>
  );

  const renderMetricsContent = () => {
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

function generatePDF(assessment: Assessment) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(34, 45, 90);
  doc.text("Executive Presence Report", pageWidth / 2, 20, { align: "center" });
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });
  
  // Overall Score
  doc.setFontSize(14);
  doc.setTextColor(34, 45, 90);
  doc.text("Overall EP Score", 20, 45);
  doc.setFontSize(36);
  doc.setTextColor(59, 130, 246);
  doc.text(`${Math.round(assessment.overall_score)}`, 20, 60);
  doc.setFontSize(12);
  doc.text("/100", 50, 60);
  
  // Bucket Scores
  doc.setFontSize(12);
  doc.setTextColor(34, 45, 90);
  let yPos = 75;
  
  const buckets = [
    { name: "Communication", score: assessment.communication_score, weight: "40%" },
    { name: "Appearance & Nonverbal", score: assessment.appearance_score, weight: "35%" },
    { name: "Storytelling", score: assessment.storytelling_score, weight: "25%" },
  ];
  
  buckets.forEach((bucket) => {
    doc.setFontSize(11);
    doc.text(`${bucket.name} (${bucket.weight}): ${Math.round(bucket.score)}/100`, 20, yPos);
    yPos += 8;
  });
  
  // Communication Analysis
  yPos += 10;
  doc.setFontSize(16);
  doc.setTextColor(34, 45, 90);
  doc.text("Communication Analysis", 20, yPos);
  yPos += 10;
  
  const commParams = assessment.communication_analysis?.parameters || {};
  const commData: string[][] = [];
  
  Object.entries(commParams).forEach(([key, param]) => {
    const paramData = param as ParameterData;
    commData.push([
      parameterLabels[key] || key,
      `${Math.round(paramData.score)}/100`,
      paramData.raw_value || '-',
      paramData.observation.substring(0, 80) + (paramData.observation.length > 80 ? '...' : '')
    ]);
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Score', 'Value', 'Observation']],
    body: commData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [34, 45, 90] },
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
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(34, 45, 90);
    doc.text("Filler Words Detail", 20, 20);
    
    const fillerData = fillerMetrics.instances.map(f => [f.word, f.timestamp]);
    
    autoTable(doc, {
      startY: 30,
      head: [['Filler Word', 'Timestamp']],
      body: fillerData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 53, 69] },
    });
  }
  
  // Pauses Detail
  const pauseMetrics = commParams.strategic_pauses?.metrics as PauseMetrics | undefined;
  if (pauseMetrics?.instances?.length > 0) {
    const currentY = (doc as any).lastAutoTable?.finalY || 20;
    if (currentY > 200) doc.addPage();
    
    doc.setFontSize(16);
    doc.setTextColor(34, 45, 90);
    doc.text("Strategic Pauses Detail", 20, currentY > 200 ? 20 : currentY + 15);
    
    const pauseData = pauseMetrics.instances.map(p => [
      p.timestamp,
      p.after_word,
      `${p.duration_seconds}s`,
      p.pause_type
    ]);
    
    autoTable(doc, {
      startY: currentY > 200 ? 30 : currentY + 25,
      head: [['Time', 'After Word', 'Duration', 'Type']],
      body: pauseData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 167, 69] },
    });
  }
  
  // Appearance Analysis
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(34, 45, 90);
  doc.text("Appearance & Nonverbal Analysis", 20, 20);
  
  const appParams = assessment.appearance_analysis?.parameters || {};
  const appData: string[][] = [];
  
  Object.entries(appParams).forEach(([key, param]) => {
    const paramData = param as ParameterData;
    appData.push([
      parameterLabels[key] || key,
      `${Math.round(paramData.score)}/100`,
      paramData.observation.substring(0, 100) + (paramData.observation.length > 100 ? '...' : '')
    ]);
  });
  
  autoTable(doc, {
    startY: 30,
    head: [['Parameter', 'Score', 'Observation']],
    body: appData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [245, 158, 11] },
  });
  
  // Storytelling Analysis
  const storyY = (doc as any).lastAutoTable?.finalY || 100;
  doc.setFontSize(16);
  doc.setTextColor(34, 45, 90);
  doc.text("Storytelling Analysis", 20, storyY + 15);
  
  const storyParams = assessment.storytelling_analysis?.parameters || {};
  const storyData: string[][] = [];
  
  Object.entries(storyParams).forEach(([key, param]) => {
    const paramData = param as ParameterData;
    storyData.push([
      parameterLabels[key] || key,
      `${Math.round(paramData.score)}/100`,
      paramData.observation.substring(0, 100) + (paramData.observation.length > 100 ? '...' : '')
    ]);
  });
  
  autoTable(doc, {
    startY: storyY + 25,
    head: [['Parameter', 'Score', 'Observation']],
    body: storyData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [52, 168, 83] },
  });
  
  // Summary Page
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(34, 45, 90);
  doc.text("Summary & Recommendations", 20, 20);
  
  const storytellingData = assessment.storytelling_analysis as StorytellingData;
  
  if (storytellingData?.summary) {
    doc.setFontSize(11);
    doc.setTextColor(60);
    const summaryLines = doc.splitTextToSize(storytellingData.summary, pageWidth - 40);
    doc.text(summaryLines, 20, 35);
  }
  
  if (storytellingData?.top_strengths?.length > 0) {
    const strengthY = storytellingData?.summary ? 70 : 35;
    doc.setFontSize(13);
    doc.setTextColor(40, 167, 69);
    doc.text("Top Strengths:", 20, strengthY);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    storytellingData.top_strengths.forEach((strength, i) => {
      doc.text(`• ${strength}`, 25, strengthY + 10 + (i * 7));
    });
  }
  
  if (storytellingData?.priority_development) {
    doc.setFontSize(13);
    doc.setTextColor(245, 158, 11);
    doc.text("Priority Development Area:", 20, 110);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const devLines = doc.splitTextToSize(storytellingData.priority_development, pageWidth - 40);
    doc.text(devLines, 20, 120);
  }
  
  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("This assessment is a point-in-time analysis based on a single video sample.", 20, 280);
  
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
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {Math.round(assessment.communication_score)}
                </div>
                <div className="text-xs text-muted-foreground">Communication</div>
                <div className="text-xs text-muted-foreground/70">40% weight</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {Math.round(assessment.appearance_score)}
                </div>
                <div className="text-xs text-muted-foreground">Appearance</div>
                <div className="text-xs text-muted-foreground/70">35% weight</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {Math.round(assessment.storytelling_score)}
                </div>
                <div className="text-xs text-muted-foreground">Storytelling</div>
                <div className="text-xs text-muted-foreground/70">25% weight</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <BucketSection
          title="Communication"
          icon={bucketIcons.communication}
          color={bucketColors.communication}
          score={assessment.communication_score}
          data={assessment.communication_analysis}
          weight="40%"
        />
        
        <BucketSection
          title="Appearance & Nonverbal"
          icon={bucketIcons.appearance}
          color={bucketColors.appearance}
          score={assessment.appearance_score}
          data={assessment.appearance_analysis}
          weight="35%"
        />
        
        <BucketSection
          title="Storytelling"
          icon={bucketIcons.storytelling}
          color={bucketColors.storytelling}
          score={assessment.storytelling_score}
          data={assessment.storytelling_analysis}
          weight="25%"
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
