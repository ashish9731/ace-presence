import { useState, useEffect } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import { VideoRecorder } from "@/components/VideoRecorder";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AssessmentReport } from "@/components/AssessmentReport";
import { BoardroomSimulator } from "@/components/BoardroomSimulator";
import { InsightsTab } from "@/components/InsightsTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Award, Sparkles, Upload, Video, ChevronLeft, Shield, Clock, BarChart3, BookOpen, MessageSquare, Eye, Crown, Lightbulb, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MainTab = "assessment" | "boardroom" | "insights";
type ViewState = "home" | "upload" | "record" | "analyzing" | "report";

interface Assessment {
  id: string;
  overall_score: number;
  communication_score: number;
  appearance_score: number;
  storytelling_score: number;
  communication_analysis: any;
  appearance_analysis: any;
  storytelling_analysis: any;
  transcript: string;
  video_duration_seconds: number;
  status: string;
}

export default function Index() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>("assessment");
  const [view, setView] = useState<ViewState>("home");
  const [isUploading, setIsUploading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("uploading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // Poll for assessment completion
  useEffect(() => {
    if (!assessmentId || view !== "analyzing") return;

    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .maybeSingle();

      if (error) {
        console.error("Error polling assessment:", error);
        return;
      }

      if (data) {
        setAnalysisStatus(data.status);

        if (data.status === "completed") {
          clearInterval(pollInterval);
          setAssessment(data as Assessment);
          setView("report");
          toast.success("Analysis complete!", {
            description: "Your Executive Presence report is ready.",
          });
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          toast.error("Analysis failed", {
            description: data.error_message || "Please try again.",
          });
          setView("home");
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [assessmentId, view]);

  const processVideo = async (file: File) => {
    if (!user) {
      toast.error("Authentication required");
      return;
    }

    console.log('Processing video:', file.name, 'size:', file.size, 'type:', file.type);
    
    setIsUploading(true);
    setAnalysisStatus("uploading");
    
    toast.info("Uploading video...", {
      description: "Please wait while we upload your recording.",
    });

    try {
      // Generate unique file path with user folder for RLS
      const fileExt = file.name.split(".").pop() || 'webm';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload video to storage
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log('Video uploaded successfully to:', filePath);
      
      toast.success("Video uploaded!", {
        description: "Starting AI analysis...",
      });

      setAnalysisStatus("processing");
      setView("analyzing");

      // Create assessment record with user_id
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          video_path: filePath,
          status: "processing",
          user_id: user.id,
        })
        .select()
        .single();

      if (assessmentError) {
        throw new Error(`Failed to create assessment: ${assessmentError.message}`);
      }

      console.log('Assessment created:', assessmentData.id);
      setAssessmentId(assessmentData.id);

      // Trigger analysis edge function
      const response = await supabase.functions.invoke("analyze-video", {
        body: {
          assessmentId: assessmentData.id,
          videoPath: filePath,
        },
      });

      if (response.error) {
        console.error("Edge function error:", response.error);
        toast.warning("Analysis started", {
          description: "Processing your video in the background...",
        });
      } else {
        console.log('Edge function triggered successfully');
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setView("home");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoSelect = async (file: File) => {
    await processVideo(file);
  };

  const handleVideoRecorded = async (file: File) => {
    console.log('Video recorded:', file.name, 'size:', file.size, 'type:', file.type);
    
    // Warn if file is very small (likely too short)
    if (file.size < 100000) { // Less than 100KB
      toast.warning("Recording seems short", {
        description: "For best results, record at least 30 seconds of speech.",
      });
    }
    
    await processVideo(file);
  };

  const handleNewAssessment = () => {
    setAssessment(null);
    setAssessmentId(null);
    setView("home");
  };

  const handleBack = () => {
    if (view === "upload" || view === "record") {
      setView("home");
    } else if (view === "analyzing") {
      // Can't go back during analysis
      toast.info("Please wait for analysis to complete");
    } else if (view === "report") {
      setView("home");
    }
  };

  const tabs = [
    { id: "assessment" as MainTab, label: "Video Analysis", icon: Video },
    { id: "boardroom" as MainTab, label: "Boardroom Simulator", icon: Crown },
    { id: "insights" as MainTab, label: "Insights", icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== "home" && view !== "analyzing" && activeTab === "assessment" && (
              <Button
                onClick={handleBack}
                variant="ghost"
                size="icon"
                className="mr-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                EP Assessment
              </h1>
              <p className="text-xs text-muted-foreground">Executive Presence Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {view === "report" && activeTab === "assessment" && (
              <button
                onClick={handleNewAssessment}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                New Assessment
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container mx-auto px-4 pb-0">
          <div className="flex gap-1 border-b border-border -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "assessment") {
                    setView("home");
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {/* Assessment Tab */}
        {activeTab === "assessment" && (
          <>
            {/* Home / Landing View */}
            {view === "home" && (
              <div className="max-w-3xl mx-auto space-y-10">
                {/* Hero Section */}
                <div className="text-center space-y-4 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Analysis with Research Backing
                  </div>
                  <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                    Assess Your
                    <span className="block text-gradient">Executive Presence</span>
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Upload or record a 3-minute video and receive detailed, research-backed feedback on your 
                    communication, appearance, and storytelling skills.
                  </p>
                </div>

                {/* Input Method Selection */}
                <div className="grid sm:grid-cols-2 gap-4 animate-slide-up">
                  <button
                    onClick={() => setView("upload")}
                    className={cn(
                      "p-6 border border-border rounded-2xl bg-card hover:bg-muted/30 transition-all",
                      "flex flex-col items-center gap-4 text-center group hover:border-primary/50 hover:shadow-lg"
                    )}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                        Upload Video
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload an existing video file (MP4, MOV, WebM)
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setView("record")}
                    className={cn(
                      "p-6 border border-border rounded-2xl bg-card hover:bg-muted/30 transition-all",
                      "flex flex-col items-center gap-4 text-center group hover:border-accent/50 hover:shadow-lg"
                    )}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Video className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                        Record Now
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Record directly using your camera and microphone
                      </p>
                    </div>
                  </button>
                </div>

                {/* Assessment Dimensions */}
                <div className="bg-gradient-card border border-border rounded-2xl p-6 animate-slide-up">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
                    What We Analyze
                  </h2>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Crown className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1 text-sm">Gravitas</h3>
                      <p className="text-xs text-muted-foreground">
                        Command, decisiveness, poise, emotional intelligence
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium text-primary/70 bg-primary/10 px-2 py-0.5 rounded">
                        25% weight
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1 text-sm">Communication</h3>
                      <p className="text-xs text-muted-foreground">
                        Speaking rate, vocal variety, filler words, pauses
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium text-accent/70 bg-accent/10 px-2 py-0.5 rounded">
                        30% weight
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
                        <Eye className="w-6 h-6 text-warning" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1 text-sm">Presence</h3>
                      <p className="text-xs text-muted-foreground">
                        Presence projection, engagement, first impression
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium text-warning/70 bg-warning/10 px-2 py-0.5 rounded">
                        25% weight
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-6 h-6 text-success" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1 text-sm">Storytelling</h3>
                      <p className="text-xs text-muted-foreground">
                        Narrative structure, flow, authenticity, pacing
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium text-success/70 bg-success/10 px-2 py-0.5 rounded">
                        20% weight
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="grid sm:grid-cols-3 gap-4 text-center animate-slide-up">
                  <div className="flex flex-col items-center gap-2 p-4">
                    <Shield className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Research-Backed Analysis</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Results in 2-3 Minutes</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Detailed Parameter Scores</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upload View */}
            {view === "upload" && (
              <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Upload Your Video
                  </h2>
                  <p className="text-muted-foreground">
                    Select a video file to analyze your executive presence
                  </p>
                </div>
                <VideoUpload 
                  onVideoSelect={handleVideoSelect} 
                  isUploading={isUploading} 
                />
              </div>
            )}

            {/* Record View */}
            {view === "record" && (
              <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Record Your Video
                  </h2>
                  <p className="text-muted-foreground">
                    Position yourself with face and upper torso visible, then record for ~3 minutes
                  </p>
                </div>
                
                {/* Recording Instructions */}
                <div className="bg-gradient-card rounded-xl p-5 border border-border">
                  <h3 className="font-semibold text-foreground mb-3">Recording Structure (3 minutes)</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium">1</span>
                      <span><strong>Intro & Role</strong> — Introduce yourself and your position (30-40s)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium">2</span>
                      <span><strong>Key Initiative</strong> — Describe an initiative you're leading (60-90s)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium">3</span>
                      <span><strong>Leadership Story</strong> — Share a challenge you overcame (60-90s)</span>
                    </li>
                  </ul>
                </div>

                <VideoRecorder 
                  onVideoRecorded={handleVideoRecorded}
                  onCancel={() => setView("home")}
                />
              </div>
            )}

            {/* Analyzing View */}
            {view === "analyzing" && (
              <div className="py-12">
                <AnalysisProgress status={analysisStatus} />
              </div>
            )}

            {/* Report View */}
            {view === "report" && assessment && (
              <AssessmentReport 
                assessment={assessment} 
                onNewAssessment={handleNewAssessment}
              />
            )}
          </>
        )}

        {/* Boardroom Simulator Tab */}
        {activeTab === "boardroom" && (
          <div className="max-w-4xl mx-auto">
            <BoardroomSimulator />
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="max-w-4xl mx-auto">
            <InsightsTab />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Research-backed executive presence analysis
          </p>
          <p className="text-xs text-muted-foreground/60">
            References: Carmine Gallo, Amy Cuddy, Nancy Duarte, Toastmasters International
          </p>
        </div>
      </footer>
    </div>
  );
}
