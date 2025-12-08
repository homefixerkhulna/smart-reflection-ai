import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    gapi: any;
  }
}

export const useGoogleCalendar = () => {
  const [env, setEnv] = useState<any>(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  // Load env from Supabase Function
  useEffect(() => {
    fetch("https://hwlokusmhcuwzvwyhhlu.supabase.co/functions/v1/env-loader")
      .then((res) => res.json())
      .then((data) => {
        if (!data.GOOGLE_CLIENT_ID || !data.GOOGLE_CALENDAR_API) {
          setError("Missing Google API environment variables");
        }
        setEnv(data);
      })
      .catch(() => setError("Failed to load environment variables"));
  }, []);

  // Load Google API script
  useEffect(() => {
    if (!env) return;

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = initGapi;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [env]);

  const initGapi = () => {
    if (!window.gapi) return;
    
    window.gapi.load("client:auth2", async () => {
      try {
        await window.gapi.client.init({
          apiKey: env.GOOGLE_CALENDAR_API,
          clientId: env.GOOGLE_CLIENT_ID,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
          scope: "https://www.googleapis.com/auth/calendar.readonly",
        });

        const auth = window.gapi.auth2.getAuthInstance();
        setIsSignedIn(auth.isSignedIn.get());

        auth.isSignedIn.listen((signedIn: boolean) => {
          setIsSignedIn(signedIn);
          if (signedIn) fetchEvents();
        });

        setGapiLoaded(true);
        setIsReady(true);

        if (auth.isSignedIn.get()) fetchEvents();
      } catch (err) {
        setError("Failed to initialize Google API");
      }
    });
  };

  const signIn = useCallback(() => {
    if (!gapiLoaded || !window.gapi) return;
    window.gapi.auth2.getAuthInstance().signIn();
  }, [gapiLoaded]);

  const signOut = useCallback(() => {
    if (!gapiLoaded || !window.gapi) return;
    window.gapi.auth2.getAuthInstance().signOut();
  }, [gapiLoaded]);

  const fetchEvents = useCallback(async () => {
    if (!window.gapi?.client?.calendar) return;
    
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });

      const items = response.result.items || [];
      setEvents(
        items.map((event: any) => ({
          id: event.id,
          title: event.summary,
          time: event.start.dateTime || event.start.date,
        }))
      );
    } catch (err) {
      setError("Failed to fetch calendar events");
    }
  }, []);

  return {
    env,
    events,
    error,
    isSignedIn,
    isReady,
    gapiLoaded,
    signIn,
    signOut,
    fetchEvents,
  };
};
