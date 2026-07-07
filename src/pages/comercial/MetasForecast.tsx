import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GradientCard } from "@/components/financeiro/GradientCard";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { Target, TrendingUp, DollarSign, BarChart3, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { fetchMetas, fetchOportunidades, etapasFunil } from "@/services/comercial";
import { useQuery } from "@tanstack/react-query";
import { fetchMeuTime } from "@/services/pessoas";

// --- Mocks removidos ---




const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function MetasForecast() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("");
  const [vendedorFilter, setVendedorFilter] = useState("");

  const { data: metasData = [], isLoading: isLoadingMetas } = useQuery({ queryKey: ['crm_metas'], queryFn: fetchMetas });
  const { data: oportunidades = [] } = useQuery({ queryKey: ['crm_oportunidades'], queryFn: fetchOportunidades });
  const { data: time = [] } = useQuery({ queryKey: ['meu_time'], queryFn: fetchMeuTime });

  const selectedPeriodo = periodo || "2026-03";

  // Forecast ponderado real baseado nas oportunidades abertas
  const forecastPonderado = oportunidades
    .filter(o => !['ganho', 'perdido'].includes(o.estagio))
    .reduce((sum, o) => sum + (Number(o.valor_estimado) * (o.probabilidade / 100)), 0);

  const metasPeriodo = metasData.filter(m => m.periodo === selectedPeriodo && m.tipo === 'receita');
  const metaTotal = metasPeriodo.reduce((sum, m) => sum + Number(m.valor_meta), 0);
  const realizadoTotal = metasPeriodo.reduce((sum, m) => sum + Number(m.valor_realizado), 0);
  const gapMeta = metaTotal - realizadoTotal;
  const progressoMeta = metaTotal > 0 ? (realizadoTotal / metaTotal) * 100 : 0;

  const vendedoresData = time.slice(0, 10).map(p => {
    const metas = metasData.filter(m => m.responsavel === p.id && m.periodo === selectedPeriodo);
    const metaReceita = metas.find(m => m.tipo === 'receita');
    const ops = oportunidades.filter(o => o.responsavel === p.id && !['ganho', 'perdido'].includes(o.estagio));
    const forecast = ops.reduce((sum, o) => sum + (Number(o.valor_estimado) * o.probabilidade / 100), 0);
    return {
      nome: p.nome.split(' ')[0],
      meta: Number(metaReceita?.valor_meta || 0),
      realizado: Number(metaReceita?.valor_realizado || 0),
      forecast,
      pipeline: ops.reduce((sum, o) => sum + Number(o.valor_estimado), 0)
    };
  });

  const evolucaoData = [
    { mes: 'Jan', meta: 450000, realizado: 420000, forecast: 480000 },
    { mes: 'Fev', meta: 450000, realizado: realizadoTotal, forecast: forecastPonderado },
    { mes: 'Mar', meta: 500000, realizado: 0, forecast: 520000 },
    { mes: 'Abr', meta: 500000, realizado: 0, forecast: 510000 },
  ];

  const getExportData = () => vendedoresData.map(v => ({ Vendedor: v.nome, Meta: formatCurrency(v.meta), Realizado: formatCurrency(v.realizado), Forecast: formatCurrency(v.forecast), Pipeline: formatCurrency(v.pipeline) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate('/comercial/metas/nova')} className="gap-2">
          <Plus className="w-4 h-4" /> Criar Meta
        </Button>
        <ExportButton getData={getExportData} fileName="metas-forecast" />
      </div>

      <FilterSection
        fields={[
          {
            type: "select", label: "Período", placeholder: "Selecione", value: periodo, onChange: setPeriodo, options: [
              { value: "2026-01", label: "Janeiro 2026" }, { value: "2026-02", label: "Fevereiro 2026" },
              { value: "2026-03", label: "Março 2026" }, { value: "2026-Q1", label: "Q1 2026" }, { value: "2026", label: "Ano 2026" }
            ], width: "min-w-[160px]"
          },
          {
            type: "select", label: "Vendedor", placeholder: "Todos", value: vendedorFilter, onChange: setVendedorFilter,
            options: time.map(p => ({ value: String(p.id), label: p.nome })), width: "min-w-[200px]"
          }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard title="Meta do Período" value={formatCurrency(metaTotal)} icon={Target} variant="info" />
        <GradientCard title="Realizado" value={formatCurrency(realizadoTotal)} icon={DollarSign} variant="success" trend={{ value: `${progressoMeta.toFixed(0)}%`, positive: progressoMeta >= 80 }} />
        <GradientCard title="Forecast Ponderado" value={formatCurrency(forecastPonderado)} icon={TrendingUp} variant="warning" />
        <GradientCard title="Gap para Meta" value={formatCurrency(gapMeta)} icon={BarChart3} variant={gapMeta > 0 ? "danger" : "success"} />
      </div>

      <Card className="border border-border rounded">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Progresso da Meta</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Realizado vs Meta</span>
              <span className="font-semibold">{progressoMeta.toFixed(1)}%</span>
            </div>
            <Progress value={progressoMeta} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-success">{formatCurrency(realizadoTotal)} realizado</span>
              <span className="text-muted-foreground">{formatCurrency(metaTotal)} meta</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border rounded">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Metas por Vendedor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendedoresData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="nome" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="meta" name="Meta" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-border rounded">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Forecast por Vendedor</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendedoresData.map(v => {
                const atingimento = v.meta > 0 ? ((v.realizado + v.forecast) / v.meta) * 100 : 0;
                return (
                  <div key={v.nome} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{v.nome}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Forecast: {formatCurrency(v.forecast)}</span>
                        <span className={atingimento >= 100 ? 'text-success' : atingimento >= 80 ? 'text-warning' : 'text-destructive'}>
                          {atingimento.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="bg-success rounded-l" style={{ width: `${Math.min(v.realizado / v.meta * 100, 100)}%` }} />
                      <div className="bg-warning/60 rounded-r" style={{ width: `${Math.min(v.forecast / v.meta * 100, 100 - (v.realizado / v.meta * 100))}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border rounded">
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Evolução Meta vs Realizado vs Forecast</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucaoData}>
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="meta" name="Meta" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="realizado" name="Realizado" stroke="hsl(var(--success))" strokeWidth={2} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="hsl(var(--warning))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
