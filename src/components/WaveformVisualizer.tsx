import { useEffect, useRef, useState } from "react";

interface WaveformVisualizerProps {
  isActive: boolean;
  barCount?: number;
  radius?: number;
  color?: string;
}

const WaveformVisualizer = ({
  isActive,
  barCount = 32,
  radius = 48,
  color = "hsl(var(--destructive))",
}: WaveformVisualizerProps) => {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!isActive) {
      // Cleanup
      animFrameRef.current && cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      analyserRef.current = null;
      setHasPermission(false);
      // Draw idle state
      drawIdle();
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyserRef.current = analyser;
        setHasPermission(true);
        draw();
      } catch {
        setHasPermission(false);
      }
    };

    const draw = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const c = canvas.getContext("2d");
      if (!c) return;

      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      c.clearRect(0, 0, size, size);

      const r = (radius / 56) * (size / 2); // scale radius to canvas
      const maxBarHeight = (size / 2) - r - 4;

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const dataIdx = Math.floor((i / barCount) * data.length);
        const value = data[dataIdx] / 255;
        const barH = Math.max(3, value * maxBarHeight);

        const x1 = cx + Math.cos(angle) * (r + 2);
        const y1 = cy + Math.sin(angle) * (r + 2);
        const x2 = cx + Math.cos(angle) * (r + 2 + barH);
        const y2 = cy + Math.sin(angle) * (r + 2 + barH);

        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.strokeStyle = color;
        c.globalAlpha = 0.4 + value * 0.6;
        c.lineWidth = Math.max(2, (size / 2) * 0.06);
        c.lineCap = "round";
        c.stroke();
        c.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    init();

    return () => {
      cancelled = true;
      animFrameRef.current && cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      analyserRef.current = null;
    };
  }, [isActive, barCount, radius, color]);

  const drawIdle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, canvas.width, canvas.height);
  };

  const canvasSize = (radius + 28) * 2;

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize * 2}
      height={canvasSize * 2}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default WaveformVisualizer;
