import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Mic, Video, Brain, FileText, CheckCircle } from "lucide-react";

interface AnalysisProgressProps {
  status: string;
}

const stages = [
  { id: "uploading", label: "Uploading Video", icon: Video },
  { id: "processing", label: "Processing Audio", icon: Mic },
  { id: "analyzing", label: "AI Analysis", icon: Brain },
  { id: "generating", label: "Generating Report", icon: FileText },
];

export function AnalysisProgress({ status }: AnalysisProgressProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Map status to stage
    if (status === "uploading") {
      setCurrentStage(0);
      setProgress(15);
    } else if (status === "processing") {
      setCurrentStage(1);
      setProgress(35);
    } else if (status === "analyzing") {
      setCurrentStage(2);
      setProgress(65);
    } else if (status === "generating" || status === "completed") {
      setCurrentStage(3);
      setProgress(status === "completed" ? 100 : 90);
    }
  }, [status]);

  // Simulate progress within stages
  useEffect(() => {
    if (status === "completed") return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const maxForStage = [25, 50, 85, 95][currentStage];
        if (prev < maxForStage) {
          return prev + 0.5;
        }
        return prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [currentStage, status]);

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
                <stop offset="0%" stopColor="hsl(222, 47%, 15%)" />
                <stop offset="100%" stopColor="hsl(38, 92%, 50%)" />
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
      <div className="grid grid-cols-4 gap-2">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isComplete = index < currentStage || status === "completed";
          const isCurrent = index === currentStage && status !== "completed";

          return (
            <div
              key={stage.id}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl transition-all duration-300",
                isComplete && "bg-success/10",
                isCurrent && "bg-accent/10 scale-105",
                !isComplete && !isCurrent && "bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                  isComplete && "bg-success text-success-foreground",
                  isCurrent && "bg-accent text-accent-foreground pulse-glow",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
                )}
              </div>
              <span
                className={cn(
                  "text-xs text-center font-medium",
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

      {/* Helpful Message */}
      <div className="text-center">
        <p className="text-muted-foreground">
          {currentStage === 0 && "Preparing your video for analysis..."}
          {currentStage === 1 && "Extracting audio and transcribing speech..."}
          {currentStage === 2 && "Our AI is analyzing your executive presence..."}
          {currentStage === 3 && "Generating your personalized coaching report..."}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          This typically takes 2-3 minutes
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
