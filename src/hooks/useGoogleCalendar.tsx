// src/hooks/useGoogleCalendar.tsx
import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    gapi: any;
  }
}

type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
};

type UseGoogleCalendarReturn = {
  isReady: boolean;
  isSignedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  events: GoogleEvent[];
  fetchEvents: (opts?: { timeMin?: string; maxResults?: number }) => Promise<void>;
  error?: Error | null;
};

const GAPI_SRC = "https://apis.google.com/js/api.js";

// ✅ Supabase + Vite environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID!;
const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API!;

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

const ACCESS_TOKEN_KEY = "gcal_access_token_v1";

/**
 * useGoogleCalendar Hook
 */
export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isReady, setIsReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Load Google API script
  useEffect(() => {
    if (window.gapi) {
      setIsReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GAPI_SRC}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setIsReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = GAPI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsReady(true);
    script.onerror = () => setError(new Error("Failed to load Google API script"));

    document.body.appendChild(script);
  }, []);

  // Initialize Google API client
  useEffect(() => {
    if (!isReady) return;

    if (!CLIENT_ID || !API_KEY) {
      setError(new Error("Missing required Google API env variables"));
      return;
    }

    const initClient = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          window.gapi.load("client:auth2", {
            callback: resolve,
            onerror: () => reject(new Error("gapi client load error")),
          });
        });

        await window.gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });

        const auth = window.gapi.auth2.getAuthInstance();
        const loggedIn = auth.isSignedIn.get();

        setIsSignedIn(loggedIn);

        // Listen for auth changes
        auth.isSignedIn.listen((val: boolean) => {
          setIsSignedIn(val);
          if (!val) {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
            setEvents([]);
          }
        });
      } catch (err: any) {
        setError(err);
      }
    };

    initClient();
  }, [isReady]);

  // Sign In
  const signIn = useCallback(async () => {
    try {
      const auth = window.gapi.auth2.getAuthInstance();
      const user = await auth.signIn();

      const token = user.getAuthResponse().access_token;
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);

      setIsSignedIn(true);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      const auth = window.gapi.auth2.getAuthInstance();
      await auth.signOut();

      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      setIsSignedIn(false);
      setEvents([]);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, []);

  // Fetch Events
  const fetchEvents = useCallback(
    async (opts?: { timeMin?: string; maxResults?: number }) => {
      try {
        if (!window.gapi?.client) {
          throw new Error("Google API not initialized");
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
        setError(err);
        throw err;
      }
    },
    []
  );

  return {
    isReady,
    isSignedIn,
    signIn,
    signOut,
    events,
    fetchEvents,
    error,
  };
 }
