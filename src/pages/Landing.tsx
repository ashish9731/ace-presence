import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, MessageSquare, Video, BarChart3, Check, LayoutGrid, Target, Users, Award, TrendingUp, Lightbulb, Shield, Globe, Zap } from "lucide-react";

export default function Landing() {
  const dimensions = [
    {
      icon: Brain,
      title: "Gravitas",
      percentage: "60%",
      description: "Commanding presence, decisiveness, poise under pressure, confidence and authority",
    },
    {
      icon: MessageSquare,
      title: "Communication",
      percentage: "25%",
      description: "Speaking rate, clarity, vocal metrics, articulation, and filler word analysis",
    },
    {
      icon: Video,
      title: "Appearance & Nonverbal",
      percentage: "5%",
      description: "Posture, eye contact, facial expressions, professional presentation",
    },
    {
      icon: BarChart3,
      title: "Storytelling",
      percentage: "10%",
      description: "Narrative structure, authenticity, emotional connection, persuasion",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Record or Upload",
      description: "3-minute video speaking to camera about your role and leadership vision",
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "Advanced AI transcription, vision analysis & NLP processing in under 3 minutes",
    },
    {
      number: "03",
      title: "Detailed Report",
      description: "Comprehensive scores, benchmarks, drill-downs, and actionable coaching tips",
    },
    {
      number: "04",
      title: "Improve",
      description: "Practice with scenarios, training modules, and personalized executive coaching",
    },
  ];

  const reportFeatures = [
    "Overall EP Score with performance level benchmarking",
    "Scores across 4 dimensions with industry comparisons",
    "Word-by-word filler word detection with timestamps",
    "Pause detection with duration classification",
    "Sentence clarity and structure breakdown",
    "Vocal metrics (pitch, loudness, articulation rate)",
    "Visual presence and nonverbal analysis",
    "Leadership signal and authority detection",
    "Personalized coaching recommendations",
    "PDF export for coaches and HR teams",
  ];

  const whyExecutivePresence = [
    {
      icon: Target,
      title: "Business Context Focus",
      description: "Unlike generic assessments, we focus on your specific business context and leadership challenges",
    },
    {
      icon: Users,
      title: "Stakeholder Insights",
      description: "Understand how key stakeholders perceive your leadership effectiveness and impact",
    },
    {
      icon: Lightbulb,
      title: "Actionable Feedback",
      description: "Receive practical, actionable insights you can immediately apply to become more effective",
    },
    {
      icon: TrendingUp,
      title: "Business Outcomes",
      description: "Identify behaviors that differentiate leaders who drive revenue growth and innovation",
    },
  ];

  const modelDimensions = [
    {
      title: "Character",
      items: ["Authenticity", "Integrity", "Concern", "Restraint", "Humility"],
      color: "#4A7C59",
    },
    {
      title: "Substance",
      items: ["Practical Wisdom", "Confidence", "Composure", "Resonance", "Vision"],
      color: "#2B6CB0",
    },
    {
      title: "Style",
      items: ["Appearance", "Intentionality", "Inclusiveness", "Interactivity", "Assertiveness"],
      color: "#9B4DCA",
    },
  ];

  const beneficiaries = [
    {
      icon: Award,
      title: "C-Suite Executives",
      description: "CEOs, CFOs, COOs looking to refine their leadership presence for board meetings and stakeholder communications",
    },
    {
      icon: Users,
      title: "Senior Leaders",
      description: "VPs and Directors preparing for executive roles and high-stakes presentations",
    },
    {
      icon: TrendingUp,
      title: "High-Potential Talent",
      description: "Emerging leaders identified for succession planning and leadership development programs",
    },
    {
      icon: Globe,
      title: "Global Teams",
      description: "Leaders managing cross-cultural teams who need to adapt their presence for diverse audiences",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background sticky top-0 z-50 border-b border-border/50">
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
        <div 
          className="absolute inset-0" 
          style={{ 
            background: 'linear-gradient(180deg, hsl(40 40% 95%) 0%, hsl(40 30% 98%) 50%, hsl(0 0% 100%) 100%)'
          }} 
        />
        
        <div className="container mx-auto px-4 py-16 sm:py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: 'hsl(40 40% 94%)', 
                color: '#8B7355',
                border: '1px solid hsl(40 30% 88%)'
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#8B7355' }} />
              AI-Powered Executive Presence Assessment
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-foreground">Enabling Leaders to</span>
              <span className="block" style={{ color: '#D4A84B' }}>Deliver Business Results</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The first AI-powered assessment tool to measure a leader's ability to 
              <strong className="text-foreground"> engage, align, inspire, and motivate others to act</strong>. 
              Get research-backed insights on gravitas, communication, presence, and storytelling in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="gap-2 px-8 rounded-lg"
                  style={{ backgroundColor: '#D4A84B', color: '#1a1a2e' }}
                >
                  Start Your Assessment
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
                  <div className="text-2xl font-semibold" style={{ color: '#D4A84B' }}>15+</div>
                  <div className="text-xs text-muted-foreground">Leadership Facets</div>
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

      {/* What is Executive Presence */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  What is <span style={{ color: '#D4A84B' }}>Executive Presence</span>?
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Executive presence has long been a critical factor in leadership, directly connected to 
                  the brand and impact of the leader. However, people have often referred to it as 
                  "I know it when I see it" and "X-factor."
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  <strong className="text-foreground">Now, we have cracked the code</strong> with research and 
                  an AI-powered model. We provide leaders with new insights and a roadmap for action that 
                  highlights their strengths and opportunities to develop.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our validated research reveals a multi-dimensional "executive presence puzzle" unique to 
                  each leader, which when solved, unlocks a pathway to inspirational, authentic leadership.
                </p>
              </div>
              <div 
                className="rounded-2xl p-8"
                style={{ backgroundColor: 'hsl(40 30% 96%)', border: '1px solid hsl(40 30% 90%)' }}
              >
                <blockquote className="text-lg italic text-foreground mb-4">
                  "This assessment allowed me to look at executive presence in a more scientific and 
                  objective way. It helped to clarify that EP isn't just about your image and brand; 
                  it's about how you become more authentic and how you interact with people in a more 
                  genuine kind of way."
                </blockquote>
                <p className="text-sm font-medium" style={{ color: '#D4A84B' }}>
                  — CEO, Fortune 500 Company
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Executive Presence */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: 'hsl(40 20% 97%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Our Assessment is <span style={{ color: '#D4A84B' }}>Different</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Unlike other assessments, our AI-powered platform provides context-specific, 
              actionable insights for today's business leaders
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {whyExecutivePresence.map((item) => (
              <div
                key={item.title}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'hsl(40 40% 92%)' }}
                >
                  <item.icon className="w-6 h-6" style={{ color: '#B8973B' }} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The EP Model */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The Executive Presence <span style={{ color: '#D4A84B' }}>Model</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our model clarifies executive presence as a three-dimensional framework of character, 
              substance, and style—each containing unique facets of leadership
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {modelDimensions.map((dimension) => (
              <div
                key={dimension.title}
                className="bg-card border border-border rounded-2xl p-6 text-center"
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${dimension.color}15` }}
                >
                  <span 
                    className="font-display text-xl font-bold"
                    style={{ color: dimension.color }}
                  >
                    {dimension.title.charAt(0)}
                  </span>
                </div>
                <h3 
                  className="font-display text-xl font-bold mb-4"
                  style={{ color: dimension.color }}
                >
                  {dimension.title}
                </h3>
                <ul className="space-y-2">
                  {dimension.items.map((item) => (
                    <li key={item} className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: dimension.color }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four Dimensions */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: 'hsl(40 20% 97%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Four Research-Backed <span style={{ color: '#D4A84B' }}>Scoring Dimensions</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Comprehensive scoring across key leadership indicators with weighted importance
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

      {/* Who Benefits */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Who <span style={{ color: '#D4A84B' }}>Benefits</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our assessment is designed for leaders at all levels who want to amplify their impact
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {beneficiaries.map((item) => (
              <div
                key={item.title}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'hsl(40 40% 92%)' }}
                >
                  <item.icon className="w-6 h-6" style={{ color: '#B8973B' }} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works & What You Receive */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: 'hsl(40 20% 97%)' }}>
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

      {/* How Assessment Works */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                How the <span style={{ color: '#D4A84B' }}>Assessment Works</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'hsl(40 40% 92%)' }}
                >
                  <Video className="w-8 h-8" style={{ color: '#B8973B' }} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Video Submission
                </h3>
                <p className="text-sm text-muted-foreground">
                  Record or upload a 3-minute video speaking about your leadership role and vision
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'hsl(40 40% 92%)' }}
                >
                  <Zap className="w-8 h-8" style={{ color: '#B8973B' }} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  AI Processing
                </h3>
                <p className="text-sm text-muted-foreground">
                  Advanced AI analyzes speech patterns, vocal metrics, visual presence, and content quality
                </p>
              </div>
              
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'hsl(40 40% 92%)' }}
                >
                  <Shield className="w-8 h-8" style={{ color: '#B8973B' }} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Personalized Insights
                </h3>
                <p className="text-sm text-muted-foreground">
                  Receive detailed feedback with strengths, gaps, and actionable coaching recommendations
                </p>
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
            Ready to Unlock Your <span style={{ color: '#D4A84B' }}>Leadership Potential</span>?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Join leaders worldwide who are mastering their executive presence through 
            AI-powered insights and personalized coaching
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
