import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientCard } from "@/components/financeiro/GradientCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Users, Target, DollarSign, TrendingUp, Filter, ArrowUpRight,
  Megaphone, BarChart3, AlertTriangle, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList, LineChart, Line
} from "recharts";
import { useNavigate } from "react-router-dom";
import { fetchCampanhas, campanhasQueryKey, fetchCanais, canaisQueryKey, fetchLeadsMarketing, leadsMarketingQueryKey } from "@/services/marketing";

const funilMarketingData: any[] = [];
const roiPorCampanhaData: any[] = [];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function VisaoGeralMarketing() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("30d");
  const [canal, setCanal] = useState("__all__");

  const { data: campanhasData = [] as any[] } = useQuery({ queryKey: campanhasQueryKey, queryFn: fetchCampanhas });
  const { data: canaisData = [] as any[] } = useQuery({ queryKey: canaisQueryKey, queryFn: fetchCanais });
  const { data: leadsData = [] as any[] } = useQuery({ queryKey: leadsMarketingQueryKey, queryFn: fetchLeadsMarketing });

  const getMetricasGerais = () => {
    return {
      leads: leadsData.length,
      mql: leadsData.filter((l: any) => l.status === 'mql').length,
      sql: leadsData.filter((l: any) => l.status === 'sql').length,
      cac: 0, roi: 0, pipelineInfluenciado: 0
    };
  };

  const metricas = getMetricasGerais();

  // Campanhas ativas
  const campanhasAtivas = campanhasData.filter((c: any) => c.status === 'ativa').length;

  // Alertas
  const campanhasROINegativo = roiPorCampanhaData.filter(c => c.roi < 0).length;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border border-border rounded p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>
            <div className="flex gap-1">
              {["7d", "30d", "90d", "1y"].map((p) => (
                <Button
                  key={p}
                  variant={periodo === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriodo(p)}
                  className="h-8 px-3"
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Canal:</span>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {canaisData.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard
          title="Leads Captados"
          value={metricas.leads.toString()}
          icon={Users}
          variant="info"
          trend={{ value: "+15%", positive: true }}
        />
        <GradientCard
          title="MQL"
          value={metricas.mql.toString()}
          icon={Target}
          variant="warning"
          trend={{ value: "+8%", positive: true }}
        />
        <GradientCard
          title="SQL"
          value={metricas.sql.toString()}
          icon={TrendingUp}
          variant="success"
          trend={{ value: "+12%", positive: true }}
        />
        <GradientCard
          title="CAC"
          value={formatCurrency(metricas.cac)}
          icon={DollarSign}
          variant="orange"
        />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border rounded p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/marketing/campanhas')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Campanhas Ativas</p>
                <p className="text-2xl font-bold">{campanhasAtivas}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="border border-border rounded p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-success/10">
              <BarChart3 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI Médio</p>
              <p className="text-2xl font-bold text-success">{metricas.roi.toFixed(0)}%</p>
            </div>
          </div>
        </Card>

        <Card className="border border-border rounded p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-warning/10">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pipeline Influenciado</p>
              <p className="text-2xl font-bold">{formatCurrency(metricas.pipelineInfluenciado)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas */}
      {campanhasROINegativo > 0 && (
        <Card className="border border-destructive/50 rounded p-4 bg-destructive/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Atenção: {campanhasROINegativo} campanha(s) com ROI negativo</p>
              <p className="text-sm text-muted-foreground">Revise a performance dessas campanhas</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/marketing/campanhas')}>
              Ver campanhas
            </Button>
          </div>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Marketing */}
        <Card className="border border-border rounded">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Funil de Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funilMarketingData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="etapa" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value, 'Quantidade']}
                  contentStyle={{ background: 'hsl(var(--muted) / 0.7)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: '12px', backdropFilter: 'blur(24px)' }}
                />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[12, 12, 12, 12]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads por Canal */}
        <Card className="border border-border rounded">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Leads por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsPorCanalData}>
                <XAxis dataKey="canal" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--muted) / 0.7)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: '12px', backdropFilter: 'blur(24px)' }}
                />
                <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[12, 12, 12, 12]} />
                <Bar dataKey="mql" name="MQL" fill="hsl(var(--warning))" radius={[12, 12, 12, 12]} />
                <Bar dataKey="sql" name="SQL" fill="hsl(var(--success))" radius={[12, 12, 12, 12]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ROI por Campanha */}
      <Card className="border border-border rounded">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">ROI por Campanha</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/marketing/campanhas')}>
            Ver todas <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roiPorCampanhaData.map((camp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{camp.campanha}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>Gasto: {formatCurrency(camp.gasto)}</span>
                    <span>Receita: {formatCurrency(camp.receita)}</span>
                  </div>
                </div>
                <div className={`text-lg font-bold ${camp.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {camp.roi > 0 ? '+' : ''}{camp.roi.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
