import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Package,
  Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface ProductSuggestion {
  type: string;
  ingredient: string;
  reason: string;
  usage: string;
}

interface RecommendationData {
  overview: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: Recommendation[];
  productSuggestions: ProductSuggestion[];
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);

  /** ----------------------------------------
   *   Fetch recommendations
   * ---------------------------------------- */
  const fetchRecommendations = useCallback(async () => {
    try {
      const { data: analyses, error: fetchError } = await supabase
        .from("skin_analyses")
        .select("id, created_at, skin_health_score, hydration_score, texture_score")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      if (!analyses || analyses.length === 0) {
        toast({
          title: "No Analysis Data",
          description: "Complete at least one skin analysis to get personalized recommendations.",
          variant: "destructive",
        });
        navigate("/history");
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-recommendations", {
        body: { analyses },
      });

      if (error) throw error;

      setRecommendations(data);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      toast({
        title: "Error",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, navigate, toast]);

  /** Run on load */
  useEffect(() => {
    if (user) fetchRecommendations();
  }, [user, fetchRecommendations]);

  /** ----------------------------------------
   *   Priority color
   * ---------------------------------------- */
  const getPriorityColor = useCallback((priority: Recommendation["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
      default:
        return "secondary";
    }
  }, []);

  /** ----------------------------------------
   *   Category Icon
   * ---------------------------------------- */
  const categoryIcons = useMemo(
    () => ({
      treatment: <Sparkles className="w-5 h-5" />,
      routine: <Droplets className="w-5 h-5" />,
      default: <TrendingUp className="w-5 h-5" />,
    }),
    []
  );

  const getCategoryIcon = (category: string) => {
    if (category.includes("Morning") || category.includes("Evening")) return categoryIcons.routine;
    if (category.includes("Treatment")) return categoryIcons.treatment;
    return categoryIcons.default;
  };

  /** ----------------------------------------
   *   Loading State
   * ---------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  /** ----------------------------------------
   *   No Data State
   * ---------------------------------------- */
  if (!recommendations) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Recommendations</h1>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No recommendations available.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /** ----------------------------------------
   *   MAIN UI
   * ---------------------------------------- */
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "bn" : "en")}
            className="flex items-center gap-1"
          >
            <Languages className="w-4 h-4" />
            {language === "en" ? "বাংলা" : "English"}
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-foreground">Personalized Recommendations</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered skincare guidance based on your progress
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Skin Health Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">{recommendations.overview}</p>
            </CardContent>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                      <span className="text-sm">{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.areasForImprovement.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-accent mt-0.5" />
                      <span className="text-sm">{a}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(rec.category)}
                        <h3 className="font-semibold">{rec.title}</h3>
                      </div>
                      <Badge variant={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.category}</p>
                    <p className="text-sm leading-relaxed">{rec.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.productSuggestions.map((p, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{p.type}</h3>
                      <Badge variant="outline">{p.ingredient}</Badge>
                    </div>
                    <p className="text-sm mb-2">{p.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Usage:</span> {p.usage}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
 }
