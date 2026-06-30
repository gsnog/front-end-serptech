import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Stethoscope, UserPlus, UserCheck } from "lucide-react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { toast } from "@/hooks/use-toast";
import {
  createMedico,
  createPessoa,
  deletePessoa,
  fetchEspecialidades,
  fetchFuncionarios,
  medicosQueryKey,
} from "@/services/pessoas";
import { cn } from "@/lib/utils";

// ─── Formatadores ─────────────────────────────────────────────────────────────

/** (XX) XXXXX-XXXX para celular, (XX) XXXX-XXXX para fixo */
function formatTelefone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** CRM/UF XXXXXX — ex: CRM/SP 123456 */
function formatCrm(value: string): string {
  const upper = value.toUpperCase().replace(/^CRM\/?/, '').replace(/[^A-Z0-9]/g, '')
  const letters = upper.replace(/[^A-Z]/g, '').slice(0, 2)
  const digits  = upper.replace(/[^0-9]/g, '').slice(0, 6)
  if (!letters && !digits) return ''
  if (!digits) return `CRM/${letters}`
  return `CRM/${letters} ${digits}`
}

// ─── Tipo selector ────────────────────────────────────────────────────────────

type Tipo = "A" | "B";

const TIPOS: { value: Tipo; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "A",
    label: "Médico externo",
    description: "Não é funcionário — cria novo usuário vinculado apenas como médico",
    icon: UserPlus,
  },
  {
    value: "B",
    label: "Funcionário existente",
    description: "Já é funcionário cadastrado no sistema — apenas vincula o CRM",
    icon: UserCheck,
  },
];

// ─── Shared médico fields ─────────────────────────────────────────────────────

const medicoValidation = [
  { name: "crm", label: "CRM", required: true, minLength: 3, maxLength: 20 },
  { name: "telefone", label: "Telefone", required: true, minLength: 8, maxLength: 20 },
];

// ─── Tipo A — Médico puro (novo usuário) ──────────────────────────────────────

function TipoAForm({ onSave, onCancel, isSaving }: { onSave: (userId: number) => void; onCancel: () => void; isSaving: boolean }) {
  const { data: especialidades = [] } = useQuery({ queryKey: ["especialidades"], queryFn: fetchEspecialidades });

  const [especialidadeId, setEspecialidadeId] = useState("");
  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } =
    useFormValidation(
      { first_name: "", last_name: "", email: "", crm: "", telefone: "" },
      [
        { name: "first_name", label: "Nome", required: true },
        { name: "last_name", label: "Sobrenome", required: true },
        { name: "email", label: "E-mail", required: true },
        ...medicoValidation,
      ]
    );

  const createPessoaMut = useMutation({ mutationFn: createPessoa });
  const createMedicoMut = useMutation({ mutationFn: (data: any) => createMedico(data) });

  const handleSalvar = async () => {
    if (!validateAll()) return;
    let pessoaCriadaId: number | null = null;
    try {
      const pessoa = await createPessoaMut.mutateAsync({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      });
      pessoaCriadaId = pessoa.id;
      await createMedicoMut.mutateAsync({
        user: pessoa.id,
        crm: formData.crm.trim(),
        telefone: formData.telefone.trim(),
        especialidade_ids: especialidadeId ? [Number(especialidadeId)] : [],
      });
      onSave(pessoa.id);
    } catch (error: any) {
      // Desfaz a criação do usuário se o médico falhou
      if (pessoaCriadaId) {
        await deletePessoa(pessoaCriadaId).catch(() => {});
        pessoaCriadaId = null;
      }
      const data = error.response?.data;
      const msg = data ? Object.values(data).flat().join(" | ") : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
    }
  };

  const especialidadesOptions = especialidades.map(e => ({ value: String(e.id), label: e.nome }));
  const isPending = createPessoaMut.isPending || createMedicoMut.isPending || isSaving;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ValidatedInput
          label="Nome"
          required
          placeholder="João"
          value={formData.first_name}
          onChange={(e) => setFieldValue("first_name", e.target.value)}
          onBlur={() => setFieldTouched("first_name")}
          error={getFieldError("first_name")}
          touched={touched.first_name}
        />
        <ValidatedInput
          label="Sobrenome"
          required
          placeholder="Silva"
          value={formData.last_name}
          onChange={(e) => setFieldValue("last_name", e.target.value)}
          onBlur={() => setFieldTouched("last_name")}
          error={getFieldError("last_name")}
          touched={touched.last_name}
        />
        <ValidatedInput
          label="E-mail"
          required
          placeholder="medico@exemplo.com"
          value={formData.email}
          onChange={(e) => setFieldValue("email", e.target.value)}
          onBlur={() => setFieldTouched("email")}
          error={getFieldError("email")}
          touched={touched.email}
        />
        <ValidatedInput
          label="CRM"
          required
          placeholder="CRM/SP 123456"
          value={formData.crm}
          onChange={(e) => setFieldValue("crm", formatCrm(e.target.value))}
          onBlur={() => setFieldTouched("crm")}
          error={getFieldError("crm")}
          touched={touched.crm}
        />
        <ValidatedInput
          label="Telefone"
          required
          placeholder="(11) 99999-9999"
          value={formData.telefone}
          onChange={(e) => setFieldValue("telefone", formatTelefone(e.target.value))}
          onBlur={() => setFieldTouched("telefone")}
          error={getFieldError("telefone")}
          touched={touched.telefone}
        />
        <ValidatedSelect
          label="Especialidade"
          value={especialidadeId}
          onValueChange={setEspecialidadeId}
          placeholder="Selecionar especialidade"
          options={especialidadesOptions}
        />
      </div>
      <FormActionBar onSave={handleSalvar} onCancel={onCancel} isSaving={isPending} />
    </div>
  );
}

// ─── Tipo B — Vincular funcionário existente ──────────────────────────────────

function TipoBForm({ onSave, onCancel, isSaving }: { onSave: (userId: number) => void; onCancel: () => void; isSaving: boolean }) {
  const { data: funcionarios = [] } = useQuery({ queryKey: ["funcionarios-list"], queryFn: fetchFuncionarios });
  const { data: especialidades = [] } = useQuery({ queryKey: ["especialidades"], queryFn: fetchEspecialidades });

  const [funcionarioId, setFuncionarioId] = useState("");
  const [especialidadeId, setEspecialidadeId] = useState("");
  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } =
    useFormValidation({ crm: "", telefone: "" }, medicoValidation);

  const createMedicoMut = useMutation({ mutationFn: (data: any) => createMedico(data) });

  const handleSalvar = async () => {
    if (!funcionarioId) {
      toast({ title: "Selecione um funcionário", variant: "destructive" });
      return;
    }
    if (!validateAll()) return;

    const func = funcionarios.find(f => String(f.id) === funcionarioId);
    if (!func) return;

    try {
      await createMedicoMut.mutateAsync({
        user: func.django_user_id,
        crm: formData.crm.trim(),
        telefone: formData.telefone.trim(),
        especialidade_ids: especialidadeId ? [Number(especialidadeId)] : [],
      });
      onSave(func.django_user_id);
    } catch (error: any) {
      const data = error.response?.data;
      const msg = data ? Object.values(data).flat().join(" | ") : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
    }
  };

  const funcionariosOptions = funcionarios.map(f => ({ value: String(f.id), label: f.nome }));
  const especialidadesOptions = especialidades.map(e => ({ value: String(e.id), label: e.nome }));
  const isPending = createMedicoMut.isPending || isSaving;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ValidatedSelect
          label="Funcionário"
          required
          value={funcionarioId}
          onValueChange={setFuncionarioId}
          placeholder="Selecionar funcionário"
          options={funcionariosOptions}
        />
        <ValidatedInput
          label="CRM"
          required
          placeholder="CRM/SP 123456"
          value={formData.crm}
          onChange={(e) => setFieldValue("crm", formatCrm(e.target.value))}
          onBlur={() => setFieldTouched("crm")}
          error={getFieldError("crm")}
          touched={touched.crm}
        />
        <ValidatedInput
          label="Telefone"
          required
          placeholder="(11) 99999-9999"
          value={formData.telefone}
          onChange={(e) => setFieldValue("telefone", formatTelefone(e.target.value))}
          onBlur={() => setFieldTouched("telefone")}
          error={getFieldError("telefone")}
          touched={touched.telefone}
        />
        <ValidatedSelect
          label="Especialidade"
          value={especialidadeId}
          onValueChange={setEspecialidadeId}
          placeholder="Selecionar especialidade"
          options={especialidadesOptions}
        />
      </div>
      <FormActionBar onSave={handleSalvar} onCancel={onCancel} isSaving={isPending} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const NovoMedico = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<Tipo>("A");


  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: medicosQueryKey });
    toast({ title: "Médico cadastrado com sucesso!" });
    navigate("/gestao-pessoas/medicos");
  };

  return (
    <SimpleFormWizard title="Novo Médico">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Novo Médico</h2>
                <p className="text-sm text-muted-foreground">Selecione como este médico será vinculado ao sistema</p>
              </div>
            </div>

            {/* Tipo selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TIPOS.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTipo(value)}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                    tipo === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", tipo === value ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-semibold", tipo === value ? "text-primary" : "text-foreground")}>
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{description}</p>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Form by tipo */}
            {tipo === "A" && <TipoAForm onSave={handleSave} onCancel={() => navigate("/gestao-pessoas/medicos")} isSaving={false} />}
            {tipo === "B" && <TipoBForm onSave={handleSave} onCancel={() => navigate("/gestao-pessoas/medicos")} isSaving={false} />}
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoMedico;
