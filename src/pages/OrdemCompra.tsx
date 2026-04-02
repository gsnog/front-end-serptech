import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { SortableHead } from "@/components/SortableHead";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Plus, ChevronDown, ChevronRight, Eye, Edit, Trash2, CheckCircle, XCircle, ShoppingCart, PackageCheck, FileUp } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useSortable } from "@/hooks/useSortable";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import api from "@/lib/api";
import {
  fetchOrdensCompra, deleteOrdemCompra, aprovarOrdemCompra, negarOrdemCompra,
  registrarCompraOrdem, registrarEntregaOrdem,
  ordensCompraQueryKey, type OrdemCompra,
  fetchFornecedores, fetchItensEstoque, fetchUnidades,
  fornecedoresQueryKey, itensEstoqueQueryKey, unidadesQueryKey,
} from "@/services/estoque";

interface ItemEntrada {
  id: number;
  itemId: string;
  itemNome: string;
  quantidade: string;
  custoUnitario: string;
}

const OrdemCompraPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<OrdemCompra | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [negarTarget, setNegarTarget] = useState<OrdemCompra | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  // Delivery dialog state
  const [entregaTarget, setEntregaTarget] = useState<OrdemCompra | null>(null);
  const [entregaFornecedorId, setEntregaFornecedorId] = useState("");
  const [entregaDestinoId, setEntregaDestinoId] = useState("");
  const [entregaData, setEntregaData] = useState(new Date().toISOString().split("T")[0]);
  const [entregaNfNumero, setEntregaNfNumero] = useState("");
  const [entregaDataEmissao, setEntregaDataEmissao] = useState("");
  const [entregaObservacao, setEntregaObservacao] = useState("");
  const [entregaItens, setEntregaItens] = useState<ItemEntrada[]>([]);
  const [entregaXmlFile, setEntregaXmlFile] = useState<File | null>(null);

  // Reference data
  const { data: fornecedoresRaw = [] } = useQuery({ queryKey: fornecedoresQueryKey, queryFn: fetchFornecedores });
  const fornecedoresArray = (Array.isArray(fornecedoresRaw) ? fornecedoresRaw : (fornecedoresRaw as any)?.results ?? []) as any[];

  const { data: itensRaw = [] } = useQuery({ queryKey: itensEstoqueQueryKey, queryFn: fetchItensEstoque });
  const itensEstoque = (Array.isArray(itensRaw) ? itensRaw : (itensRaw as any)?.results ?? []) as any[];

  const { data: unidadesRaw = [] } = useQuery({ queryKey: unidadesQueryKey, queryFn: fetchUnidades });
  const unidades = (Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? []) as any[];

  const fornecedorFilterOptions = [
    { value: "todos", label: "Todos" },
    ...fornecedoresArray.map((f: any) => ({ value: String(f.id), label: f.nome }))
  ];
  const fornecedorSelectOptions = fornecedoresArray.map((f: any) => ({ value: String(f.id), label: f.nome }));
  const itemOptions = itensEstoque.map((i: any) => ({ value: String(i.id), label: i.itens_do_estoque }));

  useRealtimeUpdates([[...ordensCompraQueryKey]]);

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, filterStatus, filterFornecedor]);

  const { data: response, isLoading } = useQuery({
    queryKey: [...ordensCompraQueryKey, page],
    queryFn: () => fetchOrdensCompra(page),
  });
  const allItems = response?.results ?? [];
  const serverTotal = response?.count ?? 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ordensCompraQueryKey });

  const deleteMutation = useMutation({
    mutationFn: deleteOrdemCompra,
    onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Removido", description: "Ordem de compra excluída." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const aprovarMutation = useMutation({
    mutationFn: aprovarOrdemCompra,
    onSuccess: () => { invalidate(); toast({ title: "Aprovada", description: "Ordem de compra aprovada." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível aprovar.", variant: "destructive" }),
  });

  const negarMutation = useMutation({
    mutationFn: ({ id, feedback }: { id: number; feedback: string }) => negarOrdemCompra(id, feedback),
    onSuccess: () => { invalidate(); setNegarTarget(null); setFeedbackText(""); toast({ title: "Negada", description: "Ordem de compra negada." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível negar.", variant: "destructive" }),
  });

  const comprarMutation = useMutation({
    mutationFn: registrarCompraOrdem,
    onSuccess: () => { invalidate(); toast({ title: "Compra registrada", description: "Status de compra atualizado para Efetuada." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível registrar a compra.", variant: "destructive" }),
  });

  const entregarMutation = useMutation({
    mutationFn: registrarEntregaOrdem,
    onSuccess: () => { invalidate(); toast({ title: "Entrega registrada", description: "Entrega e entrada registradas com sucesso." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível registrar a entrega.", variant: "destructive" }),
  });

  const criarEntradaMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload._xmlFile) {
        const formData = new FormData();
        formData.append('xml_file', payload._xmlFile);
        formData.append('unidade', String(payload._unidade));
        if (payload._ordemId) formData.append('ordem_compra', String(payload._ordemId));
        return (await api.post('/api/estoque/entradas/importar-xml/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })).data;
      }
      const { _ordemId, ...rest } = payload;
      return (await api.post('/api/estoque/entradas/', rest)).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] });
      entregarMutation.mutate(variables._ordemId);
      setEntregaTarget(null);
      setEntregaXmlFile(null);
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      const msgs = errData && typeof errData === "object"
        ? Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Erro ao criar entrada.";
      toast({ title: "Erro ao registrar entrada", description: msgs, variant: "destructive" });
    },
  });

  const openEntregaDialog = (o: OrdemCompra) => {
    setEntregaTarget(o);
    setEntregaData(new Date().toISOString().split("T")[0]);
    setEntregaFornecedorId("");
    setEntregaDestinoId(o.unidade ? String(o.unidade) : "");
    setEntregaNfNumero("");
    setEntregaDataEmissao("");
    setEntregaObservacao("");
    setEntregaXmlFile(null);

    // Pre-populate items from order, matching names to IDs
    const preItens: ItemEntrada[] = (o.itens ?? []).map((oi, idx) => {
      const matched = itensEstoque.find(
        (it: any) => it.itens_do_estoque?.toLowerCase() === oi.item?.toLowerCase()
      );
      return {
        id: Date.now() + idx,
        itemId: matched ? String(matched.id) : "",
        itemNome: oi.item,
        quantidade: String(oi.quantidade ?? 1),
        custoUnitario: "0",
      };
    });
    setEntregaItens(preItens);
  };

  const handleEntregaCustoChange = (id: number, value: string) => {
    setEntregaItens(prev => prev.map(i => i.id === id ? { ...i, custoUnitario: value } : i));
  };

  const handleSubmitEntrega = () => {
    if (!entregaTarget) return;
    if (!entregaDestinoId) {
      toast({ title: "Selecione o estoque de destino", variant: "destructive" });
      return;
    }

    // Se XML fornecido, usa endpoint importar-xml (que cria NF, fornecedor e contas a pagar automaticamente)
    if (entregaXmlFile) {
      criarEntradaMutation.mutate({
        _xmlFile: entregaXmlFile,
        _unidade: parseInt(entregaDestinoId),
        _ordemId: entregaTarget.id,
      });
      return;
    }

    if (entregaItens.length === 0) {
      toast({ title: "Adicione pelo menos um item", variant: "destructive" });
      return;
    }

    const itensCadastrados = entregaItens
      .filter(i => i.itemId)
      .map(i => ({ item_id: parseInt(i.itemId), quantidade: parseFloat(i.quantidade) || 1, custo_unitario: parseFloat(i.custoUnitario) || 0 }));

    const itensNovos = entregaItens
      .filter(i => !i.itemId)
      .map(i => ({ nome_item: i.itemNome, quantidade: parseFloat(i.quantidade) || 1, custo_unitario: parseFloat(i.custoUnitario) || 0 }));

    const valorTotal = entregaItens.reduce(
      (acc, i) => acc + (parseFloat(i.quantidade) || 0) * (parseFloat(i.custoUnitario) || 0), 0
    );

    const payload: any = {
      data: entregaData || new Date().toISOString().split("T")[0],
      estoque_destino: parseInt(entregaDestinoId),
      custo_total: valorTotal,
      observacao: entregaObservacao || "",
      itens: itensCadastrados,
      itens_precadastro: itensNovos,
      ordem_compra: entregaTarget.id,
      _ordemId: entregaTarget.id,
    };
    if (entregaFornecedorId) payload.fornecedor = parseInt(entregaFornecedorId);
    if (entregaNfNumero) {
      payload.nota_fiscal_numero = entregaNfNumero;
      payload.nota_fiscal_data_emissao = entregaDataEmissao || entregaData || new Date().toISOString().split("T")[0];
    }

    criarEntradaMutation.mutate(payload);
  };

  const entregaValorTotal = useMemo(() =>
    entregaItens.reduce((acc, i) => acc + (parseFloat(i.quantidade) || 0) * (parseFloat(i.custoUnitario) || 0), 0),
    [entregaItens]
  );

  const filtered = useMemo(() => allItems.filter(o => {
    const matchSearch = o.descricao_material?.toLowerCase().includes(search.toLowerCase()) ||
      o.setor_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus && filterStatus !== "todos" ? o.status === filterStatus : true;
    const matchFornecedor = filterFornecedor && filterFornecedor !== "todos" ? String(o.setor) === filterFornecedor : true;
    return matchSearch && matchStatus && matchFornecedor;
  }), [allItems, search, filterStatus, filterFornecedor]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered);
  const total = serverTotal;
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getExportData = () => filtered.map(o => ({ Setor: o.setor_nome, Status: o.status, "Status Compra": o.status_da_compra, Descrição: o.descricao_material }));
  const deleteItemObj = allItems.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/ordem-compra/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Ordem de Compra</Button>
          <ExportButton getData={getExportData} fileName="ordens-compra" />
        </div>
        <p className="text-sm text-muted-foreground">
          Utilize para abrir solicitações de compra de novos itens para o estoque.
        </p>
        <FilterSection
          fields={[
            { type: "text" as const, label: "Buscar", placeholder: "Buscar por setor ou material...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" },
            { type: "select" as const, label: "Status", placeholder: "Todos", value: filterStatus, onChange: setFilterStatus, options: [{ value: "todos", label: "Todos" }, { value: "Análise", label: "Análise" }, { value: "Aprovado", label: "Aprovado" }, { value: "Negado", label: "Negado" }, { value: "Entregue", label: "Entregue" }], width: "min-w-[160px]" },
            { type: "select" as const, label: "Fornecedor", placeholder: "Todos", value: filterFornecedor, onChange: setFilterFornecedor, options: fornecedorFilterOptions, width: "min-w-[180px]" }
          ]}
          resultsCount={filtered.length}
        />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="w-8" />
                <SortableHead label="Setor" field="setor_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Unidade" field="unidade_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Material" field="descricao_material" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Status" field="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Status Compra" field="status_da_compra" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : sorted.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma ordem de compra encontrada.</TableCell></TableRow>
              ) : (
                sorted.map(o => {
                  const isExpanded = expandedIds.has(o.id);
                  const itens = o.itens ?? [];
                  const canAprovar = o.status === 'Análise';
                  const canComprar = o.status === 'Aprovado' && o.status_da_compra !== 'Efetuada';
                  const canEntregar = o.status === 'Aprovado' && !o.data_de_entrega;
                  const hasStatusActions = canAprovar || canComprar || canEntregar;

                  return (
                    <>
                      <TableRow key={o.id}>
                        <TableCell className="text-center px-2">
                          {itens.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(o.id)}>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{o.setor_nome}</TableCell>
                        <TableCell className="text-center">{o.unidade_nome}</TableCell>
                        <TableCell className="text-center font-medium">{o.descricao_material}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={o.status || ''} /></TableCell>
                        <TableCell className="text-center"><StatusBadge status={o.status_da_compra || 'Não efetuada'} /></TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1 border-border">
                                Ações <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                              <DropdownMenuItem onClick={() => setViewItem(o)} className="gap-2 cursor-pointer">
                                <Eye className="h-4 w-4" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/estoque/ordem-compra/${o.id}`)} className="gap-2 cursor-pointer">
                                <Edit className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteId(o.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>

                              {hasStatusActions && <DropdownMenuSeparator />}

                              {canAprovar && (
                                <DropdownMenuItem onClick={() => aprovarMutation.mutate(o.id)} className="gap-2 cursor-pointer text-green-600 focus:text-green-600">
                                  <CheckCircle className="h-4 w-4" /> Aprovar
                                </DropdownMenuItem>
                              )}
                              {canAprovar && (
                                <DropdownMenuItem onClick={() => { setNegarTarget(o); setFeedbackText(""); }} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                                  <XCircle className="h-4 w-4" /> Negar
                                </DropdownMenuItem>
                              )}
                              {canComprar && (
                                <DropdownMenuItem onClick={() => comprarMutation.mutate(o.id)} className="gap-2 cursor-pointer">
                                  <ShoppingCart className="h-4 w-4" /> Registrar Compra
                                </DropdownMenuItem>
                              )}
                              {canEntregar && (
                                <DropdownMenuItem onClick={() => openEntregaDialog(o)} className="gap-2 cursor-pointer">
                                  <PackageCheck className="h-4 w-4" /> Registrar Entrega
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow key={`${o.id}-itens`} className="bg-muted/30">
                          <TableCell colSpan={7} className="py-0 px-8">
                            <div className="py-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Itens da Ordem #{o.id}
                              </p>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="text-center text-xs h-8">Item</TableHead>
                                    <TableHead className="text-center text-xs h-8">Marca</TableHead>
                                    <TableHead className="text-center text-xs h-8">Quantidade</TableHead>
                                    <TableHead className="text-center text-xs h-8">Especificações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {itens.map((item, idx) => (
                                    <TableRow key={idx} className="border-0">
                                      <TableCell className="text-center text-sm py-1">{item.item}</TableCell>
                                      <TableCell className="text-center text-sm py-1">{item.marca || "—"}</TableCell>
                                      <TableCell className="text-center text-sm py-1">{item.quantidade}</TableCell>
                                      <TableCell className="text-center text-sm py-1">{item.especificacoes || "—"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total} registros</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={!hasPrev}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasNext}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ordem de Compra #{viewItem?.id}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Setor</span><span className="text-sm font-medium">{viewItem.setor_nome}</span></div>
              <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Unidade</span><span className="text-sm font-medium">{viewItem.unidade_nome}</span></div>
              <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Status</span><StatusBadge status={viewItem.status || ''} /></div>
              <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Status Compra</span><StatusBadge status={viewItem.status_da_compra || 'Não efetuada'} /></div>
              <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Material</span><span className="text-sm font-medium">{viewItem.descricao_material}</span></div>
              <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Justificativa</span><span className="text-sm font-medium">{viewItem.justificativa}</span></div>
              {viewItem.feedback && (
                <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Feedback</span><span className="text-sm font-medium">{viewItem.feedback}</span></div>
              )}
              {viewItem.data_de_compra && (
                <div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Data Compra</span><span className="text-sm font-medium">{viewItem.data_de_compra}</span></div>
              )}
              {viewItem.data_de_entrega && (
                <div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Data Entrega</span><span className="text-sm font-medium">{viewItem.data_de_entrega}</span></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Negar com feedback */}
      <Dialog open={!!negarTarget} onOpenChange={() => setNegarTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Negar Ordem de Compra #{negarTarget?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Informe a justificativa para negar a ordem de <strong>{negarTarget?.setor_nome}</strong>.</p>
            <div className="space-y-2">
              <Label>Justificativa <span className="text-destructive">*</span></Label>
              <Textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Motivo da negação..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNegarTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!feedbackText.trim() || negarMutation.isPending}
              onClick={() => negarTarget && negarMutation.mutate({ id: negarTarget.id, feedback: feedbackText })}
            >
              Negar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Entrega */}
      <Dialog open={!!entregaTarget} onOpenChange={() => setEntregaTarget(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" /> Registrar Entrega — Ordem #{entregaTarget?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              Preencha os dados da entrada de estoque gerada por esta entrega. Os itens foram pré-carregados a partir da ordem de compra.
            </p>

            {/* Fornecedor + Destino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fornecedor</Label>
                <SearchableSelect
                  options={fornecedorSelectOptions}
                  value={entregaFornecedorId}
                  onValueChange={setEntregaFornecedorId}
                  placeholder="Selecione o fornecedor"
                  searchPlaceholder="Pesquisar fornecedor..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estoque de Destino <span className="text-destructive">*</span></Label>
                <Select value={entregaDestinoId} onValueChange={setEntregaDestinoId}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {unidades.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data + NF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Entrada</Label>
                <Input type="date" value={entregaData} onChange={(e) => setEntregaData(e.target.value)} className="form-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número da NF</Label>
                <Input type="text" value={entregaNfNumero} onChange={(e) => setEntregaNfNumero(e.target.value)} placeholder="Ex: 001234" className="form-input" />
              </div>
            </div>

            {/* Data emissão + Observação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Emissão da NF</Label>
                <Input type="date" value={entregaDataEmissao} onChange={(e) => setEntregaDataEmissao(e.target.value)} className="form-input" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Observação</Label>
                <Input type="text" value={entregaObservacao} onChange={(e) => setEntregaObservacao(e.target.value)} placeholder="Observações..." className="form-input" />
              </div>
            </div>

            {/* XML da NF-e */}
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileUp className="h-4 w-4" /> XML da NF-e (opcional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Se informado, o XML será processado automaticamente — fornecedor, itens e contas a pagar serão criados a partir dele. Os campos manuais abaixo serão ignorados.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".xml"
                  className="form-input"
                  onChange={(e) => setEntregaXmlFile(e.target.files?.[0] ?? null)}
                />
                {entregaXmlFile && (
                  <Button variant="ghost" size="sm" onClick={() => setEntregaXmlFile(null)} className="shrink-0 text-destructive">
                    Remover
                  </Button>
                )}
              </div>
              {entregaXmlFile && (
                <p className="text-xs text-green-600 font-medium">Arquivo selecionado: {entregaXmlFile.name}</p>
              )}
            </div>

            {/* Items */}
            <div className={`border-t pt-4 space-y-3 ${entregaXmlFile ? "opacity-40 pointer-events-none" : ""}`}>
              <h3 className="text-sm font-semibold">Itens da Entrada</h3>
              <p className="text-xs text-muted-foreground">
                {entregaXmlFile
                  ? "Os itens serão extraídos automaticamente do XML."
                  : "Os itens são os da ordem de compra. Informe o custo unitário de cada um."}
              </p>

              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-center w-40">Custo Unit. (R$)</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entregaItens.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">Nenhum item na ordem</TableCell></TableRow>
                    ) : (
                      entregaItens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="text-sm">{item.itemNome}</div>
                            {!item.itemId && <span className="text-xs text-amber-600">Pré-cadastro (item novo)</span>}
                          </TableCell>
                          <TableCell className="text-center text-sm">{item.quantidade}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.custoUnitario}
                              onChange={(e) => handleEntregaCustoChange(item.id, e.target.value)}
                              className="form-input text-center w-32 mx-auto"
                              placeholder="0,00"
                            />
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            R$ {((parseFloat(item.quantidade) || 0) * (parseFloat(item.custoUnitario) || 0)).toFixed(2).replace(".", ",")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {entregaValorTotal > 0 && (
                <div className="flex justify-end">
                  <span className="text-sm font-semibold">Valor Total: R$ {entregaValorTotal.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setEntregaTarget(null)} disabled={criarEntradaMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitEntrega}
              disabled={criarEntradaMutation.isPending || entregarMutation.isPending}
              className="gap-2"
            >
              <PackageCheck className="h-4 w-4" />
              {criarEntradaMutation.isPending || entregarMutation.isPending ? "Registrando..." : "Confirmar Entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Excluir */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ordem de compra?</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir a ordem de compra <strong>#{deleteItemObj?.id}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default OrdemCompraPage;
