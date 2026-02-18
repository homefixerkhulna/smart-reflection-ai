import { useState, useEffect } from "react";
import { Settings, LogOut, ListTodo, Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock } from "@/components/modules/Clock";
import { Weather } from "@/components/modules/Weather";
import { Calendar } from "@/components/modules/Calendar";
import { News } from "@/components/modules/News";
import { Compliments } from "@/components/modules/Compliments";
import { DermatologyModule } from "@/components/modules/DermatologyModule";
import { DermatologyChat } from "@/components/DermatologyChat";
import { TodaySchedule } from "@/components/modules/tasks/TodaySchedule";
import { useTasks } from "@/components/modules/tasks/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { supabase } from "@/integrations/supabase/client";
import Avatar3D from "@/components/Avatar3D";
import { cn } from "@/lib/utils";

const AVATAR_MODELS = [
  { id: "default", label: "Default Avatar", url: "/698bdd8efcad0d2f33536b28.glb" },
  { id: "model1", label: "Model 1", url: "/model.glb" },
  { id: "model2", label: "Model 2", url: "/model (1).glb" },
  { id: "animation", label: "Animated", url: "/animation.glb" },
];

const Index = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const { todayTasks, markComplete, markPending } = useTasks();
  const [showAvatar, setShowAvatar] = useState(true);

  // Load avatar model preference from localStorage
  const [avatarModelUrl, setAvatarModelUrl] = useState(() => {
    return localStorage.getItem("hfd_avatar_model") || AVATAR_MODELS[0].url;
  });

  // Voice assistant integration
  const {
    state: voiceState,
    transcript,
    response: voiceResponse,
    error: voiceError,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    reset: resetVoice,
  } = useVoiceAssistant();

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("skin_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setAnalyses(data);
    };
    fetchAnalyses();

    const channel = supabase
      .channel("skin-analyses-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "skin_analyses",
        filter: `user_id=eq.${user?.id}`,
      }, (payload) => {
        setAnalyses((prev) => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "skin_analyses",
        filter: `user_id=eq.${user?.id}`,
      }, (payload) => {
        setAnalyses((prev) => prev.filter((a) => a.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Listen for avatar model changes from Settings
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "hfd_avatar_model" && e.newValue) {
        setAvatarModelUrl(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleMicClick = () => {
    if (voiceState === "listening") {
      stopListening();
    } else if (voiceState === "idle") {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 relative">
      {/* Header */}
      <header className="absolute top-8 right-8 z-10 flex gap-2">
        <Button variant="ghost" size="icon" className="glass rounded-full" onClick={() => navigate("/tasks")} title="Tasks">
          <ListTodo className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="glass rounded-full" onClick={() => navigate("/settings")}>
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="glass rounded-full" onClick={signOut}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Grid Layout */}
      <div className="h-screen grid grid-cols-3 gap-8 max-w-[1920px] mx-auto">
        {/* Left Column */}
        <div className="space-y-8">
          <Clock />
          <Weather />
          <Calendar />
        </div>

        {/* Center Column — Avatar + Voice */}
        <div className="flex flex-col items-center justify-center relative">
          {/* 3D Avatar */}
          {showAvatar && (
            <div className="w-full h-[420px] relative">
              <Avatar3D
                isListening={voiceState === "listening"}
                isSpeaking={voiceState === "speaking"}
                isThinking={voiceState === "processing"}
                glbUrl={avatarModelUrl}
              />
            </div>
          )}

          {/* Voice interaction panel */}
          <div className="w-full mt-4 space-y-3">
            {/* Transcript / Response */}
            {(transcript || voiceResponse || voiceError) && (
              <div className="glass rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
                {transcript && (
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">আপনি বললেন:</p>
                    <p className="text-sm">{transcript}</p>
                  </div>
                )}
                {voiceResponse && (
                  <div className="bg-primary/10 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground">সহকারী:</p>
                    <p className="text-sm">{voiceResponse}</p>
                  </div>
                )}
                {voiceError && (
                  <p className="text-sm text-destructive">{voiceError}</p>
                )}
              </div>
            )}

            {/* Status + Mic button */}
            {voiceSupported && (
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {voiceState === "listening" && "🎙️ শুনছি..."}
                  {voiceState === "processing" && "⏳ প্রক্রিয়াকরণ..."}
                  {voiceState === "speaking" && "🔊 বলছি..."}
                  {voiceState === "idle" && "মাইক ট্যাপ করুন"}
                </span>
                <Button
                  size="lg"
                  onClick={handleMicClick}
                  disabled={voiceState === "processing" || voiceState === "speaking"}
                  className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-all",
                    voiceState === "listening" && "bg-destructive hover:bg-destructive/90 animate-pulse",
                    voiceState === "processing" && "bg-muted cursor-wait",
                    voiceState === "speaking" && "bg-primary/80",
                    voiceState === "idle" && "bg-primary hover:bg-primary/90"
                  )}
                >
                  {voiceState === "listening" ? (
                    <MicOff className="h-6 w-6" />
                  ) : voiceState === "processing" ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : voiceState === "speaking" ? (
                    <Volume2 className="h-6 w-6 animate-pulse" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </div>
            )}

            {/* Modules below avatar */}
            <Compliments />
            <DermatologyModule />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8 pt-32">
          <News className="text-primary-foreground" />
          <TodaySchedule tasks={todayTasks} onMarkComplete={markComplete} onMarkPending={markPending} />
        </div>
      </div>

      {/* Dermatology Chat Assistant */}
      <DermatologyChat analyses={analyses} />
    </div>
  );
};

export default Index;
