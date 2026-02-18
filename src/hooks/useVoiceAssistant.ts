import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useVoiceAssistant = () => {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI || !window.speechSynthesis) {
      setIsSupported(false);
      setError("Voice features not supported in this browser. Try Chrome or Edge.");
      return;
    }
    synthRef.current = window.speechSynthesis;
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    
    synthRef.current.speak(utterance);
  }, []);

  const processWithAI = useCallback(async (userText: string) => {
    setState("processing");
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use voice assistant");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_text: userText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      const data = await response.json();
      setResponse(data.response);
      speak(data.response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setState("idle");
    }
  }, [speak]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    
    setError(null);
    setTranscript("");

    // Stop any previous instance first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    // Cancel any ongoing speech synthesis
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    // Small delay to let Chrome release the previous recognition session
    setTimeout(() => {
      try {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
          setError("Speech Recognition এই ব্রাউজারে সাপোর্ট করে না।");
          return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setState("listening");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);

          if (finalTranscript) {
            processWithAI(finalTranscript);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setError("মাইক্রোফোন অনুমতি দিন। ব্রাউজারের অ্যাড্রেস বারে 🔒 আইকনে ক্লিক করুন।");
          } else if (event.error === "aborted" || event.error === "no-speech") {
            // Silently handle — not a real error
          } else {
            setError(`স্পিচ রেকগনিশন সমস্যা: ${event.error}। আবার চেষ্টা করুন।`);
          }
          setState("idle");
        };

        recognition.onend = () => {
          // Only reset to idle if we're still in listening state
          setState((prev) => prev === "listening" ? "idle" : prev);
        };

        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setError("স্পিচ রেকগনিশন শুরু করা যাচ্ছে না। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।");
        setState("idle");
      }
    }, 150);
  }, [isSupported, processWithAI]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setState("idle");
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setTranscript("");
    setResponse("");
    setError(null);
  }, [stopListening]);

  return {
    state,
    transcript,
    response,
    error,
    isSupported,
    startListening,
    stopListening,
    reset,
  };
};
