import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2, MessageSquare, X, Mic } from 'lucide-react';
import { VoiceChat } from './VoiceChat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface DermatologyChatProps {
  analyses: any[];
}

export function DermatologyChat({ analyses }: DermatologyChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "আসসালামু আলাইকুম! আমি আপনার ব্যক্তিগত এআই ডার্মাটোলজি অ্যাসিস্ট্যান্ট। আপনার ত্বকের স্বাস্থ্য বা সাধারণ চর্মরোগ সংক্রান্ত যেকোনো প্রশ্ন আমাকে করতে পারেন।",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const analysisContext = analyses
        .map(a => `Analysis from ${new Date(a.created_at).toLocaleDateString()}:\n${a.analysis_text}\nScores: Health ${a.skin_health_score}, Quality ${a.overall_quality_score}, Hydration ${a.hydration_score}, Texture ${a.texture_score}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('skin-chat', {
        body: {
          messages: [...messages, { role: 'user', content: userMessage }],
          analysisContext: analysisContext,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data?.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);

      let errorMessage = 'Failed to get response. Please try again.';
      if (error.message) {
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.error) {
            errorMessage = parsedError.error;
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'AI Assistant Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
        <Button
          size="icon"
          className="rounded-full w-16 h-16"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-28 right-8 z-50 w-[400px] h-[600px] bg-card border border-border rounded-lg shadow-xl flex flex-col">
          <header className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold">AI Dermatology Assistant</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsVoiceChatOpen(true)}
            >
              <Mic className="w-5 h-5" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about your skin..."
                className="min-h-[50px] resize-none"
                disabled={isSending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                size="icon"
                className="h-[50px] w-[50px]"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <VoiceChat
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
        analyses={analyses}
      />
    </>
  );
}
