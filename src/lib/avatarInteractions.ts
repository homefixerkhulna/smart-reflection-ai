import type { AvatarViewer } from "./gltfViewer";

export type AvatarState = "idle" | "listening" | "speaking" | "thinking";

interface AvatarInteractions {
  setState: (state: AvatarState) => void;
  startMic: () => void;
  stopMic: () => void;
  dispose: () => void;
}

/**
 * Attach lightweight interaction helpers to an AvatarViewer.
 * Provides microphone-level reactivity (scale pulse) and state management.
 */
export async function attachAvatarInteractions(
  container: HTMLElement,
  viewer: AvatarViewer
): Promise<AvatarInteractions> {
  let currentState: AvatarState = "idle";
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let mediaStream: MediaStream | null = null;
  let micAnimId = 0;
  let disposed = false;

  const setState = (state: AvatarState) => {
    currentState = state;
  };

  // ---- Mic-driven pulse ----
  const startMic = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (disposed || !analyser) return;
        micAnimId = requestAnimationFrame(tick);

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length / 255; // 0‒1

        // Apply subtle scale pulse based on mic volume
        const scale = 1 + avg * 0.03;
        viewer.model.scale.setScalar(scale);
      };
      tick();
    } catch (err) {
      console.warn("Microphone access denied or unavailable:", err);
    }
  };

  const stopMic = () => {
    cancelAnimationFrame(micAnimId);
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    analyser = null;
    viewer.model.scale.setScalar(1);
  };

  const dispose = () => {
    disposed = true;
    stopMic();
  };

  return { setState, startMic, stopMic, dispose };
}
