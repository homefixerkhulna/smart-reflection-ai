import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";

interface Analysis {
  id: string;
  image_url: string;
  created_at: string;
  skin_health_score: number | null;
  overall_quality_score: number | null;
  hydration_score: number | null;
  texture_score: number | null;
  brightness_score: number | null;
  sharpness_score: number | null;
  analysis_text: string;
}

export default function AnalysisComparison() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<[Analysis | null, Analysis | null]>([null, null]);
  const [loading, setLoading] = useState(true);

  const id1 = searchParams.get('id1');
  const id2 = searchParams.get('id2');

  useEffect(() => {
    if (user && id1 && id2) {
      fetchAnalyses();
    }
  }, [user, id1, id2]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('skin_analyses')
        .select('*')
        .in('id', [id1, id2])
        .eq('user_id', user?.id);

      if (error) throw error;

      if (data) {
        const analysis1 = data.find(a => a.id === id1) || null;
        const analysis2 = data.find(a => a.id === id2) || null;
        setAnalyses([analysis1, analysis2]);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDifference = (score1: number | null, score2: number | null) => {
    if (score1 === null || score2 === null) return null;
    return score2 - score1;
  };

  const getDifferenceIcon = (diff: number | null) => {
    if (diff === null) return null;
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getDifferenceBadge = (diff: number | null) => {
    if (diff === null) return null;
    const variant = diff > 0 ? "default" : diff < 0 ? "destructive" : "secondary";
    const sign = diff > 0 ? "+" : "";
    return (
      <Badge variant={variant} className="ml-2">
        {sign}{diff}
      </Badge>
    );
  };

  const ScoreComparison = ({ 
    label, 
    score1, 
    score2 
  }: { 
    label: string; 
    score1: number | null; 
    score2: number | null; 
  }) => {
    const diff = calculateDifference(score1, score2);
    
    return (
      <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground w-12 text-right">
            {score1 !== null ? score1 : 'N/A'}
          </span>
          <div className="flex items-center gap-1 w-16">
            {getDifferenceIcon(diff)}
            {getDifferenceBadge(diff)}
          </div>
          <span className="text-sm font-semibold text-primary w-12 text-right">
            {score2 !== null ? score2 : 'N/A'}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!analyses[0] || !analyses[1]) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/history')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to History
          </Button>
          <Card className="mt-8 p-12 text-center">
            <p className="text-muted-foreground">Unable to load analyses for comparison.</p>
          </Card>
        </div>
      </div>
    );
  }

  const [older, newer] = analyses[0].created_at < analyses[1].created_at 
    ? [analyses[0], analyses[1]] 
    : [analyses[1], analyses[0]];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis Comparison</h1>
            <p className="text-muted-foreground mt-1">Compare progress between two analyses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Older Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Earlier Analysis</span>
                <Badge variant="secondary">
                  {format(new Date(older.created_at), 'MMM dd, yyyy')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={older.image_url}
                alt="Earlier analysis"
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <div className="space-y-2">
                {older.skin_health_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Skin Health</span>
                    <span className="font-semibold">{older.skin_health_score}/100</span>
                  </div>
                )}
                {older.overall_quality_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Overall Quality</span>
                    <span className="font-semibold">{older.overall_quality_score}/100</span>
                  </div>
                )}
                {older.hydration_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hydration</span>
                    <span className="font-semibold">{older.hydration_score}/100</span>
                  </div>
                )}
                {older.texture_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Texture</span>
                    <span className="font-semibold">{older.texture_score}/100</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Newer Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Recent Analysis</span>
                <Badge variant="default">
                  {format(new Date(newer.created_at), 'MMM dd, yyyy')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={newer.image_url}
                alt="Recent analysis"
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <div className="space-y-2">
                {newer.skin_health_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Skin Health</span>
                    <span className="font-semibold">{newer.skin_health_score}/100</span>
                  </div>
                )}
                {newer.overall_quality_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Overall Quality</span>
                    <span className="font-semibold">{newer.overall_quality_score}/100</span>
                  </div>
                )}
                {newer.hydration_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Hydration</span>
                    <span className="font-semibold">{newer.hydration_score}/100</span>
                  </div>
                )}
                {newer.texture_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Texture</span>
                    <span className="font-semibold">{newer.texture_score}/100</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <ScoreComparison 
                label="Skin Health Score" 
                score1={older.skin_health_score} 
                score2={newer.skin_health_score} 
              />
              <ScoreComparison 
                label="Overall Quality" 
                score1={older.overall_quality_score} 
                score2={newer.overall_quality_score} 
              />
              <ScoreComparison 
                label="Hydration Score" 
                score1={older.hydration_score} 
                score2={newer.hydration_score} 
              />
              <ScoreComparison 
                label="Texture Score" 
                score1={older.texture_score} 
                score2={newer.texture_score} 
              />
              <ScoreComparison 
                label="Brightness Score" 
                score1={older.brightness_score} 
                score2={newer.brightness_score} 
              />
              <ScoreComparison 
                label="Sharpness Score" 
                score1={older.sharpness_score} 
                score2={newer.sharpness_score} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
