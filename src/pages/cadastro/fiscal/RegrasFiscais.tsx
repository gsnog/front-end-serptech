import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Info } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";

type RegraFiscal = { id: number; item: string; tipo: string; ncm: string; cest: string; cstCsosn: string; origem: string; icms: number; ipi: number; pis: number; cofins: number; iss: number; };

const RegrasFiscais = () => {
  const navigate = useNavigate();
  const [items] = useState<RegraFiscal[]>([]);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<RegraFiscal | null>(null);

  const filtered = items.filter(c => c.item.toLowerCase().includes(search.toLowerCase()) || c.tipo.toLowerCase().includes(search.toLowerCase()));
  const getExportData = () => filtered.map(c => ({ Item: c.item, Tipo: c.tipo, NCM: c.ncm, "CST/CSOSN": c.cstCsosn, ICMS: `${c.icms}%`, IPI: `${c.ipi}%`, ISS: `${c.iss}%` }));
  const handleDelete = () => { setDeleteId(null); toast({ title: "Aguardando API", description: "Endpoint ainda não configurado." }); };
  const deleteItem = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background"><div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate("/cadastro/fiscal/regras-fiscais/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Regra</Button>
        <ExportButton getData={getExportData} fileName="regras-fiscais" />
      </div>
      <FilterSection fields={[{ type: "text" as const, label: "Buscar", placeholder: "Buscar por item ou tipo...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]} resultsCount={filtered.length} />

      <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 flex items-center gap-2 text-sm">
        <Info className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-muted-foreground">Itens sem regra fiscal configurada podem ser emitidos em <strong>modo manual</strong> — o contador deverá preencher os tributos diretamente na nota.</span>
      </div>

      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-table-header">
            <TableHead className="font-semibold">Item/Serviço</TableHead>
            <TableHead className="text-center font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">NCM</TableHead>
            <TableHead className="font-semibold">CST/CSOSN</TableHead>
            <TableHead className="font-semibold">Alíquotas</TableHead>
            <TableHead className="text-center font-semibold">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma regra encontrada.</TableCell></TableRow> :
              filtered.map(c => (
                <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{c.item}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={c.tipo} /></TableCell>
                  <TableCell className="font-mono text-xs">{c.ncm || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.cstCsosn || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {c.tipo === "Produto" ? `ICMS ${c.icms}% | IPI ${c.ipi}%` : `ISS ${c.iss}%`}
                  </TableCell>
                  <TableCell className="text-center"><TableActions onView={() => setViewItem(c)} onEdit={() => navigate("/cadastro/fiscal/regras-fiscais/nova")} onDelete={() => setDeleteId(c.id)} /></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Regra Fiscal: {viewItem?.item}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 py-2">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Item</span><span className="text-sm font-medium">{viewItem.item}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Tipo</span><span className="text-sm font-medium">{viewItem.tipo}</span></div>
            {viewItem.tipo === "Produto" && <>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">NCM</span><span className="text-sm font-mono">{viewItem.ncm || "—"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">CST/CSOSN</span><span className="text-sm font-mono">{viewItem.cstCsosn || "—"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Origem</span><span className="text-sm">{viewItem.origem || "—"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">ICMS</span><span className="text-sm font-medium">{viewItem.icms}%</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">IPI</span><span className="text-sm font-medium">{viewItem.ipi}%</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">PIS</span><span className="text-sm font-medium">{viewItem.pis}%</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">COFINS</span><span className="text-sm font-medium">{viewItem.cofins}%</span></div>
            </>}
            {viewItem.tipo === "Serviço" && <div className="flex justify-between"><span className="text-sm text-muted-foreground">ISS</span><span className="text-sm font-medium">{viewItem.iss}%</span></div>}
          </div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir a regra fiscal de <strong>{deleteItem?.item}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

export default RegrasFiscais;