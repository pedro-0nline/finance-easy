import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/store/useStore';
import { Sparkles, AlertTriangle, Lightbulb, BarChart3, Star, Check, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { InsightType } from '@/types';

export default function InsightsPage() {
  const { insights, markInsightActioned } = useStore();
  const [analyzing, setAnalyzing] = useState(false);

  const typeIcons: Record<InsightType, React.ReactNode> = {
    alert: <AlertTriangle size={16} />,
    recommendation: <Lightbulb size={16} />,
    analysis: <BarChart3 size={16} />,
    opportunity: <Star size={16} />,
  };

  const typeColors: Record<InsightType, string> = {
    alert: 'bg-destructive/10 text-destructive border-destructive/20',
    recommendation: 'bg-info/10 text-info border-info/20',
    analysis: 'bg-success/10 text-success border-success/20',
    opportunity: 'bg-warning/10 text-warning border-warning/20',
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-muted text-muted-foreground',
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast.success('Análise concluída! Novos insights gerados.');
    }, 2000);
  };

  const renderInsights = (list: typeof insights) => (
    <div className="space-y-3">
      {list.map((insight) => (
        <Card key={insight.id} className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${typeColors[insight.type]}`}>
                {typeIcons[insight.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-sm">{insight.title}</h3>
                  <Badge variant="outline" className={priorityColors[insight.priority]}>
                    {{ high: 'Alta', medium: 'Média', low: 'Baixa' }[insight.priority]}
                  </Badge>
                  {insight.actionTaken && <Badge variant="secondary" className="bg-success/10 text-success"><Check size={12} className="mr-1" /> Aplicado</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(insight.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                  {!insight.actionTaken && (
                    <Button size="sm" variant="outline" onClick={() => { markInsightActioned(insight.id); toast.success('Sugestão aplicada!'); }}>
                      Aplicar sugestão
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {list.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum insight nesta categoria</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles size={24} className="text-primary" /> Insights
        </h1>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <><Loader2 size={16} className="mr-2 animate-spin" /> Analisando...</> : 'Analisar agora'}
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="alert">Alertas</TabsTrigger>
          <TabsTrigger value="recommendation">Recomendações</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
          <TabsTrigger value="opportunity">Oportunidades</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderInsights(insights)}</TabsContent>
        <TabsContent value="alert" className="mt-4">{renderInsights(insights.filter((i) => i.type === 'alert'))}</TabsContent>
        <TabsContent value="recommendation" className="mt-4">{renderInsights(insights.filter((i) => i.type === 'recommendation'))}</TabsContent>
        <TabsContent value="analysis" className="mt-4">{renderInsights(insights.filter((i) => i.type === 'analysis'))}</TabsContent>
        <TabsContent value="opportunity" className="mt-4">{renderInsights(insights.filter((i) => i.type === 'opportunity'))}</TabsContent>
      </Tabs>
    </div>
  );
}
