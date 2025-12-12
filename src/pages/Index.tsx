import { useState, useEffect } from "react";
import { Settings, LogOut, ListTodo } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
const Index = () => {
  const {
    signOut,
    user
  } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const {
    todayTasks,
    markComplete,
    markPending
  } = useTasks();
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;
      const {
        data
      } = await supabase.from('skin_analyses').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (data) setAnalyses(data);
    };
    fetchAnalyses();

    // Real-time subscription for new analyses
    const channel = supabase.channel('skin-analyses-realtime').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'skin_analyses',
      filter: `user_id=eq.${user?.id}`
    }, payload => {
      setAnalyses(prev => [payload.new as any, ...prev]);
    }).on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'skin_analyses',
      filter: `user_id=eq.${user?.id}`
    }, payload => {
      setAnalyses(prev => prev.filter(a => a.id !== payload.old.id));
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  return <div className="min-h-screen bg-background p-8">
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

        {/* Center Column */}
        <div className="flex flex-col justify-center space-y-8">
          <Compliments />
          <DermatologyModule />
        </div>

        {/* Right Column */}
        <div className="space-y-8 pt-32">
          <News className="text-primary-foreground" />
          
          {/* Today's Schedule */}
          <TodaySchedule tasks={todayTasks} onMarkComplete={markComplete} onMarkPending={markPending} />
        </div>
      </div>

      {/* Dermatology Chat Assistant */}
      <DermatologyChat analyses={analyses} />
    </div>;
};
export default Index;