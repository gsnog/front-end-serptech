import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileText } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

type Sub = { id: number; nome: string; categoria?: number; categoria_nome?: string; };

const Subcategorias = () => {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useQuery<Sub[]>({
    queryKey: ["subcategorias_financeiras"],
    queryFn: async () => {
      const res = await api.get("/api/financial/subcategorias/");
      return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
    },
  });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Sub | null>(null);
  const [editItem, setEditItem] = useState<Sub | null>(null);
  const [editData, setEditData] = useState({ nome: "", categoria: "" });
  const filtered = items.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));
  const getExportData = () => filtered.map(s => ({ Subcategoria: s.nome, Categoria: s.categoria_nome || s.categoria || "" }));
  const handleDelete = () => { setDeleteId(null); toast({ title: "Aguardando API", description: "Endpoint ainda não configurado." }); };
  const deleteItem = items.find(i => i.id === deleteId);
  const openEdit = (s: Sub) => { setEditItem(s); setEditData({ nome: s.nome, categoria: s.categoria_nome || String(s.categoria || "") }); };

  return (
    <div className="flex flex-col h-full bg-background"><div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate("/cadastro/financeiro/subcategorias/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Subcategoria</Button>
        <ExportButton getData={getExportData} fileName="subcategorias" />
      </div>
      <FilterSection fields={[{ type: "text" as const, label: "Subcategoria", placeholder: "Buscar subcategoria...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]} resultsCount={filtered.length} />
      <div className="rounded border border-border overflow-hidden"><Table><TableHeader><TableRow className="bg-table-header"><TableHead className="text-center font-semibold">Subcategoria</TableHead><TableHead className="text-center font-semibold">Categoria</TableHead><TableHead className="text-center font-semibold">Ações</TableHead></TableRow></TableHeader><TableBody>
        {isLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow> :
          filtered.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma subcategoria encontrada.</TableCell></TableRow> :
          filtered.map(s => <TableRow key={s.id} className="hover:bg-table-hover transition-colors"><TableCell className="text-center font-medium">{s.nome}</TableCell><TableCell className="text-center">{s.categoria_nome || "—"}</TableCell><TableCell className="text-center"><TableActions onView={() => setViewItem(s)} onEdit={() => openEdit(s)} onDelete={() => setDeleteId(s.id)} /></TableCell></TableRow>)}
      </TableBody></Table></div>
    </div>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2"><InfoRow label="Subcategoria" value={viewItem.nome} /><InfoRow label="Categoria" value={viewItem.categoria_nome || String(viewItem.categoria || "—")} /></div>}</DialogContent></Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Subcategoria</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editData.nome} onChange={e => setEditData(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Categoria</Label><Input value={editData.categoria} onChange={e => setEditData(p => ({ ...p, categoria: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Aguardando API", description: "Endpoint ainda não configurado." }); setEditItem(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>; }
export default Subcategorias;
