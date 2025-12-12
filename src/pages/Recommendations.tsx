import { useEffect, useState, useMemo } from "react"; import { useNavigate } from "react-router-dom"; import { useAuth } from "@/contexts/AuthContext"; import { supabase } from "@/integrations/supabase/client"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Button } from "@/components/ui/button"; import { Skeleton } from "@/components/ui/skeleton"; import { Badge } from "@/components/ui/badge"; import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Droplets, Package, Languages } from "lucide-react"; import { useToast } from "@/hooks/use-toast";

interface Recommendation { category: string; title: string; description: string; priority: "high" | "medium" | "low"; }

interface ProductSuggestion { type: string; ingredient: string; reason: string; usage: string; }

interface RecommendationData { overview: string; strengths: string[]; areasForImprovement: string[]; recommendations: Recommendation[]; productSuggestions: ProductSuggestion[]; }

// 🔵 Translation Map const translations = { en: { pageTitle: "Personalized Recommendations", pageSubtitle: "AI-powered skincare guidance based on your progress", overviewTitle: "Your Skin Health Journey", strengths: "Strengths", improvements: "Areas for Improvement", suggestions: "Personalized Recommendations", products: "Product Suggestions", usage: "Usage", back: "Back", langSwitch: "বাংলা",  // button label when English is active },

bn: { pageTitle: "পার্সোনালাইজড সাজেশন", pageSubtitle: "আপনার অগ্রগতির ভিত্তিতে AI স্কিনকেয়ার গাইডলাইন", overviewTitle: "আপনার স্কিন হেলথ জার্নি", strengths: "আপনার শক্তিসমূহ", improvements: "উন্নতির ক্ষেত্র", suggestions: "পার্সোনালাইজড সাজেশন", products: "প্রোডাক্ট সাজেশন", usage: "ব্যবহার", back: "ফিরে যান", langSwitch: "English", // button label when Bangla is active }, };

export default function Recommendations() { const navigate = useNavigate(); const { user } = useAuth(); const { toast } = useToast();

const [loading, setLoading] = useState(true); const [language, setLanguage] = useState<"en" | "bn">("en"); const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);

const t = useMemo(() => translations[language], [language]);

useEffect(() => { if (user) { fetchRecommendations(); } }, [user]);

const fetchRecommendations = async () => { try { const { data: analyses, error: fetchError } = await supabase .from("skin_analyses") .select("id, created_at, skin_health_score, hydration_score, texture_score") .eq("user_id", user?.id) .order("created_at", { ascending: true });

if (fetchError) throw fetchError;

  if (!analyses || analyses.length === 0) {
    toast({
      title: language === "en" ? "No Analysis Data" : "কোনো অ্যানালাইসিস ডেটা নেই",
      description:
        language === "en"
          ? "Complete at least one skin analysis to get personalized recommendations."
          : "একটি স্কিন অ্যানালাইসিস সম্পন্ন করুন সাজেশন পেতে।",
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
} catch (error) {
  console.error("Error fetching recommendations:", error);
  toast({
    title: language === "en" ? "Error" : "সমস্যা",
    description:
      language === "en"
        ? "Failed to load recommendations. Please try again."
        : "সাজেশন লোড করা যায়নি। আবার চেষ্টা করুন।",
    variant: "destructive",
  });
} finally {
  setLoading(false);
}

};

const getPriorityColor = (priority: string) => { switch (priority) { case "high": return "destructive"; case "medium": return "default"; case "low": return "secondary"; default: return "default"; } };

const getCategoryIcon = (category: string) => { if (category.includes("Morning") || category.includes("Evening")) return <Droplets className="w-5 h-5" />; if (category.includes("Treatment")) return <Sparkles className="w-5 h-5" />; return <TrendingUp className="w-5 h-5" />; };

if (loading) { return ( <div className="min-h-screen bg-background p-4 md:p-8"> <div className="max-w-7xl mx-auto space-y-6"> <Skeleton className="h-10 w-64" /> <Skeleton className="h-48 w-full" /> <Skeleton className="h-40 w-full" /> </div> </div> ); }

if (!recommendations) { return ( <div className="min-h-screen bg-background p-4 md:p-8"> <div className="max-w-7xl mx-auto"> <Button variant="ghost" size="icon" onClick={() => navigate("/history")}> <ArrowLeft className="w-5 h-5" /> </Button> <p className="text-muted-foreground mt-4 text-center"> {language === "en" ? "No recommendations available." : "কোনো সাজেশন পাওয়া যায়নি।"} </p> </div> </div> ); }

return ( <div className="min-h-screen bg-background p-4 md:p-8"> <div className="max-w-7xl mx-auto space-y-6"> {/* Header */} <div className="flex items-center justify-between mb-6"> <Button variant="ghost" size="icon" onClick={() => navigate("/history")}> <ArrowLeft className="w-5 h-5" /> </Button>

<Button
        variant="outline"
        size="sm"
        onClick={() => setLanguage(language === "en" ? "bn" : "en")}
        className="flex items-center gap-1"
      >
        <Languages className="w-4 h-4" /> {t.langSwitch}
      </Button>
    </div>

    <div>
      <h1 className="text-3xl font-bold text-foreground">{t.pageTitle}</h1>
      <p className="text-muted-foreground mt-1">{t.pageSubtitle}</p>
    </div>

    {/* Overview */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-5 h-5 text-primary" /> {t.overviewTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground leading-relaxed">{recommendations.overview}</p>
      </CardContent>
    </Card>

    {/* Strengths and Improvements */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="w-5 h-5 text-primary" /> {t.strengths}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                <span className="text-sm text-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertCircle className="w-5 h-5 text-accent" /> {t.improvements}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.areasForImprovement.map((area, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent mt-0.5" />
                <span className="text-sm text-foreground">{area}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>

    {/* Recommendations List */}
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{t.suggestions}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(rec.category)}
                  <h3 className="font-semibold text-foreground">{rec.title}</h3>
                </div>
                <Badge variant={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{rec.category}</p>
              <p className="text-sm text-foreground">{rec.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Product Suggestions */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Package className="w-5 h-5" /> {t.products}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.productSuggestions.map((product, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{product.type}</h3>
                <Badge variant="outline">{product.ingredient}</Badge>
              </div>
              <p className="text-sm text-foreground mb-2">{product.reason}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">{t.usage}:</span> {product.usage}
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
