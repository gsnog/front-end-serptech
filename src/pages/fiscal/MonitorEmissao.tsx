import { useState, useEffect } from "react";
import { fmtDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Eye, CheckCircle2, XCircle, AlertTriangle, Wifi, WifiOff, RefreshCw, ShieldCheck, Clock } from "lucide-react";
// Fiscal-mock removed — stub until /api/fiscal/ endpoints exist
const mockNotasFiscais: any[] = [];

interface MonitorItem {
  id: number;
  numero: number;
  cliente: string;
  tipo: string;
  data: string;
  status: string;
  mensagem: string;
  tentativas: number;
  ultimaAtualizacao: string;
}

const MonitorEmissao = () => {
  const navigate = useNavigate();

  // Derive monitor items from mock data (only non-final statuses)
  const pendentes: MonitorItem[] = mockNotasFiscais
    .filter(n => ["Rejeitada", "Enviada", "Em validação"].includes(n.status))
    .map(n => ({
      id: n.id,
      numero: n.numero,
      cliente: n.cliente,
      tipo: n.tipo,
      data: n.dataEmissao,
      status: n.status,
      mensagem: n.ultimoRetorno,
      tentativas: n.eventos.length,
      ultimaAtualizacao: n.eventos.length > 0 ? n.eventos[n.eventos.length - 1].data : n.dataEmissao,
    }));

  const [items, setItems] = useState<MonitorItem[]>(pendentes);
  const [filter, setFilter] = useState("todos");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Simulated integration statuses
  const [integrationStatus, setIntegrationStatus] = useState<"ok" | "erro">("ok");
  const [certStatus, setCertStatus] = useState<"ok" | "expirando" | "erro">("ok");
  const certExpiry = "15/08/2027";

  // Simulated auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Simulate random status update
      setItems(prev => prev.map(item => {
        if (item.status === "Enviada" && Math.random() > 0.85) {
          toast({ title: "Nota Autorizada!", description: `Nota #${item.numero} foi autorizada pela SEFAZ.` });
          return { ...item, status: "Autorizada", mensagem: "Autorizado o uso da NF-e", tentativas: item.tentativas + 1, ultimaAtualizacao: new Date().toLocaleString("pt-BR") };
        }
        return item;
      }));
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = items.filter(i => {
    if (filter === "todos") return !["Autorizada"].includes(i.status); // hide resolved by default
    return i.status === filter;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefresh(new Date());
      toast({ title: "Monitor atualizado", description: "Status das notas verificado." });
    }, 1500);
  };

  const handleReprocess = (item: MonitorItem) => {
    setItems(prev => prev.map(i =>
      i.id === item.id
        ? { ...i, tentativas: i.tentativas + 1, mensagem: "Reprocessando...", status: "Enviada", ultimaAtualizacao: new Date().toLocaleString("pt-BR") }
        : i
    ));
    toast({ title: "Reenviando nota", description: `Nota #${item.numero} está sendo reprocessada. Tentativa #${item.tentativas + 1}` });
  };

  const rejeitadas = items.filter(i => i.status === "Rejeitada").length;
  const enviadas = items.filter(i => i.status === "Enviada").length;
  const emValidacao = items.filter(i => i.status === "Em validação").length;

  return (
    <div className="flex flex-col h-full bg-background"><div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitor de Emissão</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o status das notas em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Última atualização: {lastRefresh.toLocaleTimeString("pt-BR")}
          </span>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="gap-1 text-xs"
            onClick={() => { setAutoRefresh(!autoRefresh); toast({ title: autoRefresh ? "Auto-refresh desativado" : "Auto-refresh ativado (15s)" }); }}
          >
            <Clock className="h-3 w-3" />
            {autoRefresh ? "Auto: ON" : "Auto: OFF"}
          </Button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatusCard
          icon={integrationStatus === "ok" ? <Wifi className="h-5 w-5 text-primary" /> : <WifiOff className="h-5 w-5 text-destructive" />}
          label="Integração API"
          value={integrationStatus === "ok" ? "Conectado" : "Erro"}
          valueClass={integrationStatus === "ok" ? "text-primary" : "text-destructive"}
          bgClass={integrationStatus === "ok" ? "bg-primary/10" : "bg-destructive/10"}
        />
        <StatusCard
          icon={<ShieldCheck className={`h-5 w-5 ${certStatus === "ok" ? "text-primary" : certStatus === "expirando" ? "text-yellow-500" : "text-destructive"}`} />}
          label="Certificado Digital"
          value={certStatus === "ok" ? `OK (${certExpiry})` : certStatus === "expirando" ? "Expirando" : "Expirado"}
          valueClass={certStatus === "ok" ? "text-primary" : certStatus === "expirando" ? "text-yellow-600 dark:text-yellow-400" : "text-destructive"}
          bgClass={certStatus === "ok" ? "bg-primary/10" : certStatus === "expirando" ? "bg-yellow-500/10" : "bg-destructive/10"}
        />
        <StatusCard
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          label="Rejeitadas"
          value={String(rejeitadas)}
          valueClass={rejeitadas > 0 ? "text-destructive" : "text-muted-foreground"}
          bgClass="bg-destructive/10"
        />
        <StatusCard
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          label="Enviadas (aguardando)"
          value={String(enviadas)}
          valueClass={enviadas > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}
          bgClass="bg-yellow-500/10"
        />
        <StatusCard
          icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />}
          label="Em validação"
          value={String(emValidacao)}
          valueClass="text-blue-600 dark:text-blue-400"
          bgClass="bg-blue-500/10"
        />
      </div>

      {/* Alert banner */}
      {rejeitadas > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">{rejeitadas} nota(s) rejeitada(s)</span> aguardando correção e reenvio.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "todos", label: "Pendentes", count: items.filter(i => !["Autorizada"].includes(i.status)).length },
          { key: "Rejeitada", label: "Rejeitadas", count: rejeitadas },
          { key: "Enviada", label: "Enviadas", count: enviadas },
          { key: "Em validação", label: "Em validação", count: emValidacao },
        ].map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="text-xs gap-1"
          >
            {f.label}
            <span className="ml-1 bg-background/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{f.count}</span>
          </Button>
        ))}
      </div>

      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-table-header">
            <TableHead className="font-semibold">Nº</TableHead>
            <TableHead className="text-center font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Cliente</TableHead>
            <TableHead className="text-center font-semibold">Data</TableHead>
            <TableHead className="text-center font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Última Mensagem</TableHead>
            <TableHead className="font-semibold">Tentativas</TableHead>
            <TableHead className="font-semibold">Última Atualização</TableHead>
            <TableHead className="text-center font-semibold">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Nenhuma nota pendente</p>
                  <p className="text-xs">Todas as notas foram processadas.</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(n => (
                <TableRow key={n.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-mono font-bold">{n.numero}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={n.tipo} /></TableCell>
                  <TableCell className="font-medium">{n.cliente}</TableCell>
                  <TableCell className="text-center text-sm">{fmtDate(n.data)}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={n.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[250px]">
                    <span className="truncate block">{n.mensagem}</span>
                  </TableCell>
                  <TableCell >
                    <span className="font-mono text-sm">{n.tentativas}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{n.ultimaAtualizacao}</TableCell>
                  <TableCell >
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/fiscal/notas/${n.id}`)} title="Abrir nota">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(n.status === "Rejeitada" || n.status === "Enviada") && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleReprocess(n)} title="Reprocessar/Reenviar">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div></div>
  );
};

function StatusCard({ icon, label, value, valueClass, bgClass }: { icon: React.ReactNode; label: string; value: string; valueClass: string; bgClass: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded border border-border bg-card">
      <div className={`p-2 rounded ${bgClass}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
        <p className={`text-sm font-bold truncate ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

export default MonitorEmissao;
