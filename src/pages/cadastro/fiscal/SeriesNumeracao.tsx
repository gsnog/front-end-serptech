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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShieldAlert } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";

type Serie = { id: number; tipo: string; serie: string; proximoNumero: number; prefixo: string; observacao: string; };

const SeriesNumeracao = () => {
  const navigate = useNavigate();
  const [items] = useState<Serie[]>([]);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Serie | null>(null);
  const [editItem, setEditItem] = useState<Serie | null>(null);
  const [editForm, setEditForm] = useState({ tipo: "", serie: "", proximoNumero: 0, prefixo: "", observacao: "" });

  const filtered = items.filter(c => c.tipo.toLowerCase().includes(search.toLowerCase()) || c.serie.includes(search));
  const getExportData = () => filtered.map(c => ({ Tipo: c.tipo, Série: c.serie, "Próximo Nº": c.proximoNumero, Prefixo: c.prefixo }));
  const handleDelete = () => { setDeleteId(null); toast({ title: "Aguardando API", description: "Endpoint ainda não configurado." }); };
  const deleteItem = items.find(i => i.id === deleteId);

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ tipo: "NF-e", serie: "", proximoNumero: 1, prefixo: "", observacao: "" });

  return (
    <div className="flex flex-col h-full bg-background"><div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate("/cadastro/fiscal/series/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Série</Button>
        <ExportButton getData={getExportData} fileName="series-numeracao" />
      </div>
      <FilterSection fields={[{ type: "text" as const, label: "Buscar", placeholder: "Buscar por tipo ou série...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]} resultsCount={filtered.length} />

      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 flex items-center gap-2 text-sm">
        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-muted-foreground">O campo <strong>"Próximo Nº"</strong> é editável apenas por <strong>Contador / Admin</strong>. Alterações são registradas na auditoria.</span>
      </div>

      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-table-header">
            <TableHead className="text-center font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Série</TableHead>
            <TableHead className="font-semibold">Próximo Nº</TableHead>
            <TableHead className="font-semibold">Prefixo</TableHead>
            <TableHead className="text-center font-semibold">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma série encontrada.</TableCell></TableRow> :
              filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="text-center"><StatusBadge status={c.tipo} /></TableCell>
                  <TableCell className="font-medium">{c.serie}</TableCell>
                  <TableCell className="font-mono font-bold">{String(c.proximoNumero).padStart(6, '0')}</TableCell>
                  <TableCell className="text-muted-foreground">{c.prefixo || "—"}</TableCell>
                  <TableCell className="text-center"><TableActions onView={() => setViewItem(c)} onEdit={() => { setEditItem(c); setEditForm({ tipo: c.tipo, serie: c.serie, proximoNumero: c.proximoNumero, prefixo: c.prefixo, observacao: c.observacao }); }} onDelete={() => setDeleteId(c.id)} /></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Série: {viewItem?.tipo} — {viewItem?.serie}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 py-2">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Tipo</span><span className="text-sm font-medium">{viewItem.tipo}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Série</span><span className="text-sm font-medium">{viewItem.serie}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Próximo Nº</span><span className="text-sm font-mono font-bold">{String(viewItem.proximoNumero).padStart(6, '0')}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Prefixo</span><span className="text-sm font-medium">{viewItem.prefixo || "—"}</span></div>
          </div>}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Série</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={editForm.tipo} onValueChange={(v) => setEditForm(p => ({ ...p, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover"><SelectItem value="NF-e">NF-e</SelectItem><SelectItem value="NFS-e">NFS-e</SelectItem></SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Série</Label><Input value={editForm.serie} onChange={e => setEditForm(p => ({ ...p, serie: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Próximo Nº 🔒</Label><Input type="number" value={editForm.proximoNumero} onChange={e => setEditForm(p => ({ ...p, proximoNumero: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>Prefixo</Label><Input value={editForm.prefixo} onChange={e => setEditForm(p => ({ ...p, prefixo: e.target.value }))} placeholder="Opcional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Aguardando API", description: "Endpoint ainda não configurado." }); setEditItem(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Série</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={newForm.tipo} onValueChange={(v) => setNewForm(p => ({ ...p, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-popover"><SelectItem value="NF-e">NF-e</SelectItem><SelectItem value="NFS-e">NFS-e</SelectItem></SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Série</Label><Input value={newForm.serie} onChange={e => setNewForm(p => ({ ...p, serie: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Próximo Nº</Label><Input type="number" value={newForm.proximoNumero} onChange={e => setNewForm(p => ({ ...p, proximoNumero: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>Prefixo</Label><Input value={newForm.prefixo} onChange={e => setNewForm(p => ({ ...p, prefixo: e.target.value }))} placeholder="Opcional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Aguardando API", description: "Endpoint ainda não configurado." }); setShowNew(false); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir a série <strong>{deleteItem?.tipo} — {deleteItem?.serie}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

export default SeriesNumeracao;