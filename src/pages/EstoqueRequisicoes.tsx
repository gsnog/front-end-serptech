import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"
import { SortableHead } from "@/components/SortableHead"
import { Plus, FileText, ClipboardCheck, PackageCheck, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react"
import { TableActions } from "@/components/TableActions"
import { StatusBadge } from "@/components/StatusBadge"
import { ExportButton } from "@/components/ExportButton"
import { usePagination } from "@/hooks/usePagination"
import { useSortable } from "@/hooks/useSortable"
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchRequisicoes, updateRequisicao, deleteRequisicao, aprovarRequisicao, negarRequisicao, entregarRequisicao, type RequisicaoSetor as Requisicao, requisicoesQueryKey } from "@/services/estoque"
import { fetchSetores, setoresQueryKey } from "@/services/pessoas"
import api from "@/lib/api"

export default function EstoqueRequisicoes() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterItem, setFilterItem] = useState("")
  const [filterSetor, setFilterSetor] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  const [viewItem, setViewItem] = useState<Requisicao | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<Requisicao | null>(null)
  const [editData, setEditData] = useState({ requisitante_nome: "", observacao: "" })
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Approval
  const [approvalItem, setApprovalItem] = useState<Requisicao | null>(null)
  const [approvalQuantities, setApprovalQuantities] = useState<Record<number, string>>({})
  const [rejectItem, setRejectItem] = useState<Requisicao | null>(null)
  const [rejectJustificativa, setRejectJustificativa] = useState("")
  const [entregarItem, setEntregarItem] = useState<Requisicao | null>(null)

  useRealtimeUpdates([[...requisicoesQueryKey]]);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: requisicoesQueryKey,
    queryFn: () => fetchRequisicoes(),
  });
  const items = Array.isArray(response) ? response : (response?.results ?? []);

  const { data: setoresResponse } = useQuery({ queryKey: setoresQueryKey, queryFn: fetchSetores })
  const setores = Array.isArray(setoresResponse) ? setoresResponse : (setoresResponse?.results ?? [])

  // Inventário da unidade da requisição em análise
  const { data: inventarioUnidade = [] } = useQuery({
    queryKey: ["inventario_aprovacao", approvalItem?.unidade],
    queryFn: () =>
      api.get(`/api/estoque/inventario/?unidade=${approvalItem!.unidade}`).then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
    enabled: !!approvalItem?.unidade,
  })

  // item_id → quantidade_disponivel
  const inventarioMap = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {}
    for (const inv of inventarioUnidade as any[]) {
      map[inv.item] = inv.quantidade_disponivel ?? 0
    }
    return map
  }, [inventarioUnidade])

  const setorOptions = [
    { value: "todos", label: "Todos" },
    ...setores
      .filter(s => s.nome.trim() !== '')
      .map(s => ({ value: String(s.id), label: s.nome }))
  ]

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Requisicao> }) => updateRequisicao(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisicoesQueryKey });
      setEditItem(null);
      toast({ title: "Sucesso", description: "Pedido atualizado." });
    },
    onError: () => toast({ title: "Erro", description: "Falha na operação.", variant: "destructive" }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRequisicao,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: requisicoesQueryKey }); setDeleteId(null); toast({ title: "Removida" }); },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  })

  const aprovaMutation = useMutation({
    mutationFn: ({ id, itens }: { id: number; itens: { id: number; quantidade_aprovada: number }[] }) => aprovarRequisicao(id, itens),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisicoesQueryKey });
      setApprovalItem(null); setApprovalQuantities({});
      toast({ title: "Pedido aprovado!" });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao aprovar.", variant: "destructive" }),
  })

  const negaMutation = useMutation({
    mutationFn: ({ id, observacao }: { id: number; observacao: string }) => negarRequisicao(id, observacao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisicoesQueryKey });
      setRejectItem(null); setRejectJustificativa("");
      toast({ title: "Pedido negado." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao negar.", variant: "destructive" }),
  })

  const entregaMutation = useMutation({
    mutationFn: (id: number) => entregarRequisicao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisicoesQueryKey });
      setEntregarItem(null);
      toast({ title: "Entrega registrada!", description: "Saída de estoque gerada automaticamente." });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.detail ?? "Falha ao registrar entrega.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  })

  const filtered = useMemo(() => items.filter(req => {
    const matchItem = req.itens?.some(i => i.item_nome?.toLowerCase().includes(filterItem.toLowerCase())) || req.requisitante_nome?.toLowerCase().includes(filterItem.toLowerCase())
    const matchSetor = filterSetor && filterSetor !== "todos" ? String(req.setor_requisicao) === filterSetor : true
    const matchStatus = filterStatus && filterStatus !== "todos" ? req.status === filterStatus : true
    const matchDataInicio = filterDataInicio ? (req.data || "") >= filterDataInicio : true
    const matchDataFim = filterDataFim ? (req.data || "") <= filterDataFim : true
    return matchItem && matchSetor && matchStatus && matchDataInicio && matchDataFim
  }), [items, filterItem, filterSetor, filterStatus, filterDataInicio, filterDataFim])

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered)
  const { page, goToPage, totalPages, paginatedItems, total, hasNext, hasPrev } = usePagination(sorted)

  const toggleRow = (id: number) => setExpandedRows(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  })

  const openApproval = (req: Requisicao) => {
    setApprovalItem(req);
    const quantities: Record<number, string> = {};
    req.itens?.forEach(it => { quantities[it.id] = String(it.quantidade); });
    setApprovalQuantities(quantities);
  };

  const handleApprove = () => {
    if (!approvalItem) return;
    const itens = (approvalItem.itens ?? []).map(it => ({
      id: it.id,
      quantidade_aprovada: parseInt(approvalQuantities[it.id] ?? String(it.quantidade)) || 0,
    }));
    aprovaMutation.mutate({ id: approvalItem.id, itens });
  };

  const handleReject = () => {
    if (rejectItem) negaMutation.mutate({ id: rejectItem.id, observacao: rejectJustificativa });
  };

  const getExportData = () => filtered.map(r => ({ Data: r.data, Itens: r.itens?.map(i => i.item_nome).join(", "), Requisitante: r.requisitante_nome, Setor: r.setor_nome, Status: r.status }));

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/pedidos-internos/nova")} className="gap-2"><Plus className="w-4 h-4" />Adicionar</Button>
          <Button onClick={() => navigate("/estoque/pedidos-internos/relatorio")} variant="outline" className="gap-2 border-border"><FileText className="w-4 h-4" />Relatório</Button>
          <ExportButton getData={getExportData} fileName="estoque-pedidos-internos" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Buscar", placeholder: "Buscar item ou requisitante...", value: filterItem, onChange: setFilterItem, width: "flex-1 min-w-[200px]" },
            { type: "select", label: "Setor", placeholder: "Todos", value: filterSetor, onChange: setFilterSetor, options: setorOptions, width: "min-w-[180px]" },
            { type: "select", label: "Status", placeholder: "Todos", value: filterStatus, onChange: setFilterStatus, options: [{ value: "todos", label: "Todos" }, { value: "Análise", label: "Análise" }, { value: "Aprovado", label: "Aprovado" }, { value: "Negado", label: "Negado" }], width: "min-w-[160px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={filtered.length}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="w-[40px]" />
              <SortableHead label="Data" field="data" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Requisitante" field="requisitante_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Setor" field="setor_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Unidade" field="unidade_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Status" field="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="text-center font-semibold">Aprovação</TableHead>
              <TableHead className="text-center font-semibold">Entrega</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando pedidos...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-destructive">Erro ao carregar os dados.</TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado.</TableCell></TableRow>
              ) : paginatedItems.map((req) => (
                <>
                  <TableRow key={req.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleRow(req.id)}>
                        {expandedRows.has(req.id) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">{req.data ? new Date(req.data).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell className="text-center">{req.requisitante_nome || "—"}</TableCell>
                    <TableCell className="text-center">{req.setor_nome || "—"}</TableCell>
                    <TableCell className="text-center">{req.unidade_nome || "—"}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={req.status || ""} /></TableCell>
                    <TableCell className="text-center">
                      {req.status === "Análise" ? (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openApproval(req)}>
                          <ClipboardCheck className="w-3.5 h-3.5" /> Analisar
                        </Button>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {req.status === "Aprovado" && req.status_entrega !== "Efetuada" ? (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEntregarItem(req)}>
                          <PackageCheck className="w-3.5 h-3.5" /> Entregar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{req.status_entrega === "Efetuada" ? "Entregue ✓" : "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <TableActions onView={() => setViewItem(req)} onEdit={() => { setEditItem(req); setEditData({ requisitante_nome: req.requisitante_nome || "", observacao: req.observacao || "" }); }} onDelete={() => setDeleteId(req.id)} />
                    </TableCell>
                  </TableRow>

                  {expandedRows.has(req.id) && (
                    <TableRow key={`${req.id}-items`} className="bg-muted/30">
                      <TableCell colSpan={9} className="py-0 px-8">
                        <div className="py-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Itens da Requisição #{req.id}
                          </p>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-center text-xs h-8">Item</TableHead>
                                <TableHead className="text-center text-xs h-8">Qtd Solicitada</TableHead>
                                <TableHead className="text-center text-xs h-8">Qtd Aprovada</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(req.itens ?? []).length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center text-sm py-2 text-muted-foreground">Sem itens</TableCell></TableRow>
                              ) : (req.itens ?? []).map((it, idx) => (
                                <TableRow key={idx} className="border-0">
                                  <TableCell className="text-center text-sm py-1">{it.item_nome || `Item #${it.item}`}</TableCell>
                                  <TableCell className="text-center text-sm py-1">{it.quantidade}</TableCell>
                                  <TableCell className="text-center text-sm py-1">
                                    {it.quantidade_aprovada != null
                                      ? <span className="font-medium text-green-600">{it.quantidade_aprovada}</span>
                                      : <span className="text-muted-foreground">—</span>}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total} registros</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={!hasPrev}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasNext}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Aprovar */}
      <Dialog open={!!approvalItem} onOpenChange={() => { setApprovalItem(null); setApprovalQuantities({}); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Aprovar Pedido Interno</DialogTitle></DialogHeader>
          {approvalItem && (
            <div className="space-y-5">
              <div className="border border-border rounded-lg p-4 space-y-2 text-sm">
                <p className="font-semibold">Detalhes do Pedido</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Requisitante:</span> <span className="font-medium">{approvalItem.requisitante_nome || "—"}</span></div>
                  <div><span className="text-muted-foreground">Unidade:</span> <span className="font-medium">{approvalItem.unidade_nome || "—"}</span></div>
                  <div><span className="text-muted-foreground">Setor:</span> <span className="font-medium">{approvalItem.setor_nome || "—"}</span></div>
                  <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{approvalItem.data || "—"}</span></div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Itens — defina a quantidade a liberar</p>
                <div className="rounded border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Item</th>
                        <th className="text-center px-3 py-2 font-medium">Qtd Solicitada</th>
                        <th className="text-center px-3 py-2 font-medium">Disponível</th>
                        <th className="text-center px-3 py-2 font-medium">Qtd a Liberar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(approvalItem.itens ?? []).length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">Sem itens</td></tr>
                      ) : (approvalItem.itens ?? []).map((it) => {
                        const disponivel = inventarioMap[it.item ?? 0] ?? null;
                        const liberando = parseInt(approvalQuantities[it.id] ?? String(it.quantidade)) || 0;
                        const semEstoque = disponivel !== null && liberando > disponivel;
                        return (
                          <tr key={it.id} className="border-t border-border">
                            <td className="px-3 py-2">{it.item_nome || `Item #${it.item}`}</td>
                            <td className="px-3 py-2 text-center">{it.quantidade}</td>
                            <td className="px-3 py-2 text-center">
                              {disponivel === null ? (
                                <span className="text-muted-foreground text-xs">—</span>
                              ) : semEstoque ? (
                                <span className="flex items-center justify-center gap-1 text-destructive text-xs font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" />{disponivel}
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-1 text-green-600 text-xs font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" />{disponivel}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Input
                                type="number" min="0" max={it.quantidade}
                                className={`w-20 mx-auto text-center ${semEstoque ? "border-destructive" : ""}`}
                                value={approvalQuantities[it.id] ?? String(it.quantidade)}
                                onChange={(e) => setApprovalQuantities(p => ({ ...p, [it.id]: e.target.value }))}
                              />
                              {semEstoque && <p className="text-xs text-destructive mt-0.5">Estoque insuficiente</p>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Você pode liberar uma quantidade diferente da solicitada.</p>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => { setRejectItem(approvalItem); setApprovalItem(null); }}>Negar</Button>
                <Button variant="outline" onClick={() => { setApprovalItem(null); setApprovalQuantities({}); }}>Cancelar</Button>
                <Button onClick={handleApprove} disabled={aprovaMutation.isPending}>Aprovar Pedido</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Negar */}
      <Dialog open={!!rejectItem} onOpenChange={() => { setRejectItem(null); setRejectJustificativa(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Negar Pedido Interno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Informe a justificativa para negar o pedido de <strong>{rejectItem?.requisitante_nome}</strong>.</p>
            <div className="space-y-2">
              <Label>Justificativa <span className="text-destructive">*</span></Label>
              <Textarea value={rejectJustificativa} onChange={e => setRejectJustificativa(e.target.value)} placeholder="Motivo da negação..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectItem(null); setRejectJustificativa(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectJustificativa.trim() || negaMutation.isPending}>Negar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Entregar */}
      <AlertDialog open={!!entregarItem} onOpenChange={() => setEntregarItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              Será gerada uma <strong>saída de estoque</strong> automática com os itens aprovados da requisição de <strong>{entregarItem?.requisitante_nome}</strong>.
              O estoque da unidade <strong>{entregarItem?.unidade_nome}</strong> será debitado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => entregarItem && entregaMutation.mutate(entregarItem.id)}
              disabled={entregaMutation.isPending}
            >
              Confirmar Entrega
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Pedido Interno</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4 text-sm">
              {[["Data", viewItem.data], ["Requisitante", viewItem.requisitante_nome], ["Unidade", viewItem.unidade_nome], ["Setor", viewItem.setor_nome], ["Status", viewItem.status], ["Entrega", viewItem.status_entrega], ["Observação", viewItem.observacao]].map(([k, v]) => v ? (
                <div key={k} className="flex justify-between py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ) : null)}
              {(viewItem.itens ?? []).length > 0 && (
                <div className="pt-1">
                  <p className="font-semibold mb-2">Itens</p>
                  {viewItem.itens!.map((it, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                      <span>{it.item_nome}</span>
                      <span className="text-muted-foreground">Solicitado: {it.quantidade}{it.quantidade_aprovada != null ? ` | Aprovado: ${it.quantidade_aprovada}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Pedido Interno</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Requisitante</Label><Input value={editData.requisitante_nome} onChange={e => setEditData(p => ({ ...p, requisitante_nome: e.target.value }))} /></div>
            <div><Label>Observação</Label><Textarea value={editData.observacao} onChange={e => setEditData(p => ({ ...p, observacao: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={() => editItem && updateMutation.mutate({ id: editItem.id, payload: editData })} disabled={updateMutation.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir pedido?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
