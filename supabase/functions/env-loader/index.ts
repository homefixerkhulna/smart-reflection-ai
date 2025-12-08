import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async () => {
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
  const GOOGLE_CALENDAR_API = Deno.env.get("GOOGLE_CALENDAR_API") ?? "";

  return new Response(
    JSON.stringify({
      GOOGLE_CLIENT_ID,
      GOOGLE_CALENDAR_API,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});
