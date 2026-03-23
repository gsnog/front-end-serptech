import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Receipt } from "lucide-react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  fetchCentrosReceita, fetchPlanoContas, createContaReceber,
  type CentroReceita, type PlanoContas,
} from "@/services/financeiro";
import api from "@/lib/api";

const validationFields = [
  { name: "cliente", label: "Cliente", required: true },
  { name: "documento", label: "Documento", required: true },
  { name: "valor", label: "Valor do Título", required: true },
  { name: "dataFaturamento", label: "Data de Faturamento", required: true },
  { name: "dataVencimento", label: "Data de Vencimento", required: true },
];

export default function NovaContaReceber() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { cliente: "", centroReceita: "", planoContas: "", documento: "", valor: "", multa: "0", encargos: "0", juros: "0", desconto: "0", valorTotal: "", dataFaturamento: "", dataVencimento: "", parcelas: "1", descricao: "" },
    validationFields
  );

  const { data: clientesResponse } = useQuery({
    queryKey: ['lab-clientes'],
    queryFn: () => api.get('/api/lab/clientes/').then(r => r.data),
  });
  const clientes: { id: number; nome: string }[] = Array.isArray(clientesResponse)
    ? clientesResponse
    : (clientesResponse?.results ?? []);

  const { data: centrosReceitaResponse } = useQuery({
    queryKey: ['centrosReceita'],
    queryFn: () => fetchCentrosReceita(),
  });
  const centrosReceita: CentroReceita[] = Array.isArray(centrosReceitaResponse)
    ? centrosReceitaResponse
    : ((centrosReceitaResponse as any)?.results ?? []);

  const { data: planoContasResponse } = useQuery({
    queryKey: ['planoContas'],
    queryFn: () => fetchPlanoContas(),
  });
  const planoContasList: PlanoContas[] = Array.isArray(planoContasResponse)
    ? planoContasResponse
    : ((planoContasResponse as any)?.results ?? []);

  const handleSalvar = async () => {
    if (validateAll()) {
      setIsSaving(true);
      try {
        await createContaReceber({
          cliente: Number(formData.cliente),
          centro_de_receita: formData.centroReceita ? Number(formData.centroReceita) : undefined,
          plano_de_contas: formData.planoContas ? Number(formData.planoContas) : undefined,
          numero_documento: formData.documento,
          valor_do_titulo: Number(formData.valor),
          multa: Number(formData.multa),
          encargos: Number(formData.encargos),
          juros: Number(formData.juros),
          desconto: Number(formData.desconto),
          valor_total: formData.valorTotal ? Number(formData.valorTotal) : undefined,
          data_de_faturamento: formData.dataFaturamento,
          data_de_vencimento: formData.dataVencimento,
          descricao: formData.descricao,
        } as any);
        toast({ title: "Conta a receber salva com sucesso!" });
        navigate("/financeiro/contas-receber");
      } catch {
        toast({ title: "Erro ao salvar", description: "Não foi possível salvar a conta.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <SimpleFormWizard title="Nova Conta a Receber">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Conta a Receber</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cliente <span className="text-destructive">*</span></Label>
                <Select value={formData.cliente} onValueChange={(v) => setFieldValue("cliente", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Centro de Receita</Label>
                <Select value={formData.centroReceita} onValueChange={(v) => setFieldValue("centroReceita", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o centro de receita" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {centrosReceita.map(cr => (
                      <SelectItem key={cr.id} value={String(cr.id)}>
                        {cr.centro_id ?? `Centro ${cr.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plano de Contas</Label>
                <Select value={formData.planoContas} onValueChange={(v) => setFieldValue("planoContas", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o plano de contas" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {planoContasList.map(pc => (
                      <SelectItem key={pc.id} value={String(pc.id)}>
                        {pc.id_plano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ValidatedInput label="Documento" required value={formData.documento}
                onChange={(e) => setFieldValue("documento", e.target.value)} onBlur={() => setFieldTouched("documento")}
                error={getFieldError("documento")} touched={touched.documento} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput label="Valor do Título" required value={formData.valor}
                onChange={(e) => setFieldValue("valor", e.target.value)} onBlur={() => setFieldTouched("valor")}
                error={getFieldError("valor")} touched={touched.valor} />
              <ValidatedInput label="Multa" type="number" value={formData.multa}
                onChange={(e) => setFieldValue("multa", e.target.value)} onBlur={() => setFieldTouched("multa")}
                error={getFieldError("multa")} touched={touched.multa} />
              <ValidatedInput label="Encargos" type="number" value={formData.encargos}
                onChange={(e) => setFieldValue("encargos", e.target.value)} onBlur={() => setFieldTouched("encargos")}
                error={getFieldError("encargos")} touched={touched.encargos} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput label="Juros" type="number" value={formData.juros}
                onChange={(e) => setFieldValue("juros", e.target.value)} onBlur={() => setFieldTouched("juros")}
                error={getFieldError("juros")} touched={touched.juros} />
              <ValidatedInput label="Desconto" type="number" value={formData.desconto}
                onChange={(e) => setFieldValue("desconto", e.target.value)} onBlur={() => setFieldTouched("desconto")}
                error={getFieldError("desconto")} touched={touched.desconto} />
              <ValidatedInput label="Valor Total" value={formData.valorTotal}
                onChange={(e) => setFieldValue("valorTotal", e.target.value)} onBlur={() => setFieldTouched("valorTotal")}
                error={getFieldError("valorTotal")} touched={touched.valorTotal} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Data de Faturamento" required type="date" value={formData.dataFaturamento}
                onChange={(e) => setFieldValue("dataFaturamento", e.target.value)} onBlur={() => setFieldTouched("dataFaturamento")}
                error={getFieldError("dataFaturamento")} touched={touched.dataFaturamento} />
              <ValidatedInput label="Data de Vencimento" required type="date" value={formData.dataVencimento}
                onChange={(e) => setFieldValue("dataVencimento", e.target.value)} onBlur={() => setFieldTouched("dataVencimento")}
                error={getFieldError("dataVencimento")} touched={touched.dataVencimento} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Documento PDF</Label>
                <Input type="file" accept=".pdf" className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
              </div>
              <ValidatedInput label="Número de Parcelas" type="number" value={formData.parcelas}
                onChange={(e) => setFieldValue("parcelas", e.target.value)} onBlur={() => setFieldTouched("parcelas")}
                error={getFieldError("parcelas")} touched={touched.parcelas} />
            </div>

            <ValidatedTextarea label="Descrição" value={formData.descricao} onChange={(e) => setFieldValue("descricao", e.target.value)}
              onBlur={() => setFieldTouched("descricao")} error={getFieldError("descricao")} touched={touched.descricao} />

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/financeiro/contas-receber")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
