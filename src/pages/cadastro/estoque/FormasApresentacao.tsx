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
import { Plus, Loader2 } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFormasApresentacao, updateFormaApresentacao, deleteFormaApresentacao,
  fetchItensEstoque, fetchFornecedores, fetchNomenclaturas,
  type FormaApresentacao,
} from "@/services/estoque";

const formasQueryKey = ["formas_apresentacao"] as const;

const FormasApresentacao = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: formas = [], isLoading } = useQuery({
    queryKey: formasQueryKey,
    queryFn: fetchFormasApresentacao,
  });

  const { data: itensResp } = useQuery({ queryKey: ["itensEstoque"], queryFn: () => fetchItensEstoque() });
  const itens = Array.isArray(itensResp) ? itensResp : (itensResp as any)?.results ?? [];

  const { data: fornecedoresResp } = useQuery({ queryKey: ["fornecedores"], queryFn: () => fetchFornecedores() });
  const fornecedores = Array.isArray(fornecedoresResp) ? fornecedoresResp : (fornecedoresResp as any)?.results ?? [];

  const { data: nomenclaturas = [] } = useQuery({ queryKey: ["nomenclaturas"], queryFn: fetchNomenclaturas });

  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<FormaApresentacao | null>(null);
  const [editItem, setEditItem] = useState<FormaApresentacao | null>(null);
  const [editData, setEditData] = useState({
    forma_apresentacao: "", item: "", nomenclatura: "", fornecedor: "", fator_conversao: "",
  });

  const filtered = formas.filter(f =>
    f.forma_apresentacao.toLowerCase().includes(search.toLowerCase()) ||
    (f.item_nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (f.fornecedor_nome ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormaApresentacao> }) =>
      updateFormaApresentacao(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formasQueryKey });
      setEditItem(null);
      toast({ title: "Forma de apresentação atualizada." });
    },
    onError: () => toast({ title: "Erro ao atualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFormaApresentacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formasQueryKey });
      setDeleteId(null);
      toast({ title: "Forma de apresentação excluída." });
    },
    onError: () => toast({ title: "Erro ao excluir.", variant: "destructive" }),
  });

  const openEdit = (f: FormaApresentacao) => {
    setEditItem(f);
    setEditData({
      forma_apresentacao: f.forma_apresentacao,
      item: f.item ? String(f.item) : "",
      nomenclatura: f.nomenclatura ? String(f.nomenclatura) : "",
      fornecedor: f.fornecedor ? String(f.fornecedor) : "",
      fator_conversao: f.fator_conversao,
    });
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    if (!editData.forma_apresentacao || !editData.item || !editData.fornecedor || !editData.nomenclatura || !editData.fator_conversao) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: editItem.id,
      data: {
        forma_apresentacao: editData.forma_apresentacao,
        item: Number(editData.item),
        nomenclatura: Number(editData.nomenclatura),
        fornecedor: Number(editData.fornecedor),
        fator_conversao: editData.fator_conversao,
      },
    });
  };

  const getExportData = () => filtered.map(f => ({
    "Unidade Fornecedor": f.forma_apresentacao,
    Item: f.item_nome ?? "",
    Fornecedor: f.fornecedor_nome ?? "",
    Nomenclatura: f.nomenclatura_nome ?? "",
    "Fator de Conversão": f.fator_conversao,
  }));

  const deleteTarget = formas.find(f => f.id === deleteId);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/formas-apresentacao/nova")} className="gap-2">
            <Plus className="w-4 h-4" />Nova Forma de Apresentação
          </Button>
          <ExportButton getData={getExportData} fileName="formas-apresentacao" />
        </div>

        <FilterSection
          fields={[{ type: "text", label: "Buscar", placeholder: "Item, fornecedor ou unidade...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]}
          resultsCount={filtered.length}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="font-semibold">Unidade Fornecedor</TableHead>
                <TableHead className="font-semibold">Item</TableHead>
                <TableHead className="font-semibold">Fornecedor</TableHead>
                <TableHead className="font-semibold">Nomenclatura</TableHead>
                <TableHead className="text-center font-semibold">Fator de Conversão</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma forma de apresentação encontrada.</TableCell></TableRow>
              ) : (
                filtered.map(f => (
                  <TableRow key={f.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="font-medium">{f.forma_apresentacao}</TableCell>
                    <TableCell>{f.item_nome ?? "—"}</TableCell>
                    <TableCell>{f.fornecedor_nome ?? "—"}</TableCell>
                    <TableCell>{f.nomenclatura_nome ?? "—"}</TableCell>
                    <TableCell className="text-center">× {f.fator_conversao}</TableCell>
                    <TableCell className="text-center">
                      <TableActions onView={() => setViewItem(f)} onEdit={() => openEdit(f)} onDelete={() => setDeleteId(f.id)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Forma de Apresentação</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 py-2 text-sm">
              {[
                ["Unidade do Fornecedor", viewItem.forma_apresentacao],
                ["Item", viewItem.item_nome ?? "—"],
                ["Fornecedor", viewItem.fornecedor_nome ?? "—"],
                ["Nomenclatura", viewItem.nomenclatura_nome ?? "—"],
                ["Fator de Conversão", `× ${viewItem.fator_conversao}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Forma de Apresentação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Unidade do Fornecedor <span className="text-destructive">*</span></Label>
              <Input placeholder="Ex: CENTO" value={editData.forma_apresentacao} onChange={e => setEditData(p => ({ ...p, forma_apresentacao: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Item <span className="text-destructive">*</span></Label>
              <Select value={editData.item} onValueChange={v => setEditData(p => ({ ...p, item: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o item..." /></SelectTrigger>
                <SelectContent>
                  {itens.map((i: any) => <SelectItem key={i.id} value={String(i.id)}>{i.itens_do_estoque}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor <span className="text-destructive">*</span></Label>
              <Select value={editData.fornecedor} onValueChange={v => setEditData(p => ({ ...p, fornecedor: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o fornecedor..." /></SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f: any) => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nomenclatura <span className="text-destructive">*</span></Label>
              <Select value={editData.nomenclatura} onValueChange={v => setEditData(p => ({ ...p, nomenclatura: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a nomenclatura..." /></SelectTrigger>
                <SelectContent>
                  {(nomenclaturas as any[]).map((n: any) => <SelectItem key={n.id} value={String(n.id)}>{n.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fator de Conversão <span className="text-destructive">*</span></Label>
              <Input type="number" min="0.0001" step="any" placeholder="Ex: 100" value={editData.fator_conversao} onChange={e => setEditData(p => ({ ...p, fator_conversao: e.target.value }))} />
              <p className="text-xs text-muted-foreground">1 unidade do fornecedor equivale a este valor no estoque interno.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir a forma de apresentação <strong>{deleteTarget?.forma_apresentacao}</strong> do item <strong>{deleteTarget?.item_nome}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormasApresentacao;
