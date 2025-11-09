import { useState } from "react";
import { Camera, Activity, TrendingUp, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { useToast } from "@/hooks/use-toast";

export const DermatologyModule = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock data - foundation for AI integration
  const metrics = [
    { label: 'Skin Health', value: 85, trend: '+2%' },
    { label: 'Hydration', value: 78, trend: '+5%' },
    { label: 'UV Protection', value: 92, trend: 'stable' },
  ];

  const handleCapture = (image: string, blob: Blob) => {
    setCapturedImage(image);
    setShowCamera(false);
    
    toast({
      title: "Image captured successfully",
      description: "Processing your skin analysis...",
    });

    // Here you would send the blob to your AI analysis service
    console.log('Image captured:', { size: blob.size, type: blob.type });
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
                onClick={() => setShowCamera(true)}
              >
                Retake
              </Button>
            </div>
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
