import { GradientCard } from "@/components/financeiro/GradientCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Target, DollarSign, TrendingUp, Users, AlertTriangle, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchOportunidades, fetchMetas, fetchAtividades, etapasFunil } from "@/services/comercial";
import { useQuery } from "@tanstack/react-query";
import { fetchMeuTime } from "@/services/pessoas";
import { useDashboardData, getPeriodCutoff, PERIODO_LABELS } from "@/pages/Dashboard";
import { todayStr } from "@/lib/utils";

import { motion } from "framer-motion";

// --- Mocks removidos ---



const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const axisStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-muted/70 dark:bg-muted/60 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold text-foreground">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }} className={className}>
    {children}
  </motion.div>
);

const PERDA_COLORS = [
  'hsl(var(--destructive))',
  'hsl(45 90% 55%)',
  'hsl(var(--primary))',
  'hsl(72 100% 50%)',
  'hsl(var(--muted-foreground))',
];

export default function DashboardComercial() {
  const [periodo, setPeriodo] = useState("30d");
  const [vendedorFilter, setVendedorFilter] = useState("__all__");

  const { dash } = useDashboardData(periodo);
  const { data: oportunidades = [] } = useQuery({ queryKey: ['crm_oportunidades'], queryFn: fetchOportunidades });
  const { data: metas = [] } = useQuery({ queryKey: ['crm_metas'], queryFn: fetchMetas });
  const { data: atividades = [] } = useQuery({ queryKey: ['crm_atividades'], queryFn: fetchAtividades });
  const { data: time = [] } = useQuery({ queryKey: ['meu_time'], queryFn: fetchMeuTime });

  const cutoff = useMemo(() => getPeriodCutoff(periodo), [periodo])

  const filteredOportunidades = useMemo(() => oportunidades.filter(o => {
    const matchPeriodo = o.criado_em ? new Date(o.criado_em) >= cutoff : true
    const matchVendedor = vendedorFilter === "__all__" || String(o.responsavel) === vendedorFilter
    return matchPeriodo && matchVendedor
  }), [oportunidades, cutoff, vendedorFilter])

  const filteredAtividades = useMemo(() => atividades.filter(a => {
    const matchPeriodo = a.data ? new Date(a.data + 'T00:00:00') >= cutoff : true
    const matchVendedor = vendedorFilter === "__all__" || String(a.responsavel) === vendedorFilter
    return matchPeriodo && matchVendedor
  }), [atividades, cutoff, vendedorFilter])

  const filteredMetas = useMemo(() => metas.filter(m =>
    vendedorFilter === "__all__" || String(m.responsavel) === vendedorFilter
  ), [metas, vendedorFilter])

  const pipelineTotal = filteredOportunidades
    .filter(o => !['ganho', 'perdido'].includes(o.estagio))
    .reduce((sum, o) => sum + (Number(o.valor_estimado) || 0), 0);

  // Forecast ponderado por probabilidade de cada etapa
  const forecastMes = filteredOportunidades
    .filter(o => !['ganho', 'perdido'].includes(o.estagio))
    .reduce((sum, o) => {
      const etapa = etapasFunil.find(e => e.id === o.estagio);
      const prob = (etapa?.probabilidade ?? 50) / 100;
      return sum + (Number(o.valor_estimado) || 0) * prob;
    }, 0);

  const metaTotal = filteredMetas.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + Number(m.valor_meta), 0);
  const realizadoTotal = filteredMetas.filter(m => m.tipo === 'receita').reduce((sum, m) => sum + Number(m.valor_realizado), 0);
  const atividadesVencidas = filteredAtividades.filter(a => a.status === 'pendente' && a.data < todayStr()).length;

  const funilData = etapasFunil.filter(e => !['ganho', 'perdido'].includes(e.id)).map(etapa => ({
    name: etapa.nome,
    value: filteredOportunidades.filter(o => o.estagio === etapa.id).length,
    amount: filteredOportunidades.filter(o => o.estagio === etapa.id).reduce((sum, o) => sum + (Number(o.valor_estimado) || 0), 0),
  }));

  // Motivos de perda vindos do backend
  const perdas: { motivo: string; valor: number }[] = dash.comercialData?.perdas ?? [];
  const motivosPerdaData = perdas.length > 0
    ? perdas.map((p, i) => ({ name: p.motivo, value: p.valor, color: PERDA_COLORS[i % PERDA_COLORS.length] }))
    : [{ name: 'Sem dados', value: 1, color: 'hsl(var(--muted-foreground))' }];
  const motivosTotal = perdas.reduce((s, d) => s + d.valor, 0);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <FadeIn>
        <div className="filter-card">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Período:</span>
              <div className="flex gap-1 bg-muted/50 rounded-full p-0.5">
                {["7d", "30d", "90d"].map(p => (
                  <Button key={p} variant={periodo === p ? "default" : "ghost"} size="sm" onClick={() => setPeriodo(p)} className="h-7 px-2.5 text-xs rounded-full">{PERIODO_LABELS[p] ?? p}</Button>
                ))}
              </div>
            </div>
            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger className="w-[180px] h-7 text-xs rounded-full"><SelectValue placeholder="Todos os vendedores" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {time.slice(0, 10).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FadeIn>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard title="Pipeline Total" value={formatCurrency(pipelineTotal)} icon={DollarSign} variant="info" trend={{ value: "+18%", positive: true }} delay={1} />
        <GradientCard title="Forecast Ponderado" value={formatCurrency(forecastMes)} icon={TrendingUp} variant="warning" delay={2} />
        <GradientCard title="Meta vs Realizado" value={`${(realizadoTotal / metaTotal * 100).toFixed(0)}%`} icon={Target} variant="success" delay={3} />
        <GradientCard title="Atividades Vencidas" value={atividadesVencidas.toString()} icon={AlertTriangle} variant="danger" delay={4} />
      </div>

      {/* Hero Dark Accent Card */}
      <FadeIn delay={5}>
        <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-[#0B0D0F] via-[#131619] to-[#0B0D0F] shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-2">Valor Total no Pipeline</p>
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-bold tracking-tight text-white">{formatCurrency(pipelineTotal)}</span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-lime-400/15 text-lime-400 border border-lime-400/20">+18% vs mês anterior</span>
          </div>
        </div>
      </FadeIn>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={6}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold text-foreground mb-5">Pipeline por Etapa</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funilData} layout="vertical" barSize={18}>
                  <defs>
                    <linearGradient id="comFunilGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={110} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar dataKey="value" fill="url(#comFunilGrad)" radius={[12, 12, 12, 12]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={7}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold text-foreground mb-5">Motivos de Perda</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={motivosPerdaData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" cornerRadius={6}>
                    {motivosPerdaData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700 }}>{motivosTotal}</text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>perdas</text>
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              {motivosPerdaData.map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-muted-foreground">{m.name} ({m.value})</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
