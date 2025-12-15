import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, MessageSquare, Video, BarChart3, Check } from "lucide-react";

export default function Landing() {
  const dimensions = [
    {
      icon: Brain,
      title: "Gravitas",
      percentage: "25%",
      description: "Commanding presence, decisiveness, poise under pressure",
    },
    {
      icon: MessageSquare,
      title: "Communication",
      percentage: "35%",
      description: "Speaking rate, clarity, vocal metrics, filler words",
    },
    {
      icon: Video,
      title: "Presence",
      percentage: "25%",
      description: "Posture, eye contact, facial expressions, gestures",
    },
    {
      icon: BarChart3,
      title: "Storytelling",
      percentage: "15%",
      description: "Narrative structure, authenticity, concreteness",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Record or Upload",
      description: "3-minute video speaking to camera about your role and leadership",
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "Whisper transcription, GPT-4o vision & NLP analysis in under 3 minutes",
    },
    {
      number: "03",
      title: "Detailed Report",
      description: "Comprehensive scores, benchmarks, drill-downs, and coaching tips",
    },
    {
      number: "04",
      title: "Improve",
      description: "Practice with scenarios, training modules, and executive coaching",
    },
  ];

  const reportFeatures = [
    "Overall EP Score with performance level",
    "Scores across 4 dimensions with benchmarks",
    "Word-by-word filler word timestamps",
    "Pause detection with duration classification",
    "Sentence clarity breakdown",
    "Vocal metrics (pitch, loudness, articulation)",
    "Visual presence analysis",
    "Leadership signal analysis",
    "Personalized coaching recommendations",
    "PDF export for coaches",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-foreground">
              Executive Presence
            </span>
            <span className="font-display text-xl text-primary">Quotient</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="gap-2">
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Login</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered Leadership Assessment
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Master Your
              <span className="block text-primary">Executive Presence</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload a 3-minute video and receive research-backed insights on
              communication, gravitas, presence, and storytelling—powered by AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="gap-2 px-8">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-center pt-8">
              <div className="inline-flex items-center gap-8 px-8 py-4 bg-card border border-border rounded-2xl shadow-lg">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-primary">2-3min</div>
                  <div className="text-xs text-muted-foreground">Analysis Time</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-primary">4</div>
                  <div className="text-xs text-muted-foreground">EP Dimensions</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-primary">100%</div>
                  <div className="text-xs text-muted-foreground">AI-Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dimensions Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Four Research-Backed <span className="text-primary">Dimensions</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Comprehensive scoring across key leadership indicators
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {dimensions.map((dimension) => (
              <div
                key={dimension.title}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <dimension.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {dimension.title}
                </h3>
                <p className="text-primary font-semibold mb-3">{dimension.percentage}</p>
                <p className="text-sm text-muted-foreground">{dimension.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works & What You Receive */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* How It Works */}
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-10">
                How It <span className="text-primary">Works</span>
              </h2>
              <div className="space-y-8">
                {steps.map((step) => (
                  <div key={step.number} className="flex gap-6">
                    <div className="font-display text-4xl font-bold text-primary/30">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* What You'll Receive */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
                What You'll Receive
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-6">
                Comprehensive EP Report
              </h3>
              <div className="space-y-4">
                {reportFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to Assess Your <span className="text-primary">Executive Presence</span>?
          </h2>
          <p className="text-background/70 text-lg mb-8 max-w-2xl mx-auto">
            Join leaders mastering their communication through AI-powered insights
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="gap-2 px-8">
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Executive Presence Quotient. Professional leadership assessment platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
