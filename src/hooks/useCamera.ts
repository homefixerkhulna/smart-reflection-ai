import { useState, useRef, useCallback, useEffect } from 'react';

interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
}

interface CaptureResult {
  image: string; // base64 data URL
  blob: Blob;
  quality: QualityMetrics;
}

interface QualityMetrics {
  brightness: number; // 0-100
  sharpness: number; // 0-100
  resolution: { width: number; height: number };
  hasGoodLighting: boolean;
  isSharpEnough: boolean;
  score: number; // Overall quality score 0-100
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    stream: null,
    isActive: false,
    error: null,
    devices: [],
    selectedDeviceId: null,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Get available camera devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setState(prev => ({ ...prev, devices: videoDevices }));
      return videoDevices;
    } catch (err) {
      console.error('Error getting devices:', err);
      return [];
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: deviceId ? undefined : 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setState(prev => ({
        ...prev,
        stream,
        isActive: true,
        error: null,
        selectedDeviceId: deviceId || null,
      }));

      return stream;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to access camera';
      setState(prev => ({ ...prev, error, isActive: false }));
      throw err;
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(prev => ({ ...prev, stream: null, isActive: false }));
  }, [state.stream]);

  // Analyze image quality
  const analyzeQuality = useCallback((imageData: ImageData): QualityMetrics => {
    const { data, width, height } = imageData;
    
    // Calculate brightness (average luminance)
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += luminance;
    }
    const avgBrightness = totalBrightness / (data.length / 4);
    const brightness = Math.round((avgBrightness / 255) * 100);

    // Calculate sharpness (using Laplacian variance)
    let sharpnessSum = 0;
    const pixelCount = width * height;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const center = data[idx];
        const top = data[((y - 1) * width + x) * 4];
        const bottom = data[((y + 1) * width + x) * 4];
        const left = data[(y * width + (x - 1)) * 4];
        const right = data[(y * width + (x + 1)) * 4];
        const laplacian = Math.abs(4 * center - top - bottom - left - right);
        sharpnessSum += laplacian;
      }
    }
    const avgSharpness = sharpnessSum / pixelCount;
    const sharpness = Math.min(100, Math.round((avgSharpness / 50) * 100));

    // Quality thresholds
    const hasGoodLighting = brightness >= 30 && brightness <= 85;
    const isSharpEnough = sharpness >= 40;

    // Calculate overall quality score
    let score = 0;
    score += hasGoodLighting ? 50 : Math.min(50, brightness);
    score += isSharpEnough ? 50 : (sharpness / 40) * 50;

    return {
      brightness,
      sharpness,
      resolution: { width, height },
      hasGoodLighting,
      isSharpEnough,
      score: Math.round(score),
    };
  }, []);

  // Capture image
  const captureImage = useCallback(async (): Promise<CaptureResult> => {
    if (!videoRef.current || !state.isActive) {
      throw new Error('Camera is not active');
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for quality analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const quality = analyzeQuality(imageData);

    // Convert to blob and data URL
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/jpeg',
        0.95
      );
    });

    const image = canvas.toDataURL('image/jpeg', 0.95);

    return { image, blob, quality };
  }, [state.isActive, analyzeQuality]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [state.stream]);

  return {
    videoRef,
    isActive: state.isActive,
    error: state.error,
    devices: state.devices,
    selectedDeviceId: state.selectedDeviceId,
    startCamera,
    stopCamera,
    captureImage,
    getDevices,
  };
};
