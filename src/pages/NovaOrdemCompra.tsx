import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Trash2, ShoppingCart, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  fetchSetoresEstoque, fetchUnidades, fetchItensEstoque,
  createOrdemCompra, updateOrdemCompra, fetchOrdemCompra,
  ordensCompraQueryKey,
} from "@/services/estoque";

interface ItemOrdem {
  localId: number;
  item: string;
  marca: string;
  quantidade: number;
  especificacoes: string;
}

export default function NovaOrdemCompra() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [itens, setItens] = useState<ItemOrdem[]>([]);
  const [formData, setFormData] = useState({
    unidade: "", setor: "", descricao: "", justificativa: "",
    itemCadastrado: "", marca: "", quantidade: "", especificacoes: "",
  });
  const [showNoItemDialog, setShowNoItemDialog] = useState(false);

  // Load setores, unidades, itens from API
  const { data: setoresData = [] } = useQuery({
    queryKey: ['setoresEstoque'],
    queryFn: fetchSetoresEstoque,
  });
  const { data: unidadesData = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: fetchUnidades,
  });
  const { data: itensEstoqueRaw } = useQuery({
    queryKey: ['itensEstoque'],
    queryFn: () => fetchItensEstoque(),
  });
  const itensEstoque = Array.isArray(itensEstoqueRaw)
    ? itensEstoqueRaw
    : (itensEstoqueRaw as any)?.results ?? [];

  // Load existing order for editing
  const { data: existingOrder } = useQuery({
    queryKey: ['ordemCompra', id],
    queryFn: () => fetchOrdemCompra(Number(id)),
    enabled: isEditing,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (existingOrder) {
      setFormData(prev => ({
        ...prev,
        unidade: existingOrder.unidade ? String(existingOrder.unidade) : "",
        setor: existingOrder.setor ? String(existingOrder.setor) : "",
        descricao: existingOrder.descricao_material || "",
        justificativa: existingOrder.justificativa || "",
      }));
      if (existingOrder.itens) {
        setItens(existingOrder.itens.map((item, idx) => ({
          localId: idx,
          item: item.item,
          marca: item.marca || "",
          quantidade: item.quantidade,
          especificacoes: item.especificacoes || "",
        })));
      }
    }
  }, [existingOrder]);

  // Restore state from sessionStorage on mount (returning from item cadastro)
  useEffect(() => {
    const saved = sessionStorage.getItem("novaOrdemCompra_state");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.itens) setItens(state.itens);
        if (state.formData) setFormData(prev => ({ ...prev, ...state.formData }));
        sessionStorage.removeItem("novaOrdemCompra_state");
      } catch (e) {
        console.error("Erro ao restaurar estado:", e);
      }
    }
  }, []);

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEditing ? updateOrdemCompra(Number(id), payload) : createOrdemCompra(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordensCompraQueryKey });
      toast({ title: isEditing ? "Ordem de compra atualizada!" : "Ordem de compra criada!" });
      navigate("/estoque/ordem-compra");
    },
    onError: () => {
      toast({ title: "Erro ao salvar", description: "Verifique os dados e tente novamente.", variant: "destructive" });
    },
  });

  const handleAddItem = () => {
    const itemName = formData.itemCadastrado;
    if (!itemName || !formData.quantidade) {
      toast({ title: "Campos obrigatórios", description: "Selecione um item e informe a quantidade.", variant: "destructive" });
      return;
    }
    setItens([...itens, {
      localId: Date.now(),
      item: itemName,
      marca: formData.marca,
      quantidade: Number(formData.quantidade),
      especificacoes: formData.especificacoes,
    }]);
    setFormData({ ...formData, itemCadastrado: "", marca: "", quantidade: "", especificacoes: "" });
  };

  const handleRemoveItem = (localId: number) => setItens(itens.filter(i => i.localId !== localId));

  const handleSalvar = () => {
    if (!formData.setor || !formData.unidade || !formData.descricao) {
      toast({ title: "Campos obrigatórios", description: "Preencha setor, unidade e descrição.", variant: "destructive" });
      return;
    }
    mutation.mutate({
      setor: Number(formData.setor),
      unidade: Number(formData.unidade),
      descricao_material: formData.descricao,
      justificativa: formData.justificativa,
      itens: itens.map(({ item, marca, quantidade, especificacoes }) => ({
        item, marca, quantidade, especificacoes,
      })),
    });
  };

  const handleCancelar = () => navigate("/estoque/ordem-compra");

  const handleGoToCadastroItem = () => {
    sessionStorage.setItem("novaOrdemCompra_state", JSON.stringify({ formData, itens }));
    setShowNoItemDialog(false);
    navigate("/cadastro/estoque/itens/novo?returnTo=/estoque/ordem-compra/nova");
  };

  return (
    <SimpleFormWizard title={isEditing ? "Editar Ordem de Compra" : "Nova Ordem de Compra"}>
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Ordem de Compra</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unidade</Label>
                <Select value={formData.unidade} onValueChange={(v) => setFormData({ ...formData, unidade: v })}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {unidadesData.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Setor</Label>
                <Select value={formData.setor} onValueChange={(v) => setFormData({ ...formData, setor: v })}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {setoresData.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.setor}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descrição</Label>
                <Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Digite a descrição" className="form-input min-h-[100px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Justificativa</Label>
                <Textarea value={formData.justificativa} onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })} placeholder="Digite a justificativa da ordem de compra" className="form-input min-h-[100px]" />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Adicionar Item</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Item</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select value={formData.itemCadastrado} onValueChange={(v) => setFormData({ ...formData, itemCadastrado: v })}>
                        <SelectTrigger className="form-input"><SelectValue placeholder="Selecione um item cadastrado" /></SelectTrigger>
                        <SelectContent className="bg-popover">
                          {itensEstoque.map((item: any) => (
                            <SelectItem key={item.id} value={item.itens_do_estoque}>{item.itens_do_estoque}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setShowNoItemDialog(true)} title="Item não encontrado? Cadastre um novo">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Marca</Label>
                  <Input value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} placeholder="Marca" className="form-input" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantidade</Label>
                  <Input type="number" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })} placeholder="Qtd" className="form-input" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Especificações</Label>
                  <Input value={formData.especificacoes} onChange={(e) => setFormData({ ...formData, especificacoes: e.target.value })} placeholder="Specs" className="form-input" />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button type="button" onClick={handleAddItem} className="btn-action">Adicionar Item</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead >Item</TableHead>
                  <TableHead >Marca</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead >Especificações</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum item adicionado</TableCell></TableRow>
                ) : (
                  itens.map((item) => (
                    <TableRow key={item.localId}>
                      <TableCell >{item.item}</TableCell>
                      <TableCell >{item.marca}</TableCell>
                      <TableCell >{item.quantidade}</TableCell>
                      <TableCell >{item.especificacoes}</TableCell>
                      <TableCell >
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.localId)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <FormActionBar onSave={handleSalvar} onCancel={handleCancelar} isSaving={mutation.isPending} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNoItemDialog} onOpenChange={setShowNoItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item não encontrado?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              O item que você precisa não está cadastrado no sistema. Deseja ir para a página de cadastro de itens?
            </p>
            <p className="text-sm text-muted-foreground">
              Suas informações preenchidas neste formulário serão <strong>salvas automaticamente</strong> e restauradas quando você voltar.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNoItemDialog(false)}>Cancelar</Button>
            <Button onClick={handleGoToCadastroItem} className="gap-2">
              <ExternalLink className="w-4 h-4" /> Ir para Cadastro de Itens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SimpleFormWizard>
  );
}
