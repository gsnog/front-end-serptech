import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"
import { Plus, FileText, ClipboardCheck, PackageCheck, ChevronDown, ChevronRight, User, CalendarCheck } from "lucide-react"
import { TableActions } from "@/components/TableActions"
import { StatusBadge } from "@/components/StatusBadge"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchRequisicoes, updateRequisicao, deleteRequisicao, type RequisicaoSetor as Requisicao, requisicoesQueryKey } from "@/services/estoque"
import { fetchSetores, setoresQueryKey } from "@/services/pessoas"

export default function EstoqueRequisicoes() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterItem, setFilterItem] = useState("")
  const [filterSetor, setFilterSetor] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  const [viewItem, setViewItem] = useState<Requisicao | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<Requisicao | null>(null)
  const [editData, setEditData] = useState({ requisitante_nome: "", observacao: "" })

  // Approval
  const [approvalItem, setApprovalItem] = useState<Requisicao | null>(null)
  const [approvalQuantities, setApprovalQuantities] = useState<Record<number, string>>({})
  const [rejectItem, setRejectItem] = useState<Requisicao | null>(null)
  const [rejectJustificativa, setRejectJustificativa] = useState("")
  const [entregarItem, setEntregarItem] = useState<Requisicao | null>(null)

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading, isError } = useQuery({
    queryKey: [...requisicoesQueryKey, currentPage],
    queryFn: () => fetchRequisicoes(currentPage),
  });
  const items = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const { data: setores = [] } = useQuery({
    queryKey: setoresQueryKey,
    queryFn: fetchSetores,
  })

  const setorOptions = [
    { value: "todos", label: "Todos" },
    ...setores
      .filter(s => (s.setor != null && String(s.setor).trim() !== '') || (s.nome != null && String(s.nome).trim() !== ''))
      .map(s => ({
        value: s.id != null ? String(s.id) : String(s.nome || s.setor),
        label: String(s.nome || s.setor || ''),
      }))
  ]

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Requisicao> }) => updateRequisicao(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisicoesQueryKey });
      setApprovalItem(null);
      setRejectItem(null);
      setEntregarItem(null);
      setEditItem(null);
      toast({ title: "Sucesso", description: "Pedido atualizado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha na operação.", variant: "destructive" }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRequisicao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisicoesQueryKey });
      setDeleteId(null);
      toast({ title: "Removida", description: "Requisição excluída." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  })

  const filtered = useMemo(() => {
    return items.filter(req => {
      const matchItem = req.itens?.some(i => i.item_nome?.toLowerCase().includes(filterItem.toLowerCase())) ||
        req.requisitante_nome?.toLowerCase().includes(filterItem.toLowerCase())
      const matchSetor = filterSetor && filterSetor !== "todos" ? String(req.setor_requisicao) === filterSetor : true
      const matchDataInicio = filterDataInicio ? (req.data || "") >= filterDataInicio : true
      const matchDataFim = filterDataFim ? (req.data || "") <= filterDataFim : true
      return matchItem && matchSetor && matchDataInicio && matchDataFim
    })
  }, [items, filterItem, filterSetor, filterDataInicio, filterDataFim])

  const getExportData = () => filtered.map(r => ({ Data: r.data, Itens: r.itens?.map(i => i.item_nome).join(", "), Requisitante: r.requisitante_nome, Setor: r.setor_nome, Status: r.status }));
  const handleDelete = () => { if (deleteId !== null) deleteMutation.mutate(deleteId); };
  const openEdit = (r: Requisicao) => { setEditItem(r); setEditData({ requisitante_nome: r.requisitante_nome || "", observacao: r.observacao || "" }); };
  const handleSaveEdit = () => { if (editItem) updateMutation.mutate({ id: editItem.id, payload: editData }); };

  const openApproval = (req: Requisicao) => {
    setApprovalItem(req);
    const quantities: Record<number, string> = {};
    req.itens?.forEach(it => { quantities[it.id] = String(it.quantidade); });
    setApprovalQuantities(quantities);
  };

  const handleApprove = () => {
    if (!approvalItem) return;
    updateMutation.mutate({ id: approvalItem.id, payload: { status: "Aprovado" } });
  };

  const handleReject = () => {
    if (rejectItem) {
      updateMutation.mutate({ id: rejectItem.id, payload: { status: "Negado", observacao: rejectJustificativa } });
    }
  };

  const handleEntregar = (req: Requisicao) => {
    updateMutation.mutate({ id: req.id, payload: { status_entrega: "Efetuada" } });
  };

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
            { type: "select", label: "Setor", placeholder: "Selecione o setor", value: filterSetor, onChange: setFilterSetor, options: setorOptions, width: "min-w-[180px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={totalCount}
        />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-center">Data</TableHead>
              <TableHead className="text-center">Itens</TableHead>
              <TableHead className="text-center">Requisitante</TableHead>
              <TableHead className="text-center">Setor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Aprovação</TableHead>
              <TableHead className="text-center">Entrega</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando pedidos...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-destructive">Erro ao carregar os dados.</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado.</TableCell></TableRow>
              ) : (
                filtered.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="text-center">{req.data ? new Date(req.data).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    <TableCell className="text-center truncate max-w-[200px]">{req.itens?.map(i => i.item_nome).join(", ")}</TableCell>
                    <TableCell className="text-center">{req.requisitante_nome || "—"}</TableCell>
                    <TableCell className="text-center">{req.setor_nome || "—"}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={req.status || ""} /></TableCell>
                    <TableCell className="text-center">
                      {req.status === "Análise" ? (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openApproval(req)}>
                          <ClipboardCheck className="w-3.5 h-3.5" /> Analisar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {req.status === "Aprovado" && req.status_entrega !== "Efetuada" ? (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEntregarItem(req)}>
                          <PackageCheck className="w-3.5 h-3.5" /> Entregar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{req.status_entrega === "Efetuada" ? "Entregue" : "—"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <TableActions onView={() => setViewItem(req)} onEdit={() => openEdit(req)} onDelete={() => setDeleteId(req.id)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!approvalItem} onOpenChange={() => { setApprovalItem(null); setApprovalQuantities({}); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Aprovar Pedido Interno</DialogTitle></DialogHeader>
          {approvalItem && (
            <div className="space-y-5">
              <div className="border border-border rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Detalhes do Pedido</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">Requisitante:</span> {approvalItem.requisitante_nome}</div>
                  <div><span className="font-semibold">Unidade:</span> {approvalItem.unidade_nome}</div>
                  <div><span className="font-semibold">Setor:</span> {approvalItem.setor_nome}</div>
                  <div><span className="font-semibold">Data do Pedido:</span> {approvalItem.data}</div>
                </div>
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => { setRejectItem(approvalItem); setApprovalItem(null); }}>Rejeitar</Button>
                <Button variant="outline" onClick={() => setApprovalItem(null)}>Cancelar</Button>
                <Button onClick={handleApprove} disabled={updateMutation.isPending}>Aprovar Pedido</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectItem} onOpenChange={() => { setRejectItem(null); setRejectJustificativa(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar Pedido Interno</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Informe a justificativa para rejeitar o pedido de <strong>{rejectItem?.requisitante_nome}</strong>.</p>
            <div className="space-y-2">
              <Label>Justificativa <span className="text-destructive">*</span></Label>
              <Textarea value={rejectJustificativa} onChange={e => setRejectJustificativa(e.target.value)} placeholder="Motivo da rejeição..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectItem(null); setRejectJustificativa(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectJustificativa.trim() || updateMutation.isPending}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entregar Dialog */}
      <AlertDialog open={!!entregarItem} onOpenChange={() => setEntregarItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Entregar Pedido Interno?</AlertDialogTitle>
            <AlertDialogDescription>Ao entregar o pedido de <strong>{entregarItem?.requisitante_nome}</strong>, o status de entrega será atualizado. Deseja prosseguir?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => entregarItem && handleEntregar(entregarItem)}>Entregar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes do Pedido Interno</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">Data</span><span className="font-medium">{viewItem.data}</span></div>
                <div className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">Requisitante</span><span className="font-medium">{viewItem.requisitante_nome}</span></div>
                <div className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">Unidade</span><span className="font-medium">{viewItem.unidade_nome}</span></div>
                <div className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">Setor</span><span className="font-medium">{viewItem.setor_nome}</span></div>
                <div className="flex justify-between py-1 border-b border-border"><span className="text-muted-foreground">Status</span><StatusBadge status={viewItem.status || ""} /></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Pedido Interno</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Requisitante</Label><Input value={editData.requisitante_nome} onChange={e => setEditData({ ...editData, requisitante_nome: e.target.value })} /></div>
            <div><Label>Observação</Label><Textarea value={editData.observacao} onChange={e => setEditData({ ...editData, observacao: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir pedido?</AlertDialogTitle><AlertDialogDescription>Deseja excluir este pedido? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
