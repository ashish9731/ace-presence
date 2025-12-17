import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Calendar, Link2, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Assessment {
  id: string;
  overall_score: number | null;
  created_at: string;
}

export default function ExecutiveCoaching() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    primaryGoal: "",
    preferredTimes: "",
    notes: "",
  });

  useEffect(() => {
    fetchAssessments();
  }, [user]);

  const fetchAssessments = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("assessments")
      .select("id, overall_score, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (data) {
      setAssessments(data);
      if (data.length > 0) {
        setSelectedReport(data[0].id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Please fill in your name and email");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-coaching-request", {
        body: {
          name: formData.name,
          email: formData.email,
          primaryGoal: formData.primaryGoal,
          preferredTimes: formData.preferredTimes,
          notes: formData.notes,
        },
      });

      if (error) throw error;

      toast.success("Request submitted!", {
        description: "A coach will reach out to you shortly at " + formData.email,
      });
      
      setFormData({
        name: "",
        email: "",
        primaryGoal: "",
        preferredTimes: "",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error sending coaching request:", error);
      toast.error("Failed to send request", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateShareLink = () => {
    if (!selectedReport) {
      toast.error("Please select a report first");
      return;
    }
    const shareLink = `${window.location.origin}/shared-report/${selectedReport}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied!", {
      description: "Link valid for 7 days",
    });
  };

  const formatReportOption = (assessment: Assessment) => {
    const date = new Date(assessment.created_at).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const score = assessment.overall_score?.toFixed(1) || "N/A";
    return `${date} — Score ${score}`;
  };

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
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Executive <span className="text-[#C4A84D]">Coaching</span>
          </h1>
          <p className="text-gray-500 mb-10">
            Request a coaching session and share your EP report for targeted feedback.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Request a Coach */}
            <div className="lg:col-span-3 bg-white rounded-2xl border-2 border-[#C4A84D]/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#C4A84D] flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Request a Coaching Session</h2>
              </div>

              <p className="text-gray-500 mb-6">
                Fill out the form below and our coaching team will reach out to schedule your session.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Your Details</h3>
                </div>

                <div>
                  <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="goal">Primary goal</Label>
                  <Input
                    id="goal"
                    placeholder="e.g., gravitas in board meetings"
                    value={formData.primaryGoal}
                    onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="times">Preferred times</Label>
                  <Input
                    id="times"
                    placeholder="e.g., Tue/Thu mornings"
                    value={formData.preferredTimes}
                    onChange={(e) => setFormData({ ...formData, preferredTimes: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Anything the coach should know"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#C4A84D] hover:bg-[#B39940] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Request...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </form>
            </div>

            {/* Right Column - Share Reports */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#C4A84D]/10 flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-[#C4A84D]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Share Reports</h2>
              </div>

              <p className="text-gray-500 mb-6">
                Generate a time-limited share link (7 days). You can paste it into email or messaging.
              </p>

              <div className="mb-6">
                <Label>Choose report</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a report" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        {formatReportOption(assessment)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full border-[#C4A84D] text-[#C4A84D] hover:bg-[#C4A84D]/5"
                onClick={handleGenerateShareLink}
              >
                <Link2 className="w-4 h-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
