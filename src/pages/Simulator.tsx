import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BoardroomSimulator } from "@/components/BoardroomSimulator";

export default function Simulator() {
  const navigate = useNavigate();
  const [showSimulator, setShowSimulator] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "High") return "bg-red-100 text-red-600 border-red-200";
    if (difficulty === "Medium") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-600 border-green-200";
  };

  if (showSimulator) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-4">
            <button
              onClick={() => setShowSimulator(false)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Scenarios
            </button>
          </div>
        </div>
        <main className="container mx-auto px-6 py-8">
          <BoardroomSimulator />
        </main>
      </div>
    );
  }

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
          <p className="text-gray-500 text-center mb-8">
            Practice high-pressure executive scenarios with AI-powered feedback
          </p>

          {/* Start Button */}
          <div className="flex justify-center mb-12">
            <button
              onClick={() => setShowSimulator(true)}
              className="px-8 py-4 bg-[#C4A84D] hover:bg-[#B39940] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Start Simulator Session
            </button>
          </div>

          {/* Preview Scenarios */}
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Sample <span className="text-[#C4A84D]">Scenarios</span>
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                title: "Budget Shortfall Crisis",
                description: "A $2M budget shortfall discovered during Q3 board presentation. Press calling in 30 minutes.",
                difficulty: "Hard",
              },
              {
                title: "Executive Conflict Resolution",
                description: "Two VPs in heated disagreement about resource allocation. Both threaten resignation.",
                difficulty: "Hard",
              },
              {
                title: "Hostile Investor Question",
                description: "Activist investor publicly challenges 3-year stock underperformance at shareholder meeting.",
                difficulty: "Expert",
              },
              {
                title: "Ethical Dilemma",
                description: "Largest client using product unethically. Dropping them means 30% revenue loss.",
                difficulty: "Expert",
              },
              {
                title: "Workforce Restructuring",
                description: "Announcing 15% workforce reduction. Leadership team present, rumors spreading.",
                difficulty: "Medium",
              },
            ].map((scenario, index) => (
              <div
                key={index}
                onClick={() => setShowSimulator(true)}
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
                    <span>2-3 min</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Target className="w-4 h-4 text-[#C4A84D]" />
                    <span>5 focus areas</span>
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
