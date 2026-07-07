import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { UserPlus } from "lucide-react";
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { origensLead } from "@/services/comercial";

const validationFields = [
  { name: "nome", label: "Nome", required: true, minLength: 2 },
  { name: "empresa", label: "Empresa", required: true },
  { name: "email", label: "Email", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: "Email inválido" },
  { name: "telefone", label: "Telefone", required: false },
  { name: "origem", label: "Origem", required: true },
  { name: "status", label: "Status", required: true },
  { name: "notas", label: "Notas", required: false },
];

export default function NovoLead() {
  const navigate = useNavigate();
  const { handleSave, isSaving } = useSaveWithDelay();

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { nome: "", empresa: "", email: "", telefone: "", origem: "", status: "", notas: "" },
    validationFields
  );

  const [origensOptions, setOrigensOptions] = useState(origensLead.map(o => ({ value: o, label: o })));
  const [statusOptions, setStatusOptions] = useState([
    { value: "novo", label: "Novo" }, { value: "quente", label: "Quente" }, { value: "morno", label: "Morno" },
    { value: "frio", label: "Frio" }, { value: "convertido", label: "Convertido" }, { value: "perdido", label: "Perdido" }
  ]);

  const handleSalvar = async () => {
    if (validateAll()) {
      await handleSave("/comercial/leads", "Lead salvo com sucesso!");
    }
  };

  return (
    <SimpleFormWizard title="Novo Lead">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Lead</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Nome" required value={formData.nome} onChange={(e) => setFieldValue("nome", e.target.value)}
                onBlur={() => setFieldTouched("nome")} error={getFieldError("nome")} touched={touched.nome} />
              <ValidatedInput label="Empresa" required value={formData.empresa} onChange={(e) => setFieldValue("empresa", e.target.value)}
                onBlur={() => setFieldTouched("empresa")} error={getFieldError("empresa")} touched={touched.empresa} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Email" type="email" required placeholder="lead@exemplo.com" value={formData.email}
                onChange={(e) => setFieldValue("email", e.target.value)} onBlur={() => setFieldTouched("email")}
                error={getFieldError("email")} touched={touched.email} />
              <ValidatedInput label="Telefone" placeholder="(99) 99999-9999" value={formData.telefone}
                onChange={(e) => setFieldValue("telefone", e.target.value)} onBlur={() => setFieldTouched("telefone")}
                error={getFieldError("telefone")} touched={touched.telefone} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd label="Origem" required value={formData.origem} onChange={(v) => setFieldValue("origem", v)}
                options={origensOptions} onAddNew={(item) => setOrigensOptions(prev => [...prev, { value: item, label: item }])} />
              <DropdownWithAdd label="Status" required value={formData.status} onChange={(v) => setFieldValue("status", v)}
                options={statusOptions} onAddNew={(item) => setStatusOptions(prev => [...prev, { value: item.toLowerCase(), label: item }])} />
            </div>

            <ValidatedTextarea label="Notas" value={formData.notas} onChange={(e) => setFieldValue("notas", e.target.value)}
              onBlur={() => setFieldTouched("notas")} error={getFieldError("notas")} touched={touched.notas} />

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/comercial/leads")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
