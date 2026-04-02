import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { SortableHead } from "@/components/SortableHead";
import { Map, Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSortable } from "@/hooks/useSortable";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import {
  fetchMapas, createMapa, updateMapa, deleteMapa,
  mapasQueryKey, type MapaPrincipal,
} from "@/services/operacional";

const EMPTY_FORM = { nome: "", data_de_recebimento: "", arquivo_pdf: "" };

export default function Mapas() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<MapaPrincipal | null>(null);
  const [editItem, setEditItem] = useState<MapaPrincipal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search]);

  const { data: response, isLoading } = useQuery({
    queryKey: [...mapasQueryKey, page],
    queryFn: () => fetchMapas(page),
  });
  const mapas = response?.results ?? [];
  const serverTotal = response?.count ?? 0;

  // ── Real-time updates ────────────────────────────────────────────────────────
  useRealtimeUpdates([[...mapasQueryKey]]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: mapasQueryKey });

  const createMutation = useMutation({
    mutationFn: createMapa,
    onSuccess: () => {
      invalidate();
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Criado", description: "Mapa adicionado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível criar o mapa.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MapaPrincipal> }) => updateMapa(id, data),
    onSuccess: () => {
      invalidate();
      setEditItem(null);
      toast({ title: "Salvo", description: "Mapa atualizado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível atualizar o mapa.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMapa,
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Removido", description: "Mapa excluído com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir o mapa.", variant: "destructive" }),
  });

  // ── Filter → Sort → Paginate ─────────────────────────────────────────────────
  const filtered = useMemo(
    () => mapas.filter(m => (m.nome ?? "").toLowerCase().includes(search.toLowerCase())),
    [mapas, search]
  );

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered);
  const paginatedItems = sorted;
  const total = serverTotal;
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const openEdit = (m: MapaPrincipal) => {
    setEditItem(m);
    setForm({
      nome: m.nome ?? "",
      data_de_recebimento: m.data_de_recebimento ?? "",
      arquivo_pdf: m.arquivo_pdf ?? "",
    });
  };

  const handleSaveCreate = () => {
    createMutation.mutate({
      nome: form.nome || null,
      data_de_recebimento: form.data_de_recebimento || null,
      arquivo_pdf: form.arquivo_pdf || null,
    });
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: {
        nome: form.nome || null,
        data_de_recebimento: form.data_de_recebimento || null,
        arquivo_pdf: form.arquivo_pdf || null,
      },
    });
  };

  const deleteTarget = mapas.find(m => m.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapas</h1>
            <p className="text-sm text-muted-foreground">Mapas principais do laboratório</p>
          </div>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setIsCreateOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Mapa
        </Button>
      </div>

      {/* Filters */}
      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Buscar mapa...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" },
        ]}
        resultsCount={total}
      />

      {/* Table */}
      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <SortableHead label="#" field="id" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="w-16" />
              <SortableHead label="Nome" field="nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Data de Recebimento" field="data_de_recebimento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="text-center">PDF</TableHead>
              <TableHead className="text-center w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : paginatedItems.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum mapa encontrado.</TableCell></TableRow>
            ) : (
              paginatedItems.map(mapa => (
                <TableRow key={mapa.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="text-center"><Badge variant="outline" className="text-xs">{mapa.id}</Badge></TableCell>
                  <TableCell className="font-medium text-center">{mapa.nome ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    {mapa.data_de_recebimento
                      ? new Date(mapa.data_de_recebimento).toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {mapa.arquivo_pdf ? (
                      <a href={mapa.arquivo_pdf} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <FileText className="h-4 w-4" /> PDF
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onView={() => setViewItem(mapa)}
                      onEdit={() => openEdit(mapa)}
                      onDelete={() => setDeleteId(mapa.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total} registros
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={!hasPrev}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasNext}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Mapa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome do mapa" /></div>
            <div><Label>Data de Recebimento</Label><Input type="date" value={form.data_de_recebimento} onChange={e => setForm({ ...form, data_de_recebimento: e.target.value })} /></div>
            <div><Label>URL do PDF</Label><Input value={form.arquivo_pdf} onChange={e => setForm({ ...form, arquivo_pdf: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────────── */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Mapa #{editItem?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Data de Recebimento</Label><Input type="date" value={form.data_de_recebimento} onChange={e => setForm({ ...form, data_de_recebimento: e.target.value })} /></div>
            <div><Label>URL do PDF</Label><Input value={form.arquivo_pdf} onChange={e => setForm({ ...form, arquivo_pdf: e.target.value })} placeholder="https://..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ───────────────────────────────────────────────────────── */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do Mapa</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2">
              {[
                ["ID", viewItem.id],
                ["Nome", viewItem.nome ?? "—"],
                ["Data de Recebimento", viewItem.data_de_recebimento ? new Date(viewItem.data_de_recebimento).toLocaleDateString("pt-BR") : "—"],
                ["Arquivo PDF", viewItem.arquivo_pdf ?? "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-1 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{k}</span>
                  <span className="text-sm font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────────────────────────── */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir <strong>"{deleteTarget?.nome ?? `#${deleteId}`}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
