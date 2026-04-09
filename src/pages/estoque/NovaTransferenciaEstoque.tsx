import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/SearchableSelect"
import { SimpleFormWizard } from "@/components/SimpleFormWizard"
import { FormActionBar } from "@/components/FormActionBar"
import { ArrowLeftRight, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { fetchUnidades, fetchItensEstoque, unidadesQueryKey, itensEstoqueQueryKey } from "@/services/estoque"

interface ItemTransferencia {
  id: number
  itemId: string
  itemNome: string
  quantidade: string
}

export default function NovaTransferenciaEstoque() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  // ── API data ──────────────────────────────────────────────────────────────
  const { data: unidadesRaw = [] } = useQuery({ queryKey: unidadesQueryKey, queryFn: fetchUnidades })
  const unidades = (Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? []) as any[]

  const { data: itensRaw = [] } = useQuery({ queryKey: itensEstoqueQueryKey, queryFn: fetchItensEstoque })
  const itensEstoque = (Array.isArray(itensRaw) ? itensRaw : (itensRaw as any)?.results ?? []) as any[]

  const itemOptions = itensEstoque.map((i: any) => ({ value: String(i.id), label: i.itens_do_estoque }))

  // ── Form state ────────────────────────────────────────────────────────────
  const [estoqueOrigemId, setEstoqueOrigemId] = useState("")
  const [estoqueDestinoId, setEstoqueDestinoId] = useState("")
  const [observacao, setObservacao] = useState("")
  const [itens, setItens] = useState<ItemTransferencia[]>([])
  const [itemSelecionado, setItemSelecionado] = useState("")
  const [quantidade, setQuantidade] = useState("")

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: any) => (await api.post('/api/estoque/transferencias/', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias_estoque'] })
      toast({ title: "Transferência realizada com sucesso!" })
      navigate("/estoque/transferencias")
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail
      const msgs = detail ?? (error.response?.data && typeof error.response.data === "object"
        ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Erro ao salvar.")
      toast({ title: "Erro ao salvar", description: msgs, variant: "destructive" })
    },
    onSettled: () => setIsSaving(false),
  })

  // ── Item helpers ──────────────────────────────────────────────────────────
  const handleAddItem = () => {
    if (!itemSelecionado || !quantidade) {
      toast({ title: "Selecione o item e informe a quantidade", variant: "destructive" })
      return
    }
    if (itens.find(i => i.itemId === itemSelecionado)) {
      toast({ title: "Item já adicionado", variant: "destructive" })
      return
    }
    const found = itensEstoque.find((i: any) => String(i.id) === itemSelecionado)
    setItens(prev => [...prev, { id: Date.now(), itemId: itemSelecionado, itemNome: found?.itens_do_estoque ?? itemSelecionado, quantidade }])
    setItemSelecionado("")
    setQuantidade("")
  }

  const handleRemoveItem = (id: number) => setItens(prev => prev.filter(i => i.id !== id))

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSalvar = () => {
    if (!estoqueOrigemId) { toast({ title: "Selecione o estoque de origem", variant: "destructive" }); return }
    if (!estoqueDestinoId) { toast({ title: "Selecione o estoque de destino", variant: "destructive" }); return }
    if (estoqueOrigemId === estoqueDestinoId) { toast({ title: "Origem e destino não podem ser iguais", variant: "destructive" }); return }
    if (itens.length === 0) { toast({ title: "Adicione pelo menos um item", variant: "destructive" }); return }

    setIsSaving(true)
    createMutation.mutate({
      estoque_origem: parseInt(estoqueOrigemId),
      estoque_destino: parseInt(estoqueDestinoId),
      observacao: observacao || "",
      itens: itens.map(i => ({ item_id: parseInt(i.itemId), quantidade: parseFloat(i.quantidade) || 1 })),
    })
  }

  return (
    <SimpleFormWizard title="Nova Transferência">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Transferência entre Estoques</h2>
              <p className="text-sm text-muted-foreground">Mova itens de um estoque para outro</p>
            </div>
          </div>

          {/* Origem + Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estoque de Origem <span className="text-destructive">*</span></Label>
              <Select value={estoqueOrigemId} onValueChange={setEstoqueOrigemId}>
                <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade de origem" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {unidades.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)} disabled={String(u.id) === estoqueDestinoId}>
                      {u.unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Estoque de Destino <span className="text-destructive">*</span></Label>
              <Select value={estoqueDestinoId} onValueChange={setEstoqueDestinoId}>
                <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade de destino" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {unidades.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)} disabled={String(u.id) === estoqueOrigemId}>
                      {u.unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observação</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="form-input min-h-[80px]" placeholder="Motivo da transferência..." />
          </div>

          {/* ── Itens ─────────────────────────────────────────────────────── */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Itens a Transferir</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Item</Label>
                <SearchableSelect
                  options={itemOptions}
                  value={itemSelecionado}
                  onValueChange={setItemSelecionado}
                  placeholder="Selecione o item"
                  searchPlaceholder="Pesquisar item..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quantidade</Label>
                <Input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Qtd" className="form-input" min="1" />
              </div>
              <div className="md:col-span-3">
                <Button type="button" onClick={handleAddItem}>Adicionar Item</Button>
              </div>
            </div>

            <div className="rounded border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhum item adicionado</TableCell></TableRow>
                  ) : (
                    itens.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.itemNome}</TableCell>
                        <TableCell >{item.quantidade}</TableCell>
                        <TableCell >
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <FormActionBar
            onSave={handleSalvar}
            onCancel={() => navigate("/estoque/transferencias")}
            isSaving={isSaving}
            saveLabel="Realizar Transferência"
          />
        </CardContent>
      </Card>
    </SimpleFormWizard>
  )
}
