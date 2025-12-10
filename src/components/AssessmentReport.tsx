import { useState } from "react";
import { ChevronDown, MessageSquare, Eye, BookOpen, Lightbulb, Info } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ParameterData {
  score: number;
  raw_value?: string;
  observation: string;
  coaching: string;
}

interface BucketData {
  overall_score: number;
  note?: string;
  story_detected?: boolean;
  parameters: Record<string, ParameterData>;
}

interface Assessment {
  id: string;
  overall_score: number;
  communication_score: number;
  appearance_score: number;
  storytelling_score: number;
  communication_analysis: BucketData;
  appearance_analysis: BucketData;
  storytelling_analysis: BucketData & { summary?: string };
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
  communication: "hsl(222, 47%, 15%)",
  appearance: "hsl(38, 92%, 50%)",
  storytelling: "hsl(152, 69%, 40%)",
};

const parameterLabels: Record<string, string> = {
  speaking_rate: "Speaking Rate",
  vocal_variety: "Vocal Variety",
  verbal_clarity: "Verbal Clarity",
  filler_words: "Filler Words",
  pauses: "Pause Usage",
  confidence_language: "Confidence Language",
  presence_projection: "Presence Projection",
  engagement_cues: "Engagement Cues",
  first_impression: "First Impression",
  energy_consistency: "Energy Consistency",
  narrative_structure: "Narrative Structure",
  narrative_flow: "Narrative Flow",
  self_disclosure: "Self-Disclosure",
  memorability: "Memorability",
  story_placement: "Story Placement",
};

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
            <p className="text-sm text-muted-foreground">{weight} of overall score</p>
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
          
          {Object.entries(data.parameters).map(([key, param]) => (
            <ParameterCard 
              key={key} 
              name={parameterLabels[key] || key} 
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
        <ScoreRing score={data.score} size="sm" showLabel={false} />
      </div>
      
      {/* Observation */}
      <div className="flex items-start gap-3 text-sm">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <p className="text-foreground/80">{data.observation}</p>
      </div>
      
      {/* Coaching */}
      <div className="flex items-start gap-3 text-sm">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}20` }}
        >
          <Lightbulb className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <p className="text-foreground/80">{data.coaching}</p>
      </div>
    </div>
  );
}

export function AssessmentReport({ assessment, onNewAssessment }: AssessmentReportProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  // Get summary from storytelling analysis if available
  const summary = (assessment.storytelling_analysis as any)?.summary || 
    "Your Executive Presence assessment is complete. Review the detailed feedback below to understand your strengths and areas for development.";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center animate-fade-in">
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
          <ScoreRing 
            score={assessment.overall_score} 
            size="xl" 
            label="Overall EP Score"
          />
          
          <div className="flex-1 space-y-4">
            <p className="text-foreground/80 leading-relaxed">
              {summary}
            </p>
            
            {/* Bucket Score Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {Math.round(assessment.communication_score)}
                </div>
                <div className="text-xs text-muted-foreground">Communication</div>
                <div className="text-xs text-muted-foreground/70">40%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {Math.round(assessment.appearance_score)}
                </div>
                <div className="text-xs text-muted-foreground">Appearance</div>
                <div className="text-xs text-muted-foreground/70">35%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {Math.round(assessment.storytelling_score)}
                </div>
                <div className="text-xs text-muted-foreground">Storytelling</div>
                <div className="text-xs text-muted-foreground/70">25%</div>
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
            <span className="font-medium text-foreground">View Transcript</span>
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
          ⚠️ This assessment provides a point-in-time analysis based on a single video sample. 
          It is not a personality diagnosis or comprehensive evaluation. Use this feedback as 
          one data point in your ongoing leadership development journey.
        </p>
      </div>

      {/* New Assessment Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onNewAssessment}
          variant="outline"
          className="h-12 px-8"
        >
          Record New Assessment
        </Button>
      </div>
    </div>
  );
}
