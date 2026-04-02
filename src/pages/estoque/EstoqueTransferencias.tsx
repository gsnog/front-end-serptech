import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { FilterSection } from "@/components/FilterSection"
import { TableActions } from "@/components/TableActions"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useSortable } from "@/hooks/useSortable"
import { usePagination } from "@/hooks/usePagination"
import { SortableHead } from "@/components/SortableHead"

const fetchTransferencias = async (page = 1) => {
  const res = await api.get('/api/estoque/transferencias/', { params: { page, page_size: 20 } })
  return res.data
}

export default function EstoqueTransferencias() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const { data: response, isLoading } = useQuery({
    queryKey: ['transferencias_estoque', page],
    queryFn: () => fetchTransferencias(page),
  })
  const transferencias = response?.results ?? []
  const serverTotal = response?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20))
  const hasNext = page < totalPages
  const hasPrev = page > 1

  const [filterOrigem, setFilterOrigem] = useState("")
  const [filterDestino, setFilterDestino] = useState("")
  const [viewItem, setViewItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const items = useMemo(() => transferencias.map((t: any) => ({
    id: t.id,
    data: t.data ?? "",
    origem: t.estoque_origem_nome ?? `Unidade ${t.estoque_origem}`,
    destino: t.estoque_destino_nome ?? `Unidade ${t.estoque_destino}`,
    itens: t.itens ?? [],
    observacao: t.observacao ?? "",
  })), [transferencias])

  const filtered = useMemo(() => items.filter(t => {
    const matchOrigem = t.origem.toLowerCase().includes(filterOrigem.toLowerCase())
    const matchDestino = t.destino.toLowerCase().includes(filterDestino.toLowerCase())
    return matchOrigem && matchDestino
  }), [items, filterOrigem, filterDestino])

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered)
  const { paginatedItems, total } = usePagination(sorted)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/estoque/transferencias/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias_estoque'] })
      toast({ title: "Transferência excluída" })
      setDeleteId(null)
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  })

  const deleteItem = items.find(i => i.id === deleteId)
  const getExportData = () => filtered.map(t => ({ Data: t.data, Origem: t.origem, Destino: t.destino }))

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/transferencias/nova")} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Transferência
          </Button>
          <ExportButton getData={getExportData} fileName="transferencias-estoque" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Origem", placeholder: "Filtrar origem...", value: filterOrigem, onChange: setFilterOrigem, width: "flex-1 min-w-[180px]" },
            { type: "text", label: "Destino", placeholder: "Filtrar destino...", value: filterDestino, onChange: setFilterDestino, width: "flex-1 min-w-[180px]" },
          ]}
          resultsCount={filtered.length}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <SortableHead label="Data" field="data" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Origem" field="origem" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Destino" field="destino" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <TableHead className="text-center font-semibold">Qtd. Itens</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma transferência encontrada.</TableCell></TableRow>
              ) : (
                paginatedItems.map((t) => (
                  <TableRow key={t.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="text-center">{t.data}</TableCell>
                    <TableCell className="text-center">{t.origem}</TableCell>
                    <TableCell className="text-center">{t.destino}</TableCell>
                    <TableCell className="text-center">{t.itens.length}</TableCell>
                    <TableCell className="text-center">
                      <TableActions onView={() => setViewItem(t)} onDelete={() => setDeleteId(t.id)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{(page - 1) * 20 + 1}–{Math.min(page * 20, serverTotal)} de {serverTotal}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrev}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Transferência #{viewItem?.id}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{viewItem.data}</p></div>
                <div><span className="text-muted-foreground">Origem:</span><p className="font-medium">{viewItem.origem}</p></div>
                <div><span className="text-muted-foreground">Destino:</span><p className="font-medium">{viewItem.destino}</p></div>
                {viewItem.observacao && <div className="col-span-2"><span className="text-muted-foreground">Observação:</span><p className="font-medium">{viewItem.observacao}</p></div>}
              </div>
              {viewItem.itens.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Itens transferidos:</p>
                  <Table>
                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-center">Quantidade</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {viewItem.itens.map((it: any) => (
                        <TableRow key={it.id}><TableCell>{it.item_nome}</TableCell><TableCell className="text-center">{it.quantidade}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transferência?</AlertDialogTitle>
            <AlertDialogDescription>Transferência de "{deleteItem?.origem}" → "{deleteItem?.destino}" em {deleteItem?.data}. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
