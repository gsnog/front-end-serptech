import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { User } from "lucide-react";
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { fetchContas } from "@/services/comercial";
import { useQuery } from "@tanstack/react-query";

const validationFields = [
  { name: "nome", label: "Nome", required: true, minLength: 2 },
  { name: "cargo", label: "Cargo", required: true },
  { name: "email", label: "Email", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMessage: "Email inválido" },
  { name: "telefone", label: "Telefone", required: false },
  { name: "contaId", label: "Conta", required: true },
  { name: "papel", label: "Papel", required: true },
];

export default function NovoContato() {
  const navigate = useNavigate();
  const { handleSave, isSaving } = useSaveWithDelay();
  const { data: contas = [] } = useQuery({ queryKey: ['crm_contas'], queryFn: fetchContas });

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { nome: "", cargo: "", email: "", telefone: "", contaId: "", papel: "", tags: "" },
    validationFields
  );

  const [papelOptions, setPapelOptions] = useState([
    { value: "decisor", label: "Decisor" }, { value: "influenciador", label: "Influenciador" },
    { value: "usuario", label: "Usuário" }, { value: "compras", label: "Compras" }
  ]);
  const [tagsOptions, setTagsOptions] = useState([
    { value: "executivo", label: "Executivo" }, { value: "tecnico", label: "Técnico" },
    { value: "compras", label: "Compras" }, { value: "financeiro", label: "Financeiro" }
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSalvar = async () => {
    if (validateAll()) {
      await handleSave("/comercial/contatos", "Contato salvo com sucesso!");
    }
  };

  return (
    <SimpleFormWizard title="Novo Contato">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Contato</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Nome" required value={formData.nome} onChange={(e) => setFieldValue("nome", e.target.value)}
                onBlur={() => setFieldTouched("nome")} error={getFieldError("nome")} touched={touched.nome} />
              <ValidatedInput label="Cargo" required value={formData.cargo} onChange={(e) => setFieldValue("cargo", e.target.value)}
                onBlur={() => setFieldTouched("cargo")} error={getFieldError("cargo")} touched={touched.cargo} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Email" type="email" required placeholder="contato@exemplo.com" value={formData.email}
                onChange={(e) => setFieldValue("email", e.target.value)} onBlur={() => setFieldTouched("email")}
                error={getFieldError("email")} touched={touched.email} />
              <ValidatedInput label="Telefone" placeholder="(99) 99999-9999" value={formData.telefone}
                onChange={(e) => setFieldValue("telefone", e.target.value)} onBlur={() => setFieldTouched("telefone")}
                error={getFieldError("telefone")} touched={touched.telefone} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedSelect label="Conta" required value={formData.contaId} onChange={(v) => setFieldValue("contaId", v)}
                onBlur={() => setFieldTouched("contaId")} error={getFieldError("contaId")} touched={touched.contaId}
                options={contas.map((c: any) => ({ value: String(c.id), label: c.nome_fantasia }))} />
              <DropdownWithAdd label="Papel" required value={formData.papel} onChange={(v) => setFieldValue("papel", v)}
                options={papelOptions} onAddNew={(item) => setPapelOptions(prev => [...prev, { value: item.toLowerCase(), label: item }])} />
            </div>

            <DropdownWithAdd label="Tags" value={formData.tags} onChange={(v) => setFieldValue("tags", v)}
              options={tagsOptions} onAddNew={(item) => setTagsOptions(prev => [...prev, { value: item.toLowerCase(), label: item }])} />

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/comercial/contatos")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
