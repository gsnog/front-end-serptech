import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"
import { TableActions } from "@/components/TableActions"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchSaidas, deleteSaida, saidasQueryKey, type Saida } from "@/services/estoque"

export default function EstoqueSaidas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterNome, setFilterNome] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  const [viewItem, setViewItem] = useState<Saida | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: [...saidasQueryKey, currentPage],
    queryFn: () => fetchSaidas(currentPage),
  });
  const items = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  const deleteMutation = useMutation({
    mutationFn: deleteSaida,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: saidasQueryKey }); setDeleteId(null); toast({ title: "Removida", description: "Saída excluída." }) },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" })
  })

  const toggleRow = (id: number) => {
    setExpandedRows(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  const filtered = useMemo(() =>
    items.filter(s =>
      (s.setor_nome || "").toLowerCase().includes(filterNome.toLowerCase()) ||
      (s.criado_por_nome || "").toLowerCase().includes(filterNome.toLowerCase())
    ), [items, filterNome])

  const getExportData = () => filtered.map(s => ({ Data: s.data, "Setor": s.setor_nome, "Criado Por": s.criado_por_nome }))
  const deleteItemData = items.find(i => i.id === deleteId)

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/saidas/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Saída</Button>
          <ExportButton getData={getExportData} fileName="estoque-saidas" />
        </div>
        <FilterSection fields={[
          { type: "text", label: "Buscar", placeholder: "Setor ou usuário...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" },
          { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
          { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
        ]} resultsCount={totalCount} />
        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-center w-12"></TableHead>
              <TableHead className="text-center">Data</TableHead>
              <TableHead className="text-center">Setor</TableHead>
              <TableHead className="text-center">Produto</TableHead>
              <TableHead className="text-center">Quantidade</TableHead>
              <TableHead className="text-center">Criado Por</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma saída encontrada.</TableCell></TableRow> :
                  filtered.map(saida => (
                    <TableRow key={saida.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleRow(saida.id)}>
                          {expandedRows.has(saida.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">{saida.data}</TableCell>
                      <TableCell className="text-center">{saida.setor_nome || "—"}</TableCell>
                      <TableCell className="text-center font-medium">{saida.produto_nome || "—"}</TableCell>
                      <TableCell className="text-center">{saida.quantidade}</TableCell>
                      <TableCell className="text-center">{saida.criado_por_nome || "—"}</TableCell>
                      <TableCell className="text-center">
                        <TableActions onView={() => setViewItem(saida)} onEdit={() => { }} onDelete={() => setDeleteId(saida.id)} />
                      </TableCell>
                    </TableRow>
                  ))
              }
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
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Saída #{viewItem?.id}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 py-2">
            <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Data</span><span className="text-sm font-medium">{viewItem.data}</span></div>
            <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Setor</span><span className="text-sm font-medium">{viewItem.setor_nome || "—"}</span></div>
            <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Produto</span><span className="text-sm font-medium">{viewItem.produto_nome || "—"}</span></div>
            <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Quantidade</span><span className="text-sm font-medium">{viewItem.quantidade}</span></div>
            <div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Criado Por</span><span className="text-sm font-medium">{viewItem.criado_por_nome || "—"}</span></div>
          </div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir saída?</AlertDialogTitle><AlertDialogDescription>Deseja excluir a saída <strong>#{deleteItemData?.id}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
