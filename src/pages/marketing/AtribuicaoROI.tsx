import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradientCard } from "@/components/financeiro/GradientCard";
import {
  Target, DollarSign, TrendingUp, BarChart3, Calendar, Filter
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import {
  fetchCampanhas, fetchCanais
} from "@/services/marketing";
import { useQuery } from "@tanstack/react-query";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function AtribuicaoROI() {
  const [periodo, setPeriodo] = useState("30d");
  const [modelo, setModelo] = useState("last_touch");

  const { data: campanhas = [] } = useQuery({ queryKey: ['marketing_campanhas'], queryFn: fetchCampanhas });
  const { data: canais = [] } = useQuery({ queryKey: ['marketing_canais'], queryFn: fetchCanais });

  const metricas = {
    roi: 0,
    receitaAtribuida: 0,
    cac: 0,
    pipelineInfluenciado: 0
  };

  const atribuicaoPorCanal = canais.map(canal => ({
    canal: canal.nome,
    leads: 0,
    oportunidades: 0,
    receita: 0,
    contribuicao: 0,
  }));

  const pieData = atribuicaoPorCanal.map((item, i) => ({
    name: item.canal,
    value: item.contribuicao,
    color: [`hsl(var(--primary))`, `hsl(var(--success))`, `hsl(var(--warning))`, `hsl(var(--chart-3))`, `hsl(var(--chart-4))`][i % 5]
  }));

  const evolucaoROI: any[] = [];
  const ltvCacData: any[] = [];

  const roiPorCampanhaData = campanhas.map(c => ({
    campanha: c.nome,
    roi: 0
  }));

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
              {["30d", "90d", "1y"].map((p) => (
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
            <span className="text-sm text-muted-foreground">Modelo:</span>
            <Select value={modelo} onValueChange={setModelo}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_touch">Last Touch</SelectItem>
                <SelectItem value="first_touch">First Touch</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard
          title="ROI Geral"
          value={`${metricas.roi.toFixed(0)}%`}
          icon={TrendingUp}
          variant="success"
          trend={{ value: "+12%", positive: true }}
        />
        <GradientCard
          title="Receita Atribuída"
          value={formatCurrency(metricas.receitaAtribuida)}
          icon={DollarSign}
          variant="info"
        />
        <GradientCard
          title="CAC"
          value={formatCurrency(metricas.cac)}
          icon={Target}
          variant="warning"
        />
        <GradientCard
          title="Pipeline Influenciado"
          value={formatCurrency(metricas.pipelineInfluenciado)}
          icon={BarChart3}
          variant="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atribuição por Canal */}
        <Card className="border border-border rounded">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Atribuição por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Contribuição']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evolução do ROI */}
        <Card className="border border-border rounded">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Evolução do ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolucaoROI}>
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'ROI']}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Line type="monotone" dataKey="roi" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* LTV:CAC */}
      <Card className="border border-border rounded">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">LTV:CAC por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ltvCacData.map((item, i) => (
              <div key={i} className="p-4 rounded bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">{item.periodo}</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">LTV</span>
                    <span className="font-semibold">{formatCurrency(item.ltv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">CAC</span>
                    <span className="font-semibold">{formatCurrency(item.cac)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-sm font-medium">Ratio LTV:CAC</span>
                    <span className={`font-bold ${item.ratio >= 3 ? 'text-success' : 'text-warning'}`}>
                      {item.ratio.toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ROI por Campanha */}
      <Card className="border border-border rounded">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">ROI por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={roiPorCampanhaData} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="campanha" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(0)}%`, 'ROI']}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Bar
                dataKey="roi"
                fill="hsl(var(--success))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
