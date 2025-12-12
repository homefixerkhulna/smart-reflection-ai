import { useEffect, useState } from "react";
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
  Languages,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

// ----------------------
// Language Hook
// ----------------------
const useLanguage = () => {
  const [language, setLanguage] = useState<"en" | "bn">("en");
  return { language, setLanguage };
};

// ----------------------
// Translation Mapping
// ----------------------
const t = {
  title: {
    en: "Personalized Recommendations",
    bn: "ব্যক্তিগত স্কিন রিকমেন্ডেশন",
  },
  subtitle: {
    en: "AI-powered skincare guidance based on your progress",
    bn: "আপনার স্কিন বিশ্লেষণের অগ্রগতির ভিত্তিতে AI রিকমেন্ডেশন",
  },
  overviewTitle: {
    en: "Your Skin Health Journey",
    bn: "আপনার স্কিন হেলথ জার্নি",
  },
  strengths: {
    en: "Strengths",
    bn: "দক্ষতা / ভালো দিক",
  },
  improvement: {
    en: "Areas for Improvement",
    bn: "যেসব জায়গায় উন্নতি প্রয়োজন",
  },
  productSuggestions: {
    en: "Product Suggestions",
    bn: "প্রোডাক্ট সাজেশন",
  },
  usage: {
    en: "Usage",
    bn: "ব্যবহার",
  },
  noDataTitle: {
    en: "No Analysis Data",
    bn: "কোনো বিশ্লেষণ ডেটা নেই",
  },
  noDataDescription: {
    en: "Complete at least one skin analysis to get personalized recommendations.",
    bn: "কমপক্ষে একটি স্কিন অ্যানালাইসিস সম্পন্ন করুন রিকমেন্ডেশন পেতে।",
  },
};

// ----------------------
// Interfaces
// ----------------------
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

// ----------------------
// Component
// ----------------------
export default function Recommendations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { language, setLanguage } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] =
    useState<RecommendationData | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      const { data: analyses, error: fetchError } = await supabase
        .from("skin_analyses")
        .select(
          "id, created_at, skin_health_score, hydration_score, texture_score"
        )
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      if (!analyses || analyses.length === 0) {
        toast({
          title: t.noDataTitle[language],
          description: t.noDataDescription[language],
          variant: "destructive",
        });
        navigate("/history");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "get-recommendations",
        { body: { analyses } }
      );

      if (error) throw error;

      setRecommendations(data);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load recommendations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes("Morning") || category.includes("Evening"))
      return <Droplets className="w-5 h-5" />;
    if (category.includes("Treatment"))
      return <Sparkles className="w-5 h-5" />;
    return <TrendingUp className="w-5 h-5" />;
  };

  // --------------------------
  // Loading UI
  // --------------------------
  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen p-4">
        <h1 className="text-2xl font-bold">
          {t.noDataTitle[language]}
        </h1>
        <p className="text-muted-foreground">
          {t.noDataDescription[language]}
        </p>
      </div>
    );
  }

  // --------------------------
  // Main Page
  // --------------------------
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/history")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Language Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setLanguage(language === "en" ? "bn" : "en")
            }
            className="flex items-center gap-2"
          >
            <Languages className="w-4 h-4" />
            {language === "en" ? "বাংলা" : "English"}
          </Button>

          <div>
            <h1 className="text-3xl font-bold">{t.title[language]}</h1>
            <p className="text-muted-foreground">
              {t.subtitle[language]}
            </p>
          </div>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t.overviewTitle[language]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.overview}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                {t.strengths[language]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1" />
                    {s}
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
                {t.improvement[language]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.areasForImprovement.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-accent mt-1" />
                    {a}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t.title[language]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex justify-between">
                    <div className="flex gap-2 items-center">
                      {getCategoryIcon(rec.category)}
                      <h3 className="font-semibold">{rec.title}</h3>
                    </div>

                    <Badge variant={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground">{rec.category}</p>
                  <p>{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Suggestions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <Package className="w-5 h-5" />
              {t.productSuggestions[language]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.productSuggestions.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{p.type}</h3>
                    <Badge variant="outline">{p.ingredient}</Badge>
                  </div>

                  <p>{p.reason}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>{t.usage[language]}:</strong> {p.usage}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
