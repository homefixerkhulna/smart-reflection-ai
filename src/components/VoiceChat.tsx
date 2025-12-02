import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, X, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: any[];
}

export function VoiceChat({ isOpen, onClose, analyses }: VoiceChatProps) {
  const { toast } = useToast();
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI || !window.speechSynthesis) {
      setIsSupported(false);
      setError('Voice features not supported in this browser. Try Chrome or Edge.');
      return;
    }
    synthRef.current = window.speechSynthesis;
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setState('speaking');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    
    synthRef.current.speak(utterance);
  }, []);

  const processWithAI = useCallback(async (userText: string) => {
    setState('processing');
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use voice assistant');
      }

      const analysisContext = analyses
        .map(a => `Analysis from ${new Date(a.created_at).toLocaleDateString()}:\n${a.analysis_text}\nScores: Health ${a.skin_health_score}, Quality ${a.overall_quality_score}, Hydration ${a.hydration_score}, Texture ${a.texture_score}`)
        .join('\n\n');

      const { data, error: fnError } = await supabase.functions.invoke('skin-chat', {
        body: {
          messages: [{ role: 'user', content: userText }],
          analysisContext: analysisContext,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data?.response) {
        setResponse(data.response);
        speak(data.response);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setState('idle');
      toast({
        title: 'Voice Chat Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [analyses, speak, toast]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    
    setError(null);
    setTranscript('');
    setResponse('');
    
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'bn-BD';

    recognitionRef.current.onstart = () => {
      setState('listening');
    };

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        processWithAI(finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`);
      }
      setState('idle');
    };

    recognitionRef.current.onend = () => {
      if (state === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current.start();
  }, [isSupported, processWithAI, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setState('idle');
  }, []);

  const handleMicClick = () => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'idle') {
      startListening();
    }
  };

  const handleClose = () => {
    stopListening();
    setTranscript('');
    setResponse('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl p-6 w-[350px] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Voice Chat</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!isSupported ? (
          <div className="text-center text-destructive py-4">
            {error}
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 py-6">
              <Button
                size="lg"
                onClick={handleMicClick}
                disabled={state === 'processing' || state === 'speaking'}
                className={cn(
                  'h-20 w-20 rounded-full transition-all duration-300',
                  state === 'listening' && 'bg-destructive hover:bg-destructive/90 animate-pulse',
                  state === 'processing' && 'bg-muted cursor-wait',
                  state === 'speaking' && 'bg-primary/80',
                  state === 'idle' && 'bg-primary hover:bg-primary/90'
                )}
              >
                {state === 'listening' ? (
                  <MicOff className="h-8 w-8" />
                ) : state === 'processing' ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : state === 'speaking' ? (
                  <Volume2 className="h-8 w-8 animate-pulse" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>

              <div className="text-sm text-muted-foreground">
                {state === 'listening' && (
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    Listening...
                  </span>
                )}
                {state === 'processing' && 'Processing...'}
                {state === 'speaking' && 'Speaking...'}
                {state === 'idle' && 'Tap to speak'}
              </div>
            </div>

            {transcript && (
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">You said:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}

            {response && (
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Assistant:</p>
                <p className="text-sm">{response}</p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
