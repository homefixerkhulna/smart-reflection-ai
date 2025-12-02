import { useState } from "react";
import { Mic, MicOff, X, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { cn } from "@/lib/utils";

export const VoiceAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    state,
    transcript,
    response,
    error,
    isSupported,
    startListening,
    stopListening,
    reset,
  } = useVoiceAssistant();

  const handleMicClick = () => {
    if (state === "listening") {
      stopListening();
    } else if (state === "idle") {
      setIsExpanded(true);
      startListening();
    }
  };

  const handleClose = () => {
    reset();
    setIsExpanded(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="glass rounded-2xl p-4 w-80 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Voice Assistant</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {state === "listening" && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Listening...
              </>
            )}
            {state === "processing" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </>
            )}
            {state === "speaking" && (
              <>
                <Volume2 className="h-3 w-3 animate-pulse" />
                Speaking...
              </>
            )}
            {state === "idle" && "Tap the mic to speak"}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">You said:</p>
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Assistant:</p>
              <p className="text-sm text-foreground">{response}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Mic Button */}
      <Button
        size="lg"
        onClick={handleMicClick}
        disabled={state === "processing" || state === "speaking"}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          state === "listening" && "bg-destructive hover:bg-destructive/90 animate-pulse",
          state === "processing" && "bg-muted cursor-wait",
          state === "speaking" && "bg-primary/80",
          state === "idle" && "bg-primary hover:bg-primary/90"
        )}
      >
        {state === "listening" ? (
          <MicOff className="h-6 w-6" />
        ) : state === "processing" ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : state === "speaking" ? (
          <Volume2 className="h-6 w-6 animate-pulse" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};
