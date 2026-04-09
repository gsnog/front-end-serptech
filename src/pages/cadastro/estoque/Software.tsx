import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { ExportButton } from "@/components/ExportButton";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Plus, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  fetchSoftware, createSoftware, updateSoftware, deleteSoftware, softwareQueryKey,
  fetchFornecedores, fornecedoresQueryKey, type Software,
} from "@/services/estoque";

const ALLOWED_ROLES = ["admin", "admin ti"];

interface SoftwareFormProps {
  form: Partial<Software>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Software>>>;
  fornecedorOptions: { value: string; label: string }[];
}

const SoftwareForm = ({ form, setForm, fornecedorOptions }: SoftwareFormProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
    <div className="space-y-2 md:col-span-2">
      <Label>Nome <span className="text-destructive">*</span></Label>
      <Input value={form.nome ?? ""} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do software" />
    </div>
    <div className="space-y-2 md:col-span-2">
      <Label>Fornecedor <span className="text-destructive">*</span></Label>
      <SearchableSelect
        options={fornecedorOptions}
        value={form.fornecedor ? String(form.fornecedor) : ""}
        onValueChange={v => setForm(p => ({ ...p, fornecedor: Number(v) }))}
        placeholder="Selecione o fornecedor"
        searchPlaceholder="Pesquisar..."
      />
    </div>
    <div className="space-y-2">
      <Label>Licença</Label>
      <Input value={form.licenca ?? ""} onChange={e => setForm(p => ({ ...p, licenca: e.target.value }))} placeholder="Chave ou nº de licença" />
    </div>
    <div className="space-y-2">
      <Label>Valor (R$)</Label>
      <Input type="number" min={0} step={0.01} value={form.valor ?? ""} onChange={e => setForm(p => ({ ...p, valor: e.target.value === "" ? undefined : Number(e.target.value) }))} />
    </div>
    <div className="space-y-2">
      <Label>Data de Aquisição</Label>
      <Input type="date" value={form.data_aquisicao ?? ""} onChange={e => setForm(p => ({ ...p, data_aquisicao: e.target.value }))} />
    </div>
    <div className="space-y-2">
      <Label>Data de Vencimento</Label>
      <Input type="date" value={form.data_vencimento ?? ""} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} />
    </div>
  </div>
);

const emptyForm = (): Partial<Software> => ({
  nome: "",
  fornecedor: undefined,
  licenca: "",
  data_aquisicao: new Date().toISOString().split("T")[0],
  data_vencimento: "",
  valor: 0,
});

const SoftwarePage = () => {
  const { currentUser } = usePermissions();
  const currentRole = (currentUser?.roles?.[0] ?? "usuario").toLowerCase();
  const canAccess = ALLOWED_ROLES.includes(currentRole);

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Software | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Partial<Software>>(emptyForm());

  const { data: softwares = [], isLoading } = useQuery({
    queryKey: [...softwareQueryKey],
    queryFn: fetchSoftware,
    enabled: canAccess,
  });

  const { data: fornecedoresRaw = [] } = useQuery({
    queryKey: fornecedoresQueryKey,
    queryFn: fetchFornecedores,
    enabled: canAccess,
  });
  const fornecedores = (Array.isArray(fornecedoresRaw) ? fornecedoresRaw : (fornecedoresRaw as any)?.results ?? []) as any[];
  const fornecedorOptions = fornecedores.map((f: any) => ({ value: String(f.id), label: f.nome }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [...softwareQueryKey] });

  const createMutation = useMutation({
    mutationFn: createSoftware,
    onSuccess: () => { invalidate(); setCreateOpen(false); setForm(emptyForm()); toast({ title: "Software cadastrado com sucesso." }); },
    onError: (e: any) => toast({ title: "Erro ao cadastrar", description: e.response?.data?.detail ?? "Tente novamente.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Software> }) => updateSoftware(id, data),
    onSuccess: () => { invalidate(); setEditItem(null); toast({ title: "Software atualizado com sucesso." }); },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.response?.data?.detail ?? "Tente novamente.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSoftware,
    onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Software removido." }); },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Apenas administradores de TI podem acessar esta página.</p>
      </div>
    );
  }

  const filtered = softwares.filter(s =>
    s.nome?.toLowerCase().includes(search.toLowerCase()) ||
    s.fornecedor_nome?.toLowerCase().includes(search.toLowerCase())
  );

  const getExportData = () => filtered.map(s => ({
    Nome: s.nome,
    Fornecedor: s.fornecedor_nome ?? s.fornecedor,
    Licença: s.licenca ?? "—",
    "Aquisição": s.data_aquisicao ?? "—",
    "Vencimento": s.data_vencimento ?? "—",
    Valor: s.valor ?? 0,
  }));

  const deleteItem = softwares.find(s => s.id === deleteId);

  const openEdit = (s: Software) => {
    setEditItem(s);
    setForm({
      nome: s.nome,
      fornecedor: s.fornecedor,
      licenca: s.licenca ?? "",
      data_aquisicao: s.data_aquisicao ?? "",
      data_vencimento: s.data_vencimento ?? "",
      valor: s.valor ?? 0,
    });
  };

  const handleSave = (isEdit: boolean) => {
    if (!form.nome || !form.fornecedor) {
      toast({ title: "Preencha nome e fornecedor.", variant: "destructive" });
      return;
    }
    const payload = {
      ...form,
      valor: form.valor ?? 0,
      data_vencimento: form.data_vencimento || null,
      licenca: form.licenca || null,
    };
    if (isEdit && editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => { setForm(emptyForm()); setCreateOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />Novo Software
          </Button>
          <ExportButton getData={getExportData} fileName="softwares" />
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie os softwares licenciados da organização.
        </p>
        <FilterSection
          fields={[
            { type: "text" as const, label: "Buscar", placeholder: "Nome ou fornecedor...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" },
          ]}
          resultsCount={filtered.length}
        />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Fornecedor</TableHead>
                <TableHead className="font-semibold">Licença</TableHead>
                <TableHead className="font-semibold">Aquisição</TableHead>
                <TableHead className="text-center font-semibold">Vencimento</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum software encontrado.</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell >{s.fornecedor_nome ?? "—"}</TableCell>
                  <TableCell >{s.licenca ?? "—"}</TableCell>
                  <TableCell className="text-center">{s.data_aquisicao ?? "—"}</TableCell>
                  <TableCell className="text-center">{s.data_vencimento ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {s.valor != null ? `R$ ${s.valor.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <TableActions onEdit={() => openEdit(s)} onDelete={() => setDeleteId(s.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: Cadastrar */}
      <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) setForm(emptyForm()); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Software</DialogTitle></DialogHeader>
          <SoftwareForm form={form} setForm={setForm} fornecedorOptions={fornecedorOptions} />
          <DialogFooter className="pt-2 border-t gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>Cancelar</Button>
            <Button onClick={() => handleSave(false)} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={!!editItem} onOpenChange={v => { if (!v) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Software</DialogTitle></DialogHeader>
          <SoftwareForm form={form} setForm={setForm} fornecedorOptions={fornecedorOptions} />
          <DialogFooter className="pt-2 border-t gap-2">
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={updateMutation.isPending}>Cancelar</Button>
            <Button onClick={() => handleSave(true)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir <strong>{deleteItem?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SoftwarePage;
