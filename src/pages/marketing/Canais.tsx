import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GradientCard } from "@/components/financeiro/GradientCard";
import {
  Globe, Target, DollarSign, TrendingUp, Users, BarChart3
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { fetchCanais, canaisQueryKey, calcularMetricasCanal, leadsPorCanalData } from "@/services/marketing";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function Canais() {
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null);

  const { data: canaisData = [] } = useQuery({ queryKey: canaisQueryKey, queryFn: fetchCanais });

  // Métricas totais
  const totalLeads = leadsPorCanalData.reduce((sum, c) => sum + c.leads, 0);
  const totalMQL = leadsPorCanalData.reduce((sum, c) => sum + c.mql, 0);
  const totalSQL = leadsPorCanalData.reduce((sum, c) => sum + c.sql, 0);
  const orcamentoTotal = canaisData.reduce((sum, c) => sum + parseFloat(c.custo_estimado || '0'), 0);

  // Dados por canal com métricas
  const canaisComMetricas = canaisData.map(canal => {
    const metricas = calcularMetricasCanal(canal.id as any);
    return {
      ...canal,
      leads: metricas.leads || 0,
      mql: metricas.mql || 0,
      sql: metricas.sql || 0,
      cpl: metricas.cpl || 0,
      conversao: metricas.leads ? ((metricas.mql || 0) / metricas.leads * 100) : 0
    };
  });

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'organico': 'Orgânico',
      'pago': 'Pago',
      'social': 'Social',
      'email': 'Email',
      'indicacao': 'Indicação',
      'eventos': 'Eventos',
      'outbound': 'Outbound',
      'parceiros': 'Parceiros'
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard
          title="Total de Canais"
          value={canaisData.filter((c: any) => c.status === 'ativo').length.toString()}
          icon={Globe}
          variant="info"
        />
        <GradientCard
          title="Leads Totais"
          value={totalLeads.toString()}
          icon={Users}
          variant="success"
        />
        <GradientCard
          title="Conversão Média"
          value={`${totalLeads > 0 ? (totalMQL / totalLeads * 100).toFixed(1) : 0}%`}
          icon={Target}
          variant="warning"
        />
        <GradientCard
          title="Orçamento Mensal"
          value={formatCurrency(orcamentoTotal)}
          icon={DollarSign}
          variant="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Leads por Canal */}
        <Card className="border border-border rounded">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Performance por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadsPorCanalData}>
                <XAxis dataKey="canal" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mql" name="MQL" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cards de Canal */}
        <Card className="border border-border rounded">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Custo por Lead (CPL)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {canaisComMetricas.filter(c => parseFloat(c.custo_estimado || '0') > 0).map(canal => (
                <div key={canal.id} className="flex items-center justify-between p-3 rounded bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{canal.nome}</p>
                      <p className="text-xs text-muted-foreground">{canal.leads} leads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(canal.cpl)}</p>
                    <p className="text-xs text-muted-foreground">por lead</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Canais */}
      <Card className="border border-border rounded">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Detalhamento por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead >Orçamento</TableHead>
                  <TableHead >Leads</TableHead>
                  <TableHead >MQL</TableHead>
                  <TableHead >SQL</TableHead>
                  <TableHead >CPL</TableHead>
                  <TableHead >Conversão</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {canaisComMetricas.map((canal) => (
                  <TableRow key={canal.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{canal.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTipoLabel(canal.tipo_canal)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canal.custo_estimado ? formatCurrency(parseFloat(canal.custo_estimado)) : '-'}
                    </TableCell>
                    <TableCell className="font-semibold">{canal.leads}</TableCell>
                    <TableCell >{canal.mql}</TableCell>
                    <TableCell >{canal.sql}</TableCell>
                    <TableCell className="text-right">
                      {canal.cpl > 0 ? formatCurrency(canal.cpl) : '-'}
                    </TableCell>
                    <TableCell >
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={canal.conversao} className="h-2 w-12" />
                        <span className="text-sm">{canal.conversao.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={canal.status === 'ativo' ? "default" : "secondary"}>
                        {canal.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
