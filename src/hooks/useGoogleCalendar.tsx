import { useState, useEffect, useCallback } from "react";

// Supabase VITE env variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CALENDAR_API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API;

export const useGoogleCalendar = () => {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  // Load GAPI Script
  useEffect(() => {
    if (!CLIENT_ID || !CALENDAR_API_KEY) {
      setError("Missing required Google API env variables");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = initGapi;
    document.body.appendChild(script);
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
          if (signedIn) fetchEvents();
        });

        setGapiLoaded(true);

        if (auth.isSignedIn.get()) {
          fetchEvents();
        }
      } catch (err) {
        console.error("GAPI init error:", err);
        setError("Failed to initialize Google API");
      }
    });
  };

  const signIn = useCallback(() => {
    if (!gapiLoaded) return;
    window.gapi.auth2.getAuthInstance().signIn();
  }, [gapiLoaded]);

  const signOut = useCallback(() => {
    if (!gapiLoaded) return;
    window.gapi.auth2.getAuthInstance().signOut();
  }, [gapiLoaded]);

  const fetchEvents = async () => {
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });

      const items = response.result.items || [];
      const mapped = items.map((event: any) => ({
        id: event.id,
        title: event.summary,
        time: event.start.dateTime || event.start.date,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setError("Failed to fetch calendar events");
    }
  };

  return {
    events,
    error,
    isSignedIn,
    gapiLoaded,
    signIn,
    signOut,
    fetchEvents,
  };
};          if (!val) {
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
 };
