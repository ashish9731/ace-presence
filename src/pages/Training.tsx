import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const modules = [
  {
    id: 1,
    number: 1,
    category: "Gravitas",
    title: "Executive Decision Framing",
    description: "Structure decisions with clarity and conviction",
    duration: "10 min",
    level: "Intermediate",
  },
  {
    id: 2,
    number: 2,
    category: "Gravitas",
    title: "Commanding Presence",
    description: "Project authority without arrogance",
    duration: "12 min",
    level: "Advanced",
  },
  {
    id: 3,
    number: 3,
    category: "Gravitas",
    title: "Poise Under Pressure",
    description: "Stay calm when challenged or questioned",
    duration: "9 min",
    level: "Intermediate",
  },
  {
    id: 4,
    number: 4,
    category: "Gravitas",
    title: "Vision Articulation",
    description: "Communicate strategic vision clearly",
    duration: "11 min",
    level: "Advanced",
  },
];

export default function Training() {
  const navigate = useNavigate();

  const getLevelColor = (level: string) => {
    if (level === "Advanced") return "text-[#C4A84D]";
    if (level === "Intermediate") return "text-green-600";
    return "text-blue-600";
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Training <span className="text-[#C4A84D]">Modules</span>
          </h1>
          <p className="text-gray-500 mb-10">
            Structured micro-courses with AI-generated content tailored to your profile
          </p>

          {/* This Week's Focus */}
          <div className="bg-[#C4A84D]/10 rounded-2xl border border-[#C4A84D]/30 p-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#C4A84D] flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  This Week's Focus: <span className="text-[#C4A84D]">Gravitas Building</span>
                </h2>
                <p className="text-gray-500">Complete all 4 modules this week to master gravitas building</p>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-2 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#C4A84D]/50 hover:shadow-lg transition-all cursor-pointer relative"
              >
                {/* Number Badge */}
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#C4A84D] flex items-center justify-center text-white font-bold text-sm">
                  {module.number}
                </div>

                <Badge variant="outline" className="border-[#C4A84D]/30 text-[#C4A84D] mb-4">
                  {module.category}
                </Badge>

                <h3 className="text-lg font-bold text-gray-900 mb-2 pr-10">{module.title}</h3>
                <p className="text-sm text-gray-500 mb-6">{module.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{module.duration}</span>
                  </div>
                  <span className={`text-sm font-medium ${getLevelColor(module.level)}`}>
                    {module.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
