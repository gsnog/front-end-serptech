import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createSetor, setoresQueryKey } from "@/services/pessoas";
import api from "@/lib/api";

export default function NovoSetor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");

  const { data: funcionariosRaw = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: () => api.get("/api/funcionarios/").then(r => Array.isArray(r.data) ? r.data : (r.data?.results ?? [])),
  });

  const responsaveisOptions = (funcionariosRaw as any[]).map((f: any) => ({
    value: String(f.id),
    label: f.nome_completo || f.user?.user?.first_name || String(f.id),
  }));

  const mutation = useMutation({
    mutationFn: () => createSetor({
      nome: nome.trim(),
      codigo: codigo.trim() || null,
      responsavel_id: responsavelId ? Number(responsavelId) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresQueryKey });
      toast({ title: "Setor cadastrado!", description: "O setor foi salvo com sucesso." });
      navigate("/cadastro/pessoas/setores");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data ? Object.values(data).flat().join(" | ") : "Erro ao salvar setor.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!nome.trim()) {
      toast({ title: "Informe o nome do setor.", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="flex flex-col h-full bg-background items-center">
      <div className="max-w-3xl w-full">
        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Setor</h2>
                <p className="text-sm text-muted-foreground">Informações do setor/área da empresa</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm font-medium">
                  Nome do Setor/Área <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: Tecnologia, RH, Financeiro..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSalvar()}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Código</Label>
                <Input
                  placeholder="Ex: TI-01, RH, FIN..."
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Responsável</Label>
                <Select value={responsavelId} onValueChange={setResponsavelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem responsável</SelectItem>
                    {responsaveisOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6 pt-6 border-t border-border">
          <Button variant="ghost" onClick={() => navigate("/cadastro/pessoas/setores")}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={mutation.isPending} className="gap-2">
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
            ) : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
