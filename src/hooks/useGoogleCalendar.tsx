import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    gapi: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CALENDAR_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API;

export interface CalendarEvent {
  id: string;
  summary?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
}

export const useGoogleCalendar = () => {
  const [isReady, setIsReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Load GAPI Script
  useEffect(() => {
    if (!CLIENT_ID || !CALENDAR_API_KEY) {
      setError(new Error("Missing required Google API env variables"));
      return;
    }

    // Check if script already loaded
    if (window.gapi) {
      initGapi();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = initGapi;
    script.onerror = () => setError(new Error("Failed to load Google API script"));
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initGapi = () => {
    window.gapi.load("client:auth2", async () => {
      try {
        await window.gapi.client.init({
          apiKey: CALENDAR_API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
          ],
          scope: "https://www.googleapis.com/auth/calendar.readonly",
        });

        const auth = window.gapi.auth2.getAuthInstance();
        setIsSignedIn(auth.isSignedIn.get());

        auth.isSignedIn.listen((signedIn: boolean) => {
          setIsSignedIn(signedIn);
        });

        setIsReady(true);
      } catch (err: any) {
        console.error("GAPI init error:", err);
        setError(new Error(err?.message || "Failed to initialize Google API"));
      }
    });
  };

  const signIn = useCallback(async () => {
    if (!isReady) return;
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
    } catch (err: any) {
      setError(new Error(err?.message || "Sign in failed"));
    }
  }, [isReady]);

  const signOut = useCallback(async () => {
    if (!isReady) return;
    try {
      await window.gapi.auth2.getAuthInstance().signOut();
      setEvents([]);
    } catch (err: any) {
      setError(new Error(err?.message || "Sign out failed"));
    }
  }, [isReady]);

  const fetchEvents = useCallback(async (opts?: { timeMin?: string; maxResults?: number }) => {
    try {
      if (!window.gapi?.client?.calendar) {
        throw new Error("Google Calendar API not initialized");
      }

      const timeMin = opts?.timeMin ?? new Date().toISOString();
      const maxResults = opts?.maxResults ?? 10;

      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin,
        showDeleted: false,
        singleEvents: true,
        maxResults,
        orderBy: "startTime",
      });

      setEvents(response.result.items || []);
    } catch (err: any) {
      console.error("Calendar fetch error:", err);
      setError(new Error(err?.message || "Failed to fetch calendar events"));
    }
  }, []);

  return {
    isReady,
    isSignedIn,
    events,
    error,
    signIn,
    signOut,
    fetchEvents,
  };
};
