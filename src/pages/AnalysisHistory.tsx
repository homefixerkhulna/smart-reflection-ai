import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Activity, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Analysis {
  id: string;
  image_url: string;
  created_at: string;
  skin_health_score: number | null;
  overall_quality_score: number | null;
  hydration_score: number | null;
  texture_score: number | null;
}

export default function AnalysisHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('skin_analyses')
        .select('id, image_url, created_at, skin_health_score, overall_quality_score, hydration_score, texture_score')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('skin_analyses')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setAnalyses(analyses.filter(a => a.id !== deleteId));
      toast({
        title: "Analysis deleted",
        description: "The analysis has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete the analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analysis History</h1>
            <p className="text-muted-foreground mt-1">View all your past skin analyses</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-64" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
            <p className="text-muted-foreground mb-6">
              Capture your first skin analysis to get started
            </p>
            <Button onClick={() => navigate('/')}>
              Start Analysis
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="overflow-hidden transition-all hover:shadow-lg"
              >
                <div 
                  className="relative h-64 bg-muted cursor-pointer"
                  onClick={() => navigate(`/analysis/${analysis.id}`)}
                >
                  <img
                    src={analysis.image_url}
                    alt="Skin analysis"
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(analysis.created_at), 'MMM dd, yyyy • HH:mm')}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(analysis.id);
                      }}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {analysis.skin_health_score !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">Skin Health</span>
                        <span className="font-semibold text-primary">{analysis.skin_health_score}/100</span>
                      </div>
                    )}
                    {analysis.overall_quality_score !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">Overall Quality</span>
                        <span className="font-semibold text-primary">{analysis.overall_quality_score}/100</span>
                      </div>
                    )}
                    {analysis.hydration_score !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">Hydration</span>
                        <span className="font-semibold text-primary">{analysis.hydration_score}/100</span>
                      </div>
                    )}
                    {analysis.texture_score !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-foreground">Texture</span>
                        <span className="font-semibold text-primary">{analysis.texture_score}/100</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
