import { useState, useEffect } from "react";
import { VOICE_COMMANDS } from "@/hooks/useVoiceAssistant";
import { Settings, LogOut, ListTodo, Mic, MicOff, Loader2, Volume2, X, HelpCircle } from "lucide-react";
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
import WaveformVisualizer from "@/components/WaveformVisualizer";
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
    showHelp,
    setShowHelp,
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
            <div className="w-full h-[380px] relative">
              <Avatar3D
                isListening={voiceState === "listening"}
                isSpeaking={voiceState === "speaking"}
                isThinking={voiceState === "processing"}
                glbUrl={avatarModelUrl}
              />
            </div>
          )}

          {/* Mic Button — directly below avatar */}
          {voiceSupported && (
            <div className="flex flex-col items-center gap-2 mt-2">
              {/* Waveform + Mic container */}
              <div className="relative flex items-center justify-center" style={{ width: 152, height: 152 }}>
                {/* Waveform ring */}
                <WaveformVisualizer
                  isActive={voiceState === "listening"}
                  barCount={36}
                  radius={48}
                  color="hsl(var(--destructive))"
                />
                {/* Glow ring */}
                <div className={cn(
                  "relative z-10 rounded-full p-1 transition-all duration-500",
                  voiceState === "listening" && "shadow-[0_0_24px_4px_hsl(var(--destructive)/0.5)]",
                  voiceState === "speaking" && "shadow-[0_0_24px_4px_hsl(var(--primary)/0.4)]",
                  voiceState === "processing" && "shadow-[0_0_16px_2px_hsl(var(--muted-foreground)/0.3)]",
                )}>
                  <Button
                    size="lg"
                    onClick={handleMicClick}
                    disabled={voiceState === "processing" || voiceState === "speaking"}
                    className={cn(
                      "h-16 w-16 rounded-full shadow-xl transition-all duration-300",
                      voiceState === "listening" && "bg-destructive hover:bg-destructive/90 scale-110",
                      voiceState === "processing" && "bg-muted cursor-wait",
                      voiceState === "speaking" && "bg-primary/80 animate-bounce",
                      voiceState === "idle" && "bg-primary hover:bg-primary/90 hover:scale-105"
                    )}
                  >
                    {voiceState === "listening" ? (
                      <MicOff className="h-7 w-7" />
                    ) : voiceState === "processing" ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : voiceState === "speaking" ? (
                      <Volume2 className="h-7 w-7 animate-pulse" />
                    ) : (
                      <Mic className="h-7 w-7" />
                    )}
                  </Button>
                </div>
              </div>
              <span className="text-xs text-muted-foreground animate-in fade-in">
                {voiceState === "listening" && "🎙️ শুনছি..."}
                {voiceState === "processing" && "⏳ প্রক্রিয়াকরণ..."}
                {voiceState === "speaking" && "🔊 বলছি..."}
                {voiceState === "idle" && "মাইক ট্যাপ করুন"}
              </span>
            </div>
          )}

          {/* Voice transcript/response panel */}
          {(transcript || voiceResponse || voiceError) && (
            <div className="w-full mt-3 glass rounded-2xl p-4 space-y-2 max-h-36 overflow-y-auto animate-in slide-in-from-bottom-2 duration-300">
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

          {/* Modules below */}
          <div className="w-full mt-4 space-y-3">
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

      {/* Voice Command Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl border border-border/50 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 rounded-full"
              onClick={() => setShowHelp(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              ভয়েস কমান্ড সমূহ
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              "আইভি" বলে যেকোনো কমান্ড দিন
            </p>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {VOICE_COMMANDS.map((cmd, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{cmd.labelBn}</p>
                    <p className="text-xs text-muted-foreground">{cmd.labelEn}</p>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono bg-background/50 rounded-lg px-2 py-1">
                    "{cmd.triggers[0]}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help button (bottom-left) */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-6 left-6 z-40 glass rounded-full"
        onClick={() => setShowHelp(true)}
        title="ভয়েস কমান্ড হেল্প"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default Index;
