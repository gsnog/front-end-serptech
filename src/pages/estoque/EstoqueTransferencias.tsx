import React, { useState, useMemo } from "react"
import { fmtDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { FilterSection } from "@/components/FilterSection"
import { TableActions } from "@/components/TableActions"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"

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

  const [filterOrigem, setFilterOrigem] = useState("")
  const [filterDestino, setFilterDestino] = useState("")
  const [viewItem, setViewItem] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const items = useMemo(() => transferencias.map((t: any) => ({
    id: t.id,
    data: t.data ?? "",
    origem: t.estoque_origem_nome ?? `Unidade ${t.estoque_origem}`,
    destino: t.estoque_destino_nome ?? `Unidade ${t.estoque_destino}`,
    itens: t.itens ?? [],
    observacao: t.observacao ?? "",
    criado_por_nome: t.criado_por_nome ?? "",
  })), [transferencias])

  const filtered = useMemo(() => items.filter(t =>
    t.origem.toLowerCase().includes(filterOrigem.toLowerCase()) &&
    t.destino.toLowerCase().includes(filterDestino.toLowerCase())
  ), [items, filterOrigem, filterDestino])

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
  const getExportData = () => filtered.map(t => ({ Data: t.data, Origem: t.origem, Destino: t.destino, "Responsável": t.criado_por_nome, "Qtd Itens": t.itens.length }))

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
          resultsCount={serverTotal}
        />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-center">Data</TableHead>
                <TableHead >Origem</TableHead>
                <TableHead >Destino</TableHead>
                <TableHead >Itens</TableHead>
                <TableHead >Responsável</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma transferência encontrada.</TableCell></TableRow>
              ) : (
                filtered.map(t => (
                  <React.Fragment key={t.id}>
                    <TableRow className="hover:bg-table-hover transition-colors">
                      <TableCell >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => toggleRow(t.id)}
                          disabled={!t.itens.length}
                        >
                          {expandedRows.has(t.id)
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">{fmtDate(t.data)}</TableCell>
                      <TableCell >{t.origem}</TableCell>
                      <TableCell >{t.destino}</TableCell>
                      <TableCell >{t.itens.length} item(s)</TableCell>
                      <TableCell >{t.criado_por_nome || "—"}</TableCell>
                      <TableCell className="text-center">
                        <TableActions onView={() => setViewItem(t)} onDelete={() => setDeleteId(t.id)} />
                      </TableCell>
                    </TableRow>

                    {expandedRows.has(t.id) && t.itens.length > 0 && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="py-2 px-6">
                          <div className="rounded border border-border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="text-xs">Item</TableHead>
                                  <TableHead className="text-right text-xs">Quantidade</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {t.itens.map((item: any) => (
                                  <TableRow key={item.id}>
                                    <TableCell className="text-sm">{item.item_nome || "—"}</TableCell>
                                    <TableCell className="text-sm">{item.quantidade}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {t.observacao && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Observação:</span> {t.observacao}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages} ({serverTotal} registros)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Transferência #{viewItem?.id}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="text-sm font-medium">{fmtDate(viewItem.data)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-sm text-muted-foreground">Origem</span>
                <span className="text-sm font-medium">{viewItem.origem}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-sm text-muted-foreground">Destino</span>
                <span className="text-sm font-medium">{viewItem.destino}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-sm text-muted-foreground">Responsável</span>
                <span className="text-sm font-medium">{viewItem.criado_por_nome || "—"}</span>
              </div>
              {viewItem.observacao && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-sm text-muted-foreground">Observação</span>
                  <span className="text-sm font-medium">{viewItem.observacao}</span>
                </div>
              )}
              {viewItem.itens.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Itens transferidos</p>
                  <div className="rounded border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">Item</TableHead>
                          <TableHead className="text-right text-xs">Qtd</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewItem.itens.map((it: any) => (
                          <TableRow key={it.id}>
                            <TableCell className="text-sm">{it.item_nome || "—"}</TableCell>
                            <TableCell className="text-sm">{it.quantidade}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transferência?</AlertDialogTitle>
            <AlertDialogDescription>
              Transferência de <strong>{deleteItem?.origem}</strong> → <strong>{deleteItem?.destino}</strong> em {deleteItem?.data}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
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
