import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Package, CheckCircle, X } from "lucide-react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchFornecedores, fetchNomenclaturas, createNomenclatura, type Fornecedor, type Nomenclatura } from "@/services/estoque";
import api from "@/lib/api";

const FREQUENCIA_OPTIONS = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "irregular", label: "Irregular" },
];

const validationFields = [
  { name: "nome", label: "Nome", required: true, minLength: 2 },
  { name: "data", label: "Data", required: true },
  { name: "frequenciaCompra", label: "Frequência de Compra", required: true },
];

const NovoItem = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [isSaving, setIsSaving] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { nome: "", data: "", apresentacao: "", setor: "", frequenciaCompra: "", frequenciaSaida: "", descricao: "" },
    validationFields
  );

  const [selectedFornecedores, setSelectedFornecedores] = useState<number[]>([]);
  const [selectedNomenclaturas, setSelectedNomenclaturas] = useState<number[]>([]);
  const [newNomenclaturaInput, setNewNomenclaturaInput] = useState("");

  const { data: fornecedoresResponse } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: () => fetchFornecedores(),
  });
  const fornecedoresData: Fornecedor[] = Array.isArray(fornecedoresResponse)
    ? fornecedoresResponse
    : (fornecedoresResponse?.results ?? []);

  const { data: nomenclaturasData = [], refetch: refetchNomenclaturas } = useQuery({
    queryKey: ['nomenclaturas'],
    queryFn: fetchNomenclaturas,
  });

  const toggleFornecedor = (id: number) => {
    setSelectedFornecedores(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleNomenclatura = (id: number) => {
    setSelectedNomenclaturas(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const handleAddNomenclatura = async () => {
    const nome = newNomenclaturaInput.trim();
    if (!nome) return;
    try {
      const created = await createNomenclatura(nome);
      await refetchNomenclaturas();
      setSelectedNomenclaturas(prev => [...prev, created.id]);
      setNewNomenclaturaInput("");
      toast({ title: `Nomenclatura "${nome}" criada e selecionada.` });
    } catch {
      toast({ title: "Erro ao criar nomenclatura", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!showCountdown) return;
    if (countdown <= 0) {
      navigate(returnTo || "/cadastro/estoque/itens");
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [showCountdown, countdown, navigate, returnTo]);

  const handleSalvar = async () => {
    if (validateAll()) {
      setIsSaving(true);
      try {
        await api.post('/api/estoque/itens/', {
          itens_do_estoque: formData.nome,
          data: formData.data,
          fornecedores: selectedFornecedores,
          nomenclaturas: selectedNomenclaturas,
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
      } finally {
        setIsSaving(false);
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

            {/* Nomenclaturas — seleção múltipla com criação inline */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nomenclaturas</Label>
              <div className="border border-input rounded-md p-2 max-h-36 overflow-y-auto space-y-1 bg-background">
                {nomenclaturasData.length === 0 && (
                  <p className="text-sm text-muted-foreground px-1 py-1">Nenhuma nomenclatura disponível</p>
                )}
                {nomenclaturasData.map((n: Nomenclatura) => (
                  <label key={n.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedNomenclaturas.includes(n.id)}
                      onChange={() => toggleNomenclatura(n.id)}
                    />
                    {n.nome}
                  </label>
                ))}
              </div>
              {selectedNomenclaturas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedNomenclaturas.map(id => {
                    const n = nomenclaturasData.find((x: Nomenclatura) => x.id === id);
                    return n ? (
                      <Badge key={id} variant="secondary" className="text-xs gap-1">
                        {n.nome}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleNomenclatura(id)} />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  className="flex-1 border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nova nomenclatura..."
                  value={newNomenclaturaInput}
                  onChange={(e) => setNewNomenclaturaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNomenclatura(); } }}
                />
                <button
                  type="button"
                  onClick={handleAddNomenclatura}
                  className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Fornecedores */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Forma de Apresentação</Label>
                <Select value={formData.apresentacao} onValueChange={(v) => setFieldValue("apresentacao", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {["Caixa", "Unidade", "Pacote", "Litro", "Kg"].map(opt => (
                      <SelectItem key={opt} value={opt.toLowerCase()}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedSelect
                label="Frequência de Compra"
                required
                value={formData.frequenciaCompra}
                onChange={(v) => setFieldValue("frequenciaCompra", v)}
                onBlur={() => setFieldTouched("frequenciaCompra")}
                error={getFieldError("frequenciaCompra")}
                touched={touched.frequenciaCompra}
                options={FREQUENCIA_OPTIONS}
              />
              <ValidatedSelect
                label="Frequência de Saída"
                value={formData.frequenciaSaida}
                onChange={(v) => setFieldValue("frequenciaSaida", v)}
                onBlur={() => setFieldTouched("frequenciaSaida")}
                error={getFieldError("frequenciaSaida")}
                touched={touched.frequenciaSaida}
                options={FREQUENCIA_OPTIONS}
              />
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
