import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { PackageMinus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchItensEstoque, fetchUnidades, fetchSetoresEstoque,
  createSaida,
  saidasQueryKey, inventarioQueryKey
} from "@/services/estoque";

interface ItemSaida {
  id: number;
  item_id: number;
  item: string;
  quantidade: string;
}

export default function NovaSaida() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dataOperacao, setDataOperacao] = useState(() => new Date().toISOString().split('T')[0]);
  const [estoqueOrigem, setEstoqueOrigem] = useState("");
  const [setorDestino, setSetorDestino] = useState("");
  const [observacao, setObservacao] = useState("");

  const [itens, setItens] = useState<ItemSaida[]>([]);
  const [itemForm, setItemForm] = useState({ item_id: 0, item: "", quantidade: "" });

  const { data: itensData } = useQuery({ queryKey: ['itensEstoque'], queryFn: () => fetchItensEstoque() });
  const { data: unidadesData } = useQuery({ queryKey: ['unidades'], queryFn: fetchUnidades });
  const { data: setoresData } = useQuery({ queryKey: ['setoresEstoque'], queryFn: fetchSetoresEstoque });

  const itensEstoque = Array.isArray(itensData) ? itensData : (itensData?.results ?? []);
  const unidades = unidadesData || [];
  const setores = setoresData || [];

  const mutationSaida = useMutation({
    mutationFn: createSaida,
    onSuccess: () => {
      toast({ title: "Saída salva!", description: "O registro foi salvo com sucesso." });
      queryClient.invalidateQueries({ queryKey: saidasQueryKey });
      queryClient.invalidateQueries({ queryKey: inventarioQueryKey });
      navigate("/estoque/saidas");
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.response?.data?.detail || "Erro ao salvar a saída.", variant: "destructive" });
    }
  });

  const isSaving = mutationSaida.isPending;

  const handleSalvar = () => {
    if (!estoqueOrigem) { toast({ title: "Atenção", description: "Selecione o estoque de origem", variant: "destructive" }); return; }
    if (!setorDestino) { toast({ title: "Atenção", description: "Selecione o setor de destino", variant: "destructive" }); return; }
    if (itens.length === 0) { toast({ title: "Atenção", description: "Adicione ao menos um item", variant: "destructive" }); return; }

    mutationSaida.mutate({
      data: dataOperacao,
      estoque_origem: Number(estoqueOrigem),
      setor_destino: Number(setorDestino),
      observacao,
      itens: itens.map(i => ({ item_id: i.item_id, quantidade: i.quantidade })) as any
    });
  };

  const handleAddItem = () => {
    if (!itemForm.item_id || !itemForm.quantidade) {
      toast({ title: "Campos obrigatórios", description: "Informe o item e a quantidade.", variant: "destructive" });
      return;
    }
    if (itens.find(i => i.item_id === itemForm.item_id)) {
      toast({ title: "Item já adicionado", variant: "destructive" });
      return;
    }
    setItens([...itens, { id: Date.now(), ...itemForm }]);
    setItemForm({ item_id: 0, item: "", quantidade: "" });
  };

  const handleRemoveItem = (id: number) => setItens(itens.filter(i => i.id !== id));

  return (
    <SimpleFormWizard title="Nova Saída">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <PackageMinus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Saída</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data <span className="text-destructive">*</span></Label>
                <Input type="date" value={dataOperacao} onChange={e => setDataOperacao(e.target.value)} className="form-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estoque de Origem <span className="text-destructive">*</span></Label>
                <Select value={estoqueOrigem} onValueChange={setEstoqueOrigem}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {unidades.map((u: any) => <SelectItem key={u.id} value={u.id.toString()}>{u.unidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Setor de Destino <span className="text-destructive">*</span></Label>
                <Select value={setorDestino} onValueChange={setSetorDestino}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {setores.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.setor}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Observação</Label>
              <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} className="form-input min-h-[80px]" placeholder="Observações sobre a saída..." />
            </div>

            {/* Itens */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Itens</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Item</Label>
                  <Select value={itemForm.item_id ? itemForm.item_id.toString() : ""} onValueChange={(val) => {
                    const sel = itensEstoque.find((i: any) => i.id.toString() === val);
                    setItemForm(p => ({ ...p, item_id: Number(val), item: sel ? sel.itens_do_estoque : "" }));
                  }}>
                    <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o item" /></SelectTrigger>
                    <SelectContent className="bg-popover max-h-[300px]">
                      {itensEstoque.map((i: any) => <SelectItem key={i.id} value={i.id.toString()}>{i.itens_do_estoque}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantidade</Label>
                  <Input type="number" value={itemForm.quantidade} onChange={(e) => setItemForm(p => ({ ...p, quantidade: e.target.value }))} placeholder="Qtd" className="form-input" min="1" />
                </div>
              </div>
              <div className="mt-4">
                <Button type="button" onClick={handleAddItem}>Adicionar Item</Button>
              </div>
            </div>

            <div className="rounded border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhum item adicionado</TableCell></TableRow>
                  ) : (
                    itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell >{item.quantidade}</TableCell>
                        <TableCell >
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-destructive hover:text-destructive"><Trash2 size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/estoque/saidas")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
