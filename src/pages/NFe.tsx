import { fmtDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Plus, FileUp, Download } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"
import { TableActions } from "@/components/TableActions"
import { StatusBadge } from "@/components/StatusBadge"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchNotasFiscais, deleteNotaFiscal, type NotaFiscal as Nfe, notasFiscaisQueryKey } from "@/services/estoque"

const NFe = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [filterNumero, setFilterNumero] = useState("")
  const [filterData, setFilterData] = useState("")
  const [viewItem, setViewItem] = useState<Nfe | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: response, isLoading, isError } = useQuery({
    queryKey: [...notasFiscaisQueryKey, currentPage],
    queryFn: () => fetchNotasFiscais(currentPage),
  })
  const nfes = Array.isArray(response) ? response : (response?.results ?? [])
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0)
  const totalPages = Math.ceil(totalCount / 5)

  const deleteMutation = useMutation({
    mutationFn: deleteNotaFiscal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notasFiscaisQueryKey });
      setDeleteId(null);
      toast({ title: "Removida", description: "Nota Fiscal excluída." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  })

  const filteredNfes = useMemo(() => {
    return nfes.filter(nfe => {
      const matchNumero = (nfe.numero || "").toLowerCase().includes(filterNumero.toLowerCase())
      const matchData = filterData ? (nfe.data_emissao || "").includes(filterData) : true
      return matchNumero && matchData
    })
  }, [nfes, filterNumero, filterData])

  const getExportData = () => filteredNfes.map(n => ({ "Data Emissão": n.data_emissao, Número: n.numero, Valor: n.valor_total }))
  const handleDelete = () => { if (deleteId !== null) deleteMutation.mutate(deleteId); }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button className="gap-2" onClick={() => navigate("/nfe/nova")}><Plus className="w-4 h-4" />Nova NF-e</Button>
          <Button onClick={() => navigate("/financeiro/xml/relatorio")} variant="outline" className="gap-2 border-border"><FileUp className="w-4 h-4" />Importar XML</Button>
          <ExportButton getData={getExportData} fileName="nfe" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Número NF-e", placeholder: "Buscar número...", value: filterNumero, onChange: setFilterNumero, width: "flex-1 min-w-[200px]" },
            { type: "date", label: "Data Emissão", value: filterData, onChange: setFilterData, width: "min-w-[160px]" }
          ]}
          resultsCount={totalCount}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-center">Data Emissão</TableHead>
              <TableHead >Número</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead >Arquivos</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando notas...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-destructive">Erro ao carregar dados.</TableCell></TableRow>
              ) : filteredNfes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma nota fiscal encontrada.</TableCell></TableRow>
              ) : (
                filteredNfes.map((nfe) => (
                  <TableRow key={nfe.id}>
                    <TableCell className="text-center">{fmtDate(nfe.data_emissao)}</TableCell>
                    <TableCell className="font-medium">{nfe.numero}</TableCell>
                    <TableCell className="text-right font-semibold">R$ {nfe.valor_total?.toFixed(2)}</TableCell>
                    <TableCell >
                      <div className="flex justify-center gap-2">
                        {nfe.xml_arquivo && (
                          <a href={nfe.xml_arquivo} target="_blank" rel="noopener noreferrer" title="Baixar XML">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><FileText className="h-4 w-4" /></Button>
                          </a>
                        )}
                        {nfe.pdf_arquivo && (
                          <a href={nfe.pdf_arquivo} target="_blank" rel="noopener noreferrer" title="Baixar PDF">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive"><Download className="h-4 w-4" /></Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <TableActions
                        onView={() => setViewItem(nfe)}
                        onEdit={() => navigate(`/nfe/editar/${nfe.id}`)}
                        onDelete={() => setDeleteId(nfe.id)}
                      />
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
        <DialogContent><DialogHeader><DialogTitle>Detalhes da NF-e</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2">
              <InfoRow label="Número" value={viewItem.numero} />
              <InfoRow label="Data Emissão" value={viewItem.data_emissao || ""} />
              <InfoRow label="Valor Total" value={`R$ ${viewItem.valor_total?.toFixed(2)}`} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir NF-e?</AlertDialogTitle><AlertDialogDescription>Deseja excluir a NF-e selecionada? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium">{value}</span></div>;
}

export default NFe
