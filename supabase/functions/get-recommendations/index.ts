import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyses } = await req.json();
    
    if (!analyses || analyses.length === 0) {
      return new Response(
        JSON.stringify({ error: "No analysis data provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare analysis data summary
    const latestAnalysis = analyses[analyses.length - 1];
    const firstAnalysis = analyses[0];
    const avgScores = {
      skinHealth: Math.round(analyses.reduce((sum: number, a: any) => sum + (a.skin_health_score || 0), 0) / analyses.length),
      hydration: Math.round(analyses.reduce((sum: number, a: any) => sum + (a.hydration_score || 0), 0) / analyses.length),
      texture: Math.round(analyses.reduce((sum: number, a: any) => sum + (a.texture_score || 0), 0) / analyses.length),
    };

    const trends = {
      skinHealth: (latestAnalysis.skin_health_score || 0) - (firstAnalysis.skin_health_score || 0),
      hydration: (latestAnalysis.hydration_score || 0) - (firstAnalysis.hydration_score || 0),
      texture: (latestAnalysis.texture_score || 0) - (firstAnalysis.texture_score || 0),
    };

    const systemPrompt = `You are an expert dermatologist and skincare specialist. Based on skin analysis data, provide personalized skincare recommendations.

Your response must be a JSON object with exactly this structure:
{
  "overview": "A brief 2-3 sentence overview of their skin health journey",
  "strengths": ["List 2-3 positive aspects or improvements"],
  "areasForImprovement": ["List 2-3 areas that need attention"],
  "recommendations": [
    {
      "category": "Morning Routine" or "Evening Routine" or "Weekly Treatment" or "Lifestyle",
      "title": "Brief recommendation title",
      "description": "Detailed explanation",
      "priority": "high" or "medium" or "low"
    }
  ],
  "productSuggestions": [
    {
      "type": "Cleanser" or "Moisturizer" or "Serum" or "Sunscreen" or "Treatment",
      "ingredient": "Key ingredient to look for",
      "reason": "Why this ingredient helps",
      "usage": "How and when to use"
    }
  ]
}`;

    const userPrompt = `Analyze this skin health data and provide personalized recommendations:

Latest Scores:
- Skin Health: ${latestAnalysis.skin_health_score || 'N/A'}
- Hydration: ${latestAnalysis.hydration_score || 'N/A'}
- Texture: ${latestAnalysis.texture_score || 'N/A'}

Average Scores (across ${analyses.length} analyses):
- Skin Health: ${avgScores.skinHealth}
- Hydration: ${avgScores.hydration}
- Texture: ${avgScores.texture}

Trends (change from first to latest):
- Skin Health: ${trends.skinHealth > 0 ? '+' : ''}${trends.skinHealth}
- Hydration: ${trends.hydration > 0 ? '+' : ''}${trends.hydration}
- Texture: ${trends.texture > 0 ? '+' : ''}${trends.texture}

Provide actionable, science-based recommendations focusing on the areas that need most improvement while acknowledging positive trends.`;

    console.log('Sending request to Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('Received AI response');
    
    const recommendations = JSON.parse(aiResponse.choices[0].message.content);

    return new Response(
      JSON.stringify(recommendations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
