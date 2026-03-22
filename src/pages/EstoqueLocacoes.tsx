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
import { useQuery } from "@tanstack/react-query"
import { fetchLocacoes, Locacao } from "@/services/estoque"
import { Loader2 } from "lucide-react"

interface DisplayLocacao {
  id: number;
  unidade: string;
  dataInicio: string;
  previsaoEntrega: string;
  dataFim: string;
  locador: string;
  contrato: string;
  valor: string;
  status: string;
  itens: {
    item: string;
    marca: string;
    quantidade: string;
    especificacoes: string;
  }[];
}

export default function EstoqueLocacoes() {
  const navigate = useNavigate()
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
  const [editItem, setEditItem] = useState<DisplayLocacao | null>(null)
  const [editData, setEditData] = useState({ unidade: "", locador: "", contrato: "" })
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const items: DisplayLocacao[] = useMemo(() => {
    return (locacoes || []).map(l => ({
      id: l.id,
      unidade: l.unidade_nome,
      dataInicio: l.data_inicio || "-",
      previsaoEntrega: l.previsao_de_entrega || "-",
      dataFim: l.data_fim || "-",
      locador: l.locador_nome,
      contrato: "CONTRATO REAL",
      valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor),
      status: l.status || "Pendente",
      itens: (l as any).item_locacao?.map((i: any) => ({
        item: i.item_nome,
        marca: "-",
        quantidade: String(i.quantidade),
        especificacoes: "-"
      })) || []
    }))
  }, [locacoes])

  const filtered = useMemo(() => {
    return items.filter(loc => {
      const matchLocador = loc.locador.toLowerCase().includes(filterLocador.toLowerCase())
      const matchDataInicio = filterDataInicio ? loc.dataInicio >= filterDataInicio.split("-").reverse().join("/") : true
      const matchDataFim = filterDataFim ? loc.previsaoEntrega <= filterDataFim.split("-").reverse().join("/") : true
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

  const getExportData = () => filtered.map(l => ({ Unidade: l.unidade, "Data Início": l.dataInicio, "Previsão Entrega": l.previsaoEntrega, "Data Fim": l.dataFim, Locador: l.locador, Contrato: l.contrato, Valor: l.valor, Status: l.status }));
  const handleDelete = () => { if (deleteId !== null) { toast({ title: "Exclusão requer API" }); setDeleteId(null); } };
  const openEdit = (l: DisplayLocacao) => { setEditItem(l); setEditData({ unidade: l.unidade, locador: l.locador, contrato: l.contrato }); };
  const handleSaveEdit = () => { if (editItem) { toast({ title: "Edição requer API" }); setEditItem(null); } };
  const deleteItem = items.find(i => i.id === deleteId);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const getItensCount = (loc: DisplayLocacao) => loc.itens.length;
  const getQuantidadeTotal = (loc: DisplayLocacao) => loc.itens.reduce((acc, i) => acc + (parseInt(i.quantidade) || 0), 0);

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
              <TableHead className="text-center w-[50px]"></TableHead>
              <TableHead className="text-center">Unidade</TableHead>
              <TableHead className="text-center">Data de Início</TableHead>
              <TableHead className="text-center">Previsão de Entrega</TableHead>
              <TableHead className="text-center">Data Fim</TableHead>
              <TableHead className="text-center">Locador</TableHead>
              <TableHead className="text-center">Contrato</TableHead>
              <TableHead className="text-center">Valor</TableHead>
              <TableHead className="text-center">Itens</TableHead>
              <TableHead className="text-center">Quantidades</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (<TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">Nenhuma locação encontrada.</TableCell></TableRow>) : (
              filtered.map((loc) => (
                <>
                  <TableRow key={loc.id}>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => toggleRow(loc.id)} className="h-7 w-7 p-0">
                        {expandedRows.has(loc.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">{loc.unidade}</TableCell>
                    <TableCell className="text-center">{loc.dataInicio}</TableCell>
                    <TableCell className="text-center">{loc.previsaoEntrega}</TableCell>
                    <TableCell className="text-center">{loc.dataFim}</TableCell>
                    <TableCell className="text-center">{loc.locador}</TableCell>
                    <TableCell className="text-center">{loc.contrato}</TableCell>
                    <TableCell className="text-center font-semibold">{loc.valor}</TableCell>
                    <TableCell className="text-center">{getItensCount(loc)}</TableCell>
                    <TableCell className="text-center">{getQuantidadeTotal(loc)}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={loc.status} /></TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(loc)} onEdit={() => openEdit(loc)} onDelete={() => setDeleteId(loc.id)} /></TableCell>
                  </TableRow>
                  {expandedRows.has(loc.id) && (
                    <TableRow key={`${loc.id}-details`} className="bg-muted/30">
                      <TableCell colSpan={12} className="p-4">
                        <div className="ml-8">
                          <h4 className="text-sm font-semibold mb-2 text-foreground">Itens da Locação</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-center">Item</TableHead>
                                <TableHead className="text-center">Marca</TableHead>
                                <TableHead className="text-center">Quantidade</TableHead>
                                <TableHead className="text-center">Especificações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loc.itens.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="text-center">{item.item}</TableCell>
                                  <TableCell className="text-center">{item.marca}</TableCell>
                                  <TableCell className="text-center">{item.quantidade}</TableCell>
                                  <TableCell className="text-center">{item.especificacoes}</TableCell>
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

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Locação</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2">
              {Object.entries({ Unidade: viewItem.unidade, "Data Início": viewItem.dataInicio, "Previsão Entrega": viewItem.previsaoEntrega, "Data Fim": viewItem.dataFim, Locador: viewItem.locador, Contrato: viewItem.contrato, Valor: viewItem.valor, Status: viewItem.status }).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{v}</span></div>
              ))}
              <div className="pt-3">
                <h4 className="text-sm font-semibold mb-2">Itens</h4>
                {viewItem.itens.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-border last:border-0 text-sm">
                    <span>{item.item} ({item.marca})</span>
                    <span>Qtd: {item.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Locação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Unidade</Label><Input value={editData.unidade} onChange={e => setEditData({ ...editData, unidade: e.target.value })} /></div>
            <div><Label>Locador</Label><Input value={editData.locador} onChange={e => setEditData({ ...editData, locador: e.target.value })} /></div>
            <div><Label>Contrato</Label><Input value={editData.contrato} onChange={e => setEditData({ ...editData, contrato: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir locação?</AlertDialogTitle><AlertDialogDescription>Deseja excluir a locação "{deleteItem?.unidade}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
