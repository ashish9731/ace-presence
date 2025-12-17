import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Play, Video, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// All daily tips pool - rotates every 3 days
const allDailyTips = [
  {
    id: 1,
    category: "Communication",
    tip: "Practice the 'power pause' - a 2-3 second silence before your key message makes it 40% more memorable. Use it before important points in your next presentation.",
  },
  {
    id: 2,
    category: "Gravitas",
    tip: "Start meetings by stating your conclusion first, then provide supporting points. This 'bottom line up front' approach signals executive-level thinking.",
  },
  {
    id: 3,
    category: "Presence",
    tip: "Before entering any room, take 3 deep breaths and visualize yourself as confident. This 'doorway ritual' primes your body language for presence.",
  },
  {
    id: 4,
    category: "Storytelling",
    tip: "Use the 'But & Therefore' technique: replace 'and then' with 'but' or 'therefore' to create narrative tension and keep audiences engaged.",
  },
  {
    id: 5,
    category: "Communication",
    tip: "Mirror your audience's energy level for the first 30 seconds, then gradually elevate it. This creates rapport before you inspire.",
  },
  {
    id: 6,
    category: "Gravitas",
    tip: "When asked a difficult question, pause for 2 seconds before responding. This signals thoughtfulness and prevents reactive answers.",
  },
  {
    id: 7,
    category: "Presence",
    tip: "Plant your feet shoulder-width apart when presenting. This 'power stance' grounds you physically and projects stability.",
  },
  {
    id: 8,
    category: "Storytelling",
    tip: "Every compelling story has a 'moment of truth' - identify and emphasize the turning point where everything changed.",
  },
  {
    id: 9,
    category: "Communication",
    tip: "Use 'we' instead of 'I' when discussing team achievements. It demonstrates leadership while building collective ownership.",
  },
];

// All TED talks pool with YouTube embed IDs - rotates every 3 days
const allTedTalks = [
  {
    id: 1,
    title: "Your body language may shape who you are",
    speaker: "Amy Cuddy",
    duration: "21 min",
    description: "Learn how power posing and body language influence confidence and presence",
    tags: ["Presence", "Body Language", "Confidence"],
    embedId: "Ks-_Mh1QhMc",
  },
  {
    id: 2,
    title: "How great leaders inspire action",
    speaker: "Simon Sinek",
    duration: "18 min",
    description: "Discover the power of starting with 'why' in leadership communication",
    tags: ["Vision Articulation", "Leadership", "Communication"],
    embedId: "qp0HIF3SfI4",
  },
  {
    id: 3,
    title: "How to speak so that people want to listen",
    speaker: "Julian Treasure",
    duration: "10 min",
    description: "Master vocal techniques for more effective speaking",
    tags: ["Communication", "Vocal Presence", "Clarity"],
    embedId: "eIho2S0ZahI",
  },
  {
    id: 4,
    title: "The power of vulnerability",
    speaker: "Brené Brown",
    duration: "20 min",
    description: "Understanding how vulnerability enhances authentic leadership presence",
    tags: ["Gravitas", "Emotional Intelligence", "Authenticity"],
    embedId: "iCvmsMzlF7o",
  },
  {
    id: 5,
    title: "The skill of self confidence",
    speaker: "Dr. Ivan Joseph",
    duration: "13 min",
    description: "Building unshakeable self-confidence for executive presence",
    tags: ["Confidence", "Gravitas", "Self-Belief"],
    embedId: "w-HYZv6HzAs",
  },
  {
    id: 6,
    title: "The puzzle of motivation",
    speaker: "Dan Pink",
    duration: "18 min",
    description: "Understanding what truly motivates people and how leaders can inspire",
    tags: ["Leadership", "Motivation", "Storytelling"],
    embedId: "rrkrvAUbU9Y",
  },
];

export default function LearningBytes() {
  const navigate = useNavigate();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Calculate which content to show based on date (rotates every 3 days)
  const { currentTip, currentTalks } = useMemo(() => {
    const startDate = new Date('2025-01-01').getTime();
    const now = new Date().getTime();
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const rotationIndex = Math.floor(daysSinceStart / 3); // Changes every 3 days
    
    // Get current tip
    const tipIndex = rotationIndex % allDailyTips.length;
    const tip = allDailyTips[tipIndex];
    
    // Get 3 TED talks starting from rotation index
    const talks = [];
    for (let i = 0; i < 3; i++) {
      const index = (rotationIndex + i) % allTedTalks.length;
      talks.push(allTedTalks[index]);
    }
    
    return { currentTip: tip, currentTalks: talks };
  }, []);

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
          <p className="text-gray-500 mb-1">
            Daily insights and expert resources to enhance your executive presence
          </p>
          <p className="text-xs text-[#C4A84D] mb-10">
            Content refreshes every 3 days
          </p>

          {/* Today's Tip */}
          <div className="bg-[#C4A84D]/10 rounded-2xl border border-[#C4A84D]/30 p-6 mb-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#C4A84D] flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Today's Tip — {currentTip.category}</h3>
                  <p className="text-sm text-gray-500">Fresh insight every 3 days</p>
                </div>
              </div>
              <Badge className="bg-[#C4A84D] text-white px-3 py-1">#{currentTip.id}</Badge>
            </div>
            <p className="text-gray-700 leading-relaxed">{currentTip.tip}</p>
          </div>

          {/* Recommended TED Talks */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recommended <span className="text-[#C4A84D]">TED Talks</span>
          </h2>
          <p className="text-gray-500 mb-6">
            Expert insights on leadership, communication, and presence
          </p>

          <div className="space-y-6">
            {currentTalks.map((talk) => (
              <div
                key={talk.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#C4A84D]/50 transition-all"
              >
                {/* Video Player */}
                {playingVideo === talk.embedId ? (
                  <div className="relative">
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${talk.embedId}?autoplay=1&rel=0`}
                        title={talk.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    <button
                      onClick={() => setPlayingVideo(null)}
                      className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => setPlayingVideo(talk.embedId)}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${talk.embedId}/maxresdefault.jpg`}
                      alt={talk.title}
                      className="w-full aspect-video object-cover"
                      onError={(e) => {
                        // Fallback to hqdefault if maxresdefault doesn't exist
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${talk.embedId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-[#C4A84D] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {talk.duration}
                    </div>
                  </div>
                )}

                {/* Video Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-[#C4A84D] mb-2">
                    <Video className="w-4 h-4" />
                    <span>{talk.duration}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{talk.title}</h3>
                  <p className="text-sm text-[#C4A84D] mb-3">by {talk.speaker}</p>
                  <p className="text-sm text-gray-500 mb-4">{talk.description}</p>
                  <div className="flex items-center gap-2">
                    {talk.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-gray-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
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
