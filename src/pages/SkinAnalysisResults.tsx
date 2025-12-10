import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Sparkles, AlertTriangle, CheckCircle, AlertCircle, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 20 Common diseases with translations
const DISEASE_TRANSLATIONS: Record<string, { en: string; bn: string }> = {
  acne: { en: 'Acne', bn: 'ব্রণ' },
  eczema: { en: 'Eczema', bn: 'একজিমা' },
  psoriasis: { en: 'Psoriasis', bn: 'সোরিয়াসিস' },
  rosacea: { en: 'Rosacea', bn: 'রোসেসিয়া' },
  melasma: { en: 'Melasma', bn: 'মেলাসমা' },
  fungal_infection: { en: 'Fungal Infection', bn: 'ছত্রাক সংক্রমণ' },
  bacterial_infection: { en: 'Bacterial Infection', bn: 'ব্যাকটেরিয়া সংক্রমণ' },
  viral_rash: { en: 'Viral Rash', bn: 'ভাইরাল র‌্যাশ' },
  dermatitis: { en: 'Dermatitis', bn: 'ডার্মাটাইটিস' },
  folliculitis: { en: 'Folliculitis', bn: 'ফলিকুলাইটিস' },
  vitiligo: { en: 'Vitiligo', bn: 'শ্বেতী' },
  urticaria: { en: 'Urticaria', bn: 'আমবাত' },
  allergic_rash: { en: 'Allergic Rash', bn: 'এলার্জিক র‌্যাশ' },
  ringworm: { en: 'Ringworm', bn: 'দাদ' },
  cellulitis: { en: 'Cellulitis', bn: 'সেলুলাইটিস' },
  sunburn: { en: 'Sunburn', bn: 'রোদে পোড়া' },
  keratosis: { en: 'Keratosis', bn: 'কেরাটোসিস' },
  scabies: { en: 'Scabies', bn: 'খোসপাঁচড়া' },
  impetigo: { en: 'Impetigo', bn: 'ইম্পেটিগো' },
  skin_aging: { en: 'Skin Aging', bn: 'ত্বকের বার্ধক্য' },
};

interface AnalysisData {
  id: string;
  image_url: string;
  analysis_text: string;
  analysis_text_bn: string | null;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  confidence_score: number | null;
  triage_suggestion: string | null;
  triage_suggestion_bn: string | null;
  condition_probabilities: Record<string, number> | null;
  disease_probabilities: Record<string, number> | null;
  visual_features: { en: string[]; bn: string[] } | null;
  general_skin_info: { en: string; bn: string } | null;
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
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const analysisId = searchParams.get('id');

  const getRiskBadge = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null) => {
    if (!riskLevel) return null;
    
    const labels = {
      HIGH: { en: 'High Risk', bn: 'উচ্চ ঝুঁকি' },
      MEDIUM: { en: 'Medium Risk', bn: 'মাঝারি ঝুঁকি' },
      LOW: { en: 'Low Risk', bn: 'কম ঝুঁকি' },
    };
    
    switch (riskLevel) {
      case 'HIGH':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {labels.HIGH[language]}
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            {labels.MEDIUM[language]}
          </Badge>
        );
      case 'LOW':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            {labels.LOW[language]}
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

      // Cast JSON fields properly
      const analysisData: AnalysisData = {
        ...data,
        risk_level: data.risk_level as 'LOW' | 'MEDIUM' | 'HIGH' | null,
        visual_features: data.visual_features as { en: string[]; bn: string[] } | null,
        general_skin_info: data.general_skin_info as { en: string; bn: string } | null,
        disease_probabilities: data.disease_probabilities as Record<string, number> | null,
        condition_probabilities: data.condition_probabilities as Record<string, number> | null,
      };
      setAnalysis(analysisData);
      setMessages([
        {
          role: 'assistant',
          content: language === 'en'
            ? `Here's your skin analysis:\n\n${data.analysis_text}\n\nFeel free to ask me any questions about your skin health!`
            : `এখানে আপনার ত্বক বিশ্লেষণ:\n\n${data.analysis_text_bn || data.analysis_text}\n\nআপনার ত্বকের স্বাস্থ্য সম্পর্কে যেকোনো প্রশ্ন করতে পারেন!`,
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
          analysisContext: language === 'en' ? analysis?.analysis_text : (analysis?.analysis_text_bn || analysis?.analysis_text),
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

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.7) return 'bg-destructive';
    if (prob >= 0.4) return 'bg-amber-500';
    if (prob >= 0.2) return 'bg-yellow-500';
    return 'bg-emerald-500';
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
              <h1 className="text-lg font-semibold">
                {language === 'en' ? 'Skin Analysis Results' : 'ত্বক বিশ্লেষণ ফলাফল'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1"
            >
              <Languages className="w-4 h-4" />
              {language === 'en' ? 'বাংলা' : 'English'}
            </Button>
            {analysis && getRiskBadge(analysis.risk_level)}
            {analysis?.confidence_score && (
              <Badge variant="outline" className="text-xs">
                {Math.round(analysis.confidence_score * 100)}% {language === 'en' ? 'confidence' : 'নির্ভরযোগ্যতা'}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Analysis Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Analysis Image */}
          {analysis?.image_url && (
            <div className="space-y-4">
              <img
                src={analysis.image_url}
                alt="Skin analysis"
                className="w-full max-w-md mx-auto rounded-lg border border-border"
              />
            </div>
          )}

          {/* General Skin Info */}
          {analysis?.general_skin_info && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold mb-2">
                {language === 'en' ? 'General Skin Information' : 'সাধারণ ত্বকের তথ্য'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? analysis.general_skin_info.en 
                  : analysis.general_skin_info.bn || analysis.general_skin_info.en}
              </p>
            </div>
          )}

          {/* Visual Features */}
          {analysis?.visual_features && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold mb-2">
                {language === 'en' ? 'Visual Features Observed' : 'পর্যবেক্ষণ করা দৃশ্যমান বৈশিষ্ট্য'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(language === 'en' 
                  ? analysis.visual_features.en 
                  : analysis.visual_features.bn || analysis.visual_features.en
                )?.map((feature, index) => (
                  <Badge key={index} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Triage Suggestion */}
          {analysis?.triage_suggestion && (
            <div className={`p-4 rounded-lg text-sm ${
              analysis.risk_level === 'HIGH' ? 'bg-destructive/10 border border-destructive/30' :
              analysis.risk_level === 'MEDIUM' ? 'bg-amber-500/10 border border-amber-500/30' :
              'bg-emerald-500/10 border border-emerald-500/30'
            }`}>
              <p className="font-medium mb-1">
                {language === 'en' ? 'Recommendation:' : 'সুপারিশ:'}
              </p>
              <p className="text-muted-foreground">
                {language === 'en' 
                  ? analysis.triage_suggestion 
                  : analysis.triage_suggestion_bn || analysis.triage_suggestion}
              </p>
            </div>
          )}

          {/* 20 Common Diseases Probability */}
          {analysis?.disease_probabilities && Object.keys(analysis.disease_probabilities).length > 0 && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold mb-4">
                {language === 'en' ? '20 Common Diseases Analysis' : '২০টি সাধারণ রোগের বিশ্লেষণ'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(analysis.disease_probabilities)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([disease, probability]) => {
                    const prob = probability as number;
                    const translation = DISEASE_TRANSLATIONS[disease] || { en: disease.replace(/_/g, ' '), bn: disease };
                    return (
                      <div key={disease} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">
                            {language === 'en' ? translation.en : translation.bn}
                          </span>
                          <span className="font-medium">{Math.round(prob * 100)}%</span>
                        </div>
                        <Progress 
                          value={prob * 100} 
                          className="h-2"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ISIC Condition Probabilities */}
          {analysis?.condition_probabilities && Object.keys(analysis.condition_probabilities).length > 0 && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold mb-2">
                {language === 'en' ? 'ISIC Condition Analysis' : 'ISIC অবস্থা বিশ্লেষণ'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analysis.condition_probabilities)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([condition, probability]) => (
                    <Badge key={condition} variant="outline" className="text-xs">
                      {condition.replace(/_/g, ' ')}: {Math.round((probability as number) * 100)}%
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Health Metrics */}
          {(analysis?.skin_health_score || analysis?.hydration_score || analysis?.texture_score) && (
            <div className="grid grid-cols-3 gap-4">
              {analysis.skin_health_score && (
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{analysis.skin_health_score}%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Skin Health' : 'ত্বকের স্বাস্থ্য'}
                  </p>
                </div>
              )}
              {analysis.hydration_score && (
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{analysis.hydration_score}%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Hydration' : 'হাইড্রেশন'}
                  </p>
                </div>
              )}
              {analysis.texture_score && (
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{analysis.texture_score}%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Texture' : 'টেক্সচার'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ISIC References */}
          {analysis?.isic_reference_ids && analysis.isic_reference_ids.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                ISIC Reference IDs: {analysis.isic_reference_ids.join(', ')}
              </p>
            </div>
          )}

          {/* Chat Section */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-4">
              {language === 'en' ? 'Ask Questions' : 'প্রশ্ন করুন'}
            </h3>
            <div className="space-y-4">
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
              placeholder={language === 'en' 
                ? 'Ask me anything about your skin analysis...'
                : 'আপনার ত্বক বিশ্লেষণ সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন...'}
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
            {language === 'en' 
              ? 'Press Enter to send, Shift + Enter for new line'
              : 'পাঠাতে Enter চাপুন, নতুন লাইনের জন্য Shift + Enter'}
          </p>
        </div>
      </div>
    </div>
  );
}
