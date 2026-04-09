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

interface Cliente { id: number; nome?: string; razao_social?: string; cnpj?: string; email?: string; telefone?: string; }

const fetchClientes = async (): Promise<Cliente[]> => { const res = await api.get("/api/lab/clientes/"); return res.data; };
const updateCliente = async (id: number, data: Partial<Cliente>): Promise<Cliente> => { const res = await api.put(`/api/lab/clientes/${id}/`, data); return res.data; };
const deleteCliente = async (id: number): Promise<void> => { await api.delete(`/api/lab/clientes/${id}/`); };

const Clientes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchNome, setSearchNome] = useState("");
  const [searchCnpj, setSearchCnpj] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Cliente | null>(null);
  const [editItem, setEditItem] = useState<Cliente | null>(null);
  const [editData, setEditData] = useState<Partial<Cliente>>({});

  const { data: items = [], isLoading } = useQuery({ queryKey: ["clientes_crm"], queryFn: fetchClientes });
  const updateMut = useMutation({
    mutationFn: (d: { id: number; payload: Partial<Cliente> }) => updateCliente(d.id, d.payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clientes_crm"] }); setEditItem(null); toast({ title: "Salvo", description: "Cliente atualizado." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["clientes_crm"] }); setDeleteId(null); toast({ title: "Removido", description: "Cliente excluído." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(c => (c.nome || "").toLowerCase().includes(searchNome.toLowerCase()) && (c.cnpj || "").includes(searchCnpj));
  const getExportData = () => filtered.map(c => ({ Nome: c.nome, "Razão Social": c.razao_social, CNPJ: c.cnpj, Email: c.email, Telefone: c.telefone }));
  const openEdit = (c: Cliente) => { setEditItem(c); setEditData({ nome: c.nome, razao_social: c.razao_social, cnpj: c.cnpj, email: c.email, telefone: c.telefone }); };
  const deleteItem = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/financeiro/clientes/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Cliente</Button>
          <ExportButton getData={getExportData} fileName="clientes" />
        </div>
        <FilterSection fields={[
          { type: "text" as const, label: "Nome do Cliente", placeholder: "Buscar cliente...", value: searchNome, onChange: setSearchNome, width: "flex-1 min-w-[200px]" },
          { type: "text" as const, label: "CNPJ", placeholder: "Buscar por CNPJ...", value: searchCnpj, onChange: setSearchCnpj, width: "min-w-[180px]" }
        ]} resultsCount={filtered.length} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="font-semibold">Nome</TableHead><TableHead className="font-semibold">Razão Social</TableHead><TableHead className="font-semibold">CNPJ</TableHead><TableHead className="font-semibold">Email</TableHead><TableHead className="font-semibold">Telefone</TableHead><TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>) :
                filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>) :
                  filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="font-medium">{c.nome || "—"}</TableCell>
                      <TableCell >{c.razao_social || "—"}</TableCell>
                      <TableCell >{c.cnpj || "—"}</TableCell>
                      <TableCell >{c.email || "—"}</TableCell>
                      <TableCell >{c.telefone || "—"}</TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(c)} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} /></TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 py-2"><InfoRow label="Razão Social" value={viewItem.razao_social || "—"} /><InfoRow label="CNPJ" value={viewItem.cnpj || "—"} /><InfoRow label="Email" value={viewItem.email || "—"} /><InfoRow label="Telefone" value={viewItem.telefone || "—"} /></div>}
        </DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editData.nome || ""} onChange={e => setEditData(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Razão Social</Label><Input value={editData.razao_social || ""} onChange={e => setEditData(p => ({ ...p, razao_social: e.target.value }))} /></div>
            <div className="space-y-2"><Label>CNPJ</Label><Input value={editData.cnpj || ""} onChange={e => setEditData(p => ({ ...p, cnpj: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editData.email || ""} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={editData.telefone || ""} onChange={e => setEditData(p => ({ ...p, telefone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) updateMut.mutate({ id: editItem.id, payload: editData }); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

export default Clientes;
