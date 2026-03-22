import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { Package, CheckCircle } from "lucide-react";
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchFornecedores, type Fornecedor } from "@/services/estoque";
import api from "@/lib/api";

const validationFields = [
  { name: "nome", label: "Nome", required: true, minLength: 2 },
  { name: "data", label: "Data", required: true },
];

const NovoItem = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { handleSave, isSaving } = useSaveWithDelay();
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { nome: "", data: "", nomenclatura: "", apresentacao: "", setor: "", frequenciaCompra: "", frequenciaSaida: "", descricao: "" },
    validationFields
  );

  const [selectedFornecedores, setSelectedFornecedores] = useState<number[]>([]);

  const { data: fornecedoresResponse } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => fetchFornecedores(),
  });
  const fornecedoresData: Fornecedor[] = Array.isArray(fornecedoresResponse)
    ? fornecedoresResponse
    : (fornecedoresResponse?.results ?? []);

  const [nomenclaturaOptions, setNomenclaturaOptions] = useState([
    { value: "nom1", label: "Nomenclatura 1" }, { value: "nom2", label: "Nomenclatura 2" }
  ]);

  const [apresentacaoOptions, setApresentacaoOptions] = useState([
    { value: "caixa", label: "Caixa" }, { value: "unidade", label: "Unidade" }, { value: "pacote", label: "Pacote" }, { value: "litro", label: "Litro" }, { value: "kg", label: "Kg" }
  ]);

  const setorOptions = [
    { value: "setor1", label: "Setor 1" }, { value: "setor2", label: "Setor 2" }
  ];

  const toggleFornecedor = (id: number) => {
    setSelectedFornecedores(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Countdown effect
  useEffect(() => {
    if (!showCountdown) return;
    if (countdown <= 0) {
      const redirectTo = returnTo || "/cadastro/estoque/itens";
      navigate(redirectTo);
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [showCountdown, countdown, navigate, returnTo]);

  const handleSalvar = async () => {
    if (validateAll()) {
      try {
        await api.post('/api/estoque/itens/', {
          itens_do_estoque: formData.nome,
          data: formData.data,
          fornecedores: selectedFornecedores,
          descricao: formData.descricao,
          frequencia_compra: formData.frequenciaCompra,
          frequencia_de_saida: formData.frequenciaSaida,
        });
        toast({ title: "Item cadastrado com sucesso!", description: `"${formData.nome}" foi adicionado ao sistema.` });
        if (returnTo) {
          setShowCountdown(true);
        } else {
          navigate("/cadastro/estoque/itens");
        }
      } catch {
        toast({ title: "Erro ao salvar", description: "Não foi possível cadastrar o item.", variant: "destructive" });
      }
    }
  };

  if (showCountdown) {
    return (
      <SimpleFormWizard title="Novo Item">
        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Item cadastrado com sucesso!</h2>
                <p className="text-sm text-muted-foreground">
                  O item <strong>"{formData.nome}"</strong> foi adicionado ao sistema.
                </p>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado em <span className="font-bold text-primary text-lg">{countdown}</span> segundo{countdown !== 1 ? "s" : ""}...
                </p>
              </div>
              <button
                onClick={() => navigate(returnTo || "/cadastro/estoque/itens")}
                className="text-sm text-primary underline hover:text-primary/80"
              >
                Voltar agora
              </button>
            </div>
          </CardContent>
        </Card>
      </SimpleFormWizard>
    );
  }

  return (
    <SimpleFormWizard title="Novo Item">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Item</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Nome" required value={formData.nome} onChange={(e) => setFieldValue("nome", e.target.value)}
                onBlur={() => setFieldTouched("nome")} error={getFieldError("nome")} touched={touched.nome} />
              <ValidatedInput label="Data" required type="date" value={formData.data} onChange={(e) => setFieldValue("data", e.target.value)}
                onBlur={() => setFieldTouched("data")} error={getFieldError("data")} touched={touched.data} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd label="Nomenclaturas" value={formData.nomenclatura} onChange={(v) => setFieldValue("nomenclatura", v)}
                options={nomenclaturaOptions} onAddNew={(item) => setNomenclaturaOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fornecedores</Label>
                <div className="border border-input rounded-md p-2 max-h-36 overflow-y-auto space-y-1 bg-background">
                  {fornecedoresData.length === 0 && (
                    <p className="text-sm text-muted-foreground px-1 py-1">Nenhum fornecedor disponível</p>
                  )}
                  {fornecedoresData.map(forn => (
                    <label key={forn.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedFornecedores.includes(forn.id)}
                        onChange={() => toggleFornecedor(forn.id)}
                      />
                      {forn.nome}
                    </label>
                  ))}
                </div>
                {selectedFornecedores.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFornecedores.map(id => {
                      const forn = fornecedoresData.find(f => f.id === id);
                      return forn ? <Badge key={id} variant="secondary" className="text-xs">{forn.nome}</Badge> : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd label="Forma de Apresentação" value={formData.apresentacao} onChange={(v) => setFieldValue("apresentacao", v)}
                options={apresentacaoOptions} onAddNew={(item) => setApresentacaoOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Setor</Label>
                <Select value={formData.setor} onValueChange={(v) => setFieldValue("setor", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {setorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedSelect label="Frequência de Compra" required value={formData.frequenciaCompra} onChange={(v) => setFieldValue("frequenciaCompra", v)}
                onBlur={() => setFieldTouched("frequenciaCompra")} error={getFieldError("frequenciaCompra")} touched={touched.frequenciaCompra}
                options={[
                  { value: "diario", label: "Diário" }, { value: "semanal", label: "Semanal" }, { value: "mensal", label: "Mensal" }
                ]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedSelect label="Frequência de Saída" value={formData.frequenciaSaida} onChange={(v) => setFieldValue("frequenciaSaida", v)}
                onBlur={() => setFieldTouched("frequenciaSaida")} error={getFieldError("frequenciaSaida")} touched={touched.frequenciaSaida}
                options={[
                  { value: "diario", label: "Diário" }, { value: "semanal", label: "Semanal" }, { value: "mensal", label: "Mensal" }
                ]} />
            </div>

            <ValidatedTextarea label="Descrição" value={formData.descricao} onChange={(e) => setFieldValue("descricao", e.target.value)}
              onBlur={() => setFieldTouched("descricao")} error={getFieldError("descricao")} touched={touched.descricao} />

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate(returnTo || "/cadastro/estoque/itens")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoItem;
