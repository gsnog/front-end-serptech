import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { FileText } from "lucide-react";
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { fetchContas, fetchOportunidades } from "@/services/comercial";
import { useQuery } from "@tanstack/react-query";

const validationFields = [
  { name: "contaId", label: "Conta", required: true },
  { name: "oportunidadeId", label: "Oportunidade", required: true },
  { name: "valor", label: "Valor", required: true },
  { name: "validade", label: "Validade", required: true },
  { name: "status", label: "Status", required: true },
  { name: "prazoEntrega", label: "Prazo de Entrega", required: false },
  { name: "formaPagamento", label: "Forma de Pagamento", required: false },
];

export default function NovaProposta() {
  const navigate = useNavigate();
  const { handleSave, isSaving } = useSaveWithDelay();

  const { data: contas = [] } = useQuery({ queryKey: ['crm_contas'], queryFn: fetchContas });
  const { data: oportunidades = [] } = useQuery({ queryKey: ['crm_oportunidades'], queryFn: fetchOportunidades });

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { contaId: "", oportunidadeId: "", valor: "", validade: "", status: "", prazoEntrega: "", formaPagamento: "", observacoes: "" },
    validationFields
  );

  const [statusOptions, setStatusOptions] = useState([
    { value: "rascunho", label: "Rascunho" }, { value: "enviada", label: "Enviada" },
    { value: "aprovada", label: "Aprovada" }, { value: "recusada", label: "Recusada" }, { value: "expirada", label: "Expirada" }
  ]);

  const handleSalvar = async () => {
    if (validateAll()) {
      await handleSave("/comercial/propostas", "Proposta salva com sucesso!");
    }
  };

  return (
    <SimpleFormWizard title="Nova Proposta">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Nova Proposta</h2>
                <p className="text-sm text-muted-foreground">Crie uma nova proposta comercial</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedSelect label="Conta" required value={formData.contaId} onChange={(v) => setFieldValue("contaId", v)}
                onBlur={() => setFieldTouched("contaId")} error={getFieldError("contaId")} touched={touched.contaId}
                options={contas.map((c: any) => ({ value: String(c.id), label: c.nome_fantasia }))} />
              <ValidatedSelect label="Oportunidade" required value={formData.oportunidadeId} onChange={(v) => setFieldValue("oportunidadeId", v)}
                onBlur={() => setFieldTouched("oportunidadeId")} error={getFieldError("oportunidadeId")} touched={touched.oportunidadeId}
                options={oportunidades.map((o: any) => ({ value: String(o.id), label: o.titulo }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput label="Valor" required type="number" placeholder="0,00" value={formData.valor}
                onChange={(e) => setFieldValue("valor", e.target.value)} onBlur={() => setFieldTouched("valor")}
                error={getFieldError("valor")} touched={touched.valor} />
              <ValidatedInput label="Validade" required type="date" value={formData.validade}
                onChange={(e) => setFieldValue("validade", e.target.value)} onBlur={() => setFieldTouched("validade")}
                error={getFieldError("validade")} touched={touched.validade} />
              <DropdownWithAdd label="Status" required value={formData.status} onChange={(v) => setFieldValue("status", v)}
                options={statusOptions} onAddNew={(item) => setStatusOptions(prev => [...prev, { value: item.toLowerCase(), label: item }])} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Prazo de Entrega" placeholder="Ex: 30 dias" value={formData.prazoEntrega}
                onChange={(e) => setFieldValue("prazoEntrega", e.target.value)} onBlur={() => setFieldTouched("prazoEntrega")}
                error={getFieldError("prazoEntrega")} touched={touched.prazoEntrega} />
              <ValidatedInput label="Forma de Pagamento" placeholder="Ex: 30/60/90" value={formData.formaPagamento}
                onChange={(e) => setFieldValue("formaPagamento", e.target.value)} onBlur={() => setFieldTouched("formaPagamento")}
                error={getFieldError("formaPagamento")} touched={touched.formaPagamento} />
            </div>

            <ValidatedTextarea label="Observações" value={formData.observacoes} onChange={(e) => setFieldValue("observacoes", e.target.value)}
              onBlur={() => setFieldTouched("observacoes")} error={getFieldError("observacoes")} touched={touched.observacoes} />

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/comercial/propostas")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
