import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { ClipboardCheck } from "lucide-react";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { toast } from "@/hooks/use-toast";
import {
  createOrdemServico, updateOrdemServico, fetchOrdemServico,
  ordensServicoQueryKey,
} from "@/services/estoque";

export default function NovaOrdemServico() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({ tipoOrdem: "", descricao: "" });
  const [tipoOptions, setTipoOptions] = useState([
    { value: "Serviços Gerais", label: "Serviços Gerais" },
    { value: "Patrimônio", label: "Patrimônio" },
    { value: "Suporte", label: "Suporte" },
  ]);

  // Load existing order for editing
  const { data: existingOrder } = useQuery({
    queryKey: ['ordemServico', id],
    queryFn: () => fetchOrdemServico(Number(id)),
    enabled: isEditing,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (existingOrder) {
      setFormData({
        tipoOrdem: existingOrder.tipo_de_ordem || "",
        descricao: existingOrder.descricao || "",
      });
    }
  }, [existingOrder]);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEditing ? updateOrdemServico(Number(id), payload) : createOrdemServico(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordensServicoQueryKey });
      toast({ title: isEditing ? "Ordem de serviço atualizada!" : "Ordem de serviço criada!" });
      navigate("/estoque/ordem-servico");
    },
    onError: () => {
      toast({ title: "Erro ao salvar", description: "Verifique os dados e tente novamente.", variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!formData.tipoOrdem || !formData.descricao) {
      toast({ title: "Campos obrigatórios", description: "Preencha o tipo de ordem e a descrição.", variant: "destructive" });
      return;
    }
    mutation.mutate({
      tipo_de_ordem: formData.tipoOrdem,
      descricao: formData.descricao,
    });
  };

  const handleCancelar = () => navigate("/estoque/ordem-servico");

  return (
    <SimpleFormWizard title={isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}>
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Ordem de Serviço</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd
                label="Tipo de Ordem"
                required
                value={formData.tipoOrdem}
                onChange={(value) => setFormData({ ...formData, tipoOrdem: value })}
                options={tipoOptions}
                onAddNew={(name) => {
                  setTipoOptions(prev => [...prev, { value: name, label: name }]);
                  setFormData(prev => ({ ...prev, tipoOrdem: name }));
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Digite a descrição da ordem de serviço"
                  className="form-input min-h-[120px]"
                />
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={handleCancelar}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
