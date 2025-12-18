import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, User, Target, Film, Camera, Upload, Lock } from "lucide-react";
import { VideoRecorder } from "@/components/VideoRecorder";
import { VideoUpload } from "@/components/VideoUpload";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AssessmentReport } from "@/components/AssessmentReport";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { ReportProtection } from "@/components/ReportProtection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTierEnforcement } from "@/hooks/useTierEnforcement";
import { toast } from "sonner";

type ViewState = "select" | "record" | "upload" | "analyzing" | "report";

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

export default function KnowYourEP() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    userPlan, 
    isTrialExpired, 
    canUseVideoAnalysis, 
    videoUsageThisMonth,
    limits,
    loading: tierLoading,
    recordVideoUsage 
  } = useTierEnforcement();
  
  const [mode, setMode] = useState<ViewState>("select");
  const [isUploading, setIsUploading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("uploading");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // Poll for assessment completion
  useEffect(() => {
    if (!assessmentId || mode !== "analyzing") return;

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
          
          // Record video usage
          await recordVideoUsage(data.id);
          
          setMode("report");
          toast.success("Analysis complete!", {
            description: "Your Executive Presence report is ready.",
          });
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          toast.error("Analysis failed", {
            description: data.error_message || "Please try again.",
          });
          setMode("select");
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [assessmentId, mode, recordVideoUsage]);

  const processVideo = async (file: File) => {
    if (!user) {
      toast.error("Authentication required");
      return;
    }

    // Check tier limits
    if (!canUseVideoAnalysis) {
      toast.error("Video analysis limit reached", {
        description: isTrialExpired 
          ? "Your free trial has expired. Please upgrade to continue."
          : `You've used ${videoUsageThisMonth}/${limits.videoAnalyses} analyses this month. Upgrade for more.`,
      });
      navigate("/pricing");
      return;
    }

    console.log('Processing video:', file.name, 'size:', file.size, 'type:', file.type);
    
    setIsUploading(true);
    setAnalysisStatus("uploading");
    
    toast.info("Uploading video...", {
      description: "Please wait while we upload your recording.",
    });

    try {
      const fileExt = file.name.split(".").pop() || 'webm';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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
      setMode("analyzing");

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
      setMode("select");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoRecorded = async (file: File) => {
    console.log('Video recorded:', file.name, 'size:', file.size, 'type:', file.type);
    
    if (file.size < 100000) {
      toast.warning("Recording seems short", {
        description: "For best results, record at least 30 seconds of speech.",
      });
    }
    
    await processVideo(file);
  };

  const handleVideoSelect = async (file: File) => {
    await processVideo(file);
  };

  const handleNewAssessment = () => {
    setAssessment(null);
    setAssessmentId(null);
    setMode("select");
  };

  // Show upgrade prompt if trial expired or no plan
  if (!tierLoading && (isTrialExpired || !userPlan)) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
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
        <main className="container mx-auto px-6 py-12">
          <UpgradePrompt 
            isTrialExpired={isTrialExpired}
            feature="Video Analysis"
            message={!userPlan ? "Please select a plan to use this feature." : undefined}
          />
        </main>
      </div>
    );
  }

  // Show limit reached message
  if (!tierLoading && !canUseVideoAnalysis) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
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
        <main className="container mx-auto px-6 py-12">
          <UpgradePrompt 
            title="Analysis Limit Reached"
            message={`You've used ${videoUsageThisMonth} of ${limits.videoAnalyses} video analyses this month. Upgrade your plan for more analyses.`}
            feature="Video Analysis"
          />
        </main>
      </div>
    );
  }

  if (mode === "record") {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-4">
            <button
              onClick={() => setMode("select")}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <VideoRecorder onVideoRecorded={handleVideoRecorded} onCancel={() => setMode("select")} />
          </div>
        </main>
      </div>
    );
  }

  if (mode === "upload") {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-4">
            <button
              onClick={() => setMode("select")}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <VideoUpload onVideoSelect={handleVideoSelect} isUploading={isUploading} />
          </div>
        </main>
      </div>
    );
  }

  if (mode === "analyzing") {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-4">
            <span className="text-sm text-gray-500">Analyzing your video...</span>
          </div>
        </div>
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <AnalysisProgress status={analysisStatus} />
          </div>
        </main>
      </div>
    );
  }

  if (mode === "report" && assessment) {
    const isFreeTier = userPlan === "free_trial";
    
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-4">
              {isFreeTier && (
                <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Preview Only - Upgrade to Download
                </span>
              )}
              <button
                onClick={handleNewAssessment}
                className="text-sm text-[#C4A84D] hover:text-[#B39940] transition-colors font-medium"
              >
                New Assessment
              </button>
            </div>
          </div>
        </div>
        <main className="container mx-auto px-6 py-8">
          <ReportProtection isProtected={isFreeTier}>
            <AssessmentReport
              assessment={assessment}
              onNewAssessment={handleNewAssessment}
              canDownload={!isFreeTier}
            />
          </ReportProtection>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Back Button */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          {/* Usage indicator */}
          {userPlan && limits.videoAnalyses !== Infinity && (
            <div className="text-sm text-gray-500">
              <span className="font-medium text-[#C4A84D]">{videoUsageThisMonth}</span>
              <span> / {limits.videoAnalyses} analyses used this month</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Know Your <span className="text-[#C4A84D]">EP</span>
          </h1>
          <p className="text-gray-500 mb-10">
            Record or upload a 3-minute video and get your Executive Presence report
          </p>

          {/* Recording Instructions Card */}
          <div className="bg-white rounded-2xl border-2 border-[#C4A84D]/30 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📝</span>
              <h2 className="text-xl font-bold text-gray-900">Recording Instructions</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <Clock className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Duration</h3>
                <p className="text-sm text-gray-500">2-4 minutes (ideal: 3 min)</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <User className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Introduction</h3>
                <p className="text-sm text-gray-500">Name, role & context (30-40s)</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <Target className="w-8 h-8 text-red-400 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Key Initiative</h3>
                <p className="text-sm text-gray-500">Current project/challenge (60-90s)</p>
              </div>
            </div>

            <div className="w-1/3">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <Film className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Leadership Story</h3>
                <p className="text-sm text-gray-500">Challenge & resolution (60-90s)</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setMode("record")}
              className="bg-white rounded-2xl border-2 border-[#C4A84D]/30 p-8 hover:border-[#C4A84D] transition-all group"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#C4A84D]/10 flex items-center justify-center mb-4 group-hover:bg-[#C4A84D]/20 transition-colors">
                  <Camera className="w-8 h-8 text-[#C4A84D]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Record Video</h3>
                <p className="text-sm text-gray-500">Use your camera to record directly</p>
              </div>
            </button>

            <button
              onClick={() => setMode("upload")}
              className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:border-[#C4A84D] transition-all group"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-[#C4A84D]/10 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#C4A84D]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Video</h3>
                <p className="text-sm text-gray-500">Upload an existing video file</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
