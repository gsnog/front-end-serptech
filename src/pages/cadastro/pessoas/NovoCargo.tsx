import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createCargo, cargosQueryKey } from "@/services/pessoas";
import SimpleFormWizard from "@/components/SimpleFormWizard";

export default function NovoCargo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salario, setSalario] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [requisitos, setRequisitos] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createCargo({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        salario: salario ? parseFloat(salario.replace(/\./g, "").replace(",", ".")) : undefined,
        carga_horaria: cargaHoraria ? parseInt(cargaHoraria) : undefined,
        requisitos: requisitos.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cargosQueryKey });
      toast({ title: "Cargo criado!", description: "O cargo foi salvo com sucesso." });
      navigate("/cadastro/pessoas/cargos");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data ? Object.values(data).flat().join(" ") : "Erro ao salvar cargo.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast({ title: "Informe o nome do cargo.", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  return (
    <SimpleFormWizard>
      <h1 className="text-2xl font-bold text-foreground mb-6">Novo Cargo</h1>

      <Card className="border-border">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Nome do Cargo <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Analista de Sistemas"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              placeholder="Descreva as responsabilidades do cargo..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Salário Base (R$)</Label>
              <Input
                placeholder="0,00"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                className="form-input"
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Carga Horária (h/semana)</Label>
              <Input
                placeholder="40"
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value.replace(/\D/g, ""))}
                className="form-input"
                inputMode="numeric"
                maxLength={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Requisitos</Label>
            <Textarea
              placeholder="Formação, experiência, habilidades exigidas..."
              value={requisitos}
              onChange={(e) => setRequisitos(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => navigate("/cadastro/pessoas/cargos")}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
              ) : "Salvar Cargo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
