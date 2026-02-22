import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

// Use any for cross-browser SpeechRecognition compatibility

const WAKE_WORDS = ["hey ivy", "ivy", "আইভি", "আইভী", "আইবি"];

export const useVoiceAssistant = () => {
  const navigate = useNavigate();

  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isProcessingRef = useRef(false);

  const speak = useCallback(async (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    await new Promise((r) => setTimeout(r, 150));

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => {
      setState("listening");
      startListeningInternal();
    };
    utterance.onerror = () => {
      setState("idle");
    };

    synthRef.current.speak(utterance);
  }, []);

  const detectWakeWord = (text: string) => {
    const lower = text.toLowerCase();
    for (const word of WAKE_WORDS) {
      if (lower.includes(word)) {
        return lower.replace(word, "").trim();
      }
    }
    return null;
  };

  const handleLocalCommand = useCallback(async (command: string) => {
    const routes: Record<string, { path: string; label: string }> = {
      "open tasks": { path: "/tasks", label: "Opening tasks page" },
      "open settings": { path: "/settings", label: "Opening settings" },
      "open analysis": { path: "/history", label: "Opening analysis history" },
      "open history": { path: "/history", label: "Opening analysis history" },
      "open recommendations": { path: "/recommendations", label: "Opening recommendations" },
      "open trends": { path: "/trends", label: "Opening trends" },
      "open compare": { path: "/compare", label: "Opening comparison" },
      "go home": { path: "/", label: "Going home" },
    };

    for (const [trigger, { path, label }] of Object.entries(routes)) {
      if (command.includes(trigger)) {
        navigate(path);
        await speak(label);
        return true;
      }
    }

    if (command.includes("take photo") || command.includes("ছবি তোলো")) {
      navigate("/");
      await speak("Ready to take photo. Please use the camera button.");
      return true;
    }

    if (command.includes("logout") || command.includes("লগআউট")) {
      await supabase.auth.signOut();
      await speak("Logged out successfully");
      return true;
    }

    return false;
  }, [navigate, speak]);

  const callAI = useCallback(async (text: string) => {
    setState("processing");
    isProcessingRef.current = true;
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use voice assistant");
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_text: text }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process request");
      }

      const data = await res.json();
      setResponse(data.response);
      await speak(data.response);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      setState("idle");
    } finally {
      isProcessingRef.current = false;
    }
  }, [speak]);

  const startListeningInternal = useCallback(() => {
    if (isProcessingRef.current) return;

    // Abort previous
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    setTimeout(() => {
      try {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
          setError("Speech Recognition এই ব্রাউজারে সাপোর্ট করে না।");
          return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.lang = "bn-BD";

        recognition.onstart = () => {
          setState("listening");
        };

        recognition.onresult = async (event: any) => {
          const text = event.results[event.results.length - 1][0].transcript;
          setTranscript(text);

          const command = detectWakeWord(text);
          if (!command) return;

          recognition.stop();

          const handled = await handleLocalCommand(command);
          if (!handled) {
            await callAI(command);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setError("মাইক্রোফোন অনুমতি দিন।");
          } else if (event.error === "aborted" || event.error === "no-speech") {
            // Silent
          } else {
            setError(`স্পিচ রেকগনিশন সমস্যা: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (!isProcessingRef.current) {
            setTimeout(startListeningInternal, 500);
          }
        };

        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setError("স্পিচ রেকগনিশন শুরু করা যাচ্ছে না।");
        setState("idle");
      }
    }, 150);
  }, [handleLocalCommand, callAI]);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    startListeningInternal();

    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, [startListeningInternal]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    isProcessingRef.current = true; // prevent auto-restart
    setState("idle");
  }, []);

  const startListening = useCallback(() => {
    isProcessingRef.current = false;
    startListeningInternal();
  }, [startListeningInternal]);

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
    isSupported: true,
    startListening,
    stopListening,
    reset,
  };
};
