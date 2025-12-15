import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Video, 
  BarChart3, 
  BookOpen, 
  GraduationCap, 
  Users, 
  HelpCircle,
  RefreshCw,
  Filter,
  LogOut,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface Assessment {
  id: string;
  overall_score: number | null;
  communication_score: number | null;
  appearance_score: number | null;
  storytelling_score: number | null;
  communication_analysis: any;
  appearance_analysis: any;
  storytelling_analysis: any;
  created_at: string;
  status: string;
}

const navItems = [
  { id: "know-ep", label: "Know your EP", subtitle: "Analyze your video", icon: Video },
  { id: "simulator", label: "Simulator", subtitle: "Practice scenarios", icon: BarChart3 },
  { id: "learning", label: "Learning Bytes", subtitle: "Daily tips", icon: BookOpen },
  { id: "training", label: "Training", subtitle: "Skill courses", icon: GraduationCap },
  { id: "coaching", label: "Executive Coaching", subtitle: "Book sessions", icon: Users },
  { id: "how-it-works", label: "How It Works", subtitle: "Our methodology", icon: HelpCircle },
];

const COLORS = {
  gravitas: "#C4A84D",
  communication: "#8B5CF6",
  presence: "#22C55E",
  storytelling: "#F97316",
  overall: "#3B82F6",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("know-ep");

  useEffect(() => {
    fetchAssessments();
    
    // Set up realtime subscription for assessments
    const channel = supabase
      .channel('assessments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assessments',
        },
        () => {
          fetchAssessments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const handleNavClick = (id: string) => {
    setActiveNav(id);
    if (id === "know-ep") {
      navigate("/assessment");
    }
  };

  const handleNewAssessment = () => {
    navigate("/assessment");
  };

  // Calculate statistics
  const latestScore = assessments[0]?.overall_score || 0;
  const previousScore = assessments[1]?.overall_score || latestScore;
  const scoreChange = latestScore && previousScore ? ((latestScore - previousScore) / previousScore * 100).toFixed(1) : "0";
  const avgScore = assessments.length > 0 
    ? (assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / assessments.length).toFixed(1)
    : "0";
  const bestScore = assessments.length > 0 
    ? Math.max(...assessments.map(a => a.overall_score || 0)).toFixed(1)
    : "0";

  // Calculate dimension averages
  const getGravitasScore = (a: Assessment) => {
    const analysis = a.communication_analysis;
    if (!analysis?.gravitas_assessment) return 0;
    const gravitas = analysis.gravitas_assessment;
    const scores = [
      gravitas.commanding_presence?.score,
      gravitas.decisiveness?.score,
      gravitas.poise_under_pressure?.score,
      gravitas.emotional_intelligence?.score,
      gravitas.vision_articulation?.score
    ].filter(s => s !== undefined);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  };

  const avgGravitas = assessments.length > 0
    ? (assessments.reduce((sum, a) => sum + getGravitasScore(a), 0) / assessments.length).toFixed(1)
    : "0";
  const avgCommunication = assessments.length > 0
    ? (assessments.reduce((sum, a) => sum + (a.communication_score || 0), 0) / assessments.length).toFixed(1)
    : "0";
  const avgPresence = assessments.length > 0
    ? (assessments.reduce((sum, a) => sum + (a.appearance_score || 0), 0) / assessments.length).toFixed(1)
    : "0";
  const avgStorytelling = assessments.length > 0
    ? (assessments.reduce((sum, a) => sum + (a.storytelling_score || 0), 0) / assessments.length).toFixed(1)
    : "0";

  // Find strongest and weakest
  const dimensionScores = [
    { name: "Gravitas", score: parseFloat(avgGravitas) },
    { name: "Communication", score: parseFloat(avgCommunication) },
    { name: "Presence", score: parseFloat(avgPresence) },
    { name: "Storytelling", score: parseFloat(avgStorytelling) },
  ];
  const strongest = dimensionScores.reduce((a, b) => a.score > b.score ? a : b);
  const weakest = dimensionScores.reduce((a, b) => a.score < b.score ? a : b);

  // Chart data
  const lineChartData = assessments.slice(0, 10).reverse().map((a, index) => ({
    date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Communication: a.communication_score || 0,
    Gravitas: getGravitasScore(a),
    Overall: a.overall_score || 0,
    Presence: a.appearance_score || 0,
  }));

  const radarData = [
    { subject: "Gravitas", value: parseFloat(avgGravitas), fullMark: 100 },
    { subject: "Communication", value: parseFloat(avgCommunication), fullMark: 100 },
    { subject: "Presence", value: parseFloat(avgPresence), fullMark: 100 },
    { subject: "Storytelling", value: parseFloat(avgStorytelling), fullMark: 100 },
  ];

  const pieData = [
    { name: "Gravitas", value: parseFloat(avgGravitas), color: COLORS.gravitas },
    { name: "Communication", value: parseFloat(avgCommunication), color: COLORS.communication },
    { name: "Presence", value: parseFloat(avgPresence), color: COLORS.presence },
    { name: "Storytelling", value: parseFloat(avgStorytelling), color: COLORS.storytelling },
  ];

  const recentScoresData = assessments.slice(0, 5).reverse().map((a, index) => ({
    name: `#${assessments.length - index}`,
    score: a.overall_score || 0,
    color: index % 2 === 0 ? COLORS.gravitas : "#EF4444",
  }));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-gray-900">EP</span>
            <span className="font-bold text-xl text-[#C4A84D]">Quotient</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#C4A84D]/10 rounded-full border border-[#C4A84D]">
              <span className="w-2 h-2 bg-[#C4A84D] rounded-full"></span>
              <span className="text-sm font-medium text-[#C4A84D]">PRO ∞</span>
            </div>
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-medium text-gray-900">{user?.email?.split('@')[0] || 'User'}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="container mx-auto px-6 pb-4">
          <div className="flex gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-3 py-2 text-left transition-all",
                  activeNav === item.id ? "text-[#C4A84D]" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  activeNav === item.id ? "bg-[#C4A84D]/10" : "bg-gray-100"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5",
                    activeNav === item.id ? "text-[#C4A84D]" : "text-gray-500"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "text-sm font-medium",
                    activeNav === item.id ? "text-gray-900" : "text-gray-700"
                  )}>{item.label}</p>
                  <p className="text-xs text-gray-400">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics <span className="text-[#C4A84D]">Dashboard</span>
            </h1>
            <p className="text-gray-500 mt-1">Real-time insights into your executive presence journey</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-gray-600 border-gray-200">
              <span>All Time</span>
              <Filter className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              className="text-[#C4A84D] border-[#C4A84D]/30 hover:bg-[#C4A84D]/5"
              onClick={fetchAssessments}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              className="bg-[#C4A84D] hover:bg-[#B39940] text-white"
              onClick={handleNewAssessment}
            >
              <Video className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#C4A84D]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#C4A84D]" />
              </div>
              <span className="text-sm text-gray-500">Latest Score</span>
            </div>
            <p className="text-4xl font-light text-[#C4A84D]">{latestScore?.toFixed(1) || "0.0"}</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {parseFloat(scoreChange) < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-red-500">{scoreChange}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">+{scoreChange}%</span>
                </>
              )}
              <span className="text-gray-400">vs previous</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">Average Score</span>
            </div>
            <p className="text-4xl font-light text-gray-900">{avgScore}</p>
            <p className="text-sm text-gray-400 mt-2">Across {assessments.length} reports</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm text-gray-500">Best Score</span>
            </div>
            <p className="text-4xl font-light text-cyan-500">{bestScore}</p>
            <p className="text-sm text-gray-400 mt-2">Personal best</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">Strongest</span>
            </div>
            <p className="text-2xl font-semibold text-emerald-500">{strongest.name}</p>
            <p className="text-xl font-light text-gray-900">{strongest.score.toFixed(1)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">Focus Area</span>
            </div>
            <p className="text-2xl font-semibold text-purple-500">{weakest.name}</p>
            <p className="text-xl font-light text-gray-900">{weakest.score.toFixed(1)}</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Score Progression */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Score <span className="text-[#C4A84D]">Progression</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Communication" stroke={COLORS.communication} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Gravitas" stroke={COLORS.gravitas} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Overall" stroke={COLORS.overall} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Presence" stroke={COLORS.presence} strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dimension Balance (Radar) */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dimension <span className="text-[#C4A84D]">Balance</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke={COLORS.gravitas}
                    fill={COLORS.gravitas}
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Score Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Score <span className="text-[#C4A84D]">Distribution</span>
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Scores */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent <span className="text-[#C4A84D]">Scores</span>
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentScoresData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {recentScoresData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dimension Averages */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dimension <span className="text-[#C4A84D]">Averages</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Gravitas</span>
                  <span className="text-sm font-medium text-[#C4A84D]">{avgGravitas}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C4A84D] rounded-full" 
                    style={{ width: `${parseFloat(avgGravitas)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Communication</span>
                  <span className="text-sm font-medium text-[#C4A84D]">{avgCommunication}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#C4A84D] rounded-full" 
                    style={{ width: `${parseFloat(avgCommunication)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Presence</span>
                  <span className="text-sm font-medium text-emerald-500">{avgPresence}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${parseFloat(avgPresence)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Storytelling</span>
                  <span className="text-sm font-medium text-orange-500">{avgStorytelling}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full" 
                    style={{ width: `${parseFloat(avgStorytelling)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Reports */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            All <span className="text-[#C4A84D]">Reports</span> ({assessments.length})
          </h3>
          <div className="space-y-3">
            {assessments.map((assessment, index) => (
              <div 
                key={assessment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => navigate(`/report/${assessment.id}`)}
              >
                <div>
                  <p className="font-medium text-gray-900">Report #{assessments.length - index}</p>
                  <p className="text-sm text-gray-400">{formatDate(assessment.created_at)}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Gravitas</p>
                    <p className="text-lg font-medium text-[#C4A84D]">{getGravitasScore(assessment).toFixed(0) || "-"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Comm.</p>
                    <p className="text-lg font-medium text-purple-500">{assessment.communication_score?.toFixed(0) || "-"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Presence</p>
                    <p className="text-lg font-medium text-emerald-500">{assessment.appearance_score?.toFixed(0) || "-"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Story</p>
                    <p className="text-lg font-medium text-orange-500">{assessment.storytelling_score?.toFixed(0) || "-"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Overall</p>
                    <p className="text-2xl font-light text-[#C4A84D]">{assessment.overall_score?.toFixed(1) || "-"}</p>
                  </div>
                </div>
              </div>
            ))}
            {assessments.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No reports yet. Start your first assessment!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
