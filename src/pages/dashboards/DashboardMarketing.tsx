import { GradientCard } from "@/components/financeiro/GradientCard";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Target, DollarSign, TrendingUp, Users, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { fetchCampanhas, fetchCanais, fetchLeadsMarketing } from "@/services/marketing";
import { useQuery } from "@tanstack/react-query";
import { getPeriodCutoff, PERIODO_LABELS } from "@/pages/Dashboard";
import { motion } from "framer-motion";

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

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}>
    {children}
  </motion.div>
);

export default function DashboardMarketing() {
  const [periodo, setPeriodo] = useState("30d");

  const { data: campanhas = [] } = useQuery({ queryKey: ['marketing_campanhas'], queryFn: fetchCampanhas });
  const { data: canais = [] } = useQuery({ queryKey: ['marketing_canais'], queryFn: fetchCanais });
  const { data: leads = [] } = useQuery({ queryKey: ['marketing_leads'], queryFn: fetchLeadsMarketing });

  const cutoff = useMemo(() => getPeriodCutoff(periodo), [periodo])

  const filteredLeads = useMemo(() => leads.filter(l =>
    l.criado_em ? new Date(l.criado_em) >= cutoff : true
  ), [leads, cutoff])

  const filteredCampanhas = useMemo(() => campanhas.filter(c =>
    c.data_inicio ? new Date(c.data_inicio) >= cutoff : true
  ), [campanhas, cutoff])

  const conversoes = filteredLeads.filter(l => l.status === 'convertido').length;
  const totalGasto = filteredCampanhas.reduce((sum, c) => sum + (Number(c.gasto) || 0), 0);
  const cac = conversoes > 0 ? totalGasto / conversoes : 0;

  const metricas = {
    leads: filteredLeads.length,
    mql: filteredLeads.filter(l => l.status === 'mql').length,
    sql: filteredLeads.filter(l => l.status === 'sql').length,
    conversoes,
    roi: 0,
    cac,
  };

  const funilMarketingData = [
    { etapa: 'Leads', valor: metricas.leads },
    { etapa: 'MQL', valor: metricas.mql },
    { etapa: 'SQL', valor: metricas.sql },
    { etapa: 'Convertidos', valor: metricas.conversoes }
  ];

  const leadsPorCanalData = canais.map(c => ({
    canal: c.nome,
    leads: filteredLeads.filter(l => l.canal_origem === c.id).length
  }));

  const roiPorCampanhaData = filteredCampanhas.map(c => ({
    campanha: c.nome,
    gasto: Number(c.gasto) || 0,
    roi: 0,
  }));

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
          </div>
        </div>
      </FadeIn>

      {/* Hero Dark Accent Card */}
      <FadeIn delay={1}>
        <div className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-[#0B0D0F] via-[#131619] to-[#0B0D0F] shadow-xl shadow-black/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold mb-2">Leads Captados no Período</p>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-bold tracking-tight text-white">{metricas.leads}</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-lime-400/15 text-lime-400 border border-lime-400/20">+15% vs período anterior</span>
            </div>
            <div className="flex gap-8 mt-6">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">MQL</p>
                <p className="text-xl font-bold text-white mt-1">{metricas.mql}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">SQL</p>
                <p className="text-xl font-bold text-white mt-1">{metricas.sql}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Conversões</p>
                <p className="text-xl font-bold text-white mt-1">{metricas.conversoes}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">ROI Médio</p>
                <p className="text-xl font-bold text-lime-400 mt-1">{metricas.roi.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard title="Leads Captados" value={metricas.leads.toString()} icon={Users} variant="info" trend={{ value: "+15%", positive: true }} delay={2} />
        <GradientCard title="MQL → SQL" value={`${metricas.mql} → ${metricas.sql}`} icon={Target} variant="warning" delay={3} />
        <GradientCard title="CAC" value={formatCurrency(metricas.cac)} icon={DollarSign} variant="orange" delay={4} />
        <GradientCard title="ROI Médio" value={`${metricas.roi.toFixed(0)}%`} icon={TrendingUp} variant="success" delay={5} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={6}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold text-foreground mb-5">Funil de Marketing</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funilMarketingData} layout="vertical" barSize={18}>
                  <defs>
                    <linearGradient id="mktFunilGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis dataKey="etapa" type="category" width={90} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar dataKey="valor" fill="url(#mktFunilGrad)" radius={[12, 12, 12, 12]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={7}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold text-foreground mb-5">Leads por Canal</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsPorCanalData.slice(0, 5)}>
                  <defs>
                    <linearGradient id="mktCanalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(72 100% 55%)" />
                      <stop offset="100%" stopColor="hsl(72 100% 40%)" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="canal" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar dataKey="leads" fill="url(#mktCanalGrad)" radius={[12, 12, 12, 12]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ROI Table */}
      <FadeIn delay={8}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-5">ROI por Campanha</h3>
          <div className="space-y-2.5">
            {roiPorCampanhaData.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="font-medium text-sm text-foreground">{c.campanha}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatCurrency(c.gasto)} investido</span>
                  <span className={`font-bold text-sm px-3 py-1 rounded-full ${c.roi >= 0
                      ? 'bg-lime-400/10 text-lime-600 dark:bg-lime-400/15 dark:text-lime-400'
                      : 'bg-rose-400/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400'
                    }`}>
                    {c.roi > 0 ? '+' : ''}{c.roi.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
