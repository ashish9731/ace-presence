import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Loader2, Calendar, Award, Eye } from "lucide-react";

interface Assessment {
  id: string;
  overall_score: number | null;
  communication_score: number | null;
  appearance_score: number | null;
  storytelling_score: number | null;
  communication_analysis: any;
  created_at: string;
  status: string;
}

export default function Reports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching assessments:", error);
      } else {
        setAssessments(data || []);
      }
      setLoading(false);
    };

    fetchAssessments();
  }, [user]);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleViewReport = (id: string) => {
    navigate(`/report/${id}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-[#C4A84D]";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getGravitasScore = (assessment: Assessment) => {
    const analysis = assessment.communication_analysis;
    if (analysis?.gravitas_score) return analysis.gravitas_score;
    if (analysis?.gravitas_analysis?.overall_score) return analysis.gravitas_analysis.overall_score;
    const gravitas = analysis?.gravitas_analysis?.parameters;
    if (!gravitas) return null;
    const scores = [
      gravitas.commanding_presence?.score,
      gravitas.decisiveness?.score,
      gravitas.poise_under_pressure?.score,
      gravitas.emotional_intelligence?.score,
      gravitas.vision_articulation?.score
    ].filter(s => s !== undefined && s !== null);
    return scores.length > 0 ? scores.reduce((sum, b) => sum + b, 0) / scores.length : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C4A84D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleBack} 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:text-gray-700 hover:bg-[#C4A84D]/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C4A84D] to-[#B39940] flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">
                  Assessment <span className="text-[#C4A84D]">Reports</span>
                </h1>
                <p className="text-xs text-gray-500">View all your EP assessment reports</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {assessments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#C4A84D]/10 flex items-center justify-center">
              <FileText className="w-10 h-10 text-[#C4A84D]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Reports Yet</h2>
            <p className="text-gray-500 mb-6">Complete your first EP assessment to see your reports here.</p>
            <Button 
              onClick={() => navigate("/know-your-ep")}
              className="bg-[#C4A84D] hover:bg-[#B39940] text-white"
            >
              Start Assessment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {assessments.length} Report{assessments.length !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="grid gap-4">
              {assessments.map((assessment, index) => {
                const gravitasScore = getGravitasScore(assessment);
                return (
                  <div
                    key={assessment.id}
                    className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#C4A84D]/30 hover:shadow-[0_0_20px_hsl(38_92%_50%/0.15)] transition-all duration-300 cursor-pointer group"
                    onClick={() => handleViewReport(assessment.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C4A84D]/20 to-[#B39940]/10 flex items-center justify-center border border-[#C4A84D]/20">
                          <span className="text-lg font-bold text-[#C4A84D]">#{assessments.length - index}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-[#C4A84D] transition-colors">
                            EP Assessment Report
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(assessment.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Score breakdown */}
                        <div className="hidden md:flex items-center gap-4">
                          <div className="text-center px-3">
                            <p className="text-xs text-gray-400 mb-1">Gravitas</p>
                            <p className={`text-lg font-semibold ${getScoreColor(gravitasScore)}`}>
                              {gravitasScore?.toFixed(0) || '-'}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-gray-200"></div>
                          <div className="text-center px-3">
                            <p className="text-xs text-gray-400 mb-1">Communication</p>
                            <p className={`text-lg font-semibold ${getScoreColor(assessment.communication_score)}`}>
                              {assessment.communication_score?.toFixed(0) || '-'}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-gray-200"></div>
                          <div className="text-center px-3">
                            <p className="text-xs text-gray-400 mb-1">Presence</p>
                            <p className={`text-lg font-semibold ${getScoreColor(assessment.appearance_score)}`}>
                              {assessment.appearance_score?.toFixed(0) || '-'}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-gray-200"></div>
                          <div className="text-center px-3">
                            <p className="text-xs text-gray-400 mb-1">Story</p>
                            <p className={`text-lg font-semibold ${getScoreColor(assessment.storytelling_score)}`}>
                              {assessment.storytelling_score?.toFixed(0) || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Overall Score */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-400 mb-1">Overall</p>
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4 text-[#C4A84D]" />
                              <span className={`text-2xl font-bold ${getScoreColor(assessment.overall_score)}`}>
                                {assessment.overall_score?.toFixed(0) || '-'}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#C4A84D]/30 text-[#C4A84D] hover:bg-[#C4A84D]/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(assessment.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
