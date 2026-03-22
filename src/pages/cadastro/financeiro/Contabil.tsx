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

interface ItemContabil { id: number; data?: string; descricao: string; valor?: number; tipo?: string; plano_de_contas_nome?: string; unidade_nome?: string; }

const Contabil = () => {
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useQuery<ItemContabil[]>({
    queryKey: ["contabil"],
    queryFn: async () => {
      const res = await api.get("/api/financial/contabil/");
      return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
    },
  });
  const [searchContabil, setSearchContabil] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<ItemContabil | null>(null);
  const [editItem, setEditItem] = useState<ItemContabil | null>(null);
  const [editNome, setEditNome] = useState("");

  const filterFields = [{ type: "text" as const, label: "Contábil", placeholder: "Buscar descrição...", value: searchContabil, onChange: setSearchContabil, width: "flex-1 min-w-[200px]" }];
  const filtered = items.filter(c => (c.descricao || "").toLowerCase().includes(searchContabil.toLowerCase()));
  const getExportData = () => filtered.map(c => ({ Data: c.data, Descrição: c.descricao, Valor: c.valor, Tipo: c.tipo, "Plano de Contas": c.plano_de_contas_nome, Unidade: c.unidade_nome }));
  const handleDelete = () => { setDeleteId(null); toast({ title: "Aguardando API" }); };
  const deleteItem = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/financeiro/contabil/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Contábil</Button>
          <ExportButton getData={getExportData} fileName="contabil" />
        </div>
        <FilterSection fields={filterFields} resultsCount={filtered.length} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="text-center font-semibold">Data</TableHead>
              <TableHead className="text-center font-semibold">Descrição</TableHead>
              <TableHead className="text-center font-semibold">Valor</TableHead>
              <TableHead className="text-center font-semibold">Tipo</TableHead>
              <TableHead className="text-center font-semibold">Plano de Contas</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>) :
              filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="text-center">{c.data || "—"}</TableCell>
                    <TableCell className="text-center font-medium">{c.descricao}</TableCell>
                    <TableCell className="text-center">{c.valor != null ? `R$ ${c.valor.toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-center">{c.tipo || "—"}</TableCell>
                    <TableCell className="text-center">{c.plano_de_contas_nome || "—"}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(c)} onEdit={() => { setEditItem(c); setEditNome(c.descricao); }} onDelete={() => setDeleteId(c.id)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>{viewItem && <div className="py-2"><div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Contábil</span><span className="text-sm font-medium">{viewItem.nome}</span></div></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Contábil</DialogTitle></DialogHeader>
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

export default Contabil;
