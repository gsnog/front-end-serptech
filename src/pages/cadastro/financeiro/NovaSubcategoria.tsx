import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Tag } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  createSubcategoria, subcategoriasQueryKey,
  fetchCategoriasFinanceiras, categoriasFinanceirasQueryKey,
} from "@/services/financeiro";

const NovaSubcategoria = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");

  const { data: catRaw = [] } = useQuery({
    queryKey: [...categoriasFinanceirasQueryKey],
    queryFn: () => fetchCategoriasFinanceiras(),
  });
  const categorias = Array.isArray(catRaw) ? catRaw : (catRaw as any)?.results ?? [];

  const mutation = useMutation({
    mutationFn: createSubcategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subcategoriasQueryKey });
      toast({ title: "Subcategoria salva!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/subcategorias");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
        : "Erro ao salvar subcategoria.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!nome.trim()) { toast({ title: "Informe o nome.", variant: "destructive" }); return; }
    if (!categoria) { toast({ title: "Selecione a categoria.", variant: "destructive" }); return; }
    mutation.mutate({ nome, categoria: Number(categoria) });
  };

  return (
    <SimpleFormWizard title="Nova Subcategoria">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Subcategoria</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Nome da subcategoria"
                  className="form-input"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
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

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/financeiro/subcategorias")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaSubcategoria;
