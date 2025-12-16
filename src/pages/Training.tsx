import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Play, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Module {
  id: number;
  number: number;
  category: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  content: {
    overview: string;
    keyPoints: string[];
    exercises: string[];
  };
}

const modules: Module[] = [
  {
    id: 1,
    number: 1,
    category: "Gravitas",
    title: "Executive Decision Framing",
    description: "Structure decisions with clarity and conviction",
    duration: "10 min",
    level: "Intermediate",
    content: {
      overview: "Learn how to frame decisions in a way that demonstrates executive-level thinking. This module covers the RAPID framework for decision-making and how to present options clearly to stakeholders.",
      keyPoints: [
        "Use the RAPID framework: Recommend, Agree, Perform, Input, Decide",
        "Present no more than 3 options with clear trade-offs",
        "Lead with your recommendation, then provide supporting rationale",
        "Acknowledge risks while maintaining confidence in your position",
        "Use data to support decisions, not to make them for you",
      ],
      exercises: [
        "Practice presenting a business decision in under 2 minutes",
        "Record yourself framing a recent decision you made",
        "Get feedback on your decisiveness and clarity",
      ],
    },
  },
  {
    id: 2,
    number: 2,
    category: "Gravitas",
    title: "Commanding Presence",
    description: "Project authority without arrogance",
    duration: "12 min",
    level: "Advanced",
    content: {
      overview: "Commanding presence is about how you carry yourself physically and verbally. This module teaches the balance between confidence and approachability that marks true executive presence.",
      keyPoints: [
        "Stand with shoulders back, feet planted firmly",
        "Make sustained eye contact (3-5 seconds per person)",
        "Use purposeful pauses before key statements",
        "Lower your vocal register slightly for authority",
        "Eliminate verbal fillers that undermine confidence",
      ],
      exercises: [
        "Practice power posing for 2 minutes before important meetings",
        "Record and review your body language during presentations",
        "Work on eliminating 'um', 'uh', and uptalk patterns",
      ],
    },
  },
  {
    id: 3,
    number: 3,
    category: "Gravitas",
    title: "Poise Under Pressure",
    description: "Stay calm when challenged or questioned",
    duration: "9 min",
    level: "Intermediate",
    content: {
      overview: "How you respond to pressure defines your executive presence. Learn techniques to maintain composure when facing difficult questions, criticism, or unexpected challenges.",
      keyPoints: [
        "Pause before responding to difficult questions (2-3 seconds)",
        "Use bridging phrases: 'That's an important point...'",
        "Acknowledge the question before pivoting to your message",
        "Maintain steady breathing to control stress response",
        "Practice the HEAR technique: Halt, Empathize, Acknowledge, Respond",
      ],
      exercises: [
        "Have a colleague fire tough questions at you unexpectedly",
        "Practice breathing exercises before high-stakes meetings",
        "Record yourself handling a challenging scenario",
      ],
    },
  },
  {
    id: 4,
    number: 4,
    category: "Gravitas",
    title: "Vision Articulation",
    description: "Communicate strategic vision clearly",
    duration: "11 min",
    level: "Advanced",
    content: {
      overview: "Great leaders inspire through clear vision articulation. This module covers how to communicate your strategic vision in a way that motivates teams and aligns stakeholders.",
      keyPoints: [
        "Start with 'why' before explaining 'what' or 'how'",
        "Use concrete, vivid language that creates mental images",
        "Connect vision to individual team member contributions",
        "Repeat key messages consistently across communications",
        "Balance aspiration with achievable milestones",
      ],
      exercises: [
        "Write your team's vision in 25 words or less",
        "Practice your vision statement until it feels natural",
        "Get feedback on whether your vision is compelling and clear",
      ],
    },
  },
];

export default function Training() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const getLevelColor = (level: string) => {
    if (level === "Advanced") return "text-[#C4A84D]";
    if (level === "Intermediate") return "text-green-600";
    return "text-blue-600";
  };

  if (selectedModule) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        {/* Back Button */}
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-4">
            <button
              onClick={() => setSelectedModule(null)}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Modules
            </button>
          </div>
        </div>

        {/* Module Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="border-[#C4A84D]/30 text-[#C4A84D] mb-4">
              {selectedModule.category}
            </Badge>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedModule.title}</h1>
            <p className="text-gray-500 mb-6">{selectedModule.description}</p>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{selectedModule.duration}</span>
              </div>
              <span className={`text-sm font-medium ${getLevelColor(selectedModule.level)}`}>
                {selectedModule.level}
              </span>
            </div>

            {/* Overview */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-600 leading-relaxed">{selectedModule.content.overview}</p>
            </div>

            {/* Key Points */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Key Points</h2>
              <ul className="space-y-3">
                {selectedModule.content.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#C4A84D]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#C4A84D]">{index + 1}</span>
                    </div>
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Exercises */}
            <div className="bg-[#C4A84D]/10 rounded-2xl border border-[#C4A84D]/30 p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Practice Exercises</h2>
              <ul className="space-y-3">
                {selectedModule.content.exercises.map((exercise, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Play className="w-5 h-5 text-[#C4A84D] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{exercise}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button
                className="bg-[#C4A84D] hover:bg-[#B39940] text-white"
                onClick={() => navigate("/know-your-ep")}
              >
                Practice with Video Assessment
              </Button>
              <Button
                variant="outline"
                className="border-[#C4A84D] text-[#C4A84D] hover:bg-[#C4A84D]/5"
                onClick={() => setSelectedModule(null)}
              >
                Back to Modules
              </Button>
            </div>
          </div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Training <span className="text-[#C4A84D]">Modules</span>
          </h1>
          <p className="text-gray-500 mb-10">
            Structured micro-courses to develop your executive presence skills
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
                onClick={() => setSelectedModule(module)}
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
