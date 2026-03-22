import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"
import { Plus, FileText, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
import { TableActions } from "@/components/TableActions"
import { GradientCard } from "@/components/financeiro/GradientCard"
import { StatusBadge } from "@/components/StatusBadge"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useQuery } from "@tanstack/react-query"
import { fetchParcelas, fetchEstatisticasFinanceiras } from "@/services/financeiro"
import { Loader2 } from "lucide-react"

const FluxoCaixa = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const { data: response, isLoading: isLoadingParcelas } = useQuery({
    queryKey: ['parcelas', currentPage],
    queryFn: () => fetchParcelas(currentPage),
  })
  const parcelas = Array.isArray(response) ? response : (response?.results ?? [])
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0)
  const totalPages = Math.ceil(totalCount / 5)

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['estatisticasFinanceiras'],
    queryFn: fetchEstatisticasFinanceiras
  })

  const [filterTipo, setFilterTipo] = useState("")
  const [filterBeneficiario, setFilterBeneficiario] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  const [viewItem, setViewItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [editData, setEditData] = useState({ beneficiario: "", tipo: "", valorTotal: "" })

  const items = useMemo(() => {
    return (parcelas || []).map(p => ({
      id: p.id,
      dataVencimento: p.data_de_vencimento || "-",
      dataPagamento: p.data_de_pagamento || "-",
      beneficiario: p.conta_receber_nome || p.conta_pagar_nome || "N/A",
      tipo: p.conta_receber ? "Entrada" : "Saída",
      status: p.status,
      valorTotal: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor),
      saldo: "-"
    }))
  }, [parcelas])

  const filtered = useMemo(() => {
    return items.filter(trans => {
      const matchTipo = filterTipo && filterTipo !== "todos" ? trans.tipo.toLowerCase() === filterTipo : true
      const matchBeneficiario = trans.beneficiario.toLowerCase().includes(filterBeneficiario.toLowerCase())
      const matchDataInicio = filterDataInicio ? trans.dataVencimento >= filterDataInicio.split("-").reverse().join("/") : true
      const matchDataFim = filterDataFim ? trans.dataVencimento <= filterDataFim.split("-").reverse().join("/") : true
      return matchTipo && matchBeneficiario && matchDataInicio && matchDataFim
    })
  }, [items, filterTipo, filterBeneficiario, filterDataInicio, filterDataFim])

  const getExportData = () => filtered.map(t => ({ Vencimento: t.dataVencimento, Pagamento: t.dataPagamento, Tipo: t.tipo, Beneficiário: t.beneficiario, Status: t.status, Valor: t.valorTotal, Saldo: t.saldo }));
  const handleDelete = () => { if (deleteId !== null) { toast({ title: "Exclusão requer API" }); setDeleteId(null); } };
  const openEdit = (t: any) => { setEditItem(t); setEditData({ beneficiario: t.beneficiario, tipo: t.tipo, valorTotal: t.valorTotal }); };
  const handleSaveEdit = () => { if (editItem) { toast({ title: "Edição requer API" }); setEditItem(null); } };
  const deleteItemData = items.find(i => i.id === deleteId);

  if (isLoadingParcelas || isLoadingStats) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GradientCard title="Total de Entradas" value={formatCurrency(stats?.entradas || 0)} icon={ArrowUpRight} variant="success" />
          <GradientCard title="Total de Saídas" value={formatCurrency(stats?.saidas || 0)} icon={ArrowDownRight} variant="danger" />
          <GradientCard title="Saldo Atual" value={formatCurrency(stats?.saldo || 0)} icon={Wallet} variant="orange" />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/financeiro/fluxo-caixa/nova")} className="gap-2"><Plus className="w-4 h-4" />Adicionar Transação</Button>
          <Button onClick={() => navigate("/financeiro/fluxo-caixa/relatorio")} variant="outline" className="gap-2 border-border"><FileText className="w-4 h-4" />Relatório</Button>
          <ExportButton getData={getExportData} fileName="fluxo-caixa" />
        </div>

        <FilterSection
          fields={[
            { type: "select", label: "Tipo", placeholder: "Selecione o tipo", value: filterTipo, onChange: setFilterTipo, options: [{ value: "todos", label: "Todos" }, { value: "entrada", label: "Entrada" }, { value: "saída", label: "Saída" }], width: "min-w-[160px]" },
            { type: "text", label: "Beneficiário", placeholder: "Buscar beneficiário...", value: filterBeneficiario, onChange: setFilterBeneficiario, width: "flex-1 min-w-[180px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={totalCount}
        />

        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-center">Vencimento</TableHead><TableHead className="text-center">Pagamento</TableHead><TableHead className="text-center">Tipo</TableHead><TableHead className="text-center">Beneficiário</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-center">Valor</TableHead><TableHead className="text-center">Saldo</TableHead><TableHead className="text-center">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada.</TableCell></TableRow>) : (
              filtered.map((transacao) => (
                <TableRow key={transacao.id}>
                  <TableCell className="text-center">{transacao.dataVencimento}</TableCell><TableCell className="text-center">{transacao.dataPagamento}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={transacao.tipo} /></TableCell>
                  <TableCell className="text-center">{transacao.beneficiario}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={transacao.status} /></TableCell>
                  <TableCell className="text-center"><span className={transacao.tipo === 'Entrada' ? 'text-primary font-semibold' : 'text-red-700 font-semibold'}>{transacao.valorTotal}</span></TableCell>
                  <TableCell className="text-center font-semibold">{transacao.saldo}</TableCell>
                  <TableCell className="text-center"><TableActions onView={() => setViewItem(transacao)} onEdit={() => openEdit(transacao)} onDelete={() => setDeleteId(transacao.id)} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages} ({totalCount} registros)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Transação</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Vencimento: viewItem.dataVencimento, Pagamento: viewItem.dataPagamento, Tipo: viewItem.tipo, Beneficiário: viewItem.beneficiario, Status: viewItem.status, Valor: viewItem.valorTotal, Saldo: viewItem.saldo }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{v}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Beneficiário</Label><Input value={editData.beneficiario} onChange={e => setEditData({ ...editData, beneficiario: e.target.value })} /></div>
            <div><Label>Tipo</Label><Input value={editData.tipo} onChange={e => setEditData({ ...editData, tipo: e.target.value })} /></div>
            <div><Label>Valor Total</Label><Input value={editData.valorTotal} onChange={e => setEditData({ ...editData, valorTotal: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir transação?</AlertDialogTitle><AlertDialogDescription>Deseja excluir a transação "{deleteItemData?.beneficiario}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default FluxoCaixa
