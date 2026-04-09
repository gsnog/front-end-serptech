import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"
import { Plus, FileText, ChevronDown, ChevronRight } from "lucide-react"
import { TableActions } from "@/components/TableActions"
import { StatusBadge } from "@/components/StatusBadge"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchLocacoes, Locacao } from "@/services/estoque"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"

interface DisplayLocacao {
  id: number;
  raw: Locacao;
  unidade: string;
  dataInicio: string;
  previsaoFinalizacao: string;
  dataFim: string;
  locador: string;
  valor: string;
  status: string;
  itens: { item: string; quantidade: string; dataEntrega: string }[];
}

export default function EstoqueLocacoes() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: ['locacoes', currentPage],
    queryFn: () => fetchLocacoes(currentPage),
  });
  const locacoes = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const [filterLocador, setFilterLocador] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  const [viewItem, setViewItem] = useState<DisplayLocacao | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Finalizar locação
  const [finalizeItem, setFinalizeItem] = useState<DisplayLocacao | null>(null)
  const [finalizeAdicional, setFinalizeAdicional] = useState("")

  const finalizeMut = useMutation({
    mutationFn: ({ id, adicional }: { id: number; adicional: number }) =>
      api.patch(`/api/estoque/locacoes/${id}/`, {
        status: "Finalizado",
        data_fim: new Date().toISOString().split("T")[0],
        adicional,
      }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locacoes"] })
      toast({ title: "Locação finalizada com sucesso!" })
      setFinalizeItem(null)
      setFinalizeAdicional("")
    },
    onError: () => toast({ title: "Erro", description: "Falha ao finalizar locação.", variant: "destructive" }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/api/estoque/locacoes/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locacoes"] })
      toast({ title: "Locação excluída." })
      setDeleteId(null)
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  })

  const items: DisplayLocacao[] = useMemo(() => {
    return (locacoes || []).map((l: Locacao) => ({
      id: l.id,
      raw: l,
      unidade: l.unidade_nome,
      dataInicio: l.data_inicio || "-",
      previsaoFinalizacao: l.previsao_de_entrega || "-",
      dataFim: l.data_fim || "-",
      locador: l.locador_nome,
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor_total ?? l.valor),
      status: l.status || "Em Andamento",
      itens: (l as any).item_locacao?.map((i: any) => ({
        item: i.item_nome,
        quantidade: String(i.quantidade),
        dataEntrega: i.data_de_entrega || "—",
      })) || []
    }))
  }, [locacoes])

  const filtered = useMemo(() => {
    return items.filter(loc => {
      const matchLocador = loc.locador.toLowerCase().includes(filterLocador.toLowerCase())
      const matchDataInicio = filterDataInicio ? loc.dataInicio >= filterDataInicio : true
      const matchDataFim = filterDataFim ? loc.previsaoFinalizacao <= filterDataFim : true
      return matchLocador && matchDataInicio && matchDataFim
    })
  }, [items, filterLocador, filterDataInicio, filterDataFim])

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getExportData = () => filtered.map(l => ({
    Unidade: l.unidade,
    "Data Início": l.dataInicio,
    "Previsão de Finalização": l.previsaoFinalizacao,
    "Data Fim": l.dataFim,
    Locador: l.locador,
    Valor: l.valor,
    Status: l.status,
  }));

  const handleFinalize = () => {
    if (!finalizeItem) return
    const extra = parseFloat(finalizeAdicional) || 0
    const novoAdicional = (finalizeItem.raw.adicional ?? 0) + extra
    finalizeMut.mutate({ id: finalizeItem.id, adicional: novoAdicional })
  }

  const deleteLocacao = items.find(i => i.id === deleteId)

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/locacoes/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Locação</Button>
          <Button onClick={() => navigate("/estoque/locacoes/relatorio")} variant="outline" className="gap-2 border-border"><FileText className="w-4 h-4" />Relatório</Button>
          <ExportButton getData={getExportData} fileName="estoque-locacoes" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Locador", placeholder: "Buscar locador...", value: filterLocador, onChange: setFilterLocador, width: "flex-1 min-w-[200px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={totalCount}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead >Unidade</TableHead>
              <TableHead className="text-center">Data de Início</TableHead>
              <TableHead >Previsão de Finalização</TableHead>
              <TableHead className="text-center">Data Fim</TableHead>
              <TableHead >Locador</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead >Itens</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma locação encontrada.</TableCell></TableRow>
            ) : (
              filtered.map((loc) => (
                <>
                  <TableRow key={loc.id}>
                    <TableCell >
                      <Button variant="ghost" size="sm" onClick={() => toggleRow(loc.id)} className="h-7 w-7 p-0">
                        {expandedRows.has(loc.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </Button>
                    </TableCell>
                    <TableCell >{loc.unidade}</TableCell>
                    <TableCell >{loc.dataInicio}</TableCell>
                    <TableCell >{loc.previsaoFinalizacao}</TableCell>
                    <TableCell >{loc.dataFim}</TableCell>
                    <TableCell >{loc.locador}</TableCell>
                    <TableCell className="font-semibold">{loc.valor}</TableCell>
                    <TableCell >{loc.itens.length}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={loc.status} /></TableCell>
                    <TableCell className="text-center">
                      <TableActions
                        onView={() => setViewItem(loc)}
                        onDelete={() => setDeleteId(loc.id)}
                        onFinalize={loc.status !== "Finalizado" ? () => { setFinalizeItem(loc); setFinalizeAdicional(""); } : undefined}
                      />
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(loc.id) && (
                    <TableRow key={`${loc.id}-details`} className="bg-muted/30">
                      <TableCell colSpan={10} className="p-4">
                        <div className="ml-8">
                          <h4 className="text-sm font-semibold mb-2 text-foreground">Itens da Locação</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead >Item</TableHead>
                                <TableHead className="text-right">Quantidade</TableHead>
                                <TableHead className="text-center">Data de Entrega</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loc.itens.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem itens</TableCell></TableRow>
                              ) : loc.itens.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell >{item.item}</TableCell>
                                  <TableCell >{item.quantidade}</TableCell>
                                  <TableCell >{item.dataEntrega}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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

      {/* Modal: Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Locação</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 text-sm">
              {[
                ["Unidade", viewItem.unidade],
                ["Locador", viewItem.locador],
                ["Data Início", viewItem.dataInicio],
                ["Previsão de Finalização", viewItem.previsaoFinalizacao],
                ["Data Fim", viewItem.dataFim],
                ["Valor Total", viewItem.valor],
                ["Status", viewItem.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              {viewItem.itens.length > 0 && (
                <div className="pt-2">
                  <p className="font-semibold mb-1">Itens</p>
                  {viewItem.itens.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-border last:border-0">
                      <span>{it.item}</span>
                      <span>Qtd: {it.quantidade}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Finalizar */}
      <Dialog open={!!finalizeItem} onOpenChange={() => { setFinalizeItem(null); setFinalizeAdicional(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Finalizar Locação</DialogTitle></DialogHeader>
          {finalizeItem && (
            <div className="space-y-4 py-2 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Locador</span>
                  <span className="font-medium">{finalizeItem.locador}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Unidade</span>
                  <span className="font-medium">{finalizeItem.unidade}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Valor atual</span>
                  <span className="font-medium">{finalizeItem.valor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adicional de finalização (opcional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={finalizeAdicional}
                  onChange={(e) => setFinalizeAdicional(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Valor extra a ser somado ao adicional existente.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFinalizeItem(null); setFinalizeAdicional(""); }}>Cancelar</Button>
            <Button onClick={handleFinalize} disabled={finalizeMut.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {finalizeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir locação?</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir a locação de <strong>{deleteLocacao?.locador}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId) }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
