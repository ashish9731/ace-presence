import { useState, useRef, useCallback } from "react";
import { Upload, Video, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  isUploading: boolean;
}

export function VideoUpload({ onVideoSelect, isUploading }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload an MP4, MOV, or WebM video file.");
      return false;
    }

    // No file size limit - accept any size
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onVideoSelect(selectedFile);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Instructions Panel */}
      <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-md">
        <h3 className="font-display text-xl font-semibold text-foreground mb-4">
          Recording Guidelines
        </h3>
        <p className="text-muted-foreground mb-4">
          Record a 3-minute video including:
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <span className="font-medium text-foreground">Intro & Role</span>
              <span className="text-muted-foreground"> (30–40 seconds)</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <span className="font-medium text-foreground">Key Initiative</span>
              <span className="text-muted-foreground"> you're leading (60–90 seconds)</span>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <span className="font-medium text-foreground">Leadership Story</span>
              <span className="text-muted-foreground"> about a challenge you overcame (60–90 seconds)</span>
            </div>
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          💡 Position yourself facing the camera with your face and upper torso visible.
        </p>
      </div>

      {/* Upload Area */}
      {!selectedFile ? (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 cursor-pointer",
            dragActive 
              ? "border-accent bg-accent/5 scale-[1.02]" 
              : "border-border hover:border-accent/50 hover:bg-muted/30",
            error && "border-destructive/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              dragActive ? "bg-accent text-accent-foreground scale-110" : "bg-muted text-muted-foreground"
            )}>
              <Upload className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                {dragActive ? "Drop your video here" : "Drag and drop your video"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • MP4, MOV, WebM
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-lg animate-scale-in">
          {/* Video Preview */}
          <div className="relative aspect-video bg-primary/5">
            <video
              src={videoPreview || undefined}
              className="w-full h-full object-contain"
              controls
            />
            <button
              onClick={clearSelection}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* File Info */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-lg animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      {selectedFile && (
        <Button
          onClick={handleSubmit}
          disabled={isUploading}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
        >
          {isUploading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Uploading...
            </span>
          ) : (
            "Start Analysis"
          )}
        </Button>
      )}
    </div>
  );
}
