import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const scenarios = [
  {
    id: 1,
    title: "Strategic Pivot Announcement",
    description: "Your company is pivoting strategy after 2 years. Some key stakeholders are skeptical.",
    difficulty: "Medium",
    duration: "2-3 min",
    focusAreas: 3,
  },
  {
    id: 2,
    title: "Merger Integration Address",
    description: "Your company just acquired a competitor. Teams from both companies are uncertain about their futures.",
    difficulty: "High",
    duration: "2-3 min",
    focusAreas: 3,
  },
  {
    id: 3,
    title: "Board Budget Defense",
    description: "The board wants to cut your department's budget by 30%. You need to justify your spending.",
    difficulty: "High",
    duration: "2-3 min",
    focusAreas: 3,
  },
  {
    id: 4,
    title: "Q4 Earnings Call",
    description: "Your company missed Q4 targets by 12%. Analysts on the earnings call are pressing for explanations and future outlook.",
    difficulty: "High",
    duration: "2-3 min",
    focusAreas: 3,
  },
  {
    id: 5,
    title: "Customer Crisis Communication",
    description: "A data breach has affected 50,000 customers. You must address them directly about the breach and remediation.",
    difficulty: "Medium",
    duration: "2-3 min",
    focusAreas: 3,
  },
];

export default function Simulator() {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "High") return "bg-red-100 text-red-600 border-red-200";
    if (difficulty === "Medium") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-600 border-green-200";
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Back Button */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
            Boardroom <span className="text-[#C4A84D]">Simulator</span>
          </h1>
          <p className="text-gray-500 text-center mb-12">
            Practice high-pressure executive scenarios with AI-powered feedback
          </p>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#C4A84D]/50 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 pr-2">{scenario.title}</h3>
                  <Badge className={`${getDifficultyColor(scenario.difficulty)} text-xs font-medium px-3 py-1`}>
                    {scenario.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-6 line-clamp-2">{scenario.description}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Clock className="w-4 h-4 text-[#C4A84D]" />
                    <span>{scenario.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Target className="w-4 h-4 text-[#C4A84D]" />
                    <span>{scenario.focusAreas} focus areas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
