import React, { useEffect } from "react";
import { Calendar as CalendarIcon, LogIn, LogOut, RefreshCw } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Calendar: React.FC = () => {
  const { isReady, isSignedIn, signIn, signOut, events, fetchEvents, error } = useGoogleCalendar();

  useEffect(() => {
    if (isReady && isSignedIn) {
      fetchEvents().catch(console.error);
    }
  }, [isReady, isSignedIn, fetchEvents]);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <CalendarIcon className="w-5 h-5 text-primary" />
          Google Calendar
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isReady && (
          <p className="text-sm text-muted-foreground">Loading Google API...</p>
        )}
        
        {error && (
          <p className="text-sm text-destructive">Error: {error.message}</p>
        )}

        {!isSignedIn ? (
          <Button 
            onClick={() => signIn()} 
            className="w-full"
            disabled={!isReady}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fetchEvents()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
              {events.map((ev) => {
                const start = ev.start.dateTime ?? ev.start.date ?? "";
                const time = start 
                  ? start.substring(start.indexOf("T") + 1, start.indexOf("T") + 6) 
                  : "All Day";
                return (
                  <div key={ev.id} className="flex items-center gap-3 group">
                    <span className="text-sm text-muted-foreground w-14">{time}</span>
                    <div className="w-1 h-8 rounded-full bg-primary" />
                    <span className="text-sm flex-1 group-hover:text-primary transition-colors">
                      {ev.summary ?? "(no title)"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
