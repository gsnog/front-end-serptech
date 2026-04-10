import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SummaryCards } from "@/components/financeiro/SummaryCards"
import { GradientCard } from "@/components/financeiro/GradientCard"
import { StatusBadge } from "@/components/StatusBadge"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, DollarSign, Package, Building2, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Receipt, BarChart3, Filter,
  LayoutGrid, UserRoundPlus, UserCircle
} from "lucide-react"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Label
} from "recharts"
import VisaoGeralComercial from "@/pages/comercial/VisaoGeral"
import VisaoGeralRH from "@/pages/gestao-pessoas/VisaoGeralRH"

import { usePermissions } from "@/contexts/PermissionsContext"
import { useQuery } from "@tanstack/react-query"
import { fetchEstatisticasFinanceiras, fetchDashboardFull } from "@/services/financeiro"
import { fetchProjetos, fetchTarefas } from "@/services/operacional"
import { fetchPessoas, fetchSetores, fetchMe, fetchMeuTime, type Pessoa } from "@/services/pessoas"

type DashboardType = "geral" | "meu-perfil" | "financeiro" | "estoque" | "patrimonio" | "operacional" | "comercial" | "rh"
type PeriodoType = "1h" | "24h" | "7d" | "30d" | "90d" | "1y"
type TipoType = "todos" | "financeiro" | "estoque" | "patrimonio"

// ===== DASHBOARD DATA HOOK =====
export const useDashboardData = () => {
  const { data = {}, isLoading } = useQuery({ queryKey: ['dashboard_full'], queryFn: fetchDashboardFull });
  return { dash: data, isLoading };
}

// ===== MOCK DATA FALLBACKS =====
const defaultEvolutionData: any[] = []
const defaultConsumoSetorData: any[] = []
const defaultPatrimonioTipoData: any[] = []
const defaultContasStatusData: any[] = []
const defaultContasReceberData: any[] = []
const defaultContasPagarData: any[] = []
const defaultDocumentosFiscaisData: any[] = []
const defaultTipoDocumentoData: any[] = []
const defaultEstoqueUnidadeData: any[] = []
const defaultTopCustosData: any[] = []
const defaultTopPatrimonioData: any[] = []
const defaultUltimasMovimentacoes: any[] = []
const defaultInventarioData: any[] = []
const defaultEstoqueEvolutionData: any[] = []
const defaultTopItensEstoqueData: any[] = []
const defaultTopItensConsumidosData: any[] = []
const defaultHistoricoMovimentacoesEstoque: any[] = []
const defaultHistoricoPatrimonio: any[] = []
const defaultPatrimonioEvolutionData: any[] = []
const defaultPatrimonioQuantidadeData: any[] = []
const defaultAquisicoesPorPeriodoData: any[] = []
const defaultVisaoGeralPatrimonioData: any[] = []

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

// Formata qualquer valor monetário — aceita number ou string (com ou sem "R$")
const parseCurrency = (value: any): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00'
  if (typeof value === 'number') return formatCurrency(value)
  if (typeof value === 'string') {
    if (value.trimStart().startsWith('R$')) return value
    const cleaned = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
    const num = parseFloat(cleaned)
    if (!isNaN(num)) return formatCurrency(num)
  }
  return String(value)
}

// Formata datas em DD/MM/AAAA — aceita ISO (YYYY-MM-DD) ou já formatada
const formatDate = (value: string | undefined | null): string => {
  if (!value) return '—'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  const d = new Date(value)
  if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR')
  return value
}

// ===== PREMIUM SHARED COMPONENTS =====
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-muted/70 dark:bg-muted/60 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-2xl">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold text-foreground">
            {entry.name}: {typeof entry.value === 'number' && entry.value > 100 ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const CountTooltip = ({ active, payload, label }: any) => {
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
    )
  }
  return null
}

// Animation wrapper
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay * 0.1, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
)

const ChartCard = ({ title, children, className = "", action, delay = 0 }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode; delay?: number }) => (
  <FadeIn delay={delay}>
    <div className={`bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/30 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        {action}
      </div>
      <div className="h-64">{children}</div>
    </div>
  </FadeIn>
)

const AlertCard = ({ title, count, type, delay = 0 }: { title: string; count: number; type: "warning" | "danger" | "info"; delay?: number }) => {
  const config = {
    danger: { bg: "bg-rose-500/5 dark:bg-rose-500/8", icon: "text-rose-500", text: "text-rose-600 dark:text-rose-400", shadow: "shadow-rose-500/5" },
    warning: { bg: "bg-amber-500/5 dark:bg-amber-500/8", icon: "text-amber-500", text: "text-amber-600 dark:text-amber-400", shadow: "shadow-amber-500/5" },
    info: { bg: "bg-blue-500/5 dark:bg-blue-500/8", icon: "text-blue-500", text: "text-blue-600 dark:text-blue-400", shadow: "shadow-blue-500/5" },
  }[type]

  return (
    <FadeIn delay={delay}>
      <div className={`relative overflow-hidden flex items-center gap-4 p-6 rounded-2xl ${config.bg} shadow-sm ${config.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
        <div className={`p-3 rounded-xl ${config.bg}`}>
          <AlertTriangle className={`h-5 w-5 ${config.icon}`} />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className={`text-3xl font-bold ${config.text} mt-1`}>{count}</p>
        </div>
      </div>
    </FadeIn>
  )
}

const FilterBar = ({ children }: { children: React.ReactNode }) => (
  <FadeIn>
    <div className="space-y-4">
      <div className="filter-card">
        <div className="flex flex-wrap gap-4 items-end">
          {children}
        </div>
      </div>
    </div>
  </FadeIn>
)

const PeriodFilter = ({ periodo, setPeriodo, options = ["1h", "24h", "7d", "30d", "90d", "1y"] }: { periodo: string; setPeriodo: (v: string) => void; options?: string[] }) => (
  <div className="flex flex-col gap-1.5 min-w-[200px]">
    <label className="filter-label">Período</label>
    <Select value={periodo} onValueChange={setPeriodo}>
      <SelectTrigger className="filter-input"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
)

// Chart shared config — PREMIUM: no grid, minimal axes
const axisStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11 }

// Donut center label renderer
const renderDonutCenter = (text: string, subtext?: string) => (
  <>
    <text x="50%" y={subtext ? "46%" : "50%"} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xl font-bold" style={{ fontSize: 18, fontWeight: 700 }}>
      {text}
    </text>
    {subtext && (
      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>
        {subtext}
      </text>
    )}
  </>
)

// ===== DASHBOARD GERAL =====
const DashboardGeral = () => {
  const { dash } = useDashboardData();
  const evolutionData = dash.evolutionData || defaultEvolutionData;
  const consumoSetorData = dash.consumoSetorData || defaultConsumoSetorData;
  const patrimonioTipoData = dash.patrimonioTipoData || defaultPatrimonioTipoData;
  const topCustosData = dash.topCustosData || defaultTopCustosData;
  const topPatrimonioData = dash.topPatrimonioData || defaultTopPatrimonioData;
  const ultimasMovimentacoes = dash.ultimasMovimentacoes || defaultUltimasMovimentacoes;

  const contasReceberData = dash.contasReceberData || defaultContasReceberData;
  const contasPagarData = dash.contasPagarData || defaultContasPagarData;
  const inventarioData = dash.inventarioData || defaultInventarioData;

  const contasPagarAbertas = contasPagarData.filter((col: any) => col.status === 'Em Aberto').length;
  const contasReceberAbertas = contasReceberData.filter((col: any) => col.status === 'Em Aberto').length;
  const itensCriticosEstoque = inventarioData.filter((col: any) => col.status === 'Crítico').length;

  const [periodo, setPeriodo] = useState<PeriodoType>("30d")
  const [setor, setSetor] = useState<string>("todos")
  const [tipo, setTipo] = useState<TipoType>("todos")

  const setores = ["todos", "Produção", "Manutenção", "TI", "Administrativo", "Operacional"]

  const patrimonioTotal = patrimonioTipoData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <FilterBar>
        <PeriodFilter periodo={periodo} setPeriodo={(v) => setPeriodo(v as PeriodoType)} />
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="filter-label">Setor</label>
          <Select value={setor} onValueChange={setSetor}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos os setores" /></SelectTrigger>
            <SelectContent>
              {setores.map((s) => <SelectItem key={s} value={s}>{s === "todos" ? "Todos os setores" : s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="filter-label">Tipo</label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoType)}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="estoque">Estoque</SelectItem>
              <SelectItem value="patrimonio">Patrimônio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      {/* ── FINANCEIRO SECTION ── */}
      {(tipo === "todos" || tipo === "financeiro") && (
        <>
          <FadeIn delay={1}>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Financeiro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GradientCard title="Total a Receber" value={formatCurrency(dash.contasStatusData?.find((s: any) => s.status === 'Em Aberto')?.receber || 0)} icon={ArrowUpRight} variant="success" delay={1} />
              <GradientCard title="Total a Pagar" value={formatCurrency(dash.contasStatusData?.find((s: any) => s.status === 'Em Aberto')?.pagar || 0)} icon={ArrowDownRight} variant="danger" delay={2} />
              <GradientCard title="Resultado do Período" value={formatCurrency(dash.evolutionData?.[dash.evolutionData.length - 1]?.saldo || 0)} icon={TrendingUp} variant="success" delay={3} />
              <GradientCard title="Saldo Atual em Caixa" value={formatCurrency(dash.evolutionData?.[dash.evolutionData.length - 1]?.saldo || 0)} icon={Wallet} variant="info" delay={4} />
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Evolução Financeira no Tempo" delay={3}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(72 100% 50%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(72 100% 50%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="entradas" name="Entradas" stroke="hsl(72 100% 50%)" fill="url(#gradEntradas)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "hsl(72 100% 50%)", stroke: "hsl(var(--background))", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="saidas" name="Saídas" stroke="hsl(var(--destructive))" fill="url(#gradSaidas)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--chart-3))" fill="url(#gradSaldo)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Entradas vs Saídas por Período" delay={4}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData} barGap={8}>
                  <defs>
                    <linearGradient id="barGradEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(72 100% 55%)" />
                      <stop offset="100%" stopColor="hsl(72 100% 40%)" />
                    </linearGradient>
                    <linearGradient id="barGradSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="entradas" name="Entradas" fill="url(#barGradEntradas)" radius={[4, 4, 4, 4]} />
                  <Bar dataKey="saidas" name="Saídas" fill="url(#barGradSaidas)" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertCard title="Contas a Pagar em Aberto" count={contasPagarAbertas} type="danger" delay={5} />
            <AlertCard title="Contas a Receber em Aberto" count={contasReceberAbertas} type="warning" delay={6} />
          </div>

          <FadeIn delay={7}>
            <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
              <div className="p-6 pb-2"><h3 className="text-sm font-semibold text-foreground">Top 5 Maiores Custos</h3></div>
              <div className="px-6 pb-6">
                <Table>
                  <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {topCustosData.map((item) => (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                        <TableCell className="text-sm">{item.item}</TableCell>
                        <TableCell className="font-semibold text-sm">{parseCurrency(item.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </FadeIn>
        </>
      )}

      {/* ── ESTOQUE SECTION ── */}
      {(tipo === "todos" || tipo === "estoque") && (
        <>
          <FadeIn delay={8}>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Estoque</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GradientCard title="Entradas no Período" value={formatCurrency(dash.evolutionData?.[dash.evolutionData.length - 1]?.entradas || 0)} icon={ArrowUpRight} variant="success" delay={3} />
              <GradientCard title="Saídas no Período" value={formatCurrency(dash.evolutionData?.[dash.evolutionData.length - 1]?.saidas || 0)} icon={ArrowDownRight} variant="warning" delay={4} />
              <GradientCard title="Valor Total em Estoque" value={formatCurrency(dash.inventarioData?.reduce((s: number, i: any) => s + (parseFloat(i.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0) || 0)} icon={Package} variant="info" delay={5} />
              <GradientCard title="Quantidade de Itens" value={dash.stats?.total_itens_estoque?.toString() || "0"} icon={Package} variant="neutral" delay={6} />
            </div>
          </FadeIn>

          <ChartCard title="Consumo de Estoque por Setor" delay={9}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumoSetorData} layout="vertical" barSize={20}>
                <defs>
                  <linearGradient id="barHorizGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="setor" tick={axisStyle} width={100} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar dataKey="valor" name="Consumo" fill="url(#barHorizGrad)" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <AlertCard title="Itens de Estoque Críticos" count={itensCriticosEstoque} type="info" delay={10} />
        </>
      )}

      {/* ── PATRIMÔNIO SECTION ── */}
      {(tipo === "todos" || tipo === "patrimonio") && (
        <>
          <FadeIn delay={11}>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Patrimônio</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GradientCard title="Valor Total do Patrimônio" value={formatCurrency(patrimonioTotal)} icon={Building2} variant="info" delay={5} />
              <GradientCard title="Itens Patrimoniais" value={patrimonioTipoData?.length?.toString() || "0"} icon={Building2} variant="neutral" delay={6} />
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Distribuição do Patrimônio por Tipo" delay={12}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={patrimonioTipoData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" cornerRadius={6}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {patrimonioTipoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  {renderDonutCenter(formatCurrency(patrimonioTotal), "Total")}
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <FadeIn delay={13}>
              <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
                <div className="p-6 pb-2"><h3 className="text-sm font-semibold text-foreground">Top 5 Ativos Patrimoniais</h3></div>
                <div className="px-6 pb-6">
                  <Table>
                    <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Valor Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {topPatrimonioData.map((item) => (
                        <TableRow key={item.codigo}>
                          <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                          <TableCell className="text-sm">{item.item}</TableCell>
                          <TableCell className="font-semibold text-sm">{parseCurrency(item.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </FadeIn>
          </div>
        </>
      )}

      {/* Recent Activity (Global) */}
      <FadeIn delay={14}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-5">Últimas Movimentações Relevantes</h3>
          <div className="space-y-1">
            {ultimasMovimentacoes.map((mov, index) => (
              <div key={index} className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${mov.tipo === "Recebimento" ? "bg-lime-400" : mov.tipo === "Pagamento" ? "bg-rose-400" : "bg-amber-400"}`} />
                  <div>
                    <p className="font-medium text-sm">{mov.tipo}</p>
                    <p className="text-xs text-muted-foreground">{mov.descricao}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${mov.tipo === "Recebimento" ? "text-lime-600 dark:text-lime-400" : mov.tipo === "Pagamento" ? "text-rose-600 dark:text-rose-400" : ""}`}>{parseCurrency(mov.valor)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(mov.data)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

// ===== DASHBOARD FINANCEIRO =====
const DashboardFinanceiro = () => {
  const { dash } = useDashboardData();
  const evolutionData = dash.evolutionData || defaultEvolutionData;
  const contasStatusData = dash.contasStatusData || defaultContasStatusData;
  const contasReceberData = dash.contasReceberData || defaultContasReceberData;
  const contasPagarData = dash.contasPagarData || defaultContasPagarData;
  const documentosFiscaisData = dash.documentosFiscaisData || defaultDocumentosFiscaisData;
  const tipoDocumentoData = dash.tipoDocumentoData || defaultTipoDocumentoData;
  const ultimasMovimentacoes = dash.ultimasMovimentacoes || defaultUltimasMovimentacoes;

  const [periodo, setPeriodo] = useState<PeriodoType>("30d")
  const [cliente, setCliente] = useState<string>("todos")
  const [beneficiario, setBeneficiario] = useState<string>("todos")
  const [status, setStatus] = useState<string>("todos")

  const clientes = ["todos", "Cliente ABC", "Cliente XYZ", "Cliente DEF", "Cliente GHI"]
  const beneficiarios = ["todos", "Fornecedor A", "Fornecedor B", "Fornecedor C", "Fornecedor D"]
  const statusList = ["todos", "Em Aberto", "Vencida", "Paga", "Recebida", "Processada", "Pendente"]

  const { data: estatisticasFinanceiras, isLoading: isLoadingFin } = useQuery({
    queryKey: ['estatisticasFinanceiras'],
    queryFn: fetchEstatisticasFinanceiras
  })

  // Placeholder data mapping for cards
  const summaryCards = [
    { title: "Saldo Atual", value: estatisticasFinanceiras ? formatCurrency(estatisticasFinanceiras.saldo) : "R$ 0,00", icon: DollarSign, trend: { value: "+12.5%", positive: true }, variant: "success" as const },
    { title: "Receitas Confirmadas", value: estatisticasFinanceiras ? formatCurrency(estatisticasFinanceiras.entradas) : "R$ 0,00", icon: TrendingUp, trend: { value: "+8%", positive: true }, variant: "info" as const },
    { title: "Despesas Pagas", value: estatisticasFinanceiras ? formatCurrency(estatisticasFinanceiras.saidas) : "R$ 0,00", icon: TrendingDown, trend: { value: "-3%", positive: true }, variant: "warning" as const },
  ]

  const tipoDocTotal = tipoDocumentoData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <FilterBar>
        <PeriodFilter periodo={periodo} setPeriodo={(v) => setPeriodo(v as PeriodoType)} />
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="filter-label">Cliente</label>
          <Select value={cliente} onValueChange={setCliente}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos Clientes" /></SelectTrigger>
            <SelectContent>{clientes.map((c) => <SelectItem key={c} value={c}>{c === "todos" ? "Todos Clientes" : c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="filter-label">Beneficiário</label>
          <Select value={beneficiario} onValueChange={setBeneficiario}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos Beneficiários" /></SelectTrigger>
            <SelectContent>{beneficiarios.map((b) => <SelectItem key={b} value={b}>{b === "todos" ? "Todos Beneficiários" : b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="filter-label">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos Status" /></SelectTrigger>
            <SelectContent>{statusList.map((s) => <SelectItem key={s} value={s}>{s === "todos" ? "Todos Status" : s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <GradientCard
            key={i}
            title={card.title}
            value={isLoadingFin ? "Carregando..." : card.value}
            icon={card.icon}
            trend={card.trend}
            variant={card.variant}
            delay={1 + i}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Evolução do Fluxo de Caixa" delay={1}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorSaldoFin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Area type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--primary))" fill="url(#colorSaldoFin)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Entradas vs Saídas" delay={2}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={evolutionData} barGap={8}>
              <defs>
                <linearGradient id="finBarEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(72 100% 55%)" />
                  <stop offset="100%" stopColor="hsl(72 100% 40%)" />
                </linearGradient>
                <linearGradient id="finBarSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="entradas" name="Entradas" fill="url(#finBarEntradas)" radius={[4, 4, 4, 4]} />
              <Bar dataKey="saidas" name="Saídas" fill="url(#finBarSaidas)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Contas a Receber por Status" delay={3}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contasStatusData}>
              <defs>
                <linearGradient id="recStatusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(72 100% 55%)" />
                  <stop offset="100%" stopColor="hsl(72 100% 40%)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="status" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Bar dataKey="receber" name="A Receber" fill="url(#recStatusGrad)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Contas a Pagar por Status" delay={4}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contasStatusData}>
              <defs>
                <linearGradient id="pagStatusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <XAxis dataKey="status" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Bar dataKey="pagar" name="A Pagar" fill="url(#pagStatusGrad)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição por Tipo de Documento" delay={5}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={tipoDocumentoData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" cornerRadius={6}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {tipoDocumentoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              {renderDonutCenter(`${tipoDocTotal}`, "Documentos")}
              <Tooltip content={<ChartTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={6}>
          <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
            <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Contas a Receber</h3></div>
            <div className="px-6 pb-6">
              <Table>
                <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Cliente</TableHead><TableHead className="text-center">Vencimento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contasReceberData.map((item) => (
                    <TableRow key={item.codigo}>
                      <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                      <TableCell className="text-sm">{item.cliente}</TableCell>
                      <TableCell className="text-center text-sm">{formatDate(item.vencimento)}</TableCell>
                      <TableCell className="font-semibold text-sm">{parseCurrency(item.valor)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={7}>
          <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
            <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Contas a Pagar</h3></div>
            <div className="px-6 pb-6">
              <Table>
                <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Beneficiário</TableHead><TableHead className="text-center">Vencimento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contasPagarData.map((item) => (
                    <TableRow key={item.codigo}>
                      <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                      <TableCell className="text-sm">{item.beneficiario}</TableCell>
                      <TableCell className="text-center text-sm">{formatDate(item.vencimento)}</TableCell>
                      <TableCell className="font-semibold text-sm">{parseCurrency(item.valor)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Recent Transactions */}
      <FadeIn delay={8}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-5">Últimas Movimentações</h3>
          <div className="space-y-1">
            {ultimasMovimentacoes.map((mov, index) => (
              <div key={index} className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${mov.tipo === "Recebimento" ? "bg-lime-400" : mov.tipo === "Pagamento" ? "bg-rose-400" : "bg-amber-400"}`} />
                  <div>
                    <p className="font-medium text-sm">{mov.tipo}</p>
                    <p className="text-xs text-muted-foreground">{mov.descricao}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${mov.tipo === "Recebimento" ? "text-lime-600 dark:text-lime-400" : mov.tipo === "Pagamento" ? "text-rose-600 dark:text-rose-400" : ""}`}>{parseCurrency(mov.valor)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(mov.data)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Fiscal Documents */}
      <FadeIn delay={9}>
        <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
          <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Documentos Fiscais</h3></div>
          <div className="px-6 pb-6">
            <Table>
              <TableHeader><TableRow><TableHead>Número</TableHead><TableHead className="text-center">Tipo</TableHead><TableHead className="text-center">Emissão</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {documentosFiscaisData.map((doc) => (
                  <TableRow key={doc.numero}>
                    <TableCell className="font-medium text-xs">{doc.numero}</TableCell>
                    <TableCell className="text-sm">{doc.tipo}</TableCell>
                    <TableCell className="text-center text-sm">{formatDate(doc.emissao)}</TableCell>
                    <TableCell className="font-semibold text-sm">{parseCurrency(doc.valor)}</TableCell>
                    <TableCell><StatusBadge status={doc.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

// ===== DASHBOARD ESTOQUE =====
const DashboardEstoque = () => {
  const { dash } = useDashboardData();
  const estoqueUnidadeData = dash.estoqueUnidadeData || defaultEstoqueUnidadeData;
  const inventarioData = dash.inventarioData || defaultInventarioData;
  const estoqueEvolutionData = dash.estoqueEvolutionData || defaultEstoqueEvolutionData;
  const topItensEstoqueData = dash.topItensEstoqueData || defaultTopItensEstoqueData;
  const topItensConsumidosData = dash.topItensConsumidosData || defaultTopItensConsumidosData;
  const historicoMovimentacoesEstoque = dash.historicoMovimentacoesEstoque || defaultHistoricoMovimentacoesEstoque;
  const consumoSetorData = dash.consumoSetorData || defaultConsumoSetorData;

  const [periodo, setPeriodo] = useState<PeriodoType>("30d")
  const [unidade, setUnidade] = useState<string>("todos")
  const [setor, setSetor] = useState<string>("todos")
  const [status, setStatus] = useState<string>("todos")

  const unidades = ["todos", "Almoxarifado SP", "TI Central", "Manutenção", "Almoxarifado RJ"]
  const setores = ["todos", "Produção", "Manutenção", "TI", "Administrativo"]
  const statusList = ["todos", "Normal", "Crítico"]

  return (
    <div className="space-y-6">
      <FilterBar>
        <PeriodFilter periodo={periodo} setPeriodo={(v) => setPeriodo(v as PeriodoType)} />
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="filter-label">Unidade</label>
          <Select value={unidade} onValueChange={setUnidade}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todas Unidades" /></SelectTrigger>
            <SelectContent>{unidades.map((u) => <SelectItem key={u} value={u}>{u === "todos" ? "Todas Unidades" : u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <label className="filter-label">Setor</label>
          <Select value={setor} onValueChange={setSetor}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos Setores" /></SelectTrigger>
            <SelectContent>{setores.map((s) => <SelectItem key={s} value={s}>{s === "todos" ? "Todos Setores" : s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="filter-label">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos Status" /></SelectTrigger>
            <SelectContent>{statusList.map((s) => <SelectItem key={s} value={s}>{s === "todos" ? "Todos Status" : s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </FilterBar>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GradientCard title="Entradas no Período" value={formatCurrency(dash.stats?.estoque_entradas_periodo || 0)} icon={ArrowUpRight} variant="success" delay={1} />
        <GradientCard title="Itens em Estoque" value={dash.stats?.total_itens_estoque?.toString() || "0"} icon={Package} variant="info" delay={2} />
        <GradientCard title="Itens Críticos" value={dash.stats?.total_estoque_critico?.toString() || "0"} icon={AlertTriangle} variant="danger" delay={3} />
      </div>

      {/* OS / OC pendentes com link */}
      <FadeIn delay={6}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/estoque/ordem-servico?status=analise"
            className="block group"
          >
            <div className="flex items-center justify-between p-5 rounded-2xl bg-amber-500/5 border border-amber-200/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-amber-300/60">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">OS Pendentes de Análise</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{dash.stats?.os_pendentes ?? 0}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>

          <Link
            to="/estoque/ordem-compra?status=Análise"
            className="block group"
          >
            <div className="flex items-center justify-between p-5 rounded-2xl bg-blue-500/5 border border-blue-200/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-300/60">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Receipt className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">OC Pendentes de Análise</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">{dash.stats?.oc_pendentes ?? 0}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        </div>
      </FadeIn>

      {/* Consumo por Setor — largura total */}
      <FadeIn delay={7}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-5">Consumo por Setor</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumoSetorData} layout="vertical" barSize={22}>
                <defs>
                  <linearGradient id="estSetorGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="setor" tick={axisStyle} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar dataKey="valor" name="Consumo" fill="url(#estSetorGrad)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </FadeIn>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn delay={9}>
          <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
            <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Top 10 Itens em Estoque</h3></div>
            <div className="px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantidade Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dash.topItensEstoqueData ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">Sem dados.</TableCell></TableRow>
                  ) : (dash.topItensEstoqueData ?? []).map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{item.item}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{item.quantidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={10}>
          <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
            <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Top 10 Itens Mais Consumidos</h3></div>
            <div className="px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qtd Consumida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dash.topItensConsumidosData ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">Sem dados.</TableCell></TableRow>
                  ) : (dash.topItensConsumidosData ?? []).map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{item.item}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{item.quantidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={13}>
        <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
          <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Visão Geral do Inventário</h3></div>
          <div className="px-6 pb-6">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead>Unidade</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {inventarioData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-sm">{item.item}</TableCell>
                    <TableCell className="text-sm">{item.quantidade}</TableCell>
                    <TableCell className="text-sm">{item.unidade}</TableCell>
                    <TableCell className="font-semibold text-sm">{parseCurrency(item.valor)}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={14}>
        <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
          <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Histórico Consolidado de Movimentações</h3></div>
          <div className="px-6 pb-6">
            <Table>
              <TableHeader><TableRow><TableHead className="text-center">Data</TableHead><TableHead className="text-center">Tipo</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead>Requisitante</TableHead><TableHead>Setor</TableHead></TableRow></TableHeader>
              <TableBody>
                {historicoMovimentacoesEstoque.map((mov, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center text-sm">{mov.data}</TableCell>
                    <TableCell><StatusBadge status={mov.tipo} /></TableCell>
                    <TableCell className="font-medium text-sm">{mov.item}</TableCell>
                    <TableCell className="text-sm">{mov.quantidade}</TableCell>
                    <TableCell className="text-sm">{mov.requisitante}</TableCell>
                    <TableCell className="text-sm">{mov.setor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
// ===== DASHBOARD PATRIMÔNIO =====
const DashboardPatrimonio = () => {
  const { dash } = useDashboardData();
  const patrimonioTipoData = dash.patrimonioTipoData || defaultPatrimonioTipoData;
  const historicoPatrimonio = dash.historicoPatrimonio || defaultHistoricoPatrimonio;
  const patrimonioEvolutionData = dash.patrimonioEvolutionData || defaultPatrimonioEvolutionData;
  const patrimonioQuantidadeData = dash.patrimonioQuantidadeData || defaultPatrimonioQuantidadeData;
  const aquisicoesPorPeriodoData = dash.aquisicoesPorPeriodoData || defaultAquisicoesPorPeriodoData;
  const visaoGeralPatrimonioData = dash.visaoGeralPatrimonioData || defaultVisaoGeralPatrimonioData;
  const topPatrimonioData = dash.topPatrimonioData || defaultTopPatrimonioData;

  const [dataAquisicao, setDataAquisicao] = useState<string>("")
  const [codigoItem, setCodigoItem] = useState<string>("todos")
  const [tipoItem, setTipoItem] = useState<string>("todos")
  const [faixaValor, setFaixaValor] = useState<string>("todos")

  const tiposPatrimonio = ["todos", "Automóveis", "Equipamentos", "Mobiliário", "Software"]
  const faixasValor = [
    { value: "todos", label: "Todas as faixas" },
    { value: "0-10000", label: "Até R$ 10.000" },
    { value: "10000-50000", label: "R$ 10.000 - R$ 50.000" },
    { value: "50000-100000", label: "R$ 50.000 - R$ 100.000" },
    { value: "100000+", label: "Acima de R$ 100.000" },
  ]

  const patrimonioTotal = patrimonioTipoData.reduce((s, d) => s + d.value, 0)
  const patrimonioQtdTotal = patrimonioQuantidadeData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      <FilterBar>
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="filter-label">Data de Aquisição</label>
          <input type="date" value={dataAquisicao} onChange={(e) => setDataAquisicao(e.target.value)}
            className="filter-input" />
        </div>
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="filter-label">Código</label>
          <Select value={codigoItem} onValueChange={setCodigoItem}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {visaoGeralPatrimonioData.map((p) => <SelectItem key={p.codigo} value={p.codigo}>{p.codigo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="filter-label">Tipo</label>
          <Select value={tipoItem} onValueChange={setTipoItem}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
            <SelectContent>{tiposPatrimonio.map((t) => <SelectItem key={t} value={t}>{t === "todos" ? "Todos os tipos" : t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[170px]">
          <label className="filter-label">Faixa de Valor</label>
          <Select value={faixaValor} onValueChange={setFaixaValor}>
            <SelectTrigger className="filter-input"><SelectValue placeholder="Todas as faixas" /></SelectTrigger>
            <SelectContent>{faixasValor.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </FilterBar>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard title="Valor Total do Patrimônio" value={formatCurrency(patrimonioTotal)} icon={DollarSign} variant="success" delay={3} />
        <GradientCard title="Total de Itens Patrimoniais" value={patrimonioTipoData?.length?.toString() || "0"} icon={Building2} variant="info" delay={4} />
        <GradientCard title="Tipos de Patrimônio Ativos" value={patrimonioTipoData?.length?.toString() || "0"} icon={BarChart3} variant="neutral" delay={5} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Evolução do Valor Patrimonial" delay={6}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={patrimonioEvolutionData}>
              <defs>
                <linearGradient id="patrimonioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Area type="monotone" dataKey="valor" name="Valor Patrimonial" stroke="hsl(var(--primary))" fill="url(#patrimonioGradient)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Valor do Patrimônio por Tipo" delay={7}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={patrimonioTipoData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" cornerRadius={6}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {patrimonioTipoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              {renderDonutCenter(formatCurrency(patrimonioTotal), "Total")}
              <Tooltip content={<ChartTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Quantidade por Tipo" delay={8}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={patrimonioQuantidadeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" cornerRadius={6}
                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {patrimonioQuantidadeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              {renderDonutCenter(`${patrimonioQtdTotal}`, "Itens")}
              <Tooltip content={<ChartTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 Itens por Valor Total" delay={9}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPatrimonioData.map(i => ({ ...i, valorNum: parseFloat(i.valor.replace(/[^\d,]/g, '').replace(',', '.')) * 1000 }))} layout="vertical" barSize={18}>
              <defs>
                <linearGradient id="patTopGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                </linearGradient>
              </defs>
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="item" tick={{ ...axisStyle, fontSize: 9 }} width={100} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Bar dataKey="valorNum" name="Valor" fill="url(#patTopGrad)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Aquisições por Período" delay={10}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aquisicoesPorPeriodoData}>
              <defs>
                <linearGradient id="patAqGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="patAqGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(72 80% 60%)" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(72 80% 60%)" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={false} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="aquisicoes" name="Qtd. Aquisições" fill="url(#patAqGrad1)" radius={[4, 4, 4, 4]} />
              <Bar yAxisId="right" dataKey="valor" name="Valor (R$)" fill="url(#patAqGrad2)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tables */}
      <FadeIn delay={11}>
        <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
          <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Visão Geral do Patrimônio</h3></div>
          <div className="px-6 pb-6">
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Item</TableHead><TableHead className="text-center">Tipo</TableHead><TableHead className="text-right">Valor Unitário</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {visaoGeralPatrimonioData.map((item) => (
                  <TableRow key={item.codigo}>
                    <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                    <TableCell className="text-sm">{item.item}</TableCell>
                    <TableCell className="text-sm">{item.tipo}</TableCell>
                    <TableCell className="font-semibold text-sm">{parseCurrency(item.valorUnit)}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={12}>
        <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
          <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Histórico de Aquisições</h3></div>
          <div className="px-6 pb-6">
            <Table>
              <TableHeader><TableRow><TableHead className="text-center">Data</TableHead><TableHead>Código</TableHead><TableHead>Item</TableHead><TableHead className="text-center">Tipo</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {historicoPatrimonio.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center text-sm">{formatDate(item.data)}</TableCell>
                    <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                    <TableCell className="text-sm">{item.item}</TableCell>
                    <TableCell className="text-sm">{item.tipo}</TableCell>
                    <TableCell className="font-semibold text-sm">{parseCurrency(item.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

// ===== DASHBOARD MEU PERFIL =====
const DashboardMeuPerfil = () => {
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupTitle, setPopupTitle] = useState("")
  const [popupContent, setPopupContent] = useState<React.ReactNode>(null)

  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  const { data: meuTime, isLoading: isLoadingTime } = useQuery({ queryKey: ['meu_time'], queryFn: fetchMeuTime })

  const openPopup = (title: string, content: React.ReactNode) => {
    setPopupTitle(title)
    setPopupContent(content)
    setPopupOpen(true)
  }

  const accessCards = [
    {
      label: "Módulos", value: "12", content: (
        <div className="grid grid-cols-2 gap-2">{["Dashboard", "Estoque", "Financeiro", "Operacional", "Cadastro", "Comercial", "Patrimônio", "Kanban", "Chat", "Agenda", "Relatórios", "Gestão de Pessoas"].map(m => (
          <span key={m} className="text-sm py-1.5 px-3 rounded-lg bg-muted/50">{m}</span>
        ))}</div>
      )
    },
    {
      label: "Equipe", value: meuTime?.length.toString() || "0", content: (
        <ul className="space-y-2">
          {meuTime?.map(p => (
            <li key={p.id} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{p.iniciais}</div>
              <span className="text-sm">{p.nome} - {p.cargo}</span>
            </li>
          )) || <li className="text-sm text-muted-foreground text-center py-4">Sem subordinados diretos</li>}
        </ul>
      )
    },
    {
      label: "Perfil", value: me?.role || "Usuário", content: (
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border/30"><span className="text-muted-foreground">Tipo</span><span className="font-medium capitalize">{me?.role || "Usuário"}</span></div>
          <div className="flex justify-between py-2 border-b border-border/30"><span className="text-muted-foreground">Permissão</span><span className="font-medium">Total</span></div>
          <div className="flex justify-between py-2"><span className="text-muted-foreground">Aprovação</span><span className="font-medium">Sim</span></div>
        </div>
      )
    },
  ]

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando perfil...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn delay={1}>
          <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">{me?.iniciais || "U"}</div>
              <h3 className="text-lg font-bold text-foreground">{me?.nome}</h3>
              <p className="text-sm text-muted-foreground">{me?.cargo || "Cargo Indefinido"}</p>
              <p className="text-xs text-muted-foreground mt-1">{me?.email}</p>
              <div className="mt-4 w-full space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Setor</span><span className="font-medium">{me?.setor || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Supervisor</span><span className="font-medium">{me?.supervisor_nome || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Admissão</span><span className="font-medium">{formatDate(me?.data_admissao)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><span className="font-medium text-lime-600">Ativo</span></div>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={2} className="lg:col-span-2">
          <div className="flex flex-col h-full space-y-4">
            <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
              <h3 className="text-sm font-semibold text-foreground mb-4">Resumo de Acesso</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {accessCards.map((card) => (
                  <button
                    key={card.label}
                    onClick={() => openPopup(card.label, card.content)}
                    className="text-center p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[72px]"
                  >
                    <p className={`font-bold text-primary leading-tight break-words w-full ${card.value.length > 8 ? 'text-sm' : 'text-2xl'}`}>{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div className="bg-card rounded-2xl p-5 shadow-sm shadow-black/[0.04] dark:shadow-black/20 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Tarefas Criadas</p>
                <p className="text-2xl font-bold text-foreground">{me?.stats?.os_criadas || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Ordens de serviço abertas</p>
              </div>
              <div className="bg-card rounded-2xl p-5 shadow-sm shadow-black/[0.04] dark:shadow-black/20 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Entradas Aprovadas</p>
                <p className="text-2xl font-bold text-lime-600">{me?.stats?.entradas_aprovadas || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Lançamentos validados</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Meu Time */}
      <FadeIn delay={2.5}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-4">Meu Time</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingTime ? (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">Carregando time...</p>
            ) : meuTime && meuTime.length > 0 ? meuTime.map((membro) => (
              <div key={membro.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {membro.iniciais}
                </div>
                <div>
                  <p className="text-sm font-medium">{membro.nome}</p>
                  <p className="text-xs text-muted-foreground">{membro.cargo} · <span className="text-lime-600">Ativo</span></p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground col-span-full text-center py-4">Sem subordinados reais vinculados no banco.</p>
            )}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={3}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-5">Últimas Atividades</h3>
          <div className="space-y-1">
            {(me?.recentActivity || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-0">
                <div>
                  <p className="font-medium text-sm">{item.acao}</p>
                  <p className="text-xs text-muted-foreground">{item.modulo}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
              </div>
            ))}
            {(!me?.recentActivity || me?.recentActivity.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Sem atividades recentes.</p>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Popup for access details */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPopupOpen(false)}>
          <div className="bg-card rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{popupTitle}</h3>
              <button onClick={() => setPopupOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            {popupContent}
          </div>
        </div>
      )}
    </div>
  )
}

// ===== DASHBOARD OPERACIONAL =====
const DashboardOperacional = () => {
  const { dash } = useDashboardData();

  const mapasPorMedico: { medico: string; total: number; pendentes: number }[] =
    dash.mapasPorMedicoData ?? [];

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GradientCard title="Mapas (total)" value={dash.stats?.total_mapas_filhos?.toString() ?? "0"} icon={Receipt} variant="success" delay={1} />
        <GradientCard title="Mapas Pendentes" value={dash.stats?.total_mapas_pendentes?.toString() ?? "0"} icon={AlertTriangle} variant="danger" delay={2} />
      </div>

      {/* Mapas por médico */}
      <FadeIn delay={5}>
        <div className="bg-card rounded-2xl p-6 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
          <h3 className="text-sm font-semibold text-foreground mb-5">Mapas por Médico</h3>
          {mapasPorMedico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado disponível.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapasPorMedico} layout="vertical" barSize={20} barGap={4}>
                  <defs>
                    <linearGradient id="mapaTotalGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="mapaPendenteGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(45 90% 55%)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(45 90% 55%)" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="medico"
                    width={130}
                    tick={{ ...axisStyle, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CountTooltip />} cursor={false} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="total" name="Total" fill="url(#mapaTotalGrad)" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="pendentes" name="Pendentes" fill="url(#mapaPendenteGrad)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Tabela detalhada por médico */}
      <FadeIn delay={6}>
        <div className="bg-card rounded-2xl shadow-sm shadow-black/[0.04] dark:shadow-black/20 overflow-hidden">
          <div className="p-6 pb-2"><h3 className="text-sm font-semibold">Detalhe por Médico</h3></div>
          <div className="px-6 pb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead className="text-center">Total de Mapas</TableHead>
                  <TableHead className="text-center">Pendentes</TableHead>
                  <TableHead className="text-center">Concluídos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapasPorMedico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Nenhum dado disponível.
                    </TableCell>
                  </TableRow>
                ) : (
                  mapasPorMedico.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-sm">{row.medico}</TableCell>
                      <TableCell className="text-center text-sm">{row.total}</TableCell>
                      <TableCell className="text-center">
                        {row.pendentes > 0
                          ? <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{row.pendentes}</span>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-center text-sm text-green-600 font-medium">
                        {row.total - row.pendentes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </FadeIn>

    </div>
  )
}

// ===== MAIN DASHBOARD =====
const Dashboard = () => {
  const { hasPermission } = usePermissions()
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>("meu-perfil")

  const allTabs: { key: DashboardType; label: string; icon: typeof LayoutGrid; module?: string }[] = [
    { key: "meu-perfil",  label: "Meu Perfil",        icon: UserCircle                         },
    { key: "geral",       label: "Geral",              icon: LayoutGrid                         },
    { key: "financeiro",  label: "Financeiro",         icon: DollarSign,  module: "financeiro"  },
    { key: "estoque",     label: "Estoque",            icon: Package,     module: "estoque"     },
    { key: "patrimonio",  label: "Patrimônio",         icon: Building2,   module: "estoque"     },
    { key: "operacional", label: "Operacional",        icon: BarChart3,   module: "operacional" },
    { key: "comercial",   label: "Comercial",          icon: TrendingUp,  module: "comercial"   },
    { key: "rh",          label: "Gestão de Pessoas",  icon: UserRoundPlus, module: "gestao_pessoas" },
  ]

  const tabs = allTabs.filter(t => !t.module || hasPermission(t.module, 'all', 'view'))

  // If current active tab was filtered out, fall back to first available
  useEffect(() => {
    if (!tabs.find(t => t.key === activeDashboard)) {
      setActiveDashboard(tabs[0]?.key ?? "meu-perfil")
    }
  }, [tabs.map(t => t.key).join(',')])

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6">
        {/* Tab Selector */}
        <Tabs value={activeDashboard} onValueChange={(v) => setActiveDashboard(v as DashboardType)}>
          <TabsList>
            {tabs.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {activeDashboard === "geral" && <DashboardGeral />}
        {activeDashboard === "meu-perfil" && <DashboardMeuPerfil />}
        {activeDashboard === "financeiro" && <DashboardFinanceiro />}
        {activeDashboard === "estoque" && <DashboardEstoque />}
        {activeDashboard === "patrimonio" && <DashboardPatrimonio />}
        {activeDashboard === "operacional" && <DashboardOperacional />}
        {activeDashboard === "comercial" && <VisaoGeralComercial />}
        {activeDashboard === "rh" && <VisaoGeralRH />}
      </div>
    </div>
  )
}

export default Dashboard
