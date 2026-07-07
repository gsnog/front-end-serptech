import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { ClipboardList, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface ItemRow {
  _key: number;
  itemId: string;
  itemNome: string;
  quantidade: string;
}

interface MyFuncionario {
  id: number;
  nome: string;
  setor_ids: number[];
  unidade_id: number | null;
  role: string;
}

export default function NovaRequisicao() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    requisitante: "",   // funcionario ID as string
    setor: "",
    unidade: "",
    observacao: "",
  });
  const setField = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const [itens, setItens] = useState<ItemRow[]>([]);
  const [itemForm, setItemForm] = useState({ itemId: "", itemNome: "", quantidade: "" });

  // ── Funcionário logado ──────────────────────────────────────────────────────
  const { data: myFuncionario } = useQuery<MyFuncionario>({
    queryKey: ["funcionario_me"],
    queryFn: () => api.get("/api/funcionarios/me/").then((r) => r.data),
    onSuccess: (data) => {
      setForm((p) => ({ ...p, requisitante: String(data.id) }));
    },
  } as any);

  // ── Lista de funcionários disponíveis ───────────────────────────────────────
  const { data: allFuncionarios = [] } = useQuery<any[]>({
    queryKey: ["funcionarios_list"],
    queryFn: () =>
      api.get("/api/funcionarios/").then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
  });

  const requisitanteOptions = useMemo(() => {
    if (!myFuncionario) return [];
    const bypass = ["admin", "suprimentos"].includes(myFuncionario.role);
    const list = bypass
      ? allFuncionarios
      : allFuncionarios.filter((f: any) =>
        (f.setor_ids ?? []).some((sid: number) => myFuncionario.setor_ids.includes(sid))
      );
    return list.map((f: any) => ({ value: String(f.id), label: f.nome }));
  }, [allFuncionarios, myFuncionario]);

  // ── Dados externos ──────────────────────────────────────────────────────────
  const { data: setores = [] } = useQuery({
    queryKey: ["setores_estoque_req"],
    queryFn: () =>
      api.get("/api/setores-estoque/").then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades_req"],
    queryFn: () =>
      api.get("/api/estoque/unidades/").then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
  });

  const { data: itensEstoque = [] } = useQuery({
    queryKey: ["itens_req"],
    queryFn: () =>
      api.get("/api/estoque/itens/").then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
  });

  const setorOptions = (setores as any[]).map((s: any) => ({
    value: String(s.id),
    label: s.setor || s.nome || String(s.id),
  }));

  const unidadeOptions = (unidades as any[]).map((u: any) => ({
    value: String(u.id),
    label: u.unidade,
  }));

  // ── Derivar setor/unidade ao trocar requisitante ─────────────────────────────
  const selectedFuncionario = useMemo(
    () => (form.requisitante ? (allFuncionarios as any[]).find((f) => String(f.id) === form.requisitante) : null),
    [form.requisitante, allFuncionarios]
  );

  const filteredSetorOptions = useMemo(() => {
    if (!selectedFuncionario || !selectedFuncionario.setor_ids?.length) return setorOptions;
    return setorOptions.filter((opt) => selectedFuncionario.setor_ids.includes(Number(opt.value)));
  }, [selectedFuncionario, setorOptions]);

  useEffect(() => {
    if (!selectedFuncionario) return;

    // Auto-preenche unidade se o funcionário tiver uma
    if (selectedFuncionario.unidade_id) {
      setForm((p) => ({ ...p, unidade: String(selectedFuncionario.unidade_id) }));
    }

    // Auto-preenche setor se só tiver um; limpa se o atual não pertencer ao funcionário
    const ids: number[] = selectedFuncionario.setor_ids ?? [];
    if (ids.length === 1) {
      setForm((p) => ({ ...p, setor: String(ids[0]) }));
    } else {
      setForm((p) => ({
        ...p,
        setor: ids.includes(Number(p.setor)) ? p.setor : "",
      }));
    }
  }, [selectedFuncionario]);

  const itemOptions = (itensEstoque as any[]).map((i: any) => ({
    value: String(i.id),
    label: i.itens_do_estoque,
  }));

  // ── Mutation ────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (payload: any) =>
      api.post("/api/estoque/requisicoes/", payload).then((r) => r.data),
    onSuccess: () => {
      toast({ title: "Pedido interno criado com sucesso!" });
      navigate("/estoque/pedidos-internos");
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
    },
  });

  // ── Itens ───────────────────────────────────────────────────────────────────
  const handleAddItem = () => {
    if (!itemForm.itemId || !itemForm.quantidade) {
      toast({ title: "Campos obrigatórios", description: "Selecione o item e informe a quantidade.", variant: "destructive" });
      return;
    }
    setItens((prev) => [...prev, { _key: Date.now(), ...itemForm }]);
    setItemForm({ itemId: "", itemNome: "", quantidade: "" });
  };

  const handleRemoveItem = (key: number) =>
    setItens((prev) => prev.filter((i) => i._key !== key));

  // ── Salvar ──────────────────────────────────────────────────────────────────
  const handleSalvar = () => {
    if (!form.setor || !form.unidade) {
      toast({ title: "Campos obrigatórios", description: "Selecione o setor e a unidade.", variant: "destructive" });
      return;
    }
    if (itens.length === 0) {
      toast({ title: "Itens obrigatórios", description: "Adicione pelo menos um item ao pedido.", variant: "destructive" });
      return;
    }
    const requisitanteNome =
      requisitanteOptions.find((o) => o.value === form.requisitante)?.label ?? "";

    mutation.mutate({
      setor_requisicao: parseInt(form.setor),
      unidade: parseInt(form.unidade),
      requisitante_nome: requisitanteNome || null,
      observacao: form.observacao || null,
      itens: itens.map((it) => ({
        item: parseInt(it.itemId),
        quantidade: parseInt(it.quantidade),
      })),
    });
  };

  return (
    <SimpleFormWizard title="Novo Pedido Interno">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Pedido Interno</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <ValidatedSelect
                label="Requisitante"
                required
                value={form.requisitante}
                onValueChange={(v) => setField("requisitante", v)}
                placeholder="Selecione o requisitante"
                options={requisitanteOptions}
                searchable
                searchPlaceholder="Buscar funcionário..."
              />

              {myFuncionario && !["admin", "suprimentos"].includes(myFuncionario.role) && (
                <p className="text-xs text-muted-foreground -mt-4">
                  Exibindo apenas funcionários do mesmo setor. Integrantes dos grupos <strong>Admin</strong> ou <strong>Suprimentos</strong> podem solicitar para qualquer funcionário.
                </p>
              )}

              <ValidatedSelect
                label="Setor"
                required
                value={form.setor}
                onValueChange={(v) => setField("setor", v)}
                placeholder="Selecione o setor"
                options={filteredSetorOptions}
                searchable
                searchPlaceholder="Buscar setor..."
              />
              <ValidatedSelect
                label="Unidade"
                required
                value={form.unidade}
                onValueChange={(v) => setField("unidade", v)}
                placeholder="Selecione a unidade"
                options={unidadeOptions}
                searchable
                searchPlaceholder="Buscar unidade..."
              />
            </div>



            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações</Label>
              <Textarea
                placeholder="Observações adicionais..."
                className="form-input min-h-[80px]"
                value={form.observacao}
                onChange={(e) => setField("observacao", e.target.value)}
              />
            </div>

            {/* Itens */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Itens</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <ValidatedSelect
                    label="Item"
                    value={itemForm.itemId}
                    onValueChange={(v) => {
                      const found = itemOptions.find((o) => o.value === v);
                      setItemForm((p) => ({ ...p, itemId: v, itemNome: found?.label ?? "" }));
                    }}
                    placeholder="Selecionar item"
                    options={itemOptions}
                    searchable
                    searchPlaceholder="Buscar item..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    value={itemForm.quantidade}
                    onChange={(e) => setItemForm((p) => ({ ...p, quantidade: e.target.value }))}
                    placeholder="Qtd"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button type="button" onClick={handleAddItem}>Adicionar Item</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead >Item</TableHead>
                  <TableHead className="text-right">Quantidade Solicitada</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhum item adicionado</TableCell></TableRow>
                ) : (
                  itens.map((item) => (
                    <TableRow key={item._key}>
                      <TableCell >{item.itemNome}</TableCell>
                      <TableCell >{item.quantidade}</TableCell>
                      <TableCell >
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item._key)} className="text-destructive hover:text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/estoque/pedidos-internos")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
