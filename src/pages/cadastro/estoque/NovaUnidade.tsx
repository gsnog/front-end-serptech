import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Building2, Loader2 } from "lucide-react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { estadosBrasil } from "@/data/brasil-localidades";
import { toast } from "@/hooks/use-toast";
import { unidadesQueryKey } from "@/services/estoque";
import api from "@/lib/api";

interface ViaCepResponse {
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const validationFields = [
  { name: "nome", label: "Nome da Unidade", required: true, minLength: 2, maxLength: 200 },
  { name: "cep", label: "CEP", required: false },
  { name: "endereco", label: "Endereço", required: false },
  { name: "bairro", label: "Bairro", required: false },
  { name: "cidade", label: "Cidade", required: false },
  { name: "estado", label: "Estado", required: false },
  { name: "responsavel", label: "Responsável", required: false },
];

const NovaUnidade = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } =
    useFormValidation(
      { nome: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", responsavel: "" },
      validationFields
    );

  const { data: funcionariosRaw = [] } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => api.get('/api/funcionarios/').then(r => Array.isArray(r.data) ? r.data : r.data?.results ?? []),
  });
  const responsaveisOptions = (funcionariosRaw as any[]).map((f: any) => ({
    value: String(f.id),
    label: f.nome,
  }));

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/estoque/unidades/', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unidadesQueryKey });
      toast({ title: "Unidade salva com sucesso!" });
      navigate("/cadastro/estoque/unidades");
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
    },
  });

  const fetchAddressByCep = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepResponse = await response.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique o CEP digitado.", variant: "destructive" });
        return;
      }
      setFieldValue("endereco", data.logradouro || "");
      setFieldValue("bairro", data.bairro || "");
      setFieldValue("cidade", data.localidade || "");
      setFieldValue("estado", data.uf || "");
      if (data.complemento) setFieldValue("complemento", data.complemento);
      toast({ title: "Endereço encontrado!", description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}` });
    } catch {
      toast({ title: "Erro ao buscar CEP", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoadingCep(false);
    }
  }, [setFieldValue]);

  const handleSalvar = () => {
    if (!validateAll()) return;
    mutation.mutate({
      unidade: formData.nome,
      cep: formData.cep || null,
      rua: formData.endereco || null,
      numero: formData.numero || null,
      complemento: formData.complemento || null,
      bairro: formData.bairro || null,
      cidade: formData.cidade || null,
      estado: formData.estado || null,
      responsavel: formData.responsavel ? Number(formData.responsavel) : null,
    });
  };

  return (
    <SimpleFormWizard title="Nova Unidade">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Unidade</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput
                label="Nome da Unidade"
                required
                value={formData.nome}
                onChange={(e) => setFieldValue("nome", e.target.value)}
                onBlur={() => setFieldTouched("nome")}
                error={getFieldError("nome")}
                touched={touched.nome}
              />
              <ValidatedSelect
                label="Responsável"
                value={formData.responsavel}
                onValueChange={(v) => setFieldValue("responsavel", v)}
                placeholder="Selecionar responsável (opcional)"
                options={responsaveisOptions}
                searchable
                searchPlaceholder="Buscar pessoa..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CEP</Label>
                <div className="relative">
                  <Input
                    placeholder="00000-000"
                    className="form-input"
                    value={formData.cep}
                    onChange={(e) => setFieldValue("cep", e.target.value)}
                    onBlur={(e) => { setFieldTouched("cep"); fetchAddressByCep(e.target.value); }}
                  />
                  {isLoadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Endereço</Label>
                <Input
                  placeholder="Rua, Avenida, etc."
                  className="form-input"
                  value={formData.endereco}
                  onChange={(e) => setFieldValue("endereco", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número</Label>
                <Input
                  placeholder="Nº"
                  className="form-input"
                  value={formData.numero}
                  onChange={(e) => setFieldValue("numero", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">Complemento</Label>
                <Input
                  placeholder="Apto, Bloco, etc."
                  className="form-input"
                  value={formData.complemento}
                  onChange={(e) => setFieldValue("complemento", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bairro</Label>
                <Input
                  placeholder="Bairro"
                  className="form-input"
                  value={formData.bairro}
                  onChange={(e) => setFieldValue("bairro", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cidade</Label>
                <Input
                  placeholder="Cidade"
                  className="form-input"
                  value={formData.cidade}
                  onChange={(e) => setFieldValue("cidade", e.target.value)}
                />
              </div>
              <ValidatedSelect
                label="Estado"
                value={formData.estado}
                onValueChange={(v) => setFieldValue("estado", v)}
                placeholder="UF"
                options={estadosBrasil.map(uf => ({ value: uf.sigla, label: `${uf.sigla} - ${uf.nome}` }))}
              />
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/estoque/unidades")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaUnidade;
