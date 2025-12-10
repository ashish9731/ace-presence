import { useState, useRef, useCallback, useEffect } from "react";
import { Video, Square, Play, RotateCcw, Pause, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoRecorderProps {
  onVideoRecorded: (file: File) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onVideoRecorded, onCancel }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_DURATION = 300; // 5 minutes max
  const RECOMMENDED_DURATION = 180; // 3 minutes recommended

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      setError("Unable to access camera. Please allow camera and microphone permissions.");
    }
  };

  useEffect(() => {
    startCamera();
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration(prev => {
        if (prev >= MAX_DURATION) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [isRecording]);

  const retakeRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    startCamera();
  }, []);

  const handleUseRecording = useCallback(() => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'video/webm'
      });
      onVideoRecorded(file);
    }
  }, [recordedBlob, onVideoRecorded]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (duration >= MAX_DURATION - 30) return "text-destructive";
    if (duration >= RECOMMENDED_DURATION) return "text-warning";
    return "text-foreground";
  };

  if (hasPermission === false) {
    return (
      <div className="w-full space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={onCancel} variant="outline" className="w-full">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Video Preview */}
      <div className="relative aspect-video bg-primary/5 rounded-xl overflow-hidden border border-border">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "w-full h-full object-cover",
            recordedUrl && "hidden"
          )}
        />
        
        {recordedUrl && (
          <video
            src={recordedUrl}
            controls
            className="w-full h-full object-contain"
          />
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-destructive/90 text-destructive-foreground rounded-full text-sm font-medium">
            <div className={cn(
              "w-2 h-2 rounded-full bg-white",
              !isPaused && "animate-pulse"
            )} />
            {isPaused ? "PAUSED" : "REC"}
          </div>
        )}

        {/* Timer */}
        {(isRecording || recordedBlob) && (
          <div className={cn(
            "absolute top-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-sm font-mono font-medium",
            getTimeColor()
          )}>
            {formatTime(duration)} / {formatTime(RECOMMENDED_DURATION)}
          </div>
        )}

        {/* Face/Torso Guide - only show before recording */}
        {!isRecording && !recordedBlob && hasPermission && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-64 border-2 border-dashed border-accent/50 rounded-[40%] opacity-60" />
          </div>
        )}
      </div>

      {/* Duration Progress */}
      {isRecording && (
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                duration >= RECOMMENDED_DURATION ? "bg-success" : "bg-accent"
              )}
              style={{ width: `${Math.min((duration / RECOMMENDED_DURATION) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {duration < RECOMMENDED_DURATION 
              ? `${formatTime(RECOMMENDED_DURATION - duration)} until recommended duration`
              : "Great! You've reached the recommended 3-minute mark"}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording && !recordedBlob && (
          <>
            <Button
              onClick={onCancel}
              variant="outline"
              className="h-12 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={startRecording}
              className="h-14 px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={!hasPermission}
            >
              <div className="w-4 h-4 rounded-full bg-white mr-2" />
              Start Recording
            </Button>
          </>
        )}

        {isRecording && (
          <>
            <Button
              onClick={pauseRecording}
              variant="outline"
              className="h-12 px-6"
            >
              {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              onClick={stopRecording}
              className="h-14 px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              Stop Recording
            </Button>
          </>
        )}

        {recordedBlob && (
          <>
            <Button
              onClick={retakeRecording}
              variant="outline"
              className="h-12 px-6"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={handleUseRecording}
              className="h-14 px-8"
            >
              <Video className="w-4 h-4 mr-2" />
              Use This Recording
            </Button>
          </>
        )}
      </div>

      {/* Tips */}
      <div className="text-center p-4 bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">
          {!isRecording && !recordedBlob && "Position yourself with your face and upper torso visible. Speak clearly to the camera."}
          {isRecording && !isPaused && "Speak naturally. Cover your intro, key initiative, and a leadership story."}
          {isRecording && isPaused && "Recording paused. Click Resume when you're ready to continue."}
          {recordedBlob && `Recording complete: ${formatTime(duration)}. Review and use this recording, or retake.`}
        </p>
      </div>
    </div>
  );
}
