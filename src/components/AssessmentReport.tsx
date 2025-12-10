import { useState } from "react";
import { ChevronDown, ChevronLeft, MessageSquare, Eye, BookOpen, Lightbulb, Info, BookmarkCheck, Target, ExternalLink, Award } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ParameterData {
  score: number;
  raw_value?: string;
  observation: string;
  coaching: string;
  reference?: string;
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
  // Communication
  speaking_rate: "Speaking Rate",
  vocal_variety: "Vocal Variety",
  verbal_clarity: "Verbal Clarity",
  filler_words: "Filler Words",
  pauses: "Pause Usage",
  strategic_pauses: "Strategic Pauses",
  confidence_language: "Confidence Language",
  // Appearance & Nonverbal
  presence_projection: "Presence Projection",
  engagement_cues: "Engagement Cues",
  first_impression: "First Impression",
  first_impression_impact: "First Impression Impact",
  energy_consistency: "Energy Consistency",
  // Storytelling
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
      {/* Header */}
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

      {/* Content */}
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
  name, 
  data,
  color 
}: { 
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
      
      {/* Observation */}
      <div className="flex items-start gap-3 text-sm">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Observation</p>
          <p className="text-foreground/80">{data.observation}</p>
        </div>
      </div>
      
      {/* Coaching */}
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

      {/* Reference */}
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
    </div>
  );
}

export function AssessmentReport({ assessment, onNewAssessment }: AssessmentReportProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  // Get summary and additional data from storytelling analysis
  const storytellingData = assessment.storytelling_analysis as StorytellingData;
  const summary = storytellingData?.summary || 
    "Your Executive Presence assessment is complete. Review the detailed feedback below to understand your strengths and areas for development.";
  const topStrengths = storytellingData?.top_strengths || [];
  const priorityDevelopment = storytellingData?.priority_development;

  const overallLevel = getScoreLevel(assessment.overall_score);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <Button
        onClick={onNewAssessment}
        variant="ghost"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Upload
      </Button>

      {/* Header */}
      <div className="text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full text-success text-sm font-medium mb-4">
          <Award className="w-4 h-4" />
          Analysis Complete
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Your Executive Presence Report
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Here's how you came across in your {Math.round(assessment.video_duration_seconds / 60)}-minute video across three dimensions: Communication, Appearance & Nonverbal, and Storytelling.
        </p>
      </div>

      {/* Overall Score */}
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
            <p className="text-foreground/80 leading-relaxed">
              {summary}
            </p>

            {/* Top Strengths */}
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

            {/* Priority Development */}
            {priorityDevelopment && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-accent mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Priority Focus Area
                </h4>
                <p className="text-sm text-foreground/80">{priorityDevelopment}</p>
              </div>
            )}
            
            {/* Bucket Score Summary */}
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

      {/* Bucket Sections */}
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

      {/* Transcript Toggle */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
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

      {/* Disclaimer */}
      <div className="text-center p-4 bg-muted/30 rounded-xl">
        <p className="text-xs text-muted-foreground">
          ⚠️ <strong>Important Disclaimer:</strong> This assessment provides a point-in-time analysis based on a single video sample. 
          It is not a personality diagnosis or comprehensive evaluation. Scores are calculated using established speech analysis 
          research and AI interpretation. Use this feedback as one data point in your ongoing leadership development journey.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
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
