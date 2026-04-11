import { useState } from "react";
import { fmtDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { GradientCard } from "@/components/financeiro/GradientCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserCheck, UserX, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { fetchPessoas } from "@/services/pessoas";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

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

export default function VisaoGeralRH() {
  const { data: pessoasResponse, isLoading } = useQuery({
    queryKey: ['pessoas'],
    queryFn: () => fetchPessoas(1, '', 200),
  });
  const pessoas = pessoasResponse?.results ?? [];

  const [periodo, setPeriodo] = useState("30d");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [setorFilter, setSetorFilter] = useState("todos");

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  // Calculate stats manually for now from 'pessoas'
  const total = pessoas?.length || 0;
  // Assumes is_active=True returned from backend means 'Ativo'
  const ativos = total;
  const afastados = 0;
  const desligados = 0;
  const semGestor = pessoas?.filter(p => !p.supervisor_id).length || 0;

  // Group by sector
  const setoresMap: Record<string, number> = {};
  pessoas?.forEach(p => {
    const s = p.setor || "Sem Setor";
    setoresMap[s] = (setoresMap[s] || 0) + 1;
  });

  const porSetor = Object.entries(setoresMap).map(([k, v]) => ({ setor: k, quantidade: v }));

  const setoresList = ["todos", ...porSetor.filter(s => s.quantidade > 0).map(s => s.setor)];

  const pieData = [
    { name: "Ativos", value: ativos, color: "hsl(72 100% 50%)" },
    { name: "Afastados", value: afastados, color: "hsl(45 100% 50%)" },
    { name: "Desligados", value: desligados, color: "hsl(0 80% 60%)" },
  ];
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  const barData = porSetor.filter(s => s.quantidade > 0);

  const ultimasAlteracoes = [
    { id: 1, acao: "Cadastro criado", pessoa: "Gabriela Nunes", data: "04/02/2026 14:30", usuario: "Maria Oliveira" },
    { id: 2, acao: "Gestor alterado", pessoa: "Henrique Dias", data: "03/02/2026 11:15", usuario: "Maria Oliveira" },
    { id: 3, acao: "Status alterado para Afastado", pessoa: "Henrique Dias", data: "03/02/2026 10:00", usuario: "Maria Oliveira" },
    { id: 4, acao: "Salário atualizado", pessoa: "Pedro Piaes", data: "01/02/2026 09:45", usuario: "Maria Oliveira" },
  ];

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
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="filter-label">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="filter-input"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="desligado">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <label className="filter-label">Setor</label>
                <Select value={setorFilter} onValueChange={setSetorFilter}>
                  <SelectTrigger className="filter-input"><SelectValue placeholder="Todos Setores" /></SelectTrigger>
                  <SelectContent>{setoresList.map((s) => <SelectItem key={s} value={s}>{s === "todos" ? "Todos Setores" : s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard title="Total de Pessoas" value={total.toString()} icon={Users} variant="info" delay={0} />
        <GradientCard title="Ativos" value={ativos.toString()} icon={UserCheck} variant="success" trend={{ value: "+3%", positive: true }} delay={1} />
        <GradientCard title="Afastados" value={afastados.toString()} icon={UserX} variant="warning" delay={2} />
        <GradientCard title="Sem Gestor" value={semGestor.toString()} icon={AlertTriangle} variant="danger" delay={3} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <FadeIn delay={4}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold text-foreground mb-5">Distribuição por Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={6}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: 18, fontWeight: 700 }}>{pieTotal}</text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>Total</text>
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>

        {/* Pessoas por Setor */}
        <FadeIn delay={5}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
            <h3 className="text-sm font-semibold text-foreground mb-5">Pessoas por Setor</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <defs>
                    <linearGradient id="rhSetorGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="setor" type="category" width={100} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar dataKey="quantidade" fill="url(#rhSetorGrad)" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Últimas Alterações */}
      <FadeIn delay={6}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-5">Últimas Alterações</h3>
          <div className="space-y-1">
            {ultimasAlteracoes.map((alt) => (
              <div key={alt.id} className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{alt.acao}</p>
                    <p className="text-xs text-muted-foreground">{alt.pessoa}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground">{fmtDate(alt.data)}</p>
                  <p className="text-xs text-muted-foreground">por {alt.usuario}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
