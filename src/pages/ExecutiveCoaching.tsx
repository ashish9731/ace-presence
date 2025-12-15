import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Calendar, Link2, MessageSquare, ExternalLink } from "lucide-react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Request submitted!", {
      description: "A coach will reach out to you shortly.",
    });
    setFormData({
      name: "",
      email: "",
      primaryGoal: "",
      preferredTimes: "",
      notes: "",
    });
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
            Book a session and send your EP report to a coach for targeted feedback.
          </p>

          <div className="grid grid-cols-5 gap-8">
            {/* Left Column - Book a Session */}
            <div className="col-span-3 bg-white rounded-2xl border-2 border-[#C4A84D]/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#C4A84D] flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Book a Coaching Session</h2>
              </div>

              <p className="text-gray-500 mb-6">
                Use the booking link (Calendly, etc.) or submit a request form and we'll follow up.
              </p>

              <Button
                className="bg-[#C4A84D] hover:bg-[#B39940] text-white mb-8"
                onClick={() => window.open("https://calendly.com", "_blank")}
              >
                Open Booking Link
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>

              <div className="border-t border-gray-100 pt-8">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Request a Coach (internal)</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1"
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
                  >
                    Send Request
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Column - Share Reports */}
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-8 h-fit">
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
