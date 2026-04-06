import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { FileText } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  createPlanoContas, planoContasQueryKey,
  fetchCategoriasFinanceiras, categoriasFinanceirasQueryKey,
  fetchClassificacoesFinanceiras, classificacoesFinanceirasQueryKey,
} from "@/services/financeiro";

const NovoPlanoContas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [idPlano, setIdPlano] = useState("");
  const [categoria, setCategoria] = useState("");
  const [classificacao, setClassificacao] = useState("");

  const { data: catRaw = [] } = useQuery({
    queryKey: [...categoriasFinanceirasQueryKey],
    queryFn: () => fetchCategoriasFinanceiras(),
  });
  const categorias = Array.isArray(catRaw) ? catRaw : (catRaw as any)?.results ?? [];

  const { data: classRaw = [] } = useQuery({
    queryKey: [...classificacoesFinanceirasQueryKey],
    queryFn: fetchClassificacoesFinanceiras,
  });
  const classificacoes = Array.isArray(classRaw) ? classRaw : (classRaw as any)?.results ?? [];

  const mutation = useMutation({
    mutationFn: createPlanoContas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planoContasQueryKey });
      toast({ title: "Plano de contas salvo!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/plano-contas");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
        : "Erro ao salvar plano de contas.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!idPlano.trim()) { toast({ title: "Informe o ID do plano.", variant: "destructive" }); return; }
    if (!categoria) { toast({ title: "Selecione a categoria.", variant: "destructive" }); return; }
    if (!classificacao) { toast({ title: "Selecione a classificação.", variant: "destructive" }); return; }
    mutation.mutate({ id_plano: idPlano, categoria: Number(categoria), classificacao: Number(classificacao) });
  };

  return (
    <SimpleFormWizard title="Novo Plano de Contas">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Plano de Contas</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">ID do Plano <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ex: 1.1.01"
                  className="form-input font-mono"
                  value={idPlano}
                  onChange={e => setIdPlano(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria <span className="text-destructive">*</span></Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {categorias.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Classificação <span className="text-destructive">*</span></Label>
                <Select value={classificacao} onValueChange={setClassificacao}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar classificação" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {classificacoes.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/financeiro/plano-contas")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoPlanoContas;
