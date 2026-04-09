import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { Settings, Trash2 } from "lucide-react";
import { ValidatedInput } from "@/components/ui/validated-input";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProjeto, createTarefa } from "@/services/operacional";
import { useFormValidation } from "@/hooks/useFormValidation";

interface ServicoItem {
  id: number;
  servico: string;
  setor: string;
  dataInicio: string;
  desconto: string;
  valorAdicional: string;
}

const validationFields = [
  { name: "dataEntrada", label: "Data de Entrada", required: true },
  { name: "embarcacao", label: "Embarcação", required: true },
  { name: "previsaoEntrega", label: "Previsão de Entrega", required: true },
];

const NovaOperacao = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutationProjeto = useMutation({
    mutationFn: createProjeto,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      return data;
    }
  });

  const mutationTarefa = useMutation({
    mutationFn: createTarefa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { dataEntrada: "", embarcacao: "", previsaoEntrega: "", servico: "", setor: "", dataInicio: "", desconto: "0", valorAdicional: "0" },
    validationFields
  );

  const [embarcacaoOptions, setEmbarcacaoOptions] = useState([
    { value: "embarcacao1", label: "Embarcação 1" }, { value: "embarcacao2", label: "Embarcação 2" }
  ]);
  const [servicoOptions, setServicoOptions] = useState([
    { value: "servico1", label: "Serviço 1" }, { value: "servico2", label: "Serviço 2" }
  ]);
  const [setorOptions, setSetorOptions] = useState([
    { value: "setor1", label: "Setor 1" }, { value: "setor2", label: "Setor 2" }
  ]);
  const [itens, setItens] = useState<ServicoItem[]>([]);

  const handleAddServico = () => {
    if (!formData.servico) {
      toast({ title: "Selecione um serviço", variant: "destructive" });
      return;
    }
    setItens(prev => [...prev, {
      id: Date.now(),
      servico: servicoOptions.find(s => s.value === formData.servico)?.label || formData.servico,
      setor: setorOptions.find(s => s.value === formData.setor)?.label || formData.setor,
      dataInicio: formData.dataInicio,
      desconto: formData.desconto,
      valorAdicional: formData.valorAdicional,
    }]);
    setFieldValue("servico", "");
    setFieldValue("setor", "");
    setFieldValue("dataInicio", "");
    setFieldValue("desconto", "0");
    setFieldValue("valorAdicional", "0");
  };

  const handleSalvar = async () => {
    if (validateAll()) {
      setIsSaving(true);
      try {
        const projeto = await mutationProjeto.mutateAsync({
          nome: formData.embarcacao,
          data_inicio: formData.dataEntrada,
          data_fim: formData.previsaoEntrega,
          status: 'Em Andamento'
        });

        // Create tasks (serviços) linked to the project
        for (const item of itens) {
          await mutationTarefa.mutateAsync({
            projeto: projeto.id,
            titulo: item.servico,
            descricao: item.setor,
            status: 'Em Andamento',
            prazo: formData.previsaoEntrega
          });
        }

        toast({ title: "Operação salva com sucesso!", description: "Projeto e tarefas criados no sistema." });
        navigate("/operacional/operacao");
      } catch (error) {
        toast({ title: "Erro ao salvar", description: "Verifique os dados e tente novamente.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <SimpleFormWizard title="Nova Operação">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Operação</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Data de Entrada" required type="date" value={formData.dataEntrada}
                onChange={(e) => setFieldValue("dataEntrada", e.target.value)} onBlur={() => setFieldTouched("dataEntrada")}
                error={getFieldError("dataEntrada")} touched={touched.dataEntrada} />
              <DropdownWithAdd label="Embarcação" required value={formData.embarcacao} onChange={(v) => setFieldValue("embarcacao", v)}
                options={embarcacaoOptions} onAddNew={(item) => setEmbarcacaoOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Previsão de Entrega" required type="date" value={formData.previsaoEntrega}
                onChange={(e) => setFieldValue("previsaoEntrega", e.target.value)} onBlur={() => setFieldTouched("previsaoEntrega")}
                error={getFieldError("previsaoEntrega")} touched={touched.previsaoEntrega} />
              <DropdownWithAdd label="Serviço" value={formData.servico} onChange={(v) => setFieldValue("servico", v)}
                options={servicoOptions} onAddNew={(item) => setServicoOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd label="Setor" value={formData.setor} onChange={(v) => setFieldValue("setor", v)}
                options={setorOptions} onAddNew={(item) => setSetorOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
              <ValidatedInput label="Data de Início" type="date" value={formData.dataInicio}
                onChange={(e) => setFieldValue("dataInicio", e.target.value)} onBlur={() => setFieldTouched("dataInicio")}
                error={getFieldError("dataInicio")} touched={touched.dataInicio} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Desconto" value={formData.desconto} onChange={(e) => setFieldValue("desconto", e.target.value)}
                onBlur={() => setFieldTouched("desconto")} error={getFieldError("desconto")} touched={touched.desconto} />
              <ValidatedInput label="Valor Adicional" value={formData.valorAdicional} onChange={(e) => setFieldValue("valorAdicional", e.target.value)}
                onBlur={() => setFieldTouched("valorAdicional")} error={getFieldError("valorAdicional")} touched={touched.valorAdicional} />
            </div>

            <Button variant="outline" onClick={handleAddServico}>Adicionar Serviço</Button>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Serviços e Setores</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead >Serviço</TableHead>
                    <TableHead >Setor</TableHead>
                    <TableHead className="text-center">Data de Início</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Valor Adicional</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum serviço adicionado.</TableCell></TableRow>
                  ) : (
                    itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell >{item.servico}</TableCell>
                        <TableCell >{item.setor}</TableCell>
                        <TableCell >{item.dataInicio}</TableCell>
                        <TableCell >{item.desconto}</TableCell>
                        <TableCell >{item.valorAdicional}</TableCell>
                        <TableCell >
                          <Button variant="ghost" size="sm" onClick={() => setItens(prev => prev.filter(i => i.id !== item.id))} className="text-destructive hover:text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/operacional/operacao")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaOperacao;
