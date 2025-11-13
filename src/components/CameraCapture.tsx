import { useEffect, useState } from 'react';
import { Camera, X, AlertCircle, CheckCircle, Lightbulb, Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (image: string, blob: Blob) => void;
  onClose: () => void;
}

export const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const { videoRef, isActive, error, startCamera, stopCamera, captureImage } = useCamera();
  const [capturing, setCapturing] = useState(false);
  const [quality, setQuality] = useState<{
    brightness: number;
    sharpness: number;
    hasGoodLighting: boolean;
    isSharpEnough: boolean;
    score: number;
  } | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = async () => {
    try {
      setCapturing(true);
      const result = await captureImage();
      setQuality(result.quality);

      // Auto-proceed if quality is good, otherwise show warning
      if (result.quality.score >= 70) {
        setTimeout(() => {
          onCapture(result.image, result.blob);
          stopCamera();
        }, 1000);
      }
    } catch (err) {
      console.error('Capture error:', err);
    } finally {
      setCapturing(false);
    }
  };

  const handleProceed = async () => {
    if (quality) {
      const result = await captureImage();
      onCapture(result.image, result.blob);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setQuality(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Skin Analysis Capture</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Camera Preview */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
              <div className="text-center space-y-2 p-6">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Please allow camera access to continue
                </p>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Lighting Guide Overlay */}
          {isActive && !quality && (
            <>
              {/* Face guide oval */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-80">
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-full animate-pulse" />
                  <div className="absolute inset-4 border border-primary/30 rounded-full" />
                </div>
              </div>

              {/* Guide text */}
              <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                <div className="glass-strong px-4 py-2 rounded-full text-sm">
                  Position your face in the oval
                </div>
              </div>

              {/* Lighting indicators */}
              <div className="absolute bottom-24 left-0 right-0 flex justify-center space-x-4 pointer-events-none">
                <div className="glass-strong px-3 py-2 rounded-lg flex items-center space-x-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span>Good lighting required</span>
                </div>
                <div className="glass-strong px-3 py-2 rounded-lg flex items-center space-x-2 text-sm">
                  <Focus className="w-4 h-4 text-blue-400" />
                  <span>Stay still</span>
                </div>
              </div>
            </>
          )}

          {/* Quality feedback */}
          {quality && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="glass-strong p-6 rounded-2xl max-w-md space-y-4">
                <div className="flex items-center justify-center">
                  {quality.score >= 70 ? (
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  ) : (
                    <AlertCircle className="w-12 h-12 text-yellow-500" />
                  )}
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {quality.score >= 70 ? 'Great capture!' : 'Image quality warning'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quality score: {quality.score}/100
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded",
                    quality.hasGoodLighting ? "bg-green-500/10" : "bg-yellow-500/10"
                  )}>
                    <span>Lighting</span>
                    <span className={quality.hasGoodLighting ? "text-green-500" : "text-yellow-500"}>
                      {quality.hasGoodLighting ? "Good" : "Improve"}
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded",
                    quality.isSharpEnough ? "bg-green-500/10" : "bg-yellow-500/10"
                  )}>
                    <span>Sharpness</span>
                    <span className={quality.isSharpEnough ? "text-green-500" : "text-yellow-500"}>
                      {quality.isSharpEnough ? "Good" : "Hold steady"}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" onClick={handleRetake} className="flex-1">
                    Retake
                  </Button>
                  <Button onClick={handleProceed} className="flex-1">
                    {quality.score >= 70 ? 'Continue' : 'Use Anyway'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {!quality && (
          <div className="p-6 border-t border-border flex justify-center">
            <Button
              size="lg"
              onClick={handleCapture}
              disabled={!isActive || capturing}
              className="rounded-full w-16 h-16 p-0"
            >
              <Camera className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
