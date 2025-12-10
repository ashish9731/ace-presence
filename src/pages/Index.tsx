import { useState, useEffect } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AssessmentReport } from "@/components/AssessmentReport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Sparkles } from "lucide-react";

type ViewState = "upload" | "analyzing" | "report";

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
  const [view, setView] = useState<ViewState>("upload");
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
          setView("upload");
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [assessmentId, view]);

  const handleVideoSelect = async (file: File) => {
    setIsUploading(true);
    setAnalysisStatus("uploading");

    try {
      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

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

      setAnalysisStatus("processing");
      setView("analyzing");

      // Create assessment record
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          video_path: filePath,
          status: "processing",
        })
        .select()
        .single();

      if (assessmentError) {
        throw new Error(`Failed to create assessment: ${assessmentError.message}`);
      }

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
        // The edge function will update the status, we'll catch it in polling
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setView("upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNewAssessment = () => {
    setAssessment(null);
    setAssessmentId(null);
    setView("upload");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          
          {view === "report" && (
            <button
              onClick={handleNewAssessment}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              New Assessment
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {view === "upload" && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Analysis
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                Assess Your
                <span className="block text-gradient">Executive Presence</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Upload a 3-minute video and receive detailed feedback on your 
                communication, appearance, and storytelling skills.
              </p>
            </div>

            {/* Upload Component */}
            <VideoUpload 
              onVideoSelect={handleVideoSelect} 
              isUploading={isUploading} 
            />

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-medium text-sm text-foreground">Communication</h3>
                <p className="text-xs text-muted-foreground mt-1">Voice, clarity, confidence</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">👁️</span>
                </div>
                <h3 className="font-medium text-sm text-foreground">Presence</h3>
                <p className="text-xs text-muted-foreground mt-1">Energy, engagement, impact</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📖</span>
                </div>
                <h3 className="font-medium text-sm text-foreground">Storytelling</h3>
                <p className="text-xs text-muted-foreground mt-1">Narrative, memorability</p>
              </div>
            </div>
          </div>
        )}

        {view === "analyzing" && (
          <div className="py-12">
            <AnalysisProgress status={analysisStatus} />
          </div>
        )}

        {view === "report" && assessment && (
          <AssessmentReport 
            assessment={assessment} 
            onNewAssessment={handleNewAssessment}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by OpenAI • Results in 2-3 minutes
          </p>
        </div>
      </footer>
    </div>
  );
}
