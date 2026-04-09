import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { MapPin, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface ItemLocacaoRow {
  _key: number;
  itemId: string;
  itemNome: string;
  quantidade: string;
  dataEntrega: string;
}

const saveLocacao = async ({
  form,
  itens,
  contrato,
}: {
  form: {
    locador: string;
    unidade: string;
    dataInicio: string;
    previsaoEntrega: string;
    valor: string;
    adicional: string;
    desconto: string;
    descricao: string;
  };
  itens: ItemLocacaoRow[];
  contrato: File | null;
}) => {
  const fd = new FormData();
  fd.append("locador", form.locador);
  fd.append("unidade", form.unidade);
  fd.append("data_inicio", form.dataInicio);
  if (form.previsaoEntrega) fd.append("previsao_de_entrega", form.previsaoEntrega);
  fd.append("status", "Em Andamento");
  fd.append("valor", form.valor || "0");
  fd.append("adicional", form.adicional || "0");
  fd.append("desconto", form.desconto || "0");
  if (form.descricao) fd.append("descricao", form.descricao);
  if (contrato) fd.append("contrato", contrato);

  const { data } = await api.post("/api/estoque/locacoes/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (itens.length > 0) {
    await Promise.all(
      itens.map((it) =>
        api.post("/api/estoque/item-locacao/", {
          locacao: data.id,
          item: parseInt(it.itemId),
          quantidade: parseFloat(it.quantidade),
          data_de_entrega: it.dataEntrega || null,
        })
      )
    );
  }

  return data;
};

export default function NovaLocacao() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    locador: "",
    unidade: "",
    dataInicio: "",
    previsaoEntrega: "",
    valor: "",
    adicional: "0",
    desconto: "0",
    descricao: "",
  });
  const setField = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const [contrato, setContrato] = useState<File | null>(null);
  const [itens, setItens] = useState<ItemLocacaoRow[]>([]);
  const [itemForm, setItemForm] = useState({ itemId: "", itemNome: "", quantidade: "", dataEntrega: "" });

  // ── Dados externos ──────────────────────────────────────────────────────────
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores_locacao"],
    queryFn: () =>
      api.get("/api/estoque/fornecedores/").then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
  });

  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades_locacao"],
    queryFn: () =>
      api.get("/api/estoque/unidades/").then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
  });

  const { data: itensEstoque = [] } = useQuery({
    queryKey: ["itens_locacao"],
    queryFn: () =>
      api.get("/api/estoque/itens/").then((r) =>
        Array.isArray(r.data) ? r.data : r.data?.results ?? []
      ),
  });

  const fornecedorOptions = (fornecedores as any[]).map((f: any) => ({
    value: String(f.id),
    label: f.nome,
  }));

  const unidadeOptions = (unidades as any[]).map((u: any) => ({
    value: String(u.id),
    label: u.unidade,
  }));

  const itemOptions = (itensEstoque as any[]).map((i: any) => ({
    value: String(i.id),
    label: i.itens_do_estoque,
  }));

  // ── Mutation ────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: saveLocacao,
    onSuccess: () => {
      toast({ title: "Locação salva com sucesso!" });
      navigate("/estoque/locacoes");
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
    setItens((prev) => [
      ...prev,
      { _key: Date.now(), ...itemForm },
    ]);
    setItemForm({ itemId: "", itemNome: "", quantidade: "", dataEntrega: "" });
  };

  const handleRemoveItem = (key: number) => setItens((prev) => prev.filter((i) => i._key !== key));

  // ── Salvar ──────────────────────────────────────────────────────────────────
  const handleSalvar = () => {
    if (!form.locador || !form.unidade || !form.dataInicio) {
      toast({ title: "Campos obrigatórios", description: "Preencha locador, unidade e data de início.", variant: "destructive" });
      return;
    }
    mutation.mutate({ form, itens, contrato });
  };

  const valorTotal =
    (parseFloat(form.valor) || 0) +
    (parseFloat(form.adicional) || 0) -
    (parseFloat(form.desconto) || 0);

  return (
    <SimpleFormWizard title="Nova Locação">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Locação</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedSelect
                label="Locador"
                required
                value={form.locador}
                onValueChange={(v) => setField("locador", v)}
                placeholder="Selecione o fornecedor"
                options={fornecedorOptions}
                searchable
                searchPlaceholder="Buscar fornecedor..."
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Início <span className="text-destructive">*</span></Label>
                <Input type="date" className="form-input" value={form.dataInicio} onChange={(e) => setField("dataInicio", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Prevista de Finalização</Label>
                <Input type="date" className="form-input" value={form.previsaoEntrega} onChange={(e) => setField("previsaoEntrega", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Contrato</Label>
                <Input
                  type="file"
                  className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  onChange={(e) => setContrato(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={form.valor}
                  onChange={(e) => setField("valor", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Adicional</Label>
                <Input type="number" min="0" step="0.01" className="form-input" value={form.adicional} onChange={(e) => setField("adicional", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Desconto</Label>
                <Input type="number" min="0" step="0.01" className="form-input" value={form.desconto} onChange={(e) => setField("desconto", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor Total</Label>
                <Input type="text" className="form-input bg-muted" readOnly value={valorTotal.toFixed(2)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Descrição</Label>
              <Textarea className="form-input min-h-[80px]" value={form.descricao} onChange={(e) => setField("descricao", e.target.value)} />
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
                    min="0"
                    step="0.01"
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
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum item adicionado</TableCell></TableRow>
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

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/estoque/locacoes")} isSaving={mutation.isPending} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
