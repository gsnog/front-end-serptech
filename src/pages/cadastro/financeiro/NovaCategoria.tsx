import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Tag } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createCategoriaFinanceira, categoriasFinanceirasQueryKey } from "@/services/financeiro";

const NovaCategoria = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");

  const mutation = useMutation({
    mutationFn: createCategoriaFinanceira,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasFinanceirasQueryKey });
      toast({ title: "Categoria salva!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/categorias");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.nome?.[0] || "Erro ao salvar categoria.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!nome.trim()) { toast({ title: "Informe o nome da categoria.", variant: "destructive" }); return; }
    mutation.mutate({ nome });
  };

  return (
    <SimpleFormWizard title="Nova Categoria">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Categoria</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Nome da categoria"
                  className="form-input"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/financeiro/categorias")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaCategoria;
