import { useState, useMemo } from "react"
import { fmtDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { FilterSection } from "@/components/FilterSection"
import { TableActions } from "@/components/TableActions"
import { ExportButton } from "@/components/ExportButton"
import { SimpleFormWizard } from "@/components/SimpleFormWizard"
import { FormActionBar } from "@/components/FormActionBar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchPatrimonio, createPatrimonio, updatePatrimonio, deletePatrimonio,
  type Patrimonio as Asset,
  fetchItensEstoque, fetchUnidades,
  patrimonioQueryKey, unidadesQueryKey, itensEstoqueQueryKey,
} from "@/services/estoque"

type ViewState = 'list' | 'add'

const emptyForm = { item: '', codigo: '', data_de_aquisicao: '', valor: '', unidade: '', descricao: '' }

const Patrimonio = () => {
  const [currentView, setCurrentView] = useState<ViewState>('list')
  const queryClient = useQueryClient()
  const [filterNome, setFilterNome] = useState("")
  const [filterData, setFilterData] = useState("")
  const [viewItem, setViewItem] = useState<Asset | null>(null)
  const [editItem, setEditItem] = useState<Asset | null>(null)
  const [editData, setEditData] = useState<Partial<Asset>>({})
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const [currentPage, setCurrentPage] = useState(1)
  const { data: response, isLoading, isError } = useQuery({
    queryKey: [...patrimonioQueryKey, currentPage],
    queryFn: () => fetchPatrimonio(currentPage),
  })
  const assets = Array.isArray(response) ? response : (response?.results ?? [])
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalCount / 20))

  const { data: itensRaw } = useQuery({ queryKey: itensEstoqueQueryKey, queryFn: fetchItensEstoque })
  const itensEstoque = Array.isArray(itensRaw) ? itensRaw : (itensRaw as any)?.results ?? []

  const { data: unidadesRaw } = useQuery({ queryKey: unidadesQueryKey, queryFn: fetchUnidades })
  const unidades = Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? []

  const createMutation = useMutation({
    mutationFn: createPatrimonio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patrimonioQueryKey })
      setCurrentView('list')
      setFormData(emptyForm)
      toast({ title: "Salvo", description: "Patrimônio adicionado com sucesso." })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.codigo?.[0] || error?.response?.data?.detail || "Falha ao salvar."
      toast({ title: "Erro", description: msg, variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Asset> }) => updatePatrimonio(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patrimonioQueryKey })
      setEditItem(null)
      toast({ title: "Salvo", description: "Patrimônio atualizado." })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.codigo?.[0] || error?.response?.data?.detail || "Falha ao atualizar."
      toast({ title: "Erro", description: msg, variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePatrimonio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patrimonioQueryKey })
      setDeleteId(null)
      toast({ title: "Removido", description: "Patrimônio excluído." })
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  })

  const filteredAssets = useMemo(() => assets.filter(asset => {
    const matchNome =
      (asset.item_nome || "").toLowerCase().includes(filterNome.toLowerCase()) ||
      (asset.codigo || "").toLowerCase().includes(filterNome.toLowerCase())
    const matchData = filterData ? (asset.data_de_aquisicao || "").includes(filterData) : true
    return matchNome && matchData
  }), [assets, filterNome, filterData])

  const getExportData = () => filteredAssets.map(a => ({
    Código: a.codigo,
    Item: a.item_nome,
    Unidade: a.unidade_nome,
    "Data Aquisição": a.data_de_aquisicao,
    Valor: a.valor,
    Descrição: a.descricao,
  }))

  const openEdit = (a: Asset) => { setEditItem(a); setEditData({ ...a }) }

  const handleSaveEdit = () => {
    if (!editData.codigo?.trim()) {
      toast({ title: "Campo obrigatório", description: "O código de identificação é obrigatório.", variant: "destructive" })
      return
    }
    if (editItem) updateMutation.mutate({ id: editItem.id, payload: editData })
  }

  const handleSubmitAdd = () => {
    if (!formData.item) { toast({ title: "Campo obrigatório", description: "Selecione o item.", variant: "destructive" }); return }
    if (!formData.codigo.trim()) { toast({ title: "Campo obrigatório", description: "Informe o código de identificação.", variant: "destructive" }); return }
    if (!formData.unidade) { toast({ title: "Campo obrigatório", description: "Selecione a unidade.", variant: "destructive" }); return }
    if (!formData.data_de_aquisicao) { toast({ title: "Campo obrigatório", description: "Informe a data de aquisição.", variant: "destructive" }); return }
    if (!formData.valor || Number(formData.valor) <= 0) { toast({ title: "Campo obrigatório", description: "Informe o valor.", variant: "destructive" }); return }

    createMutation.mutate({
      item: Number(formData.item),
      codigo: formData.codigo.trim(),
      data_de_aquisicao: formData.data_de_aquisicao,
      valor: Number(formData.valor),
      unidade: Number(formData.unidade),
      descricao: formData.descricao,
    })
  }

  const handleCancelAdd = () => { setCurrentView('list'); setFormData(emptyForm) }

  // ── Formulário de cadastro ─────────────────────────────────────────────────
  if (currentView === 'add') {
    return (
      <SimpleFormWizard title="Novo Patrimônio">
        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Item <span className="text-destructive">*</span></Label>
                <Select value={formData.item} onValueChange={v => setFormData(p => ({ ...p, item: v }))}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o item" /></SelectTrigger>
                  <SelectContent className="bg-popover max-h-[300px]">
                    {itensEstoque.map((i: any) => (
                      <SelectItem key={i.id} value={String(i.id)}>{i.itens_do_estoque}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código de Identificação <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.codigo}
                  onChange={e => setFormData(p => ({ ...p, codigo: e.target.value }))}
                  placeholder="Ex: PAT-001"
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Unidade <span className="text-destructive">*</span></Label>
                <Select value={formData.unidade} onValueChange={v => setFormData(p => ({ ...p, unidade: v }))}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {unidades.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Aquisição <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={formData.data_de_aquisicao}
                  onChange={e => setFormData(p => ({ ...p, data_de_aquisicao: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor (R$) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor}
                  onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))}
                  placeholder="0,00"
                  className="form-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Observações sobre o patrimônio..."
                className="form-input min-h-[80px]"
                maxLength={250}
              />
            </div>

            <FormActionBar onSave={handleSubmitAdd} onCancel={handleCancelAdd} isSaving={createMutation.isPending} />
          </CardContent>
        </Card>
      </SimpleFormWizard>
    )
  }

  // ── Listagem ───────────────────────────────────────────────────────────────
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
            { type: "date", label: "Data de Aquisição", value: filterData, onChange: setFilterData, width: "min-w-[160px]" },
          ]}
          resultsCount={totalCount}
        />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead >Código</TableHead>
                <TableHead >Item</TableHead>
                <TableHead >Unidade</TableHead>
                <TableHead className="text-center">Data de Aquisição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-destructive">Erro ao carregar dados.</TableCell></TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum patrimônio encontrado.</TableCell></TableRow>
              ) : (
                filteredAssets.map(asset => (
                  <TableRow key={asset.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="font-mono font-medium">{asset.codigo}</TableCell>
                    <TableCell >{asset.item_nome}</TableCell>
                    <TableCell >{asset.unidade_nome || "—"}</TableCell>
                    <TableCell className="text-center">
                      {fmtDate(asset.data_de_aquisicao)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {asset.valor != null ? `R$ ${Number(asset.valor).toFixed(2)}` : '—'}
                    </TableCell>
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

      {/* Modal visualizar */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewItem?.item_nome}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-1 py-2">
              <InfoRow label="Código de Identificação" value={viewItem.codigo || "—"} />
              <InfoRow label="Item" value={viewItem.item_nome || "—"} />
              <InfoRow label="Unidade" value={viewItem.unidade_nome || "—"} />
              <InfoRow label="Data de Aquisição" value={fmtDate(viewItem.data_de_aquisicao)} />
              <InfoRow label="Valor" value={viewItem.valor != null ? `R$ ${Number(viewItem.valor).toFixed(2)}` : "—"} />
              <InfoRow label="Descrição" value={viewItem.descricao || "—"} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Patrimônio</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Código de Identificação <span className="text-destructive">*</span></Label>
              <Input
                value={editData.codigo || ""}
                onChange={e => setEditData(p => ({ ...p, codigo: e.target.value }))}
                placeholder="Ex: PAT-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.valor ?? ""}
                onChange={e => setEditData(p => ({ ...p, valor: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Aquisição</Label>
              <Input
                type="date"
                value={editData.data_de_aquisicao || ""}
                onChange={e => setEditData(p => ({ ...p, data_de_aquisicao: e.target.value }))}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={editData.descricao || ""}
                onChange={e => setEditData(p => ({ ...p, descricao: e.target.value }))}
                maxLength={250}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir este patrimônio? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default Patrimonio
