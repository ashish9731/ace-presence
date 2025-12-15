import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, MessageSquare, Video, BarChart3, Check, LayoutGrid } from "lucide-react";

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
      <header className="bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="font-display text-xl font-bold text-foreground">
              Executive Presence
            </span>
            <span className="text-xl font-medium" style={{ color: '#D4A84B' }}>Quotient</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/auth">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-lg border-border"
                style={{ backgroundColor: 'hsl(40 30% 94%)', borderColor: 'hsl(220 13% 91%)' }}
              >
                <LayoutGrid className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient - warm cream/beige */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: 'linear-gradient(180deg, hsl(40 40% 95%) 0%, hsl(40 30% 98%) 50%, hsl(0 0% 100%) 100%)'
          }} 
        />
        
        <div className="container mx-auto px-4 py-16 sm:py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: 'hsl(40 40% 94%)', 
                color: '#8B7355',
                border: '1px solid hsl(40 30% 88%)'
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#8B7355' }} />
              AI-Powered Leadership Assessment
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-foreground">Master Your</span>
              <span className="block" style={{ color: '#D4A84B' }}>Executive Presence</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload a 3-minute video and receive research-backed insights on
              communication, gravitas, presence, and storytelling—powered by AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="gap-2 px-8 rounded-lg"
                  style={{ backgroundColor: '#D4A84B', color: '#1a1a2e' }}
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 rounded-lg"
                  style={{ 
                    borderColor: '#D4A84B', 
                    color: '#D4A84B',
                    backgroundColor: 'transparent'
                  }}
                >
                  View Pricing
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-center pt-8">
              <div 
                className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl"
                style={{ 
                  backgroundColor: 'white',
                  border: '1px solid hsl(220 13% 91%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
              >
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: '#D4A84B' }}>2-3min</div>
                  <div className="text-xs text-muted-foreground">Analysis Time</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: '#D4A84B' }}>4</div>
                  <div className="text-xs text-muted-foreground">EP Dimensions</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-semibold" style={{ color: '#D4A84B' }}>100%</div>
                  <div className="text-xs text-muted-foreground">AI-Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dimensions Section */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: 'hsl(40 20% 97%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Four Research-Backed <span style={{ color: '#D4A84B' }}>Dimensions</span>
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
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'hsl(40 40% 92%)' }}
                >
                  <dimension.icon className="w-6 h-6" style={{ color: '#B8973B' }} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {dimension.title}
                </h3>
                <p className="font-semibold mb-3" style={{ color: '#D4A84B' }}>{dimension.percentage}</p>
                <p className="text-sm text-muted-foreground">{dimension.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works & What You Receive */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* How It Works */}
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-10">
                How It <span style={{ color: '#D4A84B' }}>Works</span>
              </h2>
              <div className="space-y-8">
                {steps.map((step) => (
                  <div key={step.number} className="flex gap-6">
                    <div 
                      className="font-display text-4xl font-bold"
                      style={{ color: 'hsl(40 40% 80%)' }}
                    >
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
              <div 
                className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full mb-6"
                style={{ 
                  backgroundColor: 'hsl(40 40% 94%)',
                  color: '#B8973B'
                }}
              >
                What You'll Receive
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-6">
                Comprehensive EP Report
              </h3>
              <div className="space-y-4">
                {reportFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: 'hsl(40 40% 90%)' }}
                    >
                      <Check className="w-3 h-3" style={{ color: '#B8973B' }} />
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
      <section 
        className="py-16 sm:py-20"
        style={{ backgroundColor: '#1a1f2e' }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-white">
            Ready to Assess Your <span style={{ color: '#D4A84B' }}>Executive Presence</span>?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Join leaders mastering their communication through AI-powered insights
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="gap-2 px-8 rounded-lg"
              style={{ backgroundColor: '#D4A84B', color: '#1a1a2e' }}
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Executive Presence Quotient. Professional leadership assessment platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
