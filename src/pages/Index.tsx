import { Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock } from "@/components/modules/Clock";
import { Weather } from "@/components/modules/Weather";
import { Calendar } from "@/components/modules/Calendar";
import { News } from "@/components/modules/News";
import { Compliments } from "@/components/modules/Compliments";
import { DermatologyModule } from "@/components/modules/DermatologyModule";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <header className="absolute top-8 right-8 z-10 flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="glass rounded-full"
          onClick={() => navigate("/settings")}
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="glass rounded-full"
          onClick={signOut}
        >
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
          <News />
          
          {/* Quick Stats */}
          <div className="glass rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">System Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Camera</span>
                <span className="text-primary">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Module</span>
                <span className="text-primary">Ready</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="text-primary">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
};

export default Index;
