import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiseaseData {
  name: string;
  probability: number;
}

interface RoutineStep {
  step: number;
  time: string;
  product: string;
  action: string;
  duration: string;
  tips: string;
}

interface SkincareRoutine {
  morning: RoutineStep[];
  evening: RoutineStep[];
  weekly: {
    name: string;
    frequency: string;
    description: string;
  }[];
  avoidList: string[];
  ingredients: {
    recommended: { name: string; reason: string }[];
    avoid: { name: string; reason: string }[];
  };
  lifestyleRecommendations: string[];
  overview: string;
  overview_bn: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisData } = await req.json();

    if (!analysisData) {
      return new Response(
        JSON.stringify({ error: 'No analysis data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Extract top conditions from disease probabilities
    const diseaseProbs = analysisData.disease_probabilities || {};
    const topConditions: DiseaseData[] = Object.entries(diseaseProbs)
      .map(([name, prob]) => ({ name, probability: prob as number }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);

    const skinHealthScore = analysisData.skin_health_score || 75;
    const hydrationScore = analysisData.hydration_score || 70;
    const textureScore = analysisData.texture_score || 70;
    const riskLevel = analysisData.risk_level || 'LOW';
    const generalInfo = analysisData.general_skin_info?.en || '';
    const visualFeatures = analysisData.visual_features?.en || [];

    const systemPrompt = `You are an expert dermatologist and skincare specialist. Generate a personalized skincare routine based on skin analysis data. Your recommendations must be:
1. Evidence-based and safe
2. Practical and achievable
3. Considerate of detected skin conditions
4. Focused on prevention and maintenance

CRITICAL: Always include a disclaimer that this is informational only and not medical advice.

Return a JSON object with this exact structure:
{
  "morning": [
    {
      "step": 1,
      "time": "6:00 AM",
      "product": "Product type",
      "action": "How to apply",
      "duration": "Time needed",
      "tips": "Pro tips"
    }
  ],
  "evening": [...],
  "weekly": [
    {
      "name": "Treatment name",
      "frequency": "2x per week",
      "description": "What it does"
    }
  ],
  "avoidList": ["Things to avoid"],
  "ingredients": {
    "recommended": [{"name": "Ingredient", "reason": "Why it helps"}],
    "avoid": [{"name": "Ingredient", "reason": "Why to avoid"}]
  },
  "lifestyleRecommendations": ["Lifestyle tips"],
  "overview": "English summary of the routine",
  "overview_bn": "Bengali summary (বাংলা সারাংশ)"
}`;

    const userPrompt = `Generate a personalized skincare routine based on this analysis:

**Skin Metrics:**
- Overall Health Score: ${skinHealthScore}/100
- Hydration Level: ${hydrationScore}/100
- Texture Score: ${textureScore}/100
- Risk Level: ${riskLevel}

**Top Detected Conditions (from 20 common diseases screening):**
${topConditions.map(c => `- ${c.name}: ${Math.round(c.probability * 100)}% probability`).join('\n')}

**General Skin Information:**
${generalInfo}

**Visual Features Detected:**
${visualFeatures.join(', ')}

Please create a comprehensive morning and evening skincare routine, weekly treatments, and ingredient recommendations specifically tailored to address these conditions. Include both English overview and Bengali translation (বাংলা অনুবাদ).`;

    console.log('Generating skincare routine with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('Failed to generate routine');
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response (handle markdown code blocks)
    let routine: SkincareRoutine;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      routine = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse skincare routine');
    }

    console.log('Successfully generated skincare routine');

    return new Response(
      JSON.stringify(routine),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-skincare-routine:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
