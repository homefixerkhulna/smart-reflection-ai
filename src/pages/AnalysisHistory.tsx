import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Calendar, Activity, Trash2, GitCompare, TrendingUp, Languages, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// 20 Common diseases with translations
const DISEASE_TRANSLATIONS: Record<string, { en: string; bn: string }> = {
  acne: { en: 'Acne', bn: 'ব্রণ' },
  eczema: { en: 'Eczema', bn: 'একজিমা' },
  psoriasis: { en: 'Psoriasis', bn: 'সোরিয়াসিস' },
  rosacea: { en: 'Rosacea', bn: 'রোসেসিয়া' },
  melasma: { en: 'Melasma', bn: 'মেলাসমা' },
  fungal_infection: { en: 'Fungal Infection', bn: 'ছত্রাক সংক্রমণ' },
  bacterial_infection: { en: 'Bacterial Infection', bn: 'ব্যাকটেরিয়া সংক্রমণ' },
  viral_rash: { en: 'Viral Rash', bn: 'ভাইরাল র‌্যাশ' },
  dermatitis: { en: 'Dermatitis', bn: 'ডার্মাটাইটিস' },
  folliculitis: { en: 'Folliculitis', bn: 'ফলিকুলাইটিস' },
  vitiligo: { en: 'Vitiligo', bn: 'শ্বেতী' },
  urticaria: { en: 'Urticaria', bn: 'আমবাত' },
  allergic_rash: { en: 'Allergic Rash', bn: 'এলার্জিক র‌্যাশ' },
  ringworm: { en: 'Ringworm', bn: 'দাদ' },
  cellulitis: { en: 'Cellulitis', bn: 'সেলুলাইটিস' },
  sunburn: { en: 'Sunburn', bn: 'রোদে পোড়া' },
  keratosis: { en: 'Keratosis', bn: 'কেরাটোসিস' },
  scabies: { en: 'Scabies', bn: 'খোসপাঁচড়া' },
  impetigo: { en: 'Impetigo', bn: 'ইম্পেটিগো' },
  skin_aging: { en: 'Skin Aging', bn: 'ত্বকের বার্ধক্য' },
};

interface Analysis {
  id: string;
  image_url: string;
  created_at: string;
  skin_health_score: number | null;
  overall_quality_score: number | null;
  hydration_score: number | null;
  texture_score: number | null;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  confidence_score: number | null;
  triage_suggestion: string | null;
  triage_suggestion_bn: string | null;
  disease_probabilities: Record<string, number> | null;
  general_skin_info: { en: string; bn: string } | null;
  visual_features: { en: string[]; bn: string[] } | null;
}

export default function AnalysisHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('skin_analyses')
        .select('id, image_url, created_at, skin_health_score, overall_quality_score, hydration_score, texture_score, risk_level, confidence_score, triage_suggestion, triage_suggestion_bn, disease_probabilities, general_skin_info, visual_features')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast JSON fields properly
      const formattedData: Analysis[] = (data || []).map(item => ({
        ...item,
        risk_level: item.risk_level as 'LOW' | 'MEDIUM' | 'HIGH' | null,
        visual_features: item.visual_features as { en: string[]; bn: string[] } | null,
        general_skin_info: item.general_skin_info as { en: string; bn: string } | null,
        disease_probabilities: item.disease_probabilities as Record<string, number> | null,
      }));
      setAnalyses(formattedData);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('skin_analyses')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setAnalyses(analyses.filter(a => a.id !== deleteId));
      toast({
        title: language === 'en' ? "Analysis deleted" : "বিশ্লেষণ মুছে ফেলা হয়েছে",
        description: language === 'en' 
          ? "The analysis has been removed successfully."
          : "বিশ্লেষণটি সফলভাবে সরানো হয়েছে।",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: language === 'en' ? "Error" : "ত্রুটি",
        description: language === 'en' 
          ? "Failed to delete the analysis. Please try again."
          : "বিশ্লেষণ মুছতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const toggleSelectAnalysis = (id: string) => {
    setSelectedAnalyses(prev => {
      if (prev.includes(id)) {
        return prev.filter(analysisId => analysisId !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedAnalyses.length === 2) {
      navigate(`/compare?id1=${selectedAnalyses[0]}&id2=${selectedAnalyses[1]}`);
    }
  };

  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null) => {
    if (!riskLevel) return null;
    
    const labels = {
      HIGH: { en: 'High Risk', bn: 'উচ্চ ঝুঁকি' },
      MEDIUM: { en: 'Medium Risk', bn: 'মাঝারি ঝুঁকি' },
      LOW: { en: 'Low Risk', bn: 'কম ঝুঁকি' },
    };
    
    switch (riskLevel) {
      case 'HIGH':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3 h-3" />
            {labels.HIGH[language]}
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" />
            {labels.MEDIUM[language]}
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            {labels.LOW[language]}
          </Badge>
        );
    }
  };

  const getTopDiseases = (probabilities: Record<string, number> | null) => {
    if (!probabilities) return [];
    return Object.entries(probabilities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {language === 'en' ? 'Analysis History' : 'বিশ্লেষণ ইতিহাস'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {compareMode 
                  ? (language === 'en' ? 'Select two analyses to compare' : 'তুলনা করতে দুটি বিশ্লেষণ নির্বাচন করুন')
                  : (language === 'en' ? 'View all your past skin analyses' : 'আপনার সমস্ত পূর্ববর্তী ত্বক বিশ্লেষণ দেখুন')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1"
            >
              <Languages className="w-4 h-4" />
              {language === 'en' ? 'বাংলা' : 'English'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/recommendations')}
            >
              <Activity className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Get Recommendations' : 'সুপারিশ পান'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/trends')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {language === 'en' ? 'View Trends' : 'প্রবণতা দেখুন'}
            </Button>
            {compareMode && (
              <>
                <Button
                  onClick={handleCompare}
                  disabled={selectedAnalyses.length !== 2}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  {language === 'en' ? `Compare (${selectedAnalyses.length}/2)` : `তুলনা (${selectedAnalyses.length}/২)`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompareMode(false);
                    setSelectedAnalyses([]);
                  }}
                >
                  {language === 'en' ? 'Cancel' : 'বাতিল'}
                </Button>
              </>
            )}
            {!compareMode && analyses.length >= 2 && (
              <Button
                variant="outline"
                onClick={() => setCompareMode(true)}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                {language === 'en' ? 'Compare' : 'তুলনা'}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-64" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'en' ? 'No analyses yet' : 'এখনও কোনো বিশ্লেষণ নেই'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {language === 'en' 
                ? 'Capture your first skin analysis to get started'
                : 'শুরু করতে আপনার প্রথম ত্বক বিশ্লেষণ ক্যাপচার করুন'}
            </p>
            <Button onClick={() => navigate('/')}>
              {language === 'en' ? 'Start Analysis' : 'বিশ্লেষণ শুরু করুন'}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis) => {
              const isSelected = selectedAnalyses.includes(analysis.id);
              const isExpanded = expandedId === analysis.id;
              const topDiseases = getTopDiseases(analysis.disease_probabilities);
              
              return (
                <Card
                  key={analysis.id}
                  className={`overflow-hidden transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div 
                    className="relative h-48 bg-muted cursor-pointer"
                    onClick={() => {
                      if (compareMode) {
                        toggleSelectAnalysis(analysis.id);
                      } else {
                        navigate(`/analysis/${analysis.id}`);
                      }
                    }}
                  >
                    <img
                      src={analysis.image_url}
                      alt="Skin analysis"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      {getRiskBadge(analysis.risk_level)}
                    </div>
                    {isSelected && (
                      <Badge 
                        className="absolute top-2 right-2"
                        variant="default"
                      >
                        {language === 'en' ? 'Selected' : 'নির্বাচিত'}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(analysis.created_at), 'MMM dd, yyyy • HH:mm')}
                      </div>
                      {!compareMode && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(analysis.id);
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* General Skin Info Preview */}
                    {analysis.general_skin_info && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {language === 'en' 
                          ? analysis.general_skin_info.en 
                          : analysis.general_skin_info.bn || analysis.general_skin_info.en}
                      </p>
                    )}

                    {/* Health Scores */}
                    <div className="space-y-2 mb-3">
                      {analysis.skin_health_score !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground">
                            {language === 'en' ? 'Skin Health' : 'ত্বকের স্বাস্থ্য'}
                          </span>
                          <span className="font-semibold text-primary">{analysis.skin_health_score}/100</span>
                        </div>
                      )}
                      {analysis.hydration_score !== null && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground">
                            {language === 'en' ? 'Hydration' : 'হাইড্রেশন'}
                          </span>
                          <span className="font-semibold text-primary">{analysis.hydration_score}/100</span>
                        </div>
                      )}
                    </div>

                    {/* Top 3 Diseases */}
                    {topDiseases.length > 0 && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {language === 'en' ? 'Top Detected Conditions' : 'শীর্ষ সনাক্তকৃত অবস্থা'}
                        </p>
                        <div className="space-y-2">
                          {topDiseases.map(([disease, prob]) => {
                            const translation = DISEASE_TRANSLATIONS[disease] || { en: disease.replace(/_/g, ' '), bn: disease };
                            return (
                              <div key={disease} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="capitalize">
                                    {language === 'en' ? translation.en : translation.bn}
                                  </span>
                                  <span>{Math.round(prob * 100)}%</span>
                                </div>
                                <Progress value={prob * 100} className="h-1.5" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Expand/View Details Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/analysis/${analysis.id}`);
                      }}
                    >
                      {language === 'en' ? 'View Full Details' : 'সম্পূর্ণ বিবরণ দেখুন'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Delete Analysis' : 'বিশ্লেষণ মুছুন'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? 'Are you sure you want to delete this analysis? This action cannot be undone.'
                : 'আপনি কি নিশ্চিত যে আপনি এই বিশ্লেষণটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'en' ? 'Cancel' : 'বাতিল'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'en' ? 'Delete' : 'মুছুন'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
