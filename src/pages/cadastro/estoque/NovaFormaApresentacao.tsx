import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchItensEstoque, fetchFornecedores, fetchNomenclaturas, createFormaApresentacao } from "@/services/estoque";

const NovaFormaApresentacao = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    forma_apresentacao: "", item: "", fornecedor: "", nomenclatura: "", fator_conversao: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: itensResp } = useQuery({ queryKey: ["itensEstoque"], queryFn: () => fetchItensEstoque() });
  const itens = Array.isArray(itensResp) ? itensResp : (itensResp as any)?.results ?? [];

  const { data: fornecedoresResp } = useQuery({ queryKey: ["fornecedores"], queryFn: () => fetchFornecedores() });
  const fornecedores = Array.isArray(fornecedoresResp) ? fornecedoresResp : (fornecedoresResp as any)?.results ?? [];

  const { data: nomenclaturas = [] } = useQuery({ queryKey: ["nomenclaturas"], queryFn: fetchNomenclaturas });

  const set = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.forma_apresentacao.trim()) e.forma_apresentacao = "Obrigatório";
    if (!form.item) e.item = "Obrigatório";
    if (!form.fornecedor) e.fornecedor = "Obrigatório";
    if (!form.nomenclatura) e.nomenclatura = "Obrigatório";
    if (!form.fator_conversao || parseFloat(form.fator_conversao) <= 0) e.fator_conversao = "Informe um valor maior que zero";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSalvar = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await createFormaApresentacao({
        forma_apresentacao: form.forma_apresentacao.trim(),
        item: Number(form.item),
        fornecedor: Number(form.fornecedor),
        nomenclatura: Number(form.nomenclatura),
        fator_conversao: form.fator_conversao,
      });
      toast({ title: "Forma de apresentação cadastrada com sucesso!" });
      navigate("/cadastro/estoque/formas-apresentacao");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0];
      toast({ title: detail ?? "Erro ao cadastrar.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SimpleFormWizard title="Nova Forma de Apresentação">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Forma de Apresentação</h2>
                <p className="text-sm text-muted-foreground">Define como um fornecedor entrega um item e o fator de conversão para o estoque interno.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unidade do fornecedor */}
              <div className="space-y-2">
                <Label>Unidade do Fornecedor <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ex: CENTO, CX, PCT"
                  value={form.forma_apresentacao}
                  onChange={e => set("forma_apresentacao", e.target.value)}
                />
                {errors.forma_apresentacao && <p className="text-xs text-destructive">{errors.forma_apresentacao}</p>}
              </div>

              {/* Fator de conversão */}
              <div className="space-y-2">
                <Label>Fator de Conversão <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0.0001"
                  step="any"
                  placeholder="Ex: 100"
                  value={form.fator_conversao}
                  onChange={e => set("fator_conversao", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">1 unidade do fornecedor equivale a este valor no estoque interno.</p>
                {errors.fator_conversao && <p className="text-xs text-destructive">{errors.fator_conversao}</p>}
              </div>

              {/* Item */}
              <div className="space-y-2">
                <Label>Item <span className="text-destructive">*</span></Label>
                <Select value={form.item} onValueChange={v => set("item", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o item..." /></SelectTrigger>
                  <SelectContent>
                    {itens.map((i: any) => (
                      <SelectItem key={i.id} value={String(i.id)}>{i.itens_do_estoque}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.item && <p className="text-xs text-destructive">{errors.item}</p>}
              </div>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label>Fornecedor <span className="text-destructive">*</span></Label>
                <Select value={form.fornecedor} onValueChange={v => set("fornecedor", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o fornecedor..." /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f: any) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fornecedor && <p className="text-xs text-destructive">{errors.fornecedor}</p>}
              </div>

              {/* Nomenclatura */}
              <div className="space-y-2 md:col-span-2">
                <Label>Nomenclatura <span className="text-destructive">*</span></Label>
                <Select value={form.nomenclatura} onValueChange={v => set("nomenclatura", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione a nomenclatura..." /></SelectTrigger>
                  <SelectContent>
                    {(nomenclaturas as any[]).map((n: any) => (
                      <SelectItem key={n.id} value={String(n.id)}>{n.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nomenclatura && <p className="text-xs text-destructive">{errors.nomenclatura}</p>}
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/estoque/formas-apresentacao")}
              isSaving={isSaving}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaFormaApresentacao;
