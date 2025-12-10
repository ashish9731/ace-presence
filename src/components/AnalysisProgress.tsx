import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Mic, Video, Brain, FileText, CheckCircle, Sparkles, BarChart3 } from "lucide-react";

interface AnalysisProgressProps {
  status: string;
}

const stages = [
  { 
    id: "uploading", 
    label: "Uploading Video", 
    icon: Video,
    description: "Securely uploading your video file..."
  },
  { 
    id: "processing", 
    label: "Processing Audio", 
    icon: Mic,
    description: "Extracting audio with OpenAI Whisper..."
  },
  { 
    id: "analyzing", 
    label: "AI Analysis", 
    icon: Brain,
    description: "Analyzing communication, presence, and storytelling..."
  },
  { 
    id: "scoring", 
    label: "Calculating Scores", 
    icon: BarChart3,
    description: "Computing research-backed metrics..."
  },
  { 
    id: "generating", 
    label: "Generating Report", 
    icon: FileText,
    description: "Creating personalized coaching feedback..."
  },
];

const analysisDetails = [
  "📊 Calculating speaking rate (WPM) against 140-160 optimal range",
  "🎯 Detecting filler words using Toastmasters benchmarks",
  "💪 Analyzing confidence vs hedging language patterns",
  "⏸️ Measuring strategic pause frequency and duration",
  "📖 Identifying narrative structure and story elements",
  "🎭 Evaluating first impression impact (first 40 seconds)",
  "✨ Applying research from Gallo, Cuddy, Duarte, and more",
];

export function AnalysisProgress({ status }: AnalysisProgressProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentDetail, setCurrentDetail] = useState(0);

  useEffect(() => {
    // Map status to stage
    if (status === "uploading") {
      setCurrentStage(0);
      setProgress(10);
    } else if (status === "processing") {
      setCurrentStage(1);
      setProgress(25);
    } else if (status === "analyzing") {
      setCurrentStage(2);
      setProgress(50);
    } else if (status === "scoring") {
      setCurrentStage(3);
      setProgress(75);
    } else if (status === "generating" || status === "completed") {
      setCurrentStage(4);
      setProgress(status === "completed" ? 100 : 90);
    }
  }, [status]);

  // Simulate progress within stages
  useEffect(() => {
    if (status === "completed") return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const maxForStage = [20, 40, 70, 85, 95][currentStage];
        if (prev < maxForStage) {
          return prev + 0.3;
        }
        return prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [currentStage, status]);

  // Rotate analysis details
  useEffect(() => {
    if (currentStage < 2) return;
    
    const detailInterval = setInterval(() => {
      setCurrentDetail(prev => (prev + 1) % analysisDetails.length);
    }, 3000);

    return () => clearInterval(detailInterval);
  }, [currentStage]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Main Progress Circle */}
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={553}
              strokeDashoffset={553 - (553 * progress) / 100}
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(222, 47%, 25%)" />
                <stop offset="50%" stopColor="hsl(38, 92%, 50%)" />
                <stop offset="100%" stopColor="hsl(152, 69%, 40%)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-display font-bold text-foreground">
              {Math.round(progress)}%
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {stages[currentStage]?.label || "Processing"}
            </span>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent"
              style={{
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-5 gap-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isComplete = index < currentStage || status === "completed";
          const isCurrent = index === currentStage && status !== "completed";

          return (
            <div
              key={stage.id}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl transition-all duration-300",
                isComplete && "bg-success/10",
                isCurrent && "bg-accent/10 scale-105",
                !isComplete && !isCurrent && "bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all",
                  isComplete && "bg-success text-success-foreground",
                  isCurrent && "bg-accent text-accent-foreground pulse-glow",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className={cn("w-4 h-4", isCurrent && "animate-pulse")} />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] text-center font-medium leading-tight",
                  isComplete && "text-success",
                  isCurrent && "text-accent",
                  !isComplete && !isCurrent && "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Stage Description */}
      <div className="text-center bg-card border border-border rounded-xl p-4">
        <p className="text-foreground font-medium">
          {stages[currentStage]?.description || "Processing your video..."}
        </p>
      </div>

      {/* Analysis Detail Ticker (only during AI analysis) */}
      {currentStage >= 2 && (
        <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-xl min-h-[60px]">
          <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="text-sm text-muted-foreground animate-fade-in" key={currentDetail}>
            {analysisDetails[currentDetail]}
          </p>
        </div>
      )}

      {/* Helpful Message */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground/70">
          This typically takes 2-3 minutes depending on video length
        </p>
        <p className="text-xs text-muted-foreground/50">
          Our AI analyzes 15+ parameters using established research methodologies
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
