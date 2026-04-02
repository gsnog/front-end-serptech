import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { FilterSection } from "@/components/FilterSection"
import { SortableHead } from "@/components/SortableHead"
import { TableActions } from "@/components/TableActions"
import { ExportButton } from "@/components/ExportButton"
import { FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useQuery } from "@tanstack/react-query"
import { fetchInventario, fetchUnidades, inventarioQueryKey } from "@/services/estoque"
import { usePagination } from "@/hooks/usePagination"
import { useSortable } from "@/hooks/useSortable"
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates"
import { Loader2 } from "lucide-react"

export default function EstoqueInventario() {
  const navigate = useNavigate()

  useRealtimeUpdates([[...inventarioQueryKey]]);

  const { data: response, isLoading } = useQuery({
    queryKey: inventarioQueryKey,
    queryFn: () => fetchInventario(),
  });
  const inventario = Array.isArray(response) ? response : (response?.results ?? []);

  const { data: unidades = [] } = useQuery({ queryKey: ['unidades'], queryFn: fetchUnidades })
  const unidadeOptions = [
    { value: "todos", label: "Todos" },
    ...unidades.map(u => ({ value: u.unidade, label: u.unidade }))
  ]

  const [filterNome, setFilterNome] = useState("")
  const [filterCidade, setFilterCidade] = useState("")
  const [filterQtdMin, setFilterQtdMin] = useState("")
  const [viewItem, setViewItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [editData, setEditData] = useState({ item: "", quantidade: "", unidade: "" })

  const items = useMemo(() => {
    return (inventario || []).map(i => ({
      id: i.id,
      item: i.item_nome,
      quantidade: i.quantidade_disponivel,
      unidade: i.unidade_nome
    }))
  }, [inventario])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchNome = item.item.toLowerCase().includes(filterNome.toLowerCase())
      const matchCidade = filterCidade && filterCidade !== "todos" ? item.unidade === filterCidade : true
      const matchQtdMin = filterQtdMin ? Number(item.quantidade) >= Number(filterQtdMin) : true
      return matchNome && matchCidade && matchQtdMin
    })
  }, [items, filterNome, filterCidade, filterQtdMin])

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered)
  const { page, goToPage, totalPages, paginatedItems, total, hasNext, hasPrev } = usePagination(sorted)

  const getExportData = () => filtered.map(i => ({ Item: i.item, Quantidade: i.quantidade, Unidade: i.unidade }));
  const handleDelete = () => { if (deleteId !== null) { toast({ title: "Exclusão requer API" }); setDeleteId(null); } };
  const openEdit = (i: any) => { setEditItem(i); setEditData({ item: i.item, quantidade: String(i.quantidade), unidade: i.unidade }); };
  const handleSaveEdit = () => { if (editItem) { toast({ title: "Edição requer API" }); setEditItem(null); } };
  const deleteItem = items.find(i => i.id === deleteId);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/inventario/relatorio")} variant="outline" className="gap-2 border-border"><FileText className="w-4 h-4" />Relatório</Button>
          <ExportButton getData={getExportData} fileName="estoque-inventario" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Nome do Item", placeholder: "Buscar item...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" },
            { type: "select", label: "Unidade", placeholder: "Todas", value: filterCidade, onChange: setFilterCidade, options: unidadeOptions, width: "min-w-[180px]" },
            { type: "text", label: "Qtd. mínima", placeholder: "Ex: 10", value: filterQtdMin, onChange: setFilterQtdMin, width: "min-w-[130px]" }
          ]}
          resultsCount={filtered.length}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <SortableHead label="Item" field="item" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Quantidade" field="quantidade" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Unidade" field="unidade" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum item encontrado.</TableCell></TableRow>) : (
                paginatedItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="text-center">{item.item}</TableCell><TableCell className="text-center">{item.quantidade}</TableCell><TableCell className="text-center">{item.unidade}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(item)} onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{(page-1)*20+1}–{Math.min(page*20,total)} de {total} registros</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page-1)} disabled={!hasPrev}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(page+1)} disabled={!hasNext}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes do Item</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Item: viewItem.item, Quantidade: viewItem.quantidade, Unidade: viewItem.unidade }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{v}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Item</Label><Input value={editData.item} onChange={e => setEditData({ ...editData, item: e.target.value })} /></div>
            <div><Label>Quantidade</Label><Input type="number" value={editData.quantidade} onChange={e => setEditData({ ...editData, quantidade: e.target.value })} /></div>
            <div><Label>Unidade</Label><Input value={editData.unidade} onChange={e => setEditData({ ...editData, unidade: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir item?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{deleteItem?.item}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
