import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AssessmentReport } from "@/components/AssessmentReport";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Award, LogOut, AlertCircle } from "lucide-react";

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

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching assessment:", error);
        setError("Failed to load report");
      } else if (!data) {
        setError("Report not found");
      } else {
        setAssessment(data as Assessment);
      }
      setLoading(false);
    };

    fetchAssessment();
  }, [id, user]);

  const handleNewAssessment = () => {
    navigate("/know-your-ep");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={handleBack} variant="ghost" size="icon" className="mr-2">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-md">
                <Award className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">EP Assessment</h1>
                <p className="text-xs text-muted-foreground">Executive Presence Analysis</p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{error || "Report not found"}</h2>
            <p className="text-muted-foreground mb-6">The report you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={handleBack}>Back to Dashboard</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={handleBack} variant="ghost" size="icon" className="mr-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">EP Assessment</h1>
              <p className="text-xs text-muted-foreground">Executive Presence Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleNewAssessment}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              New Assessment
            </button>
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="animate-fade-in">
          <AssessmentReport
            assessment={assessment}
            onNewAssessment={handleNewAssessment}
          />
        </div>
      </main>
    </div>
  );
}
