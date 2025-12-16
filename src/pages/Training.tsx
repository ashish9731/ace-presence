import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Play } from "lucide-react";
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

// All modules pool - rotates every 4 days
const allModules: Module[] = [
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
  {
    id: 5,
    number: 5,
    category: "Communication",
    title: "Strategic Messaging",
    description: "Craft messages that resonate with executives",
    duration: "14 min",
    level: "Advanced",
    content: {
      overview: "Learn to communicate complex ideas simply and persuasively. This module covers the pyramid principle and other frameworks for executive-level communication.",
      keyPoints: [
        "Lead with the conclusion - executives want the answer first",
        "Use the pyramid principle: conclusion, then supporting points",
        "Limit to 3 key messages per communication",
        "Tailor your message to your audience's priorities",
        "Use concrete examples to illustrate abstract concepts",
      ],
      exercises: [
        "Rewrite a recent email using the pyramid principle",
        "Practice the 'elevator pitch' for your current project",
        "Get feedback from a mentor on your strategic messaging",
      ],
    },
  },
  {
    id: 6,
    number: 6,
    category: "Communication",
    title: "Active Listening Mastery",
    description: "Demonstrate engagement and understanding",
    duration: "8 min",
    level: "Intermediate",
    content: {
      overview: "Active listening is a key component of executive presence. Learn techniques to show you're fully engaged and to draw out important information from others.",
      keyPoints: [
        "Maintain eye contact and open body language",
        "Use reflective statements: 'What I'm hearing is...'",
        "Ask clarifying questions that show depth of understanding",
        "Avoid interrupting - let speakers complete their thoughts",
        "Summarize key points to confirm understanding",
      ],
      exercises: [
        "Practice reflective listening in your next meeting",
        "Count to 3 before responding in conversations",
        "Ask at least one follow-up question in every meeting",
      ],
    },
  },
  {
    id: 7,
    number: 7,
    category: "Presence",
    title: "Body Language Essentials",
    description: "Non-verbal communication that commands respect",
    duration: "10 min",
    level: "Beginner",
    content: {
      overview: "Your body speaks before you do. This module covers the essential non-verbal cues that project confidence, competence, and leadership.",
      keyPoints: [
        "Maintain an open posture - avoid crossing arms",
        "Use purposeful hand gestures to emphasize points",
        "Control nervous habits like fidgeting or touching face",
        "Mirror body language to build rapport",
        "Use space effectively - don't shrink yourself",
      ],
      exercises: [
        "Video record yourself presenting and analyze body language",
        "Practice power poses before important interactions",
        "Get feedback on your non-verbal communication",
      ],
    },
  },
  {
    id: 8,
    number: 8,
    category: "Storytelling",
    title: "The Executive Story Arc",
    description: "Structure narratives that inspire action",
    duration: "15 min",
    level: "Advanced",
    content: {
      overview: "Stories are the most powerful tool for influence. Learn the story arc structure that captures attention and drives action in business contexts.",
      keyPoints: [
        "Open with a hook - a surprising fact or question",
        "Establish stakes - why should the audience care?",
        "Build tension through challenges and obstacles",
        "Deliver a turning point that changes everything",
        "Close with a clear call to action",
      ],
      exercises: [
        "Map your next presentation to the story arc structure",
        "Practice telling a 2-minute leadership story",
        "Collect personal stories that illustrate key leadership lessons",
      ],
    },
  },
];

// Weekly focus themes
const weeklyThemes = [
  { theme: "Gravitas Building", description: "Master the foundations of executive authority" },
  { theme: "Communication Excellence", description: "Sharpen your strategic messaging skills" },
  { theme: "Presence & Impact", description: "Develop commanding non-verbal communication" },
  { theme: "Storytelling Power", description: "Learn to inspire through narrative" },
];

export default function Training() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Calculate which modules to show based on date (rotates every 4 days)
  const { currentModules, currentTheme } = useMemo(() => {
    const startDate = new Date('2025-01-01').getTime();
    const now = new Date().getTime();
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const rotationIndex = Math.floor(daysSinceStart / 4); // Changes every 4 days
    
    // Get 4 modules starting from rotation index
    const modules = [];
    for (let i = 0; i < 4; i++) {
      const index = (rotationIndex + i) % allModules.length;
      const module = { ...allModules[index], number: i + 1 };
      modules.push(module);
    }
    
    // Get current theme
    const themeIndex = rotationIndex % weeklyThemes.length;
    const theme = weeklyThemes[themeIndex];
    
    return { currentModules: modules, currentTheme: theme };
  }, []);

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
          <p className="text-gray-500 mb-1">
            Structured micro-courses to develop your executive presence skills
          </p>
          <p className="text-xs text-[#C4A84D] mb-10">
            Modules refresh every 4 days
          </p>

          {/* This Week's Focus */}
          <div className="bg-[#C4A84D]/10 rounded-2xl border border-[#C4A84D]/30 p-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#C4A84D] flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Current Focus: <span className="text-[#C4A84D]">{currentTheme.theme}</span>
                </h2>
                <p className="text-gray-500">{currentTheme.description}</p>
              </div>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-2 gap-6">
            {currentModules.map((module) => (
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