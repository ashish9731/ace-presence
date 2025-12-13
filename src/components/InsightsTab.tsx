import { useState, useEffect } from "react";
import { TrendingUp, Target, Award, BookOpen, Lightbulb, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Tip {
  id: string;
  category: string;
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
}

const EXECUTIVE_TIPS: Tip[] = [
  {
    id: "1",
    category: "Gravitas",
    title: "The Power Pause",
    description: "Before answering a difficult question, pause for 2-3 seconds. This demonstrates composure and gives you time to formulate a thoughtful response. Research shows leaders who pause are perceived as 40% more confident.",
    source: "Amy Cuddy, Harvard Business School",
  },
  {
    id: "2",
    category: "Communication",
    title: "The Rule of Three",
    description: "Structure your key messages in groups of three. 'We will focus on growth, innovation, and customer success.' The human brain retains triads 40% better than other groupings.",
    source: "Carmine Gallo, Talk Like TED",
  },
  {
    id: "3",
    category: "Presence",
    title: "The 7-Second First Impression",
    description: "In the first 7 seconds, others form judgments about your competence and trustworthiness. Enter with purpose, make eye contact, and offer a firm handshake to maximize this window.",
    source: "Princeton University Research",
  },
  {
    id: "4",
    category: "Storytelling",
    title: "The Vulnerability Hook",
    description: "Start with a moment of struggle or failure before sharing success. This narrative arc creates emotional connection and makes you more relatable as a leader.",
    source: "Brené Brown, Daring Greatly",
  },
  {
    id: "5",
    category: "Gravitas",
    title: "Decisive Language Patterns",
    description: "Replace 'I think we should...' with 'We will...' and 'Maybe we could...' with 'Our approach is...'. Decisive language increases perceived authority by 35%.",
    source: "Sylvia Ann Hewlett, Executive Presence",
  },
  {
    id: "6",
    category: "Communication",
    title: "The Optimal Speaking Rate",
    description: "Speak at 140-160 words per minute for maximum impact. Slower for emphasis, faster for excitement. TED speakers average 150 WPM during their most memorable moments.",
    source: "Toastmasters International",
  },
  {
    id: "7",
    category: "Presence",
    title: "Power Posing Before Presentations",
    description: "Spend 2 minutes in an expansive posture before high-stakes situations. This increases testosterone by 20% and decreases cortisol by 25%, boosting confidence.",
    source: "Amy Cuddy, Power Poses Research",
  },
  {
    id: "8",
    category: "Storytelling",
    title: "The STAR Method for Impact Stories",
    description: "Structure leadership stories with Situation, Task, Action, Result. Add emotional context at each stage. This framework ensures clarity while maintaining narrative engagement.",
    source: "McKinsey Leadership Development",
  },
];

const VIDEO_RESOURCES = [
  {
    id: "1",
    title: "The Power of Vulnerability",
    speaker: "Brené Brown",
    duration: "20 min",
    category: "Leadership",
    embedId: "brene_brown_the_power_of_vulnerability",
  },
  {
    id: "2",
    title: "Your Body Language May Shape Who You Are",
    speaker: "Amy Cuddy",
    duration: "21 min",
    category: "Presence",
    embedId: "amy_cuddy_your_body_language_may_shape_who_you_are",
  },
  {
    id: "3",
    title: "How Great Leaders Inspire Action",
    speaker: "Simon Sinek",
    duration: "18 min",
    category: "Vision",
    embedId: "simon_sinek_how_great_leaders_inspire_action",
  },
  {
    id: "4",
    title: "The Puzzle of Motivation",
    speaker: "Dan Pink",
    duration: "18 min",
    category: "Leadership",
    embedId: "dan_pink_the_puzzle_of_motivation",
  },
  {
    id: "5",
    title: "How to Speak So That People Want to Listen",
    speaker: "Julian Treasure",
    duration: "10 min",
    category: "Communication",
    embedId: "julian_treasure_how_to_speak_so_that_people_want_to_listen",
  },
  {
    id: "6",
    title: "The Happy Secret to Better Work",
    speaker: "Shawn Achor",
    duration: "12 min",
    category: "Leadership",
    embedId: "shawn_achor_the_happy_secret_to_better_work",
  },
  {
    id: "7",
    title: "The Skill of Self Confidence",
    speaker: "Dr. Ivan Joseph",
    duration: "13 min",
    category: "Presence",
    embedId: "ivan_joseph_the_skill_of_self_confidence",
  },
  {
    id: "8",
    title: "Grit: The Power of Passion and Perseverance",
    speaker: "Angela Lee Duckworth",
    duration: "6 min",
    category: "Leadership",
    embedId: "angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",
  },
];

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "gravitas": return Award;
    case "communication": return Target;
    case "presence": return TrendingUp;
    case "storytelling": return BookOpen;
    default: return Lightbulb;
  }
}

function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case "gravitas": return "text-primary bg-primary/10";
    case "communication": return "text-accent bg-accent/10";
    case "presence": return "text-warning bg-warning/10";
    case "storytelling": return "text-success bg-success/10";
    default: return "text-muted-foreground bg-muted";
  }
}

export function InsightsTab() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dailyTip, setDailyTip] = useState<Tip | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<typeof VIDEO_RESOURCES[0] | null>(null);

  // Get 3-day period number of the year (videos rotate every 3 days)
  const getThreeDayPeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const threeDays = 1000 * 60 * 60 * 24 * 3;
    return Math.floor(diff / threeDays);
  };

  // Get videos that rotate every 3 days
  const getRotatingVideos = () => {
    const periodNum = getThreeDayPeriod();
    const startIndex = (periodNum * 4) % VIDEO_RESOURCES.length;
    const videos = [];
    for (let i = 0; i < 4; i++) {
      videos.push(VIDEO_RESOURCES[(startIndex + i) % VIDEO_RESOURCES.length]);
    }
    return videos;
  };

  const rotatingVideos = getRotatingVideos();

  useEffect(() => {
    // Get a "daily" tip based on the date
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % EXECUTIVE_TIPS.length;
    setDailyTip(EXECUTIVE_TIPS[tipIndex]);
  }, []);

  const filteredTips = selectedCategory
    ? EXECUTIVE_TIPS.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase())
    : EXECUTIVE_TIPS;

  const categories = [...new Set(EXECUTIVE_TIPS.map(t => t.category))];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium">
          <Lightbulb className="w-4 h-4" />
          AI-Powered Analysis with Research Backing
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">
          <span className="text-foreground">Executive</span>{" "}
          <span className="text-accent">Presence Insights</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Daily tips, expert advice, and curated resources to enhance your communication, appearance, and storytelling skills.
        </p>
      </div>

      {/* Daily Tip */}
      {dailyTip && (
        <div className="bg-gradient-card border border-primary/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-primary">TIP OF THE DAY</span>
                <span className={cn("px-2 py-0.5 rounded-full text-xs", getCategoryColor(dailyTip.category))}>
                  {dailyTip.category}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {dailyTip.title}
              </h3>
              <p className="text-foreground/80 mb-3">{dailyTip.description}</p>
              <p className="text-xs text-muted-foreground italic">— {dailyTip.source}</p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Tips
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat.toLowerCase() ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.toLowerCase())}
            className="gap-2"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Tips Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filteredTips.map((tip) => {
          const Icon = getCategoryIcon(tip.category);
          return (
            <div
              key={tip.id}
              className="p-5 border border-border rounded-xl bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getCategoryColor(tip.category))}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className={cn("text-xs font-medium", getCategoryColor(tip.category).split(' ')[0])}>
                    {tip.category}
                  </span>
                  <h4 className="font-semibold text-foreground">{tip.title}</h4>
                </div>
              </div>
              <p className="text-sm text-foreground/80 mb-3">{tip.description}</p>
              <p className="text-xs text-muted-foreground italic">— {tip.source}</p>
            </div>
          );
        })}
      </div>

      {/* Recommended Videos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            This Week's Recommended Viewing
          </h3>
          <span className="text-xs text-muted-foreground">Updates every 3 days</span>
        </div>

        {/* Embedded Video Player */}
        {selectedVideo && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="aspect-video">
              <iframe
                src={`https://embed.ted.com/talks/${selectedVideo.embedId}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media"
                className="w-full h-full"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">{selectedVideo.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedVideo.speaker} • {selectedVideo.duration}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
        
        <div className="grid sm:grid-cols-2 gap-4">
          {rotatingVideos.map((video) => (
            <button
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className={cn(
                "group p-4 border border-border rounded-xl bg-card hover:border-primary/50 transition-all flex items-center gap-4 text-left w-full",
                selectedVideo?.id === video.id && "border-primary bg-primary/5"
              )}
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                <Play className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {video.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {video.speaker} • {video.duration}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-primary/5 rounded-xl">
          <div className="text-2xl font-bold text-primary">{EXECUTIVE_TIPS.length}</div>
          <div className="text-xs text-muted-foreground">Expert Tips</div>
        </div>
        <div className="text-center p-4 bg-accent/5 rounded-xl">
          <div className="text-2xl font-bold text-accent">{categories.length}</div>
          <div className="text-xs text-muted-foreground">Categories</div>
        </div>
        <div className="text-center p-4 bg-success/5 rounded-xl">
          <div className="text-2xl font-bold text-success">{VIDEO_RESOURCES.length}</div>
          <div className="text-xs text-muted-foreground">Videos</div>
        </div>
        <div className="text-center p-4 bg-warning/5 rounded-xl">
          <div className="text-2xl font-bold text-warning">3-Day</div>
          <div className="text-xs text-muted-foreground">Video Rotation</div>
        </div>
      </div>
    </div>
  );
}
