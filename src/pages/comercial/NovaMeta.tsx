import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { fetchMeuTime } from "@/services/pessoas";
import { useQuery } from "@tanstack/react-query";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { Target } from "lucide-react";
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";

// --- Mocks removidos ---




const validationFields = [
  { name: "vendedorId", label: "Vendedor", required: true },
  { name: "tipo", label: "Tipo de Meta", required: true },
  { name: "area", label: "Área", required: true },
  { name: "periodoInicio", label: "Período Início", required: true },
  { name: "periodoFim", label: "Período Fim", required: true },
];

export default function NovaMeta() {
  const navigate = useNavigate();
  const { handleSave, isSaving } = useSaveWithDelay();
  const { data: time = [] } = useQuery({ queryKey: ['meu_time'], queryFn: fetchMeuTime });

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { vendedorId: "", tipo: "", area: "", periodoInicio: "", periodoFim: "", valorMeta: "" },
    validationFields
  );

  const [tipoOptions, setTipoOptions] = useState([
    { value: "receita", label: "Receita" },
    { value: "novos_clientes", label: "Novos Clientes" },
    { value: "margem", label: "Margem" },
    { value: "renovacoes", label: "Renovações" },
    { value: "reducao_custos", label: "Redução de Custos" },
    { value: "producao", label: "Produção" },
  ]);

  const handleSalvar = async () => {
    if (validateAll()) {
      await handleSave("/comercial/metas", "Meta criada com sucesso!");
    }
  };

  return (
    <SimpleFormWizard title="Criar Meta">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Criar Meta</h2>
                <p className="text-sm text-muted-foreground">Defina uma meta vinculada ao sistema</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedSelect label="Vendedor / Responsável" required value={formData.vendedorId} onChange={(v) => setFieldValue("vendedorId", v)}
                onBlur={() => setFieldTouched("vendedorId")} error={getFieldError("vendedorId")} touched={touched.vendedorId}
                options={time.map((p: any) => ({ value: String(p.id), label: p.nome }))} searchable searchPlaceholder="Buscar vendedor..." />
              <ValidatedSelect label="Área" required value={formData.area} onChange={(v) => setFieldValue("area", v)}
                onBlur={() => setFieldTouched("area")} error={getFieldError("area")} touched={touched.area}
                options={[
                  { value: "comercial", label: "Comercial" },
                  { value: "financeiro", label: "Financeiro" },
                  { value: "estoque", label: "Estoque" },
                  { value: "operacional", label: "Operacional" },
                  { value: "rh", label: "Gestão de Pessoas" },
                ]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd label="Tipo de Meta" required value={formData.tipo} onChange={(v) => setFieldValue("tipo", v)}
                options={tipoOptions} onAddNew={(item) => setTipoOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
              <ValidatedInput label="Valor da Meta" type="number" placeholder="0 (opcional)" value={formData.valorMeta}
                onChange={(e) => setFieldValue("valorMeta", e.target.value)} onBlur={() => setFieldTouched("valorMeta")}
                error={getFieldError("valorMeta")} touched={touched.valorMeta} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Período Início" required type="date" value={formData.periodoInicio}
                onChange={(e) => setFieldValue("periodoInicio", e.target.value)} onBlur={() => setFieldTouched("periodoInicio")}
                error={getFieldError("periodoInicio")} touched={touched.periodoInicio} />
              <ValidatedInput label="Período Fim" required type="date" value={formData.periodoFim}
                onChange={(e) => setFieldValue("periodoFim", e.target.value)} onBlur={() => setFieldTouched("periodoFim")}
                error={getFieldError("periodoFim")} touched={touched.periodoFim} />
            </div>

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/comercial/metas")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
