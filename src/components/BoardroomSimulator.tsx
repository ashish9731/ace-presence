import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, RotateCcw, ChevronRight, Download, Crown, Timer, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreRing } from "./ScoreRing";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Scenario {
  id: string;
  title: string;
  category: string;
  difficulty: "Medium" | "Hard" | "Expert";
  question: string;
  context: string;
  timeLimit: number;
}

interface ScenarioResult {
  scenarioId: string;
  transcript: string;
  score: number;
  analysis: {
    commanding_presence: { score: number; feedback: string };
    strategic_thinking: { score: number; feedback: string };
    composure: { score: number; feedback: string };
    decisiveness: { score: number; feedback: string };
    stakeholder_management: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  duration: number;
}

const BOARDROOM_SCENARIOS: Scenario[] = [
  {
    id: "crisis-1",
    title: "Budget Shortfall Crisis",
    category: "Crisis Management",
    difficulty: "Hard",
    question: "You're presenting Q3 results to the board when the CFO interrupts: 'We've just discovered a $2M budget shortfall due to an accounting error. The press is calling for a statement in 30 minutes.' How do you respond?",
    context: "You're the CEO in a board meeting with investors, board members, and senior executives present.",
    timeLimit: 120,
  },
  {
    id: "conflict-1",
    title: "Executive Conflict Resolution",
    category: "Leadership",
    difficulty: "Hard",
    question: "Your two top VPs are in a heated disagreement about resource allocation. One wants to expand sales, the other wants R&D investment. Both threaten to resign if they don't get their way. How do you handle this?",
    context: "Private meeting with both VPs. Company morale depends on resolving this quickly.",
    timeLimit: 90,
  },
  {
    id: "investor-1",
    title: "Hostile Investor Question",
    category: "Investor Relations",
    difficulty: "Expert",
    question: "An activist investor publicly challenges you: 'Your stock has underperformed for 3 years. Why shouldn't we replace the entire executive team?' The room goes silent.",
    context: "Annual shareholder meeting with media present.",
    timeLimit: 90,
  },
  {
    id: "ethics-1",
    title: "Ethical Dilemma",
    category: "Ethics & Values",
    difficulty: "Expert",
    question: "You discover your largest client is using your product in a way that violates your company's values, though not technically illegal. Dropping them means losing 30% of revenue. What's your decision?",
    context: "Emergency board meeting. Legal says you're protected, but PR is concerned about reputation.",
    timeLimit: 120,
  },
  {
    id: "change-1",
    title: "Workforce Restructuring",
    category: "Change Management",
    difficulty: "Medium",
    question: "You need to announce a 15% workforce reduction to achieve profitability. Your leadership team is present and rumors are already spreading. How do you frame this decision?",
    context: "All-hands leadership meeting, 50 senior managers present.",
    timeLimit: 120,
  },
  {
    id: "strategy-1",
    title: "Strategic Pivot Defense",
    category: "Strategy",
    difficulty: "Hard",
    question: "The board questions your decision to pivot from your core product that's still profitable. A board member asks: 'Why are we cannibalizing ourselves when competitors haven't caught up yet?'",
    context: "Strategic planning session with board of directors.",
    timeLimit: 90,
  },
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Medium": return "bg-accent/20 text-accent";
    case "Hard": return "bg-warning/20 text-warning";
    case "Expert": return "bg-destructive/20 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

export function BoardroomSimulator() {
  const { user } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepTime, setPrepTime] = useState(10);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<ScenarioResult[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPreparing && prepTime > 0) {
      timer = setInterval(() => {
        setPrepTime((t) => t - 1);
      }, 1000);
    } else if (isPreparing && prepTime === 0) {
      setIsPreparing(false);
      startRecording();
    }
    return () => clearInterval(timer);
  }, [isPreparing, prepTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && selectedScenario) {
      timer = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= selectedScenario.timeLimit) {
            stopRecording();
            return t;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, selectedScenario]);

  const startScenario = async (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setResult(null);
    setPrepTime(10);
    setRecordingTime(0);
    setIsPreparing(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await analyzeResponse(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const analyzeResponse = async (audioBlob: Blob) => {
    if (!selectedScenario || !user) return;
    
    setIsAnalyzing(true);
    
    try {
      // Upload audio for transcription with user-specific folder
      const fileName = `${user.id}/boardroom-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, audioBlob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Call analysis edge function
      const response = await supabase.functions.invoke("analyze-boardroom", {
        body: {
          audioPath: fileName,
          scenario: selectedScenario,
          duration: recordingTime,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const analysisResult: ScenarioResult = response.data;
      setResult(analysisResult);
      setCompletedScenarios(prev => [...prev, analysisResult]);
      
      toast.success("Analysis complete!", {
        description: `You scored ${Math.round(analysisResult.score)}/100`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScenario = () => {
    setSelectedScenario(null);
    setResult(null);
    setIsRecording(false);
    setIsPreparing(false);
    setPrepTime(10);
    setRecordingTime(0);
  };

  const generateBoardroomPDF = () => {
    if (completedScenarios.length === 0) {
      toast.error("No completed scenarios to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors (typed as tuples for jsPDF)
    const primaryColor: [number, number, number] = [147, 51, 234];
    const successColor: [number, number, number] = [40, 167, 69];
    const accentColor: [number, number, number] = [59, 130, 246];
    const warningColor: [number, number, number] = [245, 158, 11];

    // ===== PAGE 1: Cover & Executive Summary =====
    
    // Header gradient
    doc.setFillColor(147, 51, 234);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text("Boardroom Simulator", pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(14);
    doc.text("Executive Performance Report", pageWidth / 2, 38, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 48, { align: "center" });

    // Overall Performance Score
    const avgScore = completedScenarios.reduce((sum, r) => sum + r.score, 0) / completedScenarios.length;
    
    let yPos = 70;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("OVERALL PERFORMANCE", pageWidth / 2, yPos, { align: "center" });
    
    // Large score
    doc.setFontSize(50);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${Math.round(avgScore)}`, pageWidth / 2, yPos + 30, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(150, 150, 150);
    doc.text("/100", pageWidth / 2 + 30, yPos + 30);

    // Performance level
    const level = avgScore >= 80 ? "Executive Ready" : avgScore >= 60 ? "Developing Leader" : "Emerging";
    doc.setFontSize(12);
    doc.setTextColor(avgScore >= 70 ? successColor[0] : warningColor[0], avgScore >= 70 ? successColor[1] : warningColor[1], avgScore >= 70 ? successColor[2] : warningColor[2]);
    doc.text(level, pageWidth / 2, yPos + 42, { align: "center" });

    yPos += 60;

    // Summary Stats Boxes
    const boxWidth = 50;
    const boxHeight = 25;
    const startX = (pageWidth - (boxWidth * 3 + 20)) / 2;

    // Scenarios completed
    doc.setFillColor(240, 240, 255);
    doc.roundedRect(startX, yPos, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${completedScenarios.length}`, startX + boxWidth / 2, yPos + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Scenarios', startX + boxWidth / 2, yPos + 20, { align: 'center' });

    // Highest score
    const highestScore = Math.max(...completedScenarios.map(r => r.score));
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(startX + boxWidth + 10, yPos, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(18);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text(`${Math.round(highestScore)}`, startX + boxWidth + 10 + boxWidth / 2, yPos + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Highest', startX + boxWidth + 10 + boxWidth / 2, yPos + 20, { align: 'center' });

    // Total time
    const totalTime = completedScenarios.reduce((sum, r) => sum + r.duration, 0);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(startX + (boxWidth + 10) * 2, yPos, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(18);
    doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
    doc.text(`${Math.floor(totalTime / 60)}m`, startX + (boxWidth + 10) * 2 + boxWidth / 2, yPos + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Total Time', startX + (boxWidth + 10) * 2 + boxWidth / 2, yPos + 20, { align: 'center' });

    yPos += 40;

    // Scenarios Summary Table
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("SCENARIOS OVERVIEW", 20, yPos);

    const tableData = completedScenarios.map(r => {
      const scenario = BOARDROOM_SCENARIOS.find(s => s.id === r.scenarioId);
      return [
        scenario?.title || 'Unknown',
        scenario?.category || '-',
        scenario?.difficulty || '-',
        `${Math.round(r.score)}/100`,
        `${Math.floor(r.duration / 60)}:${(r.duration % 60).toString().padStart(2, '0')}`
      ];
    });

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Scenario', 'Category', 'Difficulty', 'Score', 'Duration']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: primaryColor },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
    });

    // ===== DETAILED SCENARIO PAGES =====
    completedScenarios.forEach((result, index) => {
      doc.addPage();
      const scenario = BOARDROOM_SCENARIOS.find(s => s.id === result.scenarioId);
      
      // Scenario Header
      const diffColor: [number, number, number] = scenario?.difficulty === "Expert" ? [220, 53, 69] : 
                        scenario?.difficulty === "Hard" ? [245, 158, 11] : [59, 130, 246];
      
      doc.setFillColor(diffColor[0], diffColor[1], diffColor[2]);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(scenario?.title || "Scenario", 20, 15);
      doc.setFontSize(10);
      doc.text(`${scenario?.category} | ${scenario?.difficulty} | Score: ${Math.round(result.score)}/100`, 20, 27);
      
      yPos = 50;

      // The Challenge
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(15, yPos - 5, pageWidth - 30, 30, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("THE CHALLENGE:", 20, yPos + 3);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const challengeLines = doc.splitTextToSize(scenario?.question || "", pageWidth - 45);
      doc.text(challengeLines.slice(0, 3), 20, yPos + 12);

      yPos += 40;

      // Analysis Breakdown Table
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("ANALYSIS BREAKDOWN", 20, yPos);

      const analysisData = Object.entries(result.analysis).map(([key, data]) => [
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        `${Math.round(data.score)}/100`,
        data.feedback.substring(0, 80) + (data.feedback.length > 80 ? '...' : '')
      ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Dimension', 'Score', 'Feedback']],
        body: analysisData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: diffColor },
        alternateRowStyles: { fillColor: [250, 250, 255] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 20 },
          2: { cellWidth: 'auto' },
        },
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 60;

      // Strengths & Improvements
      if (yPos < pageHeight - 80) {
        // Strengths
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(15, yPos, (pageWidth - 35) / 2, 50, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(successColor[0], successColor[1], successColor[2]);
        doc.text("STRENGTHS", 20, yPos + 10);
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        result.strengths.slice(0, 3).forEach((s, i) => {
          const lines = doc.splitTextToSize(`✓ ${s}`, (pageWidth - 50) / 2);
          doc.text(lines[0], 20, yPos + 20 + (i * 10));
        });

        // Improvements
        const rightX = 15 + (pageWidth - 35) / 2 + 5;
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(rightX, yPos, (pageWidth - 35) / 2, 50, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
        doc.text("AREAS TO IMPROVE", rightX + 5, yPos + 10);
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        result.improvements.slice(0, 3).forEach((s, i) => {
          const lines = doc.splitTextToSize(`→ ${s}`, (pageWidth - 50) / 2);
          doc.text(lines[0], rightX + 5, yPos + 20 + (i * 10));
        });

        yPos += 60;
      }

      // Response Transcript
      if (result.transcript && yPos < pageHeight - 50) {
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("YOUR RESPONSE (Transcript)", 20, yPos);
        
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(15, yPos + 5, pageWidth - 30, 40, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const transcriptLines = doc.splitTextToSize(result.transcript, pageWidth - 40);
        doc.text(transcriptLines.slice(0, 6), 20, yPos + 15);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Scenario ${index + 1} of ${completedScenarios.length}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    });

    // ===== FINAL PAGE: Summary & Recommendations =====
    doc.addPage();
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("SUMMARY & RECOMMENDATIONS", 20, 22);

    yPos = 50;

    // Performance by Dimension
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("AVERAGE SCORES BY DIMENSION", 20, yPos);

    const dimensions = ['commanding_presence', 'strategic_thinking', 'composure', 'decisiveness', 'stakeholder_management'];
    const dimensionScores = dimensions.map(dim => {
      const scores = completedScenarios.map(r => r.analysis[dim as keyof typeof r.analysis]?.score || 0);
      return {
        name: dim.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
      };
    });

    yPos += 10;
    dimensionScores.forEach((dim, i) => {
      const barWidth = 100;
      const barX = 20;
      const barY = yPos + (i * 18);
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(dim.name, barX, barY);
      
      // Background bar
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(barX, barY + 2, barWidth, 8, 2, 2, 'F');
      
      // Score bar
      const scoreWidth = (dim.avgScore / 100) * barWidth;
      const barColor = dim.avgScore >= 70 ? successColor : dim.avgScore >= 50 ? warningColor : [220, 53, 69];
      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      doc.roundedRect(barX, barY + 2, scoreWidth, 8, 2, 2, 'F');
      
      // Score text
      doc.setFontSize(9);
      doc.text(`${Math.round(dim.avgScore)}`, barX + barWidth + 5, barY + 8);
    });

    yPos += dimensions.length * 18 + 20;

    // Top Strengths
    const allStrengths = completedScenarios.flatMap(r => r.strengths);
    if (allStrengths.length > 0) {
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.text("★ YOUR TOP STRENGTHS", 20, yPos + 10);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      [...new Set(allStrengths)].slice(0, 3).forEach((s, i) => {
        doc.text(`• ${s}`, 25, yPos + 20 + (i * 5));
      });
      yPos += 45;
    }

    // Key Areas for Development
    const allImprovements = completedScenarios.flatMap(r => r.improvements);
    if (allImprovements.length > 0) {
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
      doc.text("⚡ PRIORITY DEVELOPMENT AREAS", 20, yPos + 10);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      [...new Set(allImprovements)].slice(0, 3).forEach((s, i) => {
        doc.text(`• ${s}`, 25, yPos + 20 + (i * 5));
      });
    }

    // Disclaimer
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, pageHeight - 30, pageWidth - 30, 18, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("⚠️ DISCLAIMER: This assessment provides AI-powered analysis of your verbal responses to simulated scenarios.", 20, pageHeight - 22);
    doc.text("Use this feedback as one input in your executive presence development journey.", 20, pageHeight - 17);

    doc.save(`Boardroom-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Comprehensive PDF report downloaded!");
  };

  // Scenario Selection View
  if (!selectedScenario) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent text-sm font-medium">
            <Crown className="w-4 h-4" />
            AI-Powered Analysis with Research Backing
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            <span className="text-foreground">Master</span>{" "}
            <span className="text-accent">High-Stakes Situations</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Practice responding to challenging executive scenarios. Speak your response and receive detailed, research-backed feedback on your presence, composure, and strategic thinking.
          </p>
        </div>

        {completedScenarios.length > 0 && (
          <div className="flex justify-center">
            <Button onClick={generateBoardroomPDF} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Progress Report ({completedScenarios.length} scenarios)
            </Button>
          </div>
        )}

        <div className="grid gap-4">
          {BOARDROOM_SCENARIOS.map((scenario) => {
            const completed = completedScenarios.find(r => r.scenarioId === scenario.id);
            
            return (
              <button
                key={scenario.id}
                onClick={() => startScenario(scenario)}
                className={cn(
                  "p-5 border border-border rounded-xl bg-card hover:bg-muted/30 transition-all text-left",
                  "flex items-center justify-between group hover:border-primary/50"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getDifficultyColor(scenario.difficulty))}>
                      {scenario.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">{scenario.category}</span>
                    <span className="text-xs text-muted-foreground">• {scenario.timeLimit}s limit</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{scenario.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{scenario.question}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  {completed && (
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{Math.round(completed.score)}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Recording/Analysis View
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Button onClick={resetScenario} variant="ghost" className="gap-2">
        <RotateCcw className="w-4 h-4" />
        Back to Scenarios
      </Button>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getDifficultyColor(selectedScenario.difficulty))}>
            {selectedScenario.difficulty}
          </span>
          <span className="text-xs text-muted-foreground">{selectedScenario.category}</span>
        </div>
        
        <h2 className="font-display text-xl font-bold text-foreground">
          {selectedScenario.title}
        </h2>
        
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Context:</p>
          <p className="text-sm text-foreground/80">{selectedScenario.context}</p>
        </div>
        
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">The Challenge:</p>
          <p className="text-foreground">{selectedScenario.question}</p>
        </div>
      </div>

      {/* Preparation Timer */}
      {isPreparing && (
        <div className="text-center py-12 space-y-4">
          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
            <span className="text-4xl font-bold text-accent">{prepTime}</span>
          </div>
          <p className="text-lg font-medium text-foreground">Prepare Your Response</p>
          <p className="text-sm text-muted-foreground">Recording starts in {prepTime} seconds</p>
        </div>
      )}

      {/* Recording State */}
      {isRecording && (
        <div className="text-center py-8 space-y-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center mx-auto animate-pulse">
              <Mic className="w-12 h-12 text-destructive" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
              Recording
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-mono font-bold text-foreground">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-muted-foreground">/ {selectedScenario.timeLimit}s</span>
          </div>
          
          <Button onClick={stopRecording} size="lg" className="gap-2">
            <MicOff className="w-5 h-5" />
            Stop Recording
          </Button>
        </div>
      )}

      {/* Analyzing State */}
      {isAnalyzing && (
        <div className="text-center py-12 space-y-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-spin-slow">
            <Crown className="w-12 h-12 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">Analyzing Your Response</p>
          <p className="text-sm text-muted-foreground">Evaluating gravitas, composure, and strategic thinking...</p>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-gradient-card border border-border rounded-2xl p-6 text-center">
            <ScoreRing score={result.score} size="lg" label="Overall Score" />
            <p className="text-sm text-muted-foreground mt-2">
              Response Duration: {Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}
            </p>
          </div>

          {/* Analysis Breakdown */}
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(result.analysis).map(([key, data]) => (
              <div key={key} className="p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  <ScoreRing score={data.score} size="sm" showLabel={false} />
                </div>
                <p className="text-sm text-muted-foreground">{data.feedback}</p>
              </div>
            ))}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
              <h4 className="font-semibold text-success mb-2">Strengths</h4>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-success">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <h4 className="font-semibold text-accent mb-2">Areas to Improve</h4>
              <ul className="space-y-1">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-accent">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={resetScenario} variant="outline" className="gap-2">
              Try Another Scenario
            </Button>
            <Button onClick={() => startScenario(selectedScenario)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Retry This Scenario
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
