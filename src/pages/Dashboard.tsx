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
  RefreshCw,
  ChevronDown,
  LogOut,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  FileText,
  MessageSquare,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { id: "dashboard", label: "Dashboard", subtitle: "Analytics overview", icon: LayoutDashboard, path: "" },
  { id: "know-ep", label: "Know your EP", subtitle: "Analyze your video", icon: Video, path: "/know-your-ep" },
  { id: "simulator", label: "Simulator", subtitle: "Practice scenarios", icon: BarChart3, path: "/simulator" },
  { id: "learning", label: "Learning Bytes", subtitle: "Daily tips", icon: BookOpen, path: "/learning-bytes" },
  { id: "training", label: "Training", subtitle: "Skill courses", icon: GraduationCap, path: "/training" },
  { id: "coaching", label: "Executive Coaching", subtitle: "Book sessions", icon: Users, path: "/executive-coaching" },
  { id: "reports", label: "Reports", subtitle: "View all reports", icon: FileText, path: "/reports" },
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
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("all");

  useEffect(() => {
    fetchAssessments();
    fetchUserPlan();
    
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

  const fetchUserPlan = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_plans")
      .select("plan_name")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data?.plan_name) {
      setUserPlan(data.plan_name);
    }
  };

  const fetchAssessments = async (showToast = false) => {
    if (!user) return;
    
    setRefreshing(true);
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assessments:", error);
      if (showToast) toast.error("Failed to refresh data");
    } else {
      setAssessments(data || []);
      if (showToast) toast.success("Dashboard refreshed!");
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Filter assessments based on time filter
  useEffect(() => {
    if (assessments.length === 0) {
      setFilteredAssessments([]);
      return;
    }

    const now = new Date();
    let filtered = assessments;

    switch (timeFilter) {
      case "7days":
        filtered = assessments.filter(a => {
          const date = new Date(a.created_at);
          return (now.getTime() - date.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        });
        break;
      case "30days":
        filtered = assessments.filter(a => {
          const date = new Date(a.created_at);
          return (now.getTime() - date.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        });
        break;
      case "90days":
        filtered = assessments.filter(a => {
          const date = new Date(a.created_at);
          return (now.getTime() - date.getTime()) <= 90 * 24 * 60 * 60 * 1000;
        });
        break;
      case "all":
      default:
        filtered = assessments;
    }

    setFilteredAssessments(filtered);
  }, [assessments, timeFilter]);

  const handleRefresh = () => {
    fetchAssessments(true);
  };

  const handleNavClick = (id: string, path: string) => {
    setActiveNav(id);
    if (path) {
      navigate(path);
    }
  };

  const handleNewAssessment = () => {
    navigate("/know-your-ep");
  };

  // Calculate statistics using filteredAssessments for time-based filtering
  const data = filteredAssessments;
  const latestScore = data[0]?.overall_score || 0;
  const previousScore = data[1]?.overall_score || latestScore;
  const scoreChange = latestScore && previousScore ? ((latestScore - previousScore) / previousScore * 100).toFixed(1) : "0";
  const avgScore = data.length > 0 
    ? (data.reduce((sum, a) => sum + (a.overall_score || 0), 0) / data.length).toFixed(1)
    : "0";
  const bestScore = data.length > 0 
    ? Math.max(...data.map(a => a.overall_score || 0)).toFixed(1)
    : "0";

  // Calculate dimension averages - FIX: use correct path for gravitas data
  const getGravitasScore = (a: Assessment) => {
    const analysis = a.communication_analysis;
    // Check for gravitas_score directly (stored by edge function)
    if (analysis?.gravitas_score) return analysis.gravitas_score;
    // Also check gravitas_analysis.overall_score
    if (analysis?.gravitas_analysis?.overall_score) return analysis.gravitas_analysis.overall_score;
    // Fallback: calculate from individual parameters
    const gravitas = analysis?.gravitas_analysis?.parameters;
    if (!gravitas) return 0;
    const scores = [
      gravitas.commanding_presence?.score,
      gravitas.decisiveness?.score,
      gravitas.poise_under_pressure?.score,
      gravitas.emotional_intelligence?.score,
      gravitas.vision_articulation?.score
    ].filter(s => s !== undefined && s !== null);
    return scores.length > 0 ? scores.reduce((sum, b) => sum + b, 0) / scores.length : 0;
  };

  const avgGravitas = data.length > 0
    ? (data.reduce((sum, a) => sum + getGravitasScore(a), 0) / data.length).toFixed(1)
    : "0";
  const avgCommunication = data.length > 0
    ? (data.reduce((sum, a) => sum + (a.communication_score || 0), 0) / data.length).toFixed(1)
    : "0";
  const avgPresence = data.length > 0
    ? (data.reduce((sum, a) => sum + (a.appearance_score || 0), 0) / data.length).toFixed(1)
    : "0";
  const avgStorytelling = data.length > 0
    ? (data.reduce((sum, a) => sum + (a.storytelling_score || 0), 0) / data.length).toFixed(1)
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

  // Chart data - use filtered data
  const lineChartData = data.slice(0, 10).reverse().map((a) => ({
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

  const recentScoresData = data.slice(0, 5).reverse().map((a, index) => ({
    name: `#${data.length - index}`,
    score: a.overall_score || 0,
    color: index % 2 === 0 ? COLORS.gravitas : "#EF4444",
  }));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
            <span className="font-bold text-3xl text-gray-900">EP</span>
            <span className="font-bold text-3xl text-[#C4A84D]">Quotient</span>
          </div>
          
          <div className="flex items-center gap-4">
            {userPlan && (
              <button
                onClick={() => navigate("/pricing")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_hsl(38_92%_50%/0.5),0_0_40px_hsl(38_92%_50%/0.3)] hover:border-[#C4A84D] ${
                  userPlan === "pro"
                    ? "bg-gradient-to-r from-[#D4AF37]/20 to-[#B8973B]/20 border-[#D4AF37] text-[#D4AF37]"
                    : userPlan === "basic"
                    ? "bg-[#C4A84D]/10 border-[#C4A84D] text-[#C4A84D]"
                    : "bg-[#C4A84D]/10 border-[#C4A84D] text-[#C4A84D]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4A84D]"></span>
                <span className="text-xs font-bold uppercase">{userPlan === "free_trial" ? "FREE TRIAL" : userPlan}</span>
                {userPlan === "pro" && <span className="text-[10px]">∞</span>}
                {userPlan === "basic" && <span className="text-[10px]">{assessments.length}/7</span>}
                {userPlan === "free_trial" && <span className="text-[10px]">{assessments.length}/1</span>}
              </button>
            )}
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

        {/* Navigation - 3cm gap from logo */}
        <div className="container mx-auto px-6 pb-4 mt-8">
          <div className="flex gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.path)}
                className={cn(
                  "flex items-center gap-3 py-2 px-3 text-left transition-all duration-300 rounded-lg border border-transparent hover:border-[#C4A84D] hover:shadow-[0_0_20px_hsl(38_92%_50%/0.5),0_0_40px_hsl(38_92%_50%/0.3)] cursor-pointer",
                  activeNav === item.id ? "text-[#C4A84D] border-[#C4A84D]/30" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-gray-600 border-gray-200">
                  <span>
                    {timeFilter === "all" && "All Time"}
                    {timeFilter === "7days" && "Last 7 Days"}
                    {timeFilter === "30days" && "Last 30 Days"}
                    {timeFilter === "90days" && "Last 90 Days"}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={() => setTimeFilter("all")}>
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("7days")}>
                  Last 7 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("30days")}>
                  Last 30 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("90days")}>
                  Last 90 Days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              className="text-[#C4A84D] border-[#C4A84D]/30 hover:bg-[#C4A84D]/5"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              {refreshing ? "Refreshing..." : "Refresh"}
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

        {/* Stats Cards - 6 KPIs */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#C4A84D]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#C4A84D]" />
              </div>
              <span className="text-sm text-gray-500">Latest Score</span>
            </div>
            <p className="text-3xl font-light text-[#C4A84D]">{latestScore?.toFixed(1) || "0.0"}</p>
            <div className="flex items-center gap-1 mt-2 text-xs">
              {parseFloat(scoreChange) < 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-red-500">{scoreChange}%</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">+{scoreChange}%</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm text-gray-500">Best Score</span>
            </div>
            <p className="text-3xl font-light text-cyan-500">{bestScore}</p>
            <p className="text-xs text-gray-400 mt-2">Personal best</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#C4A84D]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#C4A84D]" />
              </div>
              <span className="text-sm text-gray-500">Gravitas</span>
            </div>
            <p className="text-3xl font-light text-[#C4A84D]">{avgGravitas}</p>
            <p className="text-xs text-gray-400 mt-2">Avg score</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-gray-500">Communication</span>
            </div>
            <p className="text-3xl font-light text-purple-500">{avgCommunication}</p>
            <p className="text-xs text-gray-400 mt-2">Avg score</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">Presence</span>
            </div>
            <p className="text-3xl font-light text-emerald-500">{avgPresence}</p>
            <p className="text-xs text-gray-400 mt-2">Avg score</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-sm text-gray-500">Storytelling</span>
            </div>
            <p className="text-3xl font-light text-orange-500">{avgStorytelling}</p>
            <p className="text-xs text-gray-400 mt-2">Avg score</p>
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
                  <Tooltip content={<CustomTooltip />} />
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="40%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => value.toFixed(1)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Scores */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent <span className="text-[#C4A84D]">Scores</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentScoresData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip 
                    formatter={(value: number) => value.toFixed(1)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelFormatter={(label) => `Assessment ${label}`}
                  />
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

      </main>
    </div>
  );
}
