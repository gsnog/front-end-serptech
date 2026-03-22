import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Landmark } from "lucide-react"
import { FilterSection } from "@/components/FilterSection"
import { TableActions } from "@/components/TableActions"
import { ExportButton } from "@/components/ExportButton"
import { SimpleFormWizard } from "@/components/SimpleFormWizard"
import { FormActionBar } from "@/components/FormActionBar"
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchPatrimonio, createPatrimonio, updatePatrimonio, deletePatrimonio, type Patrimonio as Asset, fetchItensEstoque, fetchUnidades } from "@/services/estoque"

type ViewState = 'list' | 'add'

const Patrimonio = () => {
  const [currentView, setCurrentView] = useState<ViewState>('list')
  const queryClient = useQueryClient()
  const [filterNome, setFilterNome] = useState("")
  const [filterData, setFilterData] = useState("")
  const [viewItem, setViewItem] = useState<Asset | null>(null)
  const [editItem, setEditItem] = useState<Asset | null>(null)
  const [editData, setEditData] = useState<Partial<Asset>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ item: '', data_de_aquisicao: '', valor: '', descricao: '', unidade: '', codigo: '' })

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['patrimonio', currentPage],
    queryFn: () => fetchPatrimonio(currentPage),
  });
  const assets = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const { data: itensEstoque = [] } = useQuery({
    queryKey: ['itens'],
    queryFn: fetchItensEstoque,
  })

  const createMutation = useMutation({
    mutationFn: createPatrimonio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
      setCurrentView('list');
      setFormData({ item: '', data_de_aquisicao: '', valor: '', descricao: '', unidade: '', codigo: '' });
      toast({ title: "Salvo", description: "Patrimônio adicionado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Asset> }) => updatePatrimonio(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
      setEditItem(null);
      toast({ title: "Salvo", description: "Patrimônio atualizado." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePatrimonio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
      setDeleteId(null);
      toast({ title: "Removido", description: "Patrimônio excluído." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  })

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchNome = (asset.item_nome || "").toLowerCase().includes(filterNome.toLowerCase()) || (asset.codigo || "").toLowerCase().includes(filterNome.toLowerCase())
      const matchData = filterData ? (asset.data_de_aquisicao || "").includes(filterData) : true
      return matchNome && matchData
    })
  }, [assets, filterNome, filterData])

  const getExportData = () => filteredAssets.map(a => ({ Código: a.codigo, Item: a.item_nome, "Data Aquisição": a.data_de_aquisicao, Valor: a.valor }))
  const openEdit = (a: Asset) => { setEditItem(a); setEditData({ ...a }) }
  const handleSaveEdit = () => { if (editItem) updateMutation.mutate({ id: editItem.id, payload: editData }) }
  const handleDeleteConfirm = () => { if (deleteId) deleteMutation.mutate(deleteId) }

  const handleCancelAdd = () => { setCurrentView('list'); setFormData({ item: '', data_de_aquisicao: '', valor: '', descricao: '', unidade: '', codigo: '' }) }

  const handleSubmitAdd = async () => {
    createMutation.mutate({
      item: Number(formData.item),
      data_de_aquisicao: formData.data_de_aquisicao,
      valor: Number(formData.valor),
      unidade: Number(formData.unidade),
      descricao: formData.descricao,
      codigo: formData.codigo
    })
  }

  if (currentView === 'list') {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={() => setCurrentView('add')} className="gap-2"><Plus className="w-4 h-4" />Novo Patrimônio</Button>
            <ExportButton getData={getExportData} fileName="patrimonio" />
          </div>

          <FilterSection
            fields={[
              { type: "text", label: "Item / Código", placeholder: "Buscar...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" },
              { type: "date", label: "Data de Aquisição", value: filterData, onChange: setFilterData, width: "min-w-[160px]" }
            ]}
            resultsCount={filteredAssets.length}
          />

          <div className="rounded border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-table-header">
                <TableHead className="text-center font-semibold">Código</TableHead>
                <TableHead className="text-center font-semibold">Item</TableHead>
                <TableHead className="text-center font-semibold">Data de Aquisição</TableHead>
                <TableHead className="text-center font-semibold">Valor</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando patrimônio...</TableCell></TableRow>
                ) : isError ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-destructive">Erro ao carregar dados.</TableCell></TableRow>
                ) : filteredAssets.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum patrimônio encontrado.</TableCell></TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="text-center">{asset.codigo}</TableCell>
                      <TableCell className="text-center font-medium">{asset.item_nome}</TableCell>
                      <TableCell className="text-center">{asset.data_de_aquisicao ? new Date(asset.data_de_aquisicao).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="text-center font-semibold">R$ {asset.valor?.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <TableActions onView={() => setViewItem(asset)} onEdit={() => openEdit(asset)} onDelete={() => setDeleteId(asset.id)} />
                      </TableCell>
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
        </div>

        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{viewItem?.item_nome} ({viewItem?.codigo})</DialogTitle></DialogHeader>
            {viewItem && (
              <div className="space-y-2 py-2">
                <InfoRow label="Código" value={viewItem.codigo || ""} />
                <InfoRow label="Item" value={viewItem.item_nome || ""} />
                <InfoRow label="Data de Aquisição" value={viewItem.data_de_aquisicao || ""} />
                <InfoRow label="Valor" value={`R$ ${viewItem.valor?.toFixed(2)}`} />
                <InfoRow label="Descrição" value={viewItem.descricao || "—"} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Editar Patrimônio</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label>Código</Label><Input value={editData.codigo || ""} onChange={e => setEditData(p => ({ ...p, codigo: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Valor</Label><Input type="number" value={editData.valor || 0} onChange={e => setEditData(p => ({ ...p, valor: Number(e.target.value) }))} /></div>
              <div className="space-y-2 col-span-2"><Label>Descrição</Label><Textarea value={editData.descricao || ""} onChange={e => setEditData(p => ({ ...p, descricao: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir este patrimônio? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>Excluir</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  if (currentView === 'add') {
    return (
      <SimpleFormWizard title="Novo Patrimônio">
        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Item <span className="text-destructive">*</span></Label>
                  <Select value={formData.item} onValueChange={(v) => setFormData(prev => ({ ...prev, item: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o item" /></SelectTrigger>
                    <SelectContent>
                      {itensEstoque.map(opt => <SelectItem key={opt.id} value={String(opt.id)}>{opt.itens_do_estoque}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Código Patrimonial <span className="text-destructive">*</span></Label><Input id="codigo" value={formData.codigo} onChange={(e) => setFormData(p => ({ ...p, codigo: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Data de Aquisição <span className="text-destructive">*</span></Label><Input id="data_de_aquisicao" type="date" value={formData.data_de_aquisicao} onChange={(e) => setFormData(p => ({ ...p, data_de_aquisicao: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Valor <span className="text-destructive">*</span></Label><Input id="valor" type="number" value={formData.valor} onChange={(e) => setFormData(p => ({ ...p, valor: e.target.value }))} /></div>
              </div>
              <FormActionBar onSave={handleSubmitAdd} onCancel={handleCancelAdd} isSaving={createMutation.isPending} />
            </div>
          </CardContent>
        </Card>
      </SimpleFormWizard>
    )
  }

  return null
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium">{value}</span></div>;
}

export default Patrimonio
