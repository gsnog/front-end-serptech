import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { Plus } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchTarefas } from "@/services/operacional";
import { Loader2 } from "lucide-react";

const Servicos = () => {
  const navigate = useNavigate();
  const { data: tarefas, isLoading } = useQuery({
    queryKey: ['tarefas'],
    queryFn: fetchTarefas
  });

  const [filterNome, setFilterNome] = useState("");
  const [viewItem, setViewItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editData, setEditData] = useState({ nome: "", descricao: "", custo: "" });

  const items = useMemo(() => {
    return (tarefas || []).map(t => ({
      id: t.id,
      nome: t.titulo,
      descricao: t.descricao || "-",
      custo: "Sob Consulta"
    }));
  }, [tarefas]);

  const filtered = useMemo(() => items.filter(s => s.nome.toLowerCase().includes(filterNome.toLowerCase())), [items, filterNome]);

  const getExportData = () => filtered.map(s => ({ Nome: s.nome, Descrição: s.descricao, Custo: s.custo }));
  const openEdit = (s: any) => { setEditItem(s); setEditData({ nome: s.nome, descricao: s.descricao, custo: s.custo }) };
  const handleSaveEdit = () => { if (editItem) { toast({ title: "Edição requer API de Update", description: "Módulo em desenvolvimento." }); setEditItem(null); } };
  const handleDelete = () => { if (deleteId !== null) { toast({ title: "Exclusão requer API de Delete", description: "Módulo em desenvolvimento." }); setDeleteId(null); } };
  const deleteItemData = items.find(i => i.id === deleteId);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button className="gap-2" onClick={() => navigate("/operacional/servicos/novo")}><Plus className="w-4 h-4" />Novo Serviço</Button>
          <ExportButton getData={getExportData} fileName="servicos" />
        </div>

        <FilterSection fields={[{ type: "text", label: "Nome do Serviço", placeholder: "Buscar serviço...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" }]} resultsCount={filtered.length} />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead >Nome do Serviço</TableHead><TableHead >Descrição</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-center">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum serviço encontrado.</TableCell></TableRow>) : (
                filtered.map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell >{servico.nome}</TableCell><TableCell >{servico.descricao}</TableCell><TableCell >{servico.custo}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(servico)} onEdit={() => openEdit(servico)} onDelete={() => setDeleteId(servico.id)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes do Serviço</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Nome: viewItem.nome, Descrição: viewItem.descricao, Custo: viewItem.custo }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{v}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Serviço</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editData.nome} onChange={e => setEditData({ ...editData, nome: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={editData.descricao} onChange={e => setEditData({ ...editData, descricao: e.target.value })} /></div>
            <div><Label>Custo</Label><Input value={editData.custo} onChange={e => setEditData({ ...editData, custo: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir serviço?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{deleteItemData?.nome}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Servicos;
