import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Play, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dailyTips = [
  {
    id: 1,
    category: "Communication",
    tip: "Practice the 'power pause' - a 2-3 second silence before your key message makes it 40% more memorable. Use it before important points in your next presentation.",
  },
];

const tedTalks = [
  {
    id: 1,
    title: "Your body language may shape who you are",
    speaker: "Amy Cuddy",
    duration: "21 min",
    description: "Learn how power posing and body language influence confidence and presence",
    tags: ["Presence", "Body Language", "Confidence"],
    url: "https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are",
  },
  {
    id: 2,
    title: "How great leaders inspire action",
    speaker: "Simon Sinek",
    duration: "18 min",
    description: "Discover the power of starting with 'why' in leadership communication",
    tags: ["Vision Articulation", "Leadership", "Communication"],
    url: "https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action",
  },
  {
    id: 3,
    title: "How to speak so that people want to listen",
    speaker: "Julian Treasure",
    duration: "10 min",
    description: "Master vocal techniques for more effective speaking",
    tags: ["Communication", "Vocal Presence", "Clarity"],
    url: "https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen",
  },
];

export default function LearningBytes() {
  const navigate = useNavigate();

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
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Learning <span className="text-[#C4A84D]">Bytes</span>
          </h1>
          <p className="text-gray-500 mb-10">
            Daily insights and expert resources to enhance your executive presence
          </p>

          {/* Today's Tip */}
          {dailyTips.map((tip) => (
            <div
              key={tip.id}
              className="bg-[#C4A84D]/10 rounded-2xl border border-[#C4A84D]/30 p-6 mb-10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#C4A84D] flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Today's Tip — {tip.category}</h3>
                    <p className="text-sm text-gray-500">Fresh insight every day at midnight UTC</p>
                  </div>
                </div>
                <Badge className="bg-[#C4A84D] text-white px-3 py-1">#1</Badge>
              </div>
              <p className="text-gray-700 leading-relaxed">{tip.tip}</p>
            </div>
          ))}

          {/* Recommended TED Talks */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recommended <span className="text-[#C4A84D]">TED Talks</span>
          </h2>
          <p className="text-gray-500 mb-6">
            Expert insights on leadership, communication, and presence
          </p>

          <div className="space-y-6">
            {tedTalks.map((talk) => (
              <div
                key={talk.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#C4A84D]/50 transition-all"
              >
                <div className="flex items-center gap-2 text-sm text-[#C4A84D] mb-2">
                  <Video className="w-4 h-4" />
                  <span>{talk.duration}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{talk.title}</h3>
                <p className="text-sm text-[#C4A84D] mb-3">by {talk.speaker}</p>
                <p className="text-sm text-gray-500 mb-4">{talk.description}</p>
                <div className="flex items-center gap-2 mb-4">
                  {talk.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-gray-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  className="w-full bg-[#C4A84D] hover:bg-[#B39940] text-white"
                  onClick={() => window.open(talk.url, "_blank")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Watch Video
                </Button>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gray-100 rounded-2xl p-8 text-center mt-10">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Want Personalized Learning?</h3>
            <p className="text-gray-500 mb-6">
              Complete video assessments to get AI-powered recommendations<br />
              tailored to your specific areas for improvement.
            </p>
            <Button
              onClick={() => navigate("/know-your-ep")}
              className="bg-[#C4A84D] hover:bg-[#B39940] text-white px-6"
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
