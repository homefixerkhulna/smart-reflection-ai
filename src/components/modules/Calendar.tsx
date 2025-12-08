// CalendarWidget.tsx
import React, { useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { useGoogleCalendar } from "./useGoogleCalendar";

export const CalendarWidget: React.FC = () => {
  const { isReady, isSignedIn, signIn, signOut, events, fetchEvents, error } = useGoogleCalendar();

  useEffect(() => {
    if (isReady && isSignedIn) {
      fetchEvents().catch(console.error);
    }
  }, [isReady, isSignedIn, fetchEvents]);

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium">Today's Schedule</h3>
      </div>

      <div>
        {!isReady && <p>Loading Google API...</p>}
        {error && <p className="text-sm text-red-600">Error: {error.message}</p>}

        {!isSignedIn ? (
          <button onClick={() => signIn()} className="btn">
            Sign in with Google
          </button>
        ) : (
          <div>
            <div className="mb-3">
              <button onClick={() => signOut()} className="btn btn-ghost">
                Sign out
              </button>
              <button onClick={() => fetchEvents()} className="ml-2 btn btn-outline">
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {events.length === 0 && <div className="text-sm text-muted-foreground">No upcoming events</div>}
              {events.map((ev) => {
                const start = ev.start.dateTime ?? ev.start.date ?? "";
                const time = start ? start.substring(start.indexOf("T") + 1, start.indexOf("T") + 6) : "All Day";
                return (
                  <div key={ev.id} className="flex items-center space-x-3 group">
                    <div className="text-sm text-muted-foreground w-14">{time}</div>
                    <div className="w-1 h-8 rounded-full bg-primary" />
                    <div className="text-sm flex-1 group-hover:text-primary transition-colors">
                      {ev.summary ?? "(no title)"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
