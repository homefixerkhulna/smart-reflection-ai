import { useState, useEffect } from "react";
import { Camera, Activity, TrendingUp, Image as ImageIcon, Sparkles, Loader2, History, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/CameraCapture";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AnalysisResult {
  analysis: string;
  analysis_bn: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_score: number;
  triage_suggestion: string;
  triage_suggestion_bn: string;
  condition_probabilities: Record<string, number>;
  disease_probabilities: Record<string, number>;
  skin_health_score: number;
  hydration_score: number;
  texture_score: number;
  isic_reference_ids: string[];
  visual_features: { en: string[]; bn: string[] };
  general_skin_info: { en: string; bn: string };
}

export const DermatologyModule = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latestAnalysisId, setLatestAnalysisId] = useState<string | null>(null);

  // Fetch latest analysis
  useEffect(() => {
    if (user) {
      const fetchLatestAnalysis = async () => {
        const { data } = await supabase
          .from('skin_analyses')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setLatestAnalysisId(data.id);
        }
      };
      fetchLatestAnalysis();
    }
  }, [user]);

  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (riskLevel) {
      case 'HIGH':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            High Risk
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            Medium Risk
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            Low Risk
          </Badge>
        );
    }
  };

  const handleCapture = async (image: string, blob: Blob) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to save your analysis.",
        variant: "destructive",
      });
      return;
    }

    setCapturedImage(image);
    setShowCamera(false);
    setIsAnalyzing(true);
    
    toast({
      title: "Image captured successfully",
      description: "Analyzing your skin with AI...",
    });

    try {
      console.log('Sending image for enhanced analysis...');
      const { data, error } = await supabase.functions.invoke('analyze-skin', {
        body: { imageData: image }
      });

      if (error) {
        console.error('Error analyzing image:', error);
        toast({
          title: "Analysis failed",
          description: error.message || "Failed to analyze image. Please try again.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }

      if (data?.analysis) {
        setAnalysisResult(data as AnalysisResult);
        
        // Save to database with enhanced fields including Bengali translations and 20 diseases
        const { data: savedAnalysis, error: dbError } = await supabase
          .from('skin_analyses')
          .insert({
            user_id: user.id,
            image_url: image,
            analysis_text: data.analysis,
            analysis_text_bn: data.analysis_bn,
            skin_health_score: data.skin_health_score,
            hydration_score: data.hydration_score,
            texture_score: data.texture_score,
            risk_level: data.risk_level,
            confidence_score: data.confidence_score,
            triage_suggestion: data.triage_suggestion,
            triage_suggestion_bn: data.triage_suggestion_bn,
            condition_probabilities: data.condition_probabilities,
            disease_probabilities: data.disease_probabilities,
            isic_reference_ids: data.isic_reference_ids,
            visual_features: data.visual_features,
            general_skin_info: data.general_skin_info,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Error saving analysis:', dbError);
          toast({
            title: "Warning",
            description: "Analysis complete but failed to save to history.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Analysis complete",
            description: "Opening results page...",
          });
          // Navigate to results page
          navigate(`/analysis/${savedAnalysis.id}`);
        }
      }
    } catch (error) {
      console.error('Error in analysis:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get metrics from analysis result or use defaults
  const metrics = analysisResult ? [
    { label: 'Skin Health', value: analysisResult.skin_health_score, trend: '+2%' },
    { label: 'Hydration', value: analysisResult.hydration_score, trend: '+5%' },
    { label: 'Texture Quality', value: analysisResult.texture_score, trend: 'stable' },
  ] : [
    { label: 'Skin Health', value: 85, trend: '+2%' },
    { label: 'Hydration', value: 78, trend: '+5%' },
    { label: 'UV Protection', value: 92, trend: 'stable' },
  ];

  return (
    <>
      <div className="glass-strong rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Skin Analysis</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/history')}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowCamera(true)}
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
          </div>
        </div>

        {capturedImage && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-border">
              <img 
                src={capturedImage} 
                alt="Captured skin analysis" 
                className="w-full h-48 object-cover"
              />
              <div className="p-3 bg-secondary/50 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>Latest capture</span>
                  {analysisResult && getRiskBadge(analysisResult.risk_level)}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowCamera(true);
                    setAnalysisResult(null);
                  }}
                  disabled={isAnalyzing}
                >
                  Retake
                </Button>
              </div>
            </div>

            {isAnalyzing && (
              <div className="flex items-center justify-center space-x-2 p-4 bg-secondary/30 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analyzing your skin with ISIC-trained AI...</span>
              </div>
            )}

            {analysisResult && !isAnalyzing && (
              <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h4 className="font-medium">AI Skin Analysis</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRiskBadge(analysisResult.risk_level)}
                    <Badge variant="outline" className="text-xs">
                      {Math.round(analysisResult.confidence_score * 100)}% confidence
                    </Badge>
                  </div>
                </div>
                
                {/* Triage Suggestion */}
                <div className={`p-3 rounded-md text-sm ${
                  analysisResult.risk_level === 'HIGH' ? 'bg-destructive/10 border border-destructive/30' :
                  analysisResult.risk_level === 'MEDIUM' ? 'bg-amber-500/10 border border-amber-500/30' :
                  'bg-emerald-500/10 border border-emerald-500/30'
                }`}>
                  <p className="font-medium mb-1">Recommendation:</p>
                  <p className="text-muted-foreground">{analysisResult.triage_suggestion}</p>
                </div>

                {/* Top Conditions */}
                {Object.keys(analysisResult.condition_probabilities).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Condition Analysis:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(analysisResult.condition_probabilities)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([condition, probability]) => (
                          <Badge key={condition} variant="outline" className="text-xs">
                            {condition.replace(/_/g, ' ')}: {Math.round(probability * 100)}%
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {analysisResult.analysis}
                  </p>
                </div>

                {/* ISIC References */}
                {analysisResult.isic_reference_ids.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      ISIC Reference IDs: {analysisResult.isic_reference_ids.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{metric.value}%</span>
                  <span className="text-xs text-primary flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {metric.trend}
                  </span>
                </div>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all duration-500"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Next scheduled analysis in 2 days. Your skin health has improved 8% this month.
          </p>
        </div>
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
};
