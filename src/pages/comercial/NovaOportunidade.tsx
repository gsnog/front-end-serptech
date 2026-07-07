import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { TrendingUp } from "lucide-react";
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { fetchContas, etapasFunil, fetchLeads } from "@/services/comercial";
import { useQuery } from "@tanstack/react-query";

const validationFields = [
  { name: "titulo", label: "Título", required: true, minLength: 2 },
  { name: "contaId", label: "Conta", required: true },
  { name: "valorEstimado", label: "Valor Estimado", required: true },
  { name: "dataPrevisao", label: "Data Previsão", required: true },
  { name: "etapa", label: "Etapa", required: true },
  { name: "origem", label: "Origem (Lead)", required: false },
];

export default function NovaOportunidade() {
  const navigate = useNavigate();
  const { handleSave, isSaving } = useSaveWithDelay();

  const { data: contas = [] } = useQuery({ queryKey: ['crm_contas'], queryFn: fetchContas });
  const { data: leads = [] } = useQuery({ queryKey: ['crm_leads'], queryFn: fetchLeads });

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { titulo: "", contaId: "", valorEstimado: "", dataPrevisao: "", etapa: "", origem: "", concorrente: "" },
    validationFields
  );

  const [etapaOptions, setEtapaOptions] = useState(
    etapasFunil.map(e => ({ value: e.id, label: `${e.nome} (${e.probabilidade}%)` }))
  );

  const handleSalvar = async () => {
    if (validateAll()) {
      await handleSave("/comercial/oportunidades", "Oportunidade salva com sucesso!");
    }
  };

  return (
    <SimpleFormWizard title="Nova Oportunidade">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Nova Oportunidade</h2>
                <p className="text-sm text-muted-foreground">Crie uma nova oportunidade de negócio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Título" required value={formData.titulo} onChange={(e) => setFieldValue("titulo", e.target.value)}
                onBlur={() => setFieldTouched("titulo")} error={getFieldError("titulo")} touched={touched.titulo} />
              <ValidatedSelect label="Conta" required value={formData.contaId} onChange={(v) => setFieldValue("contaId", v)}
                onBlur={() => setFieldTouched("contaId")} error={getFieldError("contaId")} touched={touched.contaId}
                options={contas.map((c: any) => ({ value: String(c.id), label: c.nome_fantasia }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Valor Estimado" required type="number" placeholder="0,00" value={formData.valorEstimado}
                onChange={(e) => setFieldValue("valorEstimado", e.target.value)} onBlur={() => setFieldTouched("valorEstimado")}
                error={getFieldError("valorEstimado")} touched={touched.valorEstimado} />
              <ValidatedInput label="Data Previsão" required type="date" value={formData.dataPrevisao}
                onChange={(e) => setFieldValue("dataPrevisao", e.target.value)} onBlur={() => setFieldTouched("dataPrevisao")}
                error={getFieldError("dataPrevisao")} touched={touched.dataPrevisao} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd label="Etapa" required value={formData.etapa} onChange={(v) => setFieldValue("etapa", v)}
                options={etapaOptions} onAddNew={(item) => setEtapaOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
              <ValidatedSelect label="Origem (Lead)" value={formData.origem} onChange={(v) => setFieldValue("origem", v)}
                onBlur={() => setFieldTouched("origem")} error={getFieldError("origem")} touched={touched.origem}
                options={leads.map((l: any) => ({ value: String(l.id), label: `${l.nome} - ${l.empresa}` }))} />
            </div>

            <ValidatedInput label="Concorrente" value={formData.concorrente} onChange={(e) => setFieldValue("concorrente", e.target.value)}
              onBlur={() => setFieldTouched("concorrente")} error={getFieldError("concorrente")} touched={touched.concorrente}
              placeholder="Nome do concorrente (se houver)" />

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/comercial/oportunidades")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
