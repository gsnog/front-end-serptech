import { useState, useMemo } from "react";
import { fmtDate } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/TableActions";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { SortableHead } from "@/components/SortableHead";
import { Plus, List, GripVertical, Calendar, LayoutList, Filter as FunnelIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useSortable } from "@/hooks/useSortable";
import { usePagination } from "@/hooks/usePagination";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import {
  fetchOportunidades, oportunidadesQueryKey, etapasFunil,
  fetchContas, contasQueryKey,
  updateOportunidade, deleteOportunidade,
} from "@/services/comercial";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Oportunidades() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"lista" | "kanban" | "funil">("lista");
  const [searchTerm, setSearchTerm] = useState("");
  const [etapaFilter, setEtapaFilter] = useState("");
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: oportunidades = [], isLoading: isLoadingOps } = useQuery({ queryKey: oportunidadesQueryKey, queryFn: fetchOportunidades });
  const { data: contasData = [] } = useQuery({ queryKey: contasQueryKey, queryFn: fetchContas });
  const getContaById = (id: number) => (contasData as any[]).find((c) => c.id === id);

  // ── Real-time updates ────────────────────────────────────────────────────────
  useRealtimeUpdates([[...oportunidadesQueryKey]]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: oportunidadesQueryKey });

  const updateEstagio = useMutation({
    mutationFn: ({ id, estagio }: { id: number; estagio: string }) =>
      updateOportunidade(id, { estagio } as any),
    onSuccess: () => { invalidate(); toast({ title: "Estágio atualizado." }); },
    onError: () => toast({ title: "Erro ao atualizar estágio.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateOportunidade(id, data),
    onSuccess: () => { invalidate(); setEditItem(null); toast({ title: "Salvo", description: "Oportunidade atualizada." }); },
    onError: () => toast({ title: "Erro ao salvar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOportunidade,
    onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Excluído", description: "Oportunidade removida." }); },
    onError: () => toast({ title: "Erro ao excluir.", variant: "destructive" }),
  });

  // ── Dialog state ─────────────────────────────────────────────────────────────
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editData, setEditData] = useState({ titulo: "", valorEstimado: "", probabilidade: "", estagio: "" });

  const openEdit = (op: any) => {
    setEditItem(op);
    setEditData({ titulo: op.titulo, valorEstimado: String(op.valor_estimado), probabilidade: String(op.probabilidade), estagio: op.estagio });
  };
  const handleSaveEdit = () => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: { titulo: editData.titulo, valor_estimado: editData.valorEstimado, probabilidade: editData.probabilidade, estagio: editData.estagio },
    });
  };

  const deleteItemData = (oportunidades as any[]).find((i: any) => i.id === deleteId);

  // ── Drag-and-drop ────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, opId: string) => { setDraggedCard(opId); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, etapaId: string) => {
    e.preventDefault();
    if (!draggedCard) return;
    const op = (oportunidades as any[]).find(o => String(o.id) === draggedCard);
    if (op && op.estagio !== etapaId) updateEstagio.mutate({ id: Number(draggedCard), estagio: etapaId });
    setDraggedCard(null);
  };

  // ── Filter → Sort → Paginate (lista view) ───────────────────────────────────
  const filtered = useMemo(() => {
    return (oportunidades as any[]).filter(op => {
      const conta = getContaById(op.conta);
      const matchSearch = !searchTerm ||
        (op.titulo ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conta?.nome_fantasia ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchEtapa = !etapaFilter || op.estagio === etapaFilter;
      return matchSearch && matchEtapa;
    });
  }, [oportunidades, contasData, searchTerm, etapaFilter]);

  const flatFiltered = filtered.map((op: any) => ({
    ...op,
    _conta_nome: getContaById(op.conta)?.nome_fantasia ?? "",
    _valor_num: parseFloat(op.valor_estimado || "0"),
    _etapa_nome: etapasFunil.find(e => e.id === op.estagio || e.nome === op.estagio)?.nome ?? op.estagio,
  }));

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(flatFiltered);
  const { page, goToPage, totalPages, paginatedItems, total, hasNext, hasPrev } = usePagination(sorted);

  // ── Kanban helpers ───────────────────────────────────────────────────────────
  const etapasAtivas = etapasFunil.filter(e => !["ganho", "perdido"].includes(e.id));

  const getEtapaBgColor = (etapaId: string) => {
    const colors: Record<string, string> = {
      prospeccao: "bg-slate-100 dark:bg-slate-800", qualificacao: "bg-blue-50 dark:bg-blue-900/30",
      diagnostico: "bg-indigo-50 dark:bg-indigo-900/30", proposta: "bg-purple-50 dark:bg-purple-900/30",
      negociacao: "bg-amber-50 dark:bg-amber-900/30", aprovacao: "bg-sky-50 dark:bg-sky-900/30",
    };
    return colors[etapaId] || "bg-muted";
  };

  const funnelData = etapasAtivas.map(etapa => {
    const ops = filtered.filter((op: any) => op.estagio === etapa.id || op.estagio === etapa.nome);
    return { ...etapa, count: ops.length, total: ops.reduce((s: number, o: any) => s + parseFloat(String(o.valor_estimado || "0")), 0) };
  });

  const getExportData = () => filtered.map((op: any) => {
    const conta = getContaById(op.conta);
    const etapa = etapasFunil.find(e => e.id === op.estagio || e.nome === op.estagio);
    return { Oportunidade: op.titulo, Conta: conta?.nome_fantasia ?? "", Valor: formatCurrency(parseFloat(op.valor_estimado || "0")), Etapa: etapa?.nome ?? op.estagio, Probabilidade: `${op.probabilidade}%`, Previsão: fmtDate(op.data_fechamento_esperada) };
  });

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center border border-border rounded overflow-hidden">
          <Button variant={view === "lista" ? "default" : "ghost"} size="sm" onClick={() => setView("lista")} className="rounded-none"><List className="h-4 w-4" /></Button>
          <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setView("kanban")} className="rounded-none"><LayoutList className="h-4 w-4" /></Button>
          <Button variant={view === "funil" ? "default" : "ghost"} size="sm" onClick={() => setView("funil")} className="rounded-none"><FunnelIcon className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton getData={getExportData} fileName="oportunidades" />
          <Button onClick={() => navigate("/comercial/oportunidades/nova")} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Oportunidade
          </Button>
        </div>
      </div>

      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Oportunidade ou conta...", value: searchTerm, onChange: setSearchTerm, width: "flex-1 min-w-[200px]" },
          { type: "select", label: "Etapa", placeholder: "Todas", value: etapaFilter, onChange: setEtapaFilter, options: etapasFunil.map(e => ({ value: e.id, label: e.nome })), width: "min-w-[180px]" },
        ]}
        resultsCount={total}
      />

      {/* ── Funil ─────────────────────────────────────────────────────────────── */}
      {view === "funil" && (
        <Card className="border border-border rounded p-6">
          <CardHeader className="pb-4 px-0 pt-0"><CardTitle className="text-base font-semibold">Funil de Vendas</CardTitle></CardHeader>
          <div className="space-y-2">
            {funnelData.map((etapa, i) => {
              const widthPct = 100 - (i * (60 / funnelData.length));
              return (
                <div key={etapa.id} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-right text-muted-foreground truncate">{etapa.nome}</div>
                  <div className="flex-1 flex justify-center">
                    <div className={`h-12 rounded flex items-center justify-center text-sm font-medium ${getEtapaBgColor(etapa.id)} border border-border`} style={{ width: `${widthPct}%` }}>
                      {etapa.count} ops • {formatCurrency(etapa.total)}
                    </div>
                  </div>
                  <div className="w-16 text-sm text-muted-foreground">{etapa.probabilidade}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Kanban ────────────────────────────────────────────────────────────── */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {etapasAtivas.map(etapa => {
            const opsEtapa = filtered.filter((op: any) => op.estagio === etapa.id || op.estagio === etapa.nome);
            const totalEtapa = opsEtapa.reduce((sum: number, op: any) => sum + parseFloat(op.valor_estimado || "0"), 0);
            return (
              <div key={etapa.id} className="flex-shrink-0 w-[300px]" onDragOver={handleDragOver} onDrop={e => handleDrop(e, etapa.id)}>
                <div className={`rounded p-3 ${getEtapaBgColor(etapa.id)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{etapa.nome}</h3>
                      <p className="text-xs text-muted-foreground">{opsEtapa.length} ops • {formatCurrency(totalEtapa)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{etapa.probabilidade}%</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {opsEtapa.map((op: any) => {
                      const conta = getContaById(op.conta);
                      return (
                        <Card key={op.id} className={`border border-border rounded cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedCard === String(op.id) ? "opacity-50" : ""}`}
                          draggable onDragStart={e => handleDragStart(e, String(op.id))}>
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{op.titulo}</p>
                                <p className="text-xs text-muted-foreground truncate">{conta?.nome_fantasia}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm font-semibold text-primary">{formatCurrency(parseFloat(op.valor_estimado || "0"))}</span>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {op.data_fechamento_esperada ? new Date(op.data_fechamento_esperada).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "-"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex-shrink-0 w-[300px]">
            <div className="rounded p-3 bg-emerald-50 dark:bg-emerald-900/30">
              <div className="flex items-center justify-between mb-3">
                <div><h3 className="font-semibold text-sm text-success">Fechado Ganho</h3><p className="text-xs text-muted-foreground">{filtered.filter((op: any) => op.estagio === "ganho").length} ops</p></div>
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success">100%</Badge>
              </div>
              <div className="min-h-[200px] border-2 border-dashed border-success/30 rounded flex items-center justify-center" onDragOver={handleDragOver} onDrop={e => handleDrop(e, "ganho")}>
                <p className="text-xs text-muted-foreground">Arraste para ganhar</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-[300px]">
            <div className="rounded p-3 bg-rose-50 dark:bg-rose-900/30">
              <div className="flex items-center justify-between mb-3">
                <div><h3 className="font-semibold text-sm text-destructive">Fechado Perdido</h3><p className="text-xs text-muted-foreground">{filtered.filter((op: any) => op.estagio === "perdido").length} ops</p></div>
                <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive">0%</Badge>
              </div>
              <div className="min-h-[200px] border-2 border-dashed border-destructive/30 rounded flex items-center justify-center" onDragOver={handleDragOver} onDrop={e => handleDrop(e, "perdido")}>
                <p className="text-xs text-muted-foreground">Arraste para perder</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lista ─────────────────────────────────────────────────────────────── */}
      {view === "lista" && (
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <SortableHead label="Oportunidade" field="titulo" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Conta" field="_conta_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Valor" field="_valor_num" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Etapa" field="_etapa_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Probabilidade" field="probabilidade" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Previsão" field="data_fechamento_esperada" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOps ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma oportunidade encontrada.</TableCell></TableRow>
              ) : (
                paginatedItems.map((op: any) => {
                  const etapa = etapasFunil.find(e => e.id === op.estagio || e.nome === op.estagio);
                  return (
                    <TableRow key={op.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{op.titulo}</TableCell>
                      <TableCell>{op._conta_nome}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(op._valor_num)}</TableCell>
                      <TableCell><Badge variant="outline">{etapa?.nome ?? op.estagio}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${op.probabilidade}%` }} />
                          </div>
                          <span className="text-sm">{op.probabilidade}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{fmtDate(op.data_fechamento_esperada)}</TableCell>
                      <TableCell><TableActions onView={() => setViewItem(op)} onEdit={() => openEdit(op)} onDelete={() => setDeleteId(op.id)} /></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total} registros
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={!hasPrev}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasNext}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ───────────────────────────────────────────────────────────── */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Oportunidade</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Título: viewItem.titulo, Conta: getContaById(viewItem.conta)?.nome_fantasia ?? "", Valor: formatCurrency(parseFloat(viewItem.valor_estimado || "0")), Etapa: etapasFunil.find(e => e.id === viewItem.estagio)?.nome ?? viewItem.estagio, Probabilidade: `${viewItem.probabilidade}%`, Previsão: fmtDate(viewItem.data_fechamento_esperada) }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{v as string}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Oportunidade</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={editData.titulo} onChange={e => setEditData({ ...editData, titulo: e.target.value })} /></div>
            <div><Label>Valor Estimado</Label><Input type="number" value={editData.valorEstimado} onChange={e => setEditData({ ...editData, valorEstimado: e.target.value })} /></div>
            <div><Label>Probabilidade (%)</Label><Input type="number" value={editData.probabilidade} onChange={e => setEditData({ ...editData, probabilidade: e.target.value })} /></div>
            <div>
              <Label>Etapa</Label>
              <Select value={editData.estagio} onValueChange={v => setEditData({ ...editData, estagio: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                <SelectContent>
                  {etapasFunil.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir oportunidade?</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir "{deleteItemData?.titulo}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
