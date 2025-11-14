import { useState } from "react";
import { Camera, Activity, TrendingUp, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const DermatologyModule = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data - foundation for AI integration
  const metrics = [
    { label: 'Skin Health', value: 85, trend: '+2%' },
    { label: 'Hydration', value: 78, trend: '+5%' },
    { label: 'UV Protection', value: 92, trend: 'stable' },
  ];

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
      console.log('Sending image for analysis...');
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
        setAnalysis(data.analysis);
        
        // Save to database
        const { data: savedAnalysis, error: dbError } = await supabase
          .from('skin_analyses')
          .insert({
            user_id: user.id,
            image_url: image,
            analysis_text: data.analysis,
            skin_health_score: 85,
            hydration_score: 78,
            texture_score: 82,
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

  return (
    <>
      <div className="glass-strong rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Skin Analysis</h3>
          </div>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowCamera(true)}
          >
            <Camera className="w-4 h-4 mr-2" />
            Capture
          </Button>
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
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowCamera(true);
                    setAnalysis(null);
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
                <span className="text-sm text-muted-foreground">Analyzing your skin...</span>
              </div>
            )}

            {analysis && !isAnalyzing && (
              <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h4 className="font-medium">AI Skin Analysis</h4>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {analysis}
                  </p>
                </div>
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
