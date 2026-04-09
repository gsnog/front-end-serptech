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

type Apresentacao = { id: number; nome: string; };

const FormasApresentacao = () => {
  const navigate = useNavigate();
  const [items] = useState<Apresentacao[]>([]);
  const [searchApresentacao, setSearchApresentacao] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Apresentacao | null>(null);
  const [editItem, setEditItem] = useState<Apresentacao | null>(null);
  const [editNome, setEditNome] = useState("");

  const filterFields = [{ type: "text" as const, label: "Apresentação", placeholder: "Buscar apresentação...", value: searchApresentacao, onChange: setSearchApresentacao, width: "flex-1 min-w-[200px]" }];
  const filtered = items.filter(ap => ap.nome.toLowerCase().includes(searchApresentacao.toLowerCase()));

  const getExportData = () => filtered.map(a => ({ Apresentação: a.nome }));
  const handleDelete = () => { setDeleteId(null); toast({ title: "Aguardando API", description: "Endpoint de exclusão ainda não configurado." }); };
  const deleteItem = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/formas-apresentacao/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Apresentação</Button>
          <ExportButton getData={getExportData} fileName="formas-apresentacao" />
        </div>
        <FilterSection fields={filterFields} resultsCount={filtered.length} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header"><TableHead className="font-semibold">Apresentação</TableHead><TableHead className="text-center font-semibold">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (<TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhuma forma de apresentação encontrada.</TableCell></TableRow>) : (
                filtered.map((ap) => (
                  <TableRow key={ap.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="font-medium">{ap.nome}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(ap)} onEdit={() => { setEditItem(ap); setEditNome(ap.nome); }} onDelete={() => setDeleteId(ap.id)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>{viewItem && <div className="py-2"><div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Nome</span><span className="text-sm font-medium">{viewItem.nome}</span></div></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Apresentação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label>Nome</Label><Input value={editNome} onChange={e => setEditNome(e.target.value)} /></div></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Aguardando API", description: "Endpoint ainda não configurado." }); setEditItem(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormasApresentacao;
