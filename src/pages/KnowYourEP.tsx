import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, User, Target, Film, Camera, Upload } from "lucide-react";
import { VideoRecorder } from "@/components/VideoRecorder";
import { VideoUpload } from "@/components/VideoUpload";

export default function KnowYourEP() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"select" | "record" | "upload">("select");

  const handleVideoRecorded = (file: File) => {
    console.log("Video recorded:", file);
    setMode("select");
  };

  const handleVideoSelect = (file: File) => {
    console.log("Video selected:", file);
    setMode("select");
  };

  if (mode === "record") {
    return <VideoRecorder onVideoRecorded={handleVideoRecorded} onCancel={() => setMode("select")} />;
  }

  if (mode === "upload") {
    return <VideoUpload onVideoSelect={handleVideoSelect} isUploading={false} />;
  }

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
