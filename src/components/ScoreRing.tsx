import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { ring: 60, stroke: 4, text: "text-lg", labelSize: "text-[10px]" },
  md: { ring: 80, stroke: 5, text: "text-2xl", labelSize: "text-xs" },
  lg: { ring: 120, stroke: 6, text: "text-3xl", labelSize: "text-sm" },
  xl: { ring: 180, stroke: 8, text: "text-5xl", labelSize: "text-base" },
};

function getScoreColor(score: number): string {
  if (score >= 85) return "hsl(152, 69%, 40%)"; // Excellent - green
  if (score >= 70) return "hsl(142, 69%, 45%)"; // Good - light green
  if (score >= 55) return "hsl(38, 92%, 50%)";  // Average - amber
  if (score >= 40) return "hsl(25, 95%, 53%)";  // Needs work - orange
  return "hsl(0, 84%, 60%)";                     // Poor - red
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Developing";
  if (score >= 40) return "Needs Focus";
  return "Priority Area";
}

export function ScoreRing({ 
  score, 
  size = "md", 
  label,
  showLabel = true,
  className 
}: ScoreRingProps) {
  const config = sizeConfig[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="none"
            className="text-muted/50"
          />
          {/* Score circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            stroke={color}
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>
        
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={cn("font-display font-bold", config.text)}
            style={{ color }}
          >
            {Math.round(score)}
          </span>
        </div>
      </div>
      
      {/* Label */}
      {showLabel && (
        <div className="text-center mt-2">
          {label && (
            <p className={cn("font-medium text-foreground", config.labelSize)}>
              {label}
            </p>
          )}
          <p 
            className={cn("font-medium", config.labelSize)}
            style={{ color }}
          >
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
}
