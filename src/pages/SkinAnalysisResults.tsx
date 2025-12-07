import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Sparkles, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AnalysisData {
  id: string;
  image_url: string;
  analysis_text: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  confidence_score: number | null;
  triage_suggestion: string | null;
  condition_probabilities: Record<string, number> | null;
  isic_reference_ids: string[] | null;
  skin_health_score: number | null;
  hydration_score: number | null;
  texture_score: number | null;
  created_at: string;
}

export default function SkinAnalysisResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const analysisId = searchParams.get('id');

  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null) => {
    if (!riskLevel) return null;
    
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

      setAnalysis(data as AnalysisData);
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
          analysisContext: analysis?.analysis_text,
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
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">Skin Analysis Results</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis && getRiskBadge(analysis.risk_level)}
            {analysis?.confidence_score && (
              <Badge variant="outline" className="text-xs">
                {Math.round(analysis.confidence_score * 100)}% confidence
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Analysis Image & Risk Info */}
      {analysis?.image_url && (
        <div className="border-b border-border bg-card">
          <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
            <img
              src={analysis.image_url}
              alt="Skin analysis"
              className="w-full max-w-md mx-auto rounded-lg border border-border"
            />
            
            {/* Triage Suggestion */}
            {analysis.triage_suggestion && (
              <div className={`p-4 rounded-lg text-sm ${
                analysis.risk_level === 'HIGH' ? 'bg-destructive/10 border border-destructive/30' :
                analysis.risk_level === 'MEDIUM' ? 'bg-amber-500/10 border border-amber-500/30' :
                'bg-emerald-500/10 border border-emerald-500/30'
              }`}>
                <p className="font-medium mb-1">Recommendation:</p>
                <p className="text-muted-foreground">{analysis.triage_suggestion}</p>
              </div>
            )}

            {/* Condition Probabilities */}
            {analysis.condition_probabilities && Object.keys(analysis.condition_probabilities).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Condition Analysis:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.condition_probabilities)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 4)
                    .map(([condition, probability]) => (
                      <Badge key={condition} variant="outline" className="text-xs">
                        {condition.replace(/_/g, ' ')}: {Math.round((probability as number) * 100)}%
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Health Metrics */}
            {(analysis.skin_health_score || analysis.hydration_score || analysis.texture_score) && (
              <div className="grid grid-cols-3 gap-4">
                {analysis.skin_health_score && (
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{analysis.skin_health_score}%</p>
                    <p className="text-xs text-muted-foreground">Skin Health</p>
                  </div>
                )}
                {analysis.hydration_score && (
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{analysis.hydration_score}%</p>
                    <p className="text-xs text-muted-foreground">Hydration</p>
                  </div>
                )}
                {analysis.texture_score && (
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{analysis.texture_score}%</p>
                    <p className="text-xs text-muted-foreground">Texture</p>
                  </div>
                )}
              </div>
            )}

            {/* ISIC References */}
            {analysis.isic_reference_ids && analysis.isic_reference_ids.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ISIC Reference IDs: {analysis.isic_reference_ids.join(', ')}
                </p>
              </div>
            )}
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
