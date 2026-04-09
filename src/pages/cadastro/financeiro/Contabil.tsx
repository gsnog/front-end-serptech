import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLancamentosContabeis, updateLancamentoContabil, deleteLancamentoContabil,
  lancamentosContabeisQueryKey, type LancamentoContabil,
  fetchPlanoContas, planoContasQueryKey,
} from "@/services/financeiro";
import { fetchUnidades, unidadesQueryKey } from "@/services/estoque";

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

const Contabil = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<LancamentoContabil | null>(null);
  const [editItem, setEditItem] = useState<LancamentoContabil | null>(null);
  const [editForm, setEditForm] = useState({ data: "", descricao: "", valor: 0, tipo: "", plano_de_contas: "", unidade: "" });

  const { data: raw = [], isLoading } = useQuery({
    queryKey: [...lancamentosContabeisQueryKey],
    queryFn: fetchLancamentosContabeis,
  });
  const items: LancamentoContabil[] = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];

  const { data: planosRaw = [] } = useQuery({ queryKey: [...planoContasQueryKey], queryFn: fetchPlanoContas });
  const planos = Array.isArray(planosRaw) ? planosRaw : (planosRaw as any)?.results ?? [];

  const { data: unidadesRaw = [] } = useQuery({ queryKey: [...unidadesQueryKey], queryFn: fetchUnidades });
  const unidades = Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? [];

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LancamentoContabil> }) =>
      updateLancamentoContabil(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lancamentosContabeisQueryKey });
      setEditItem(null);
      toast({ title: "Salvo", description: "Lançamento atualizado." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteLancamentoContabil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lancamentosContabeisQueryKey });
      setDeleteId(null);
      toast({ title: "Removido", description: "Lançamento excluído." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(c =>
    (c.descricao || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.plano_de_contas_nome || "").toLowerCase().includes(search.toLowerCase())
  );
  const getExportData = () => filtered.map(c => ({
    Data: c.data, Descrição: c.descricao, Valor: c.valor,
    Tipo: c.tipo, "Plano de Contas": c.plano_de_contas_nome, Unidade: c.unidade_nome,
  }));
  const deleteItem = items.find(i => i.id === deleteId);

  const openEdit = (c: LancamentoContabil) => {
    setEditItem(c);
    setEditForm({
      data: c.data, descricao: c.descricao, valor: c.valor,
      tipo: c.tipo, plano_de_contas: String(c.plano_de_contas), unidade: String(c.unidade),
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/financeiro/contabil/novo")} className="gap-2">
            <Plus className="w-4 h-4" />Novo Lançamento
          </Button>
          <ExportButton getData={getExportData} fileName="contabil" />
        </div>
        <FilterSection
          fields={[{ type: "text" as const, label: "Contábil", placeholder: "Buscar descrição ou plano de contas...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]}
          resultsCount={filtered.length}
        />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-center font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
                <TableHead className="text-center font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Plano de Contas</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="text-center">{c.data}</TableCell>
                  <TableCell className="font-medium">{c.descricao}</TableCell>
                  <TableCell className="text-right">R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="capitalize">{c.tipo === 'debito' ? 'Débito' : 'Crédito'}</TableCell>
                  <TableCell >{c.plano_de_contas_nome || "—"}</TableCell>
                  <TableCell className="text-center">
                    <TableActions onView={() => setViewItem(c)} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lançamento Contábil</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 py-2">
              <InfoRow label="Data" value={viewItem.data} />
              <InfoRow label="Descrição" value={viewItem.descricao} />
              <InfoRow label="Valor" value={`R$ ${Number(viewItem.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <InfoRow label="Tipo" value={viewItem.tipo === 'debito' ? 'Débito' : 'Crédito'} />
              <InfoRow label="Plano de Contas" value={viewItem.plano_de_contas_nome || String(viewItem.plano_de_contas)} />
              <InfoRow label="Unidade" value={viewItem.unidade_nome || String(viewItem.unidade)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={editForm.data} onChange={e => setEditForm(p => ({ ...p, data: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={editForm.descricao} onChange={e => setEditForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" value={editForm.valor} onChange={e => setEditForm(p => ({ ...p, valor: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editForm.tipo} onValueChange={v => setEditForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plano de Contas</Label>
              <Select value={editForm.plano_de_contas} onValueChange={v => setEditForm(p => ({ ...p, plano_de_contas: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {planos.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.id_plano}{p.categoria_nome ? ` — ${p.categoria_nome}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={editForm.unidade} onValueChange={v => setEditForm(p => ({ ...p, unidade: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar unidade" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {unidades.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!editItem) return;
                updateMut.mutate({
                  id: editItem.id,
                  payload: {
                    data: editForm.data,
                    descricao: editForm.descricao,
                    valor: editForm.valor,
                    tipo: editForm.tipo as "debito" | "credito",
                    plano_de_contas: Number(editForm.plano_de_contas),
                    unidade: Number(editForm.unidade),
                  },
                });
              }}
              disabled={updateMut.isPending}
            >Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir o lançamento <strong>{deleteItem?.descricao}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contabil;
