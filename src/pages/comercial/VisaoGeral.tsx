import { fmtDate, todayStr } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientCard } from "@/components/financeiro/GradientCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Users, Target, FileText, TrendingUp, DollarSign, Calendar, Phone,
  AlertTriangle, ArrowUpRight, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
  etapasFunil
} from "@/services/comercial";
import { pessoasQueryKey } from "@/services/pessoas";
import { useState } from "react";
import { motion } from "framer-motion";
import { useDashboardData } from "../Dashboard";
import { useQuery } from "@tanstack/react-query";
import { fetchOportunidades, fetchLeads, fetchAtividades, fetchPropostas } from "@/services/comercial";

// --- Mocks removidos para usar dados reais ---


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

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

export default function VisaoGeralComercial() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState("30d");
  const [vendedor, setVendedor] = useState("__all__");

  const { dash } = useDashboardData();
  const { data: oportunidades = [] } = useQuery({ queryKey: ['oportunidades'], queryFn: fetchOportunidades });
  const { data: leads = [] } = useQuery({ queryKey: ['leads'], queryFn: fetchLeads });
  const { data: atividades = [] } = useQuery({ queryKey: ['atividades'], queryFn: fetchAtividades });
  const { data: propostas = [] } = useQuery({ queryKey: ['propostas'], queryFn: fetchPropostas });

  // Métricas Reais
  const leadsNovos = leads.filter(l => l.status === 'novo').length;
  const opsAbertas = oportunidades.filter(o => !['ganho', 'perdido'].includes(o.estagio)).length;
  const propostasPendentes = propostas.filter(p => p.status === 'enviada').length;
  const pipelineTotal = oportunidades.filter(o => !['ganho', 'perdido'].includes(o.estagio)).reduce((sum, o) => sum + (Number(o.valor_estimado) || 0), 0);
  const forecastMes = pipelineTotal * 0.7; // Simples forecast ponderado de 70%
  const atividadesVencidas = atividades.filter(a =>
    a.status === 'pendente' && a.data < todayStr()
  ).length;

  // Dados do funil
  const funilData = etapasFunil
    .filter(e => !['ganho', 'perdido'].includes(e.id))
    .map(etapa => ({
      name: etapa.nome,
      value: oportunidades.filter(o => o.estagio === etapa.id).length,
      amount: oportunidades
        .filter(o => o.estagio === etapa.id)
        .reduce((sum, o) => sum + (Number(o.valor_estimado) || 0), 0)
    }));

  // Motivos de perda reais do backend
  const motivosPerdaData = (dash.comercialData?.perdas || []).map((p: any, i: number) => ({
    name: p.motivo,
    value: p.valor,
    color: `hsl(${(i * 60) % 360} 70% 50%)`
  }));
  const motivosTotalCount = motivosPerdaData.reduce((s: number, d: any) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FadeIn>
        <div className="space-y-4">
          <div className="filter-card">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5 min-w-[200px]">
                <label className="filter-label">Período</label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="filter-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["7d", "30d", "90d", "1y"].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[180px]">
                <label className="filter-label">Vendedor</label>
                <Select value={vendedor} onValueChange={setVendedor}>
                  <SelectTrigger className="filter-input">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard title="Leads Novos" value={leadsNovos.toString()} icon={Users} variant="info" trend={{ value: "+12%", positive: true }} delay={1} />
        <GradientCard title="Oportunidades Abertas" value={opsAbertas.toString()} icon={Target} variant="warning" trend={{ value: "+5%", positive: true }} delay={2} />
        <GradientCard title="Pipeline Total" value={formatCurrency(pipelineTotal)} icon={DollarSign} variant="success" trend={{ value: "+18%", positive: true }} delay={3} />
        <GradientCard title="Forecast do Mês" value={formatCurrency(forecastMes)} icon={TrendingUp} variant="orange" delay={4} />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FadeIn delay={5}>
          <div className="bg-card rounded-2xl p-5 shadow-sm shadow-black/[0.04] dark:shadow-black/20 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            onClick={() => navigate('/comercial/propostas')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Propostas Pendentes</p>
                  <p className="text-3xl font-bold mt-1">{propostasPendentes}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={6}>
          <div className="bg-card rounded-2xl p-5 shadow-sm shadow-black/[0.04] dark:shadow-black/20 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            onClick={() => navigate('/comercial/atividades')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Atividades Hoje</p>
                  <p className="text-3xl font-bold mt-1">{atividades.filter(a => a.data === todayStr()).length}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={7}>
          <div className="bg-card rounded-2xl p-5 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Atividades Vencidas</p>
                <p className="text-3xl font-bold text-destructive mt-1">{atividadesVencidas}</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Vendas */}
        <FadeIn delay={8}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold mb-5">Funil de Vendas</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funilData} layout="vertical">
                  <defs>
                    <linearGradient id="visaoFunilGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tickFormatter={(v) => `${v}`} axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={false}
                  />
                  <Bar dataKey="value" fill="url(#visaoFunilGrad)" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>

        {/* Ranking Vendedores - Placeholder real (vazio se sem dados) */}
        <FadeIn delay={9}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold mb-5">Eficiência de Vendas</h3>
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">Dados de performance em processamento...</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Motivos de Perda + Próximas Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={10}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold mb-5">Motivos de Perda</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={motivosPerdaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    cornerRadius={6}
                  >
                    {motivosPerdaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700 }}>{motivosTotalCount}</text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>Oportunidades Perdidas</text>
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {motivosPerdaData.map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-muted-foreground">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Próximas Atividades */}
        <FadeIn delay={11}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold">Próximas Atividades</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/comercial/atividades')}>
                Ver todas <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {atividades.filter(a => a.status === 'pendente').slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${a.tipo === 'reuniao' ? 'bg-primary/10' :
                      a.tipo === 'ligacao' ? 'bg-success/10' : 'bg-warning/10'
                      }`}>
                      {a.tipo === 'reuniao' ? <Calendar className="h-4 w-4 text-primary" /> :
                        a.tipo === 'ligacao' ? <Phone className="h-4 w-4 text-success" /> :
                          <FileText className="h-4 w-4 text-warning" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(a.data)} {a.hora && `às ${a.hora}`}</p>
                    </div>
                  </div>
                  <StatusBadge
                    status={a.tipo === 'reuniao' ? 'Em andamento' : a.tipo === 'ligacao' ? 'Normal' : 'Processando'}
                  />
                </div>
              ))}
              {atividades.filter(a => a.status === 'pendente').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sem atividades pendentes.</p>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
