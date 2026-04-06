import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { CircleDollarSign } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  createCentroCusto, centrosCustoQueryKey,
  fetchAreas, areasQueryKey,
} from "@/services/financeiro";
import { fetchSetoresEstoque, setoresEstoqueQueryKey } from "@/services/estoque";

const NovoCentroCusto = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [setor, setSetor] = useState("");
  const [area, setArea] = useState("");

  const { data: setoresRaw = [] } = useQuery({
    queryKey: [...setoresEstoqueQueryKey],
    queryFn: fetchSetoresEstoque,
  });
  const setores = Array.isArray(setoresRaw) ? setoresRaw : (setoresRaw as any)?.results ?? [];

  const { data: areasRaw = [] } = useQuery({
    queryKey: [...areasQueryKey],
    queryFn: fetchAreas,
  });
  const areas = Array.isArray(areasRaw) ? areasRaw : (areasRaw as any)?.results ?? [];

  const mutation = useMutation({
    mutationFn: createCentroCusto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centrosCustoQueryKey });
      toast({ title: "Centro de custo salvo!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/centro-custo");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
        : "Erro ao salvar centro de custo.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!setor) { toast({ title: "Selecione o setor.", variant: "destructive" }); return; }
    if (!area) { toast({ title: "Selecione a área.", variant: "destructive" }); return; }
    mutation.mutate({ setor: Number(setor), area: Number(area) });
  };

  return (
    <SimpleFormWizard title="Novo Centro de Custo">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <CircleDollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Centro de Custo</h2>
                <p className="text-sm text-muted-foreground">O código do centro será gerado automaticamente</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Setor <span className="text-destructive">*</span></Label>
                <Select value={setor} onValueChange={setSetor}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar setor" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {setores.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.setor || s.nome || `Setor ${s.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Área <span className="text-destructive">*</span></Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar área" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {areas.map((a: any) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/financeiro/centro-custo")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoCentroCusto;
