import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Analysis {
  id: string;
  created_at: string;
  skin_health_score: number | null;
  overall_quality_score: number | null;
  hydration_score: number | null;
  texture_score: number | null;
  brightness_score: number | null;
  sharpness_score: number | null;
}

export default function AnalysisTrends() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('skin_analyses')
        .select('id, created_at, skin_health_score, overall_quality_score, hydration_score, texture_score, brightness_score, sharpness_score')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = analyses.map(analysis => ({
    date: format(new Date(analysis.created_at), 'MMM d'),
    fullDate: format(new Date(analysis.created_at), 'PPP'),
    skinHealth: analysis.skin_health_score,
    hydration: analysis.hydration_score,
    texture: analysis.texture_score,
    brightness: analysis.brightness_score,
    sharpness: analysis.sharpness_score,
    overallQuality: analysis.overall_quality_score,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong p-4 rounded-lg border border-border">
          <p className="text-sm font-semibold text-foreground mb-2">
            {payload[0].payload.fullDate}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/history')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Trends & Analytics</h1>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No analysis data available yet. Complete at least one skin analysis to see trends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/history')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trends & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your skin health progress over time
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Skin Health Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      color: 'hsl(var(--foreground))' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="skinHealth" 
                    name="Skin Health"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hydration" 
                    name="Hydration"
                    stroke="hsl(189 94% 65%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(189 94% 65%)', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="texture" 
                    name="Texture"
                    stroke="hsl(280 60% 70%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(280 60% 70%)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Image Quality Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Image Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      color: 'hsl(var(--foreground))' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overallQuality" 
                    name="Overall Quality"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="brightness" 
                    name="Brightness"
                    stroke="hsl(45 93% 65%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(45 93% 65%)', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sharpness" 
                    name="Sharpness"
                    stroke="hsl(340 75% 65%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(340 75% 65%)', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{analyses.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Latest Skin Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {analyses[analyses.length - 1]?.skin_health_score || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tracking Since
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-foreground">
                  {format(new Date(analyses[0]?.created_at), 'MMM yyyy')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
