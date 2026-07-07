import { useQuery } from '@tanstack/react-query'
import {
  FileText, Clock, CheckCircle, AlertCircle, Upload,
  User, Phone, Award, Mail,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { fetchMedicoMe, fetchMeusMapas, portalMedicoKeys, type MapaPortal } from '@/services/portalMedico'
import { fmtDate } from '@/lib/utils'

// ── Helpers ────────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function toIso(dateStr: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/')
    return `${y}-${m}-${d}`
  }
  return dateStr.substring(0, 10)
}

function getMonthLabel(dateStr: string): string {
  const iso = toIso(dateStr)
  const parts = iso.split('-')
  if (parts.length < 3) return '?'
  const month = parseInt(parts[1], 10) - 1
  const year  = parts[0].slice(-2)
  if (month < 0 || month > 11) return '?'
  return `${MONTH_NAMES[month]}/${year}`
}

function buildMonthlyData(mapas: MapaPortal[]) {
  const counts: Record<string, number> = {}
  mapas.forEach(m => {
    if (!m.data_de_recebimento) return
    const label = getMonthLabel(m.data_de_recebimento)
    counts[label] = (counts[label] ?? 0) + m.filhos_count
  })

  const sorted = mapas
    .filter(m => m.data_de_recebimento)
    .map(m => ({ label: getMonthLabel(m.data_de_recebimento!), iso: toIso(m.data_de_recebimento!) }))
    .sort((a, b) => a.iso.localeCompare(b.iso))

  const seen = new Set<string>()
  const ordered: string[] = []
  for (const { label } of sorted) {
    if (!seen.has(label)) { seen.add(label); ordered.push(label) }
  }

  return ordered.slice(-6).map(label => ({ mes: label, mapas: counts[label] ?? 0 }))
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-muted/70 dark:bg-muted/60 backdrop-blur-xl border border-border/50 rounded-xl p-3 shadow-2xl">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {entry.value} {entry.value === 1 ? 'mapa' : 'mapas'} enviados
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, icon: Icon, colorClass, loading,
}: {
  title: string
  value: number
  icon: typeof FileText
  colorClass: string
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading
              ? <Skeleton className="h-8 w-16 mt-1" />
              : <p className="text-3xl font-bold mt-1">{value}</p>}
          </div>
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClass)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PortalMedicoDashboard() {
  const { data: medico, isLoading: loadingMedico } = useQuery({
    queryKey: portalMedicoKeys.me,
    queryFn: fetchMedicoMe,
    retry: false,
  })

  const { data, isLoading: loadingMapas } = useQuery({
    queryKey: [...portalMedicoKeys.mapas(), 'dashboard'] as const,
    queryFn: () => fetchMeusMapas({ page_size: 500 }),
  })

  const mapas: MapaPortal[] = data?.results ?? []

  const total        = mapas.reduce((s, m) => s + m.filhos_count, 0)
  const emRevisao    = mapas.reduce((s, m) => s + m.aguardando_verificacao_count, 0)
  const comPendencia = mapas.reduce((s, m) => s + m.pendentes_count, 0)
  const revisados    = mapas.reduce((s, m) => s + Math.max(0, m.filhos_count - m.pendentes_count - m.aguardando_verificacao_count), 0)

  const monthlyData = buildMonthlyData(mapas)

  const recentes = [...mapas]
    .sort((a, b) => (b.data_de_recebimento ?? '').localeCompare(a.data_de_recebimento ?? ''))
    .slice(0, 5)

  const primeiroNome = medico?.nome?.split(' ')[0] ?? ''
  const iniciais = medico?.nome
    ? medico.nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {loadingMedico
              ? <Skeleton className="h-6 w-48 inline-block" />
              : `Olá${primeiroNome ? `, Dr. ${primeiroNome}` : ''}`}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Bem-vindo ao seu portal</p>
        </div>
        <Link to="/portal-medico/mapas">
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            Enviar Mapa
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mapas">
        <TabsList>
          <TabsTrigger value="mapas" className="gap-2">
            <FileText className="h-4 w-4" />
            Mapas
          </TabsTrigger>
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4" />
            Meu Perfil
          </TabsTrigger>
        </TabsList>

        {/* ── Aba Mapas ── */}
        <TabsContent value="mapas" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total de Mapas"  value={total}        icon={FileText}    colorClass="bg-muted text-muted-foreground"                          loading={loadingMapas} />
            <KpiCard title="Em Revisão"      value={emRevisao}    icon={Clock}       colorClass="bg-blue-500/20 text-blue-600 dark:text-blue-400"         loading={loadingMapas} />
            <KpiCard title="Com Pendência"   value={comPendencia} icon={AlertCircle} colorClass="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500"   loading={loadingMapas} />
            <KpiCard title="Revisados"       value={revisados}    icon={CheckCircle} colorClass="bg-primary/20 text-primary"                              loading={loadingMapas} />
          </div>

          {/* Chart + Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mapas enviados por mês</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMapas ? (
                  <Skeleton className="h-48 w-full" />
                ) : monthlyData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">Nenhum mapa encontrado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="gradMapas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={false} />
                      <Area
                        type="monotone"
                        dataKey="mapas"
                        stroke="hsl(var(--primary))"
                        fill="url(#gradMapas)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lotes recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMapas ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : recentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Nenhum mapa enviado ainda.</p>
                ) : (
                  <div className="divide-y">
                    {recentes.map(m => {
                      const status =
                        m.pendentes_count > 0               ? { label: 'Pendência',  cls: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500' }
                        : m.aguardando_verificacao_count > 0 ? { label: 'Em Revisão', cls: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' }
                        : m.filhos_count > 0                 ? { label: 'Revisado',   cls: 'bg-primary/20 text-primary' }
                        : { label: 'Enviado', cls: 'bg-muted text-muted-foreground' }
                      return (
                        <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.nome ?? `Mapa #${m.id}`}</p>
                            <p className="text-xs text-muted-foreground">{fmtDate(m.data_de_recebimento)}</p>
                          </div>
                          <Badge className={cn('border-transparent shrink-0 text-xs', status.cls)}>
                            {status.label}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
                {recentes.length > 0 && (
                  <Link to="/portal-medico/mapas">
                    <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground">
                      Ver todos os mapas
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Aba Meu Perfil ── */}
        <TabsContent value="perfil" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loadingMedico ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : medico ? (
                <div className="space-y-6">
                  {/* Avatar + nome */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
                      {iniciais}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Dr. {medico.nome}</h3>
                      <p className="text-sm text-muted-foreground">{medico.crm || '—'}</p>
                    </div>
                  </div>

                  {/* Dados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <p className="font-medium">{medico.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <p className="font-medium">{medico.telefone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm sm:col-span-2">
                      <Award className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Especialidades</p>
                        {medico.especialidades.length === 0 ? (
                          <p className="font-medium">—</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {medico.especialidades.map(e => (
                              <Badge key={e.id} variant="secondary" className="text-xs">
                                {e.nome}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Perfil não encontrado.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
