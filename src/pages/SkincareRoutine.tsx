import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Droplets, 
  Sparkles,
  Clock,
  Languages,
  Loader2,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoutineStep {
  step: number;
  time: string;
  product: string;
  action: string;
  duration: string;
  tips: string;
}

interface WeeklyTreatment {
  name: string;
  frequency: string;
  description: string;
}

interface Ingredient {
  name: string;
  reason: string;
}

interface SkincareRoutine {
  morning: RoutineStep[];
  evening: RoutineStep[];
  weekly: WeeklyTreatment[];
  avoidList: string[];
  ingredients: {
    recommended: Ingredient[];
    avoid: Ingredient[];
  };
  lifestyleRecommendations: string[];
  overview: string;
  overview_bn: string;
}

export default function SkincareRoutinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [routine, setRoutine] = useState<SkincareRoutine | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    if (user && id) {
      fetchAnalysisAndGenerateRoutine();
    }
  }, [user, id]);

  const fetchAnalysisAndGenerateRoutine = async () => {
    try {
      setLoading(true);
      
      // Fetch the analysis data
      const { data: analysis, error: fetchError } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (fetchError || !analysis) {
        toast({
          title: "Error",
          description: "Analysis not found.",
          variant: "destructive",
        });
        navigate('/history');
        return;
      }

      setAnalysisData(analysis);
      setLoading(false);
      
      // Generate routine
      await generateRoutine(analysis);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const generateRoutine = async (analysis: any) => {
    try {
      setGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-skincare-routine', {
        body: { analysisData: analysis }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setRoutine(data);
    } catch (error) {
      console.error('Error generating routine:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate skincare routine.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/analysis/${id}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Personalized Skincare Routine
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-generated routine based on your skin analysis
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1"
          >
            <Languages className="w-4 h-4" />
            {language === 'en' ? 'বাংলা' : 'English'}
          </Button>
        </div>

        {/* Generating State */}
        {generating && (
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-lg font-medium">Generating Your Personalized Routine</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyzing your skin conditions and creating tailored recommendations...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Routine Content */}
        {routine && !generating && (
          <div className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {language === 'en' ? 'Routine Overview' : 'রুটিন সারাংশ'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {language === 'en' ? routine.overview : routine.overview_bn}
                </p>
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {language === 'en' 
                        ? 'This is for informational purposes only. Consult a dermatologist for personalized medical advice.'
                        : 'এটি শুধুমাত্র তথ্যের জন্য। ব্যক্তিগত চিকিৎসা পরামর্শের জন্য একজন চর্মরোগ বিশেষজ্ঞের সাথে পরামর্শ করুন।'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Morning & Evening Routines */}
            <Tabs defaultValue="morning" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="morning" className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  {language === 'en' ? 'Morning Routine' : 'সকালের রুটিন'}
                </TabsTrigger>
                <TabsTrigger value="evening" className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  {language === 'en' ? 'Evening Routine' : 'সন্ধ্যার রুটিন'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="morning" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {routine.morning.map((step, idx) => (
                        <div 
                          key={idx} 
                          className="flex gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">{step.step}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-foreground">{step.product}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {step.duration}
                              </div>
                            </div>
                            <p className="text-sm text-foreground mb-2">{step.action}</p>
                            <p className="text-xs text-muted-foreground italic">💡 {step.tips}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evening" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {routine.evening.map((step, idx) => (
                        <div 
                          key={idx} 
                          className="flex gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                            <span className="text-lg font-bold text-foreground">{step.step}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-foreground">{step.product}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {step.duration}
                              </div>
                            </div>
                            <p className="text-sm text-foreground mb-2">{step.action}</p>
                            <p className="text-xs text-muted-foreground italic">💡 {step.tips}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Weekly Treatments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {language === 'en' ? 'Weekly Treatments' : 'সাপ্তাহিক চিকিৎসা'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {routine.weekly.map((treatment, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{treatment.name}</h4>
                        <Badge variant="outline">{treatment.frequency}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{treatment.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    {language === 'en' ? 'Recommended Ingredients' : 'প্রস্তাবিত উপাদান'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {routine.ingredients.recommended.map((ing, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="font-medium text-foreground">{ing.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{ing.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="w-5 h-5" />
                    {language === 'en' ? 'Ingredients to Avoid' : 'এড়িয়ে চলা উপাদান'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {routine.ingredients.avoid.map((ing, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <p className="font-medium text-foreground">{ing.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{ing.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Avoid List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {language === 'en' ? 'Things to Avoid' : 'যা এড়িয়ে চলতে হবে'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {routine.avoidList.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-primary" />
                  {language === 'en' ? 'Lifestyle Recommendations' : 'জীবনযাত্রার পরামর্শ'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {routine.lifestyleRecommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Regenerate Button */}
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => generateRoutine(analysisData)} 
                disabled={generating}
                className="flex items-center gap-2"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {language === 'en' ? 'Regenerate Routine' : 'রুটিন পুনরায় তৈরি করুন'}
              </Button>
            </div>
          </div>
        )}

        {/* No Routine State */}
        {!routine && !generating && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Failed to generate routine</p>
              <p className="text-muted-foreground mt-1 mb-4">
                Please try again or go back to the analysis.
              </p>
              <Button onClick={() => generateRoutine(analysisData)}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
