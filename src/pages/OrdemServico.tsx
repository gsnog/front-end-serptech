import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { SortableHead } from "@/components/SortableHead";
import { toast } from "@/hooks/use-toast";
import { useSortable } from "@/hooks/useSortable";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import {
  fetchOrdensServico, deleteOrdemServico, ordensServicoQueryKey, type OrdemServico,
} from "@/services/estoque";

const OrdemServicoPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<OrdemServico | null>(null);

  useRealtimeUpdates([[...ordensServicoQueryKey]]);

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, filterStatus, filterTipo, filterResponsavel]);

  const { data: response, isLoading } = useQuery({
    queryKey: [...ordensServicoQueryKey, page],
    queryFn: () => fetchOrdensServico(page),
  });
  const allItems = response?.results ?? [];
  const serverTotal = response?.count ?? 0;

  const deleteMutation = useMutation({
    mutationFn: deleteOrdemServico,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ordensServicoQueryKey }); setDeleteId(null); toast({ title: "Removida", description: "Ordem de serviço excluída." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const responsaveisUnicos = Array.from(new Set(allItems.map(o => o.usuario_nome).filter(Boolean)));
  const responsavelOptions = [
    { value: "todos", label: "Todos" },
    ...responsaveisUnicos.map(r => ({ value: r!, label: r! }))
  ];

  const filtered = useMemo(() => allItems.filter(o => {
    const matchSearch = o.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      o.tipo_de_ordem?.toLowerCase().includes(search.toLowerCase()) ||
      o.usuario_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus && filterStatus !== "todos" ? o.status === filterStatus : true;
    const matchTipo = filterTipo && filterTipo !== "todos" ? o.tipo_de_ordem === filterTipo : true;
    const matchResponsavel = filterResponsavel && filterResponsavel !== "todos" ? o.usuario_nome === filterResponsavel : true;
    return matchSearch && matchStatus && matchTipo && matchResponsavel;
  }), [allItems, search, filterStatus, filterTipo, filterResponsavel]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered);
  const paginatedItems = sorted;
  const total = serverTotal;
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const getExportData = () => filtered.map(o => ({ Nº: o.numero, Tipo: o.tipo_de_ordem, Descrição: o.descricao, Status: o.status, Solicitante: o.usuario_nome }));
  const deleteItemObj = allItems.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/ordem-servico/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Ordem de Serviço</Button>
          <ExportButton getData={getExportData} fileName="ordens-servico" />
        </div>
        <p className="text-sm text-muted-foreground">
          Utilize para registrar e acompanhar serviços de manutenção ou terceirizados.
        </p>
        <FilterSection
          fields={[
            { type: "text" as const, label: "Buscar", placeholder: "Buscar por tipo ou descrição...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" },
            { type: "select" as const, label: "Status", placeholder: "Todos", value: filterStatus, onChange: setFilterStatus, options: [{ value: "todos", label: "Todos" }, { value: "Aberta", label: "Aberta" }, { value: "Em andamento", label: "Em andamento" }, { value: "Concluída", label: "Concluída" }, { value: "Cancelada", label: "Cancelada" }], width: "min-w-[160px]" },
            { type: "select" as const, label: "Tipo", placeholder: "Todos", value: filterTipo, onChange: setFilterTipo, options: [{ value: "todos", label: "Todos" }, { value: "manutencao_preventiva", label: "Manutenção Preventiva" }, { value: "manutencao_corretiva", label: "Manutenção Corretiva" }, { value: "instalacao", label: "Instalação" }, { value: "servico_externo", label: "Serviço Externo" }], width: "min-w-[190px]" },
            { type: "select" as const, label: "Responsável", placeholder: "Todos", value: filterResponsavel, onChange: setFilterResponsavel, options: responsavelOptions, width: "min-w-[160px]" }
          ]}
          resultsCount={filtered.length}
        />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <SortableHead label="Nº" field="numero" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Tipo" field="tipo_de_ordem" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Descrição" field="descricao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Solicitante" field="usuario_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Status" field="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow> :
                paginatedItems.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ordem de serviço encontrada.</TableCell></TableRow> :
                  paginatedItems.map(o => (
                    <TableRow key={o.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="text-center font-mono">{o.numero}</TableCell>
                      <TableCell className="text-center">{o.tipo_de_ordem?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-center font-medium">{o.descricao}</TableCell>
                      <TableCell className="text-center">{o.usuario_nome}</TableCell>
                      <TableCell className="text-center"><StatusBadge status={o.status || ''} /></TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(o)} onEdit={() => navigate(`/estoque/ordem-servico/${o.id}`)} onDelete={() => setDeleteId(o.id)} /></TableCell>
                    </TableRow>
                  ))
              }
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
        <DialogContent><DialogHeader><DialogTitle>OS #{viewItem?.numero} — {viewItem?.tipo_de_ordem}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2">
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Descrição</span><span className="text-sm font-medium">{viewItem.descricao}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Solicitante</span><span className="text-sm font-medium">{viewItem.usuario_nome}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Fornecedor</span><span className="text-sm font-medium">{viewItem.fornecedor_nome || "—"}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Data Solicitação</span><span className="text-sm font-medium">{viewItem.data_solicitacao}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span><span className="text-sm font-medium">{viewItem.status}</span></div>
        </div>}</DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir a OS <strong>#{deleteItemObj?.numero}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default OrdemServicoPage;
