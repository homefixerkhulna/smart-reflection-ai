import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function SkinAnalysisResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const analysisId = searchParams.get('id');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchAnalysis = async () => {
      if (!analysisId) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('skin_analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({
          title: 'Error',
          description: 'Failed to load analysis',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setAnalysis(data);
      setMessages([
        {
          role: 'assistant',
          content: `Here's your skin analysis:\n\n${data.analysis_text}\n\nFeel free to ask me any questions about your skin health!`,
        },
      ]);
      setLoading(false);
    };

    fetchAnalysis();
  }, [analysisId, user, navigate, toast]);

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
      const { data, error } = await supabase.functions.invoke('skin-chat', {
        body: {
          messages: [...messages, { role: 'user', content: userMessage }],
          analysisContext: analysis.analysis_text,
        },
      });

      if (error) throw error;

      if (data?.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Skin Analysis Results</h1>
          </div>
        </div>
      </header>

      {/* Analysis Image */}
      {analysis?.image_url && (
        <div className="border-b border-border bg-card">
          <div className="container max-w-4xl mx-auto px-4 py-6">
            <img
              src={analysis.image_url}
              alt="Skin analysis"
              className="w-full max-w-md mx-auto rounded-lg border border-border"
            />
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4">
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
              placeholder="Ask me anything about your skin analysis..."
              className="min-h-[60px] resize-none"
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
