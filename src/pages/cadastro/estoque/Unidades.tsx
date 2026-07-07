import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Unidade {
  id: number;
  unidade?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  cnpj?: string;
  responsavel?: number | null;
  responsavel_nome?: string | null;
}

const fetchUnidades = async (): Promise<Unidade[]> => {
  const res = await api.get("/api/estoque/unidades/");
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};
const updateUnidade = async (id: number, data: Partial<Unidade>): Promise<Unidade> => {
  const res = await api.put(`/api/estoque/unidades/${id}/`, data);
  return res.data;
};
const deleteUnidade = async (id: number): Promise<void> => {
  await api.delete(`/api/estoque/unidades/${id}/`);
};

const Unidades = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchUnidade, setSearchUnidade] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Unidade | null>(null);
  const [editItem, setEditItem] = useState<Unidade | null>(null);
  const [editNome, setEditNome] = useState("");

  const { data: items = [], isLoading } = useQuery({ queryKey: ["unidades_estoque"], queryFn: fetchUnidades });

  const updateMut = useMutation({
    mutationFn: (d: { id: number; payload: Partial<Unidade> }) => updateUnidade(d.id, d.payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["unidades_estoque"] }); setEditItem(null); toast({ title: "Salvo", description: "Unidade atualizada." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteUnidade,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["unidades_estoque"] }); setDeleteId(null); toast({ title: "Removido", description: "Unidade excluída." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const safeItems = Array.isArray(items) ? items : [];
  const filtered = safeItems.filter((u: Unidade) =>
    String(u?.unidade ?? '').toLowerCase().includes(searchUnidade.toLowerCase()) ||
    String(u?.cidade ?? '').toLowerCase().includes(searchUnidade.toLowerCase())
  );

  const getExportData = () => filtered.map((u: Unidade) => ({
    Unidade: u.unidade ?? "—",
    Cidade: u.cidade ?? "—",
    Responsável: u.responsavel_nome ?? "—",
  }));

  const deleteItem = safeItems.find((i: Unidade) => i?.id === deleteId);

  const endereco = (u: Unidade) =>
    [u.rua, u.numero, u.complemento, u.bairro, u.cidade, u.estado, u.cep]
      .filter(Boolean).join(", ") || "—";

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/unidades/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Unidade</Button>
          <ExportButton getData={getExportData} fileName="unidades-estoque" />
        </div>
        <FilterSection
          fields={[{ type: "text" as const, label: "Unidade", placeholder: "Buscar por unidade ou cidade...", value: searchUnidade, onChange: setSearchUnidade, width: "flex-1 min-w-[200px]" }]}
          resultsCount={filtered.length}
        />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="font-semibold">Unidade</TableHead>
                <TableHead className="font-semibold">Cidade</TableHead>
                <TableHead className="font-semibold">Responsável</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma unidade encontrada.</TableCell></TableRow>
              ) : filtered.map((u: Unidade) => (
                <TableRow key={u.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{u.unidade || "—"}</TableCell>
                  <TableCell >{u.cidade || "—"}</TableCell>
                  <TableCell >{u.responsavel_nome || "—"}</TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onView={() => setViewItem(u)}
                      onEdit={() => { setEditItem(u); setEditNome(u.unidade || ""); }}
                      onDelete={() => setDeleteId(u.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewItem?.unidade}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-1 py-2 text-sm">
              <InfoRow label="Unidade" value={viewItem.unidade} />
              <InfoRow label="CNPJ" value={viewItem.cnpj} />
              <InfoRow label="Responsável" value={viewItem.responsavel_nome} />
              <InfoRow label="CEP" value={viewItem.cep} />
              <InfoRow label="Endereço" value={endereco(viewItem)} />
              <InfoRow label="Bairro" value={viewItem.bairro} />
              <InfoRow label="Cidade" value={viewItem.cidade} />
              <InfoRow label="Estado" value={viewItem.estado} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Unidade</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editNome} onChange={e => setEditNome(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) updateMut.mutate({ id: editItem.id, payload: { unidade: editNome } }); }} disabled={updateMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.unidade}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default Unidades;
