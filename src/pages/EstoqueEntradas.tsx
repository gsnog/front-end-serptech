import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Upload, ChevronDown, ChevronRight, XCircle, Link2, ClipboardCheck, CheckCircle, User, CalendarCheck, ChevronsUpDown, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"
import { FilterSection } from "@/components/FilterSection"
import { TableActions } from "@/components/TableActions"
import { ExportButton } from "@/components/ExportButton"
import { StatusBadge } from "@/components/StatusBadge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn, fmtDate } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { fetchEntradas, fetchAllEntradas, entradasQueryKey, fetchNomenclaturas, nomenclaturasQueryKey } from "@/services/estoque"
import { usePermissions } from "@/contexts/PermissionsContext"
import { Entradas } from "@/types/estoque"
import { fetchItensEstoque } from "@/services/estoque"

interface ItemNF {
  id: number;
  item: string;
  quantidade: number;
  custoUnitario: string;
}

interface ItemPreCadastroNF {
  id: number;
  nome_item: string;
  quantidade: number;
  custo_unitario: number;
  unidade_fornecedor: string;
  fator_conversao_fornecedor?: number | null;
}

interface EntradaNF {
  id: number;
  data: string;
  responsavel: string;
  notaFiscal: string;
  fornecedor: string;
  unidade: string;
  custoTotal: string;
  status: string;
  itens: ItemNF[];
  itens_precadastro: ItemPreCadastroNF[];
}

// --- Mocks removidos ---
const mockEntradas: EntradaNF[] = [];

// --- Mocks removidos ---

function loadSavedEntries(): EntradaNF[] {
  const saved = sessionStorage.getItem("novas_entradas");
  if (saved) {
    try {
      return JSON.parse(saved) as EntradaNF[];
    } catch { /* ignore */ }
  }
  return [];
}

export default function EstoqueEntradas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient();
  const { currentUser, hasPermission } = usePermissions();

  const canApprove = hasPermission('estoque', 'est_entradas', 'approve');

  const [page, setPage] = useState(1)

  // Fetch reais da API
  const { data: entradasResponse, isLoading, isError } = useQuery({
    queryKey: [...entradasQueryKey, page],
    queryFn: () => fetchEntradas(page),
  });
  const entradasApi = entradasResponse?.results ?? [];
  const serverTotal = entradasResponse?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const { data: itensEstoqueResponse } = useQuery({
    queryKey: ['itens_estoque'],
    queryFn: fetchItensEstoque
  });
  const itensEstoque = Array.isArray(itensEstoqueResponse)
    ? itensEstoqueResponse
    : (itensEstoqueResponse as any)?.results ?? [];

  const optionsEstoque = useMemo(() =>
    itensEstoque.map((i: any) => ({ value: String(i.id), label: i.itens_do_estoque })),
    [itensEstoque]
  );

  // Delete Mutation da API
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/estoque/entradas/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] });
      toast({ title: "Removido", description: "Entrada excluída com sucesso da base de dados." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Ocorreu um erro ao excluir a entrada. Tente novamente.", variant: "destructive" });
    }
  });

  // Approval Mutations (real API — protected by CanApproveEntradas on backend)
  const aprovarMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/api/estoque/entradas/${id}/aprovar/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] });
      setApprovalItem(null);
      toast({ title: "Entrada aprovada!", description: "Status atualizado para Aprovado." });
    },
    onError: (error: any) => {
      const status = error.response?.status;
      if (status === 403) {
        toast({ title: "Sem permissão", description: "Apenas gestores, diretores ou admins podem aprovar entradas.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao aprovar", description: error.response?.data?.detail ?? "Verifique o status da entrada.", variant: "destructive" });
      }
      setApprovalItem(null);
    }
  });

  const rejeitarMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/api/estoque/entradas/${id}/rejeitar/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] });
      setRejectItem(null);
      setRejectJustificativa("");
      toast({ title: "Entrada recusada.", description: "Status atualizado para Recusado." });
    },
    onError: (error: any) => {
      const status = error.response?.status;
      if (status === 403) {
        toast({ title: "Sem permissão", description: "Apenas gestores, diretores ou admins podem recusar entradas.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao recusar", description: error.response?.data?.detail ?? "Verifique o status da entrada.", variant: "destructive" });
      }
      setRejectItem(null);
    }
  });

  const [items, setItems] = useState<EntradaNF[]>([]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "Erro na API",
        description: "Não foi possível carregar as entradas do servidor.",
        variant: "destructive"
      });
    }
  }, [isError]);

  const [filterNome, setFilterNome] = useState("")
  const [filterNFe, setFilterNFe] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  const [viewItem, setViewItem] = useState<EntradaNF | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<EntradaNF | null>(null)
  const [editData, setEditData] = useState({ notaFiscal: "", fornecedor: "", unidade: "", responsavel: "" })
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Approval workflow
  const [approvalItem, setApprovalItem] = useState<EntradaNF | null>(null)
  const [rejectItem, setRejectItem] = useState<EntradaNF | null>(null)
  const [rejectJustificativa, setRejectJustificativa] = useState("")
  // Normalização de itens pré-cadastrados: { [precadastroId]: { acao, itemId } }
  const [precadastroSelections, setPrecadastroSelections] = useState<Record<number, { acao: "novo" | "existente" | ""; itemId: string }>>({})
  // Dados de conversão por item pré-cadastrado: { [precadastroId]: { fatorConversao,  formaApresentacao } }
  const [conversaoSelections, setConversaoSelections] = useState<Record<number, { fatorConversao: string; string; formaApresentacao: string }>>({})

  const { data: nomenclaturas = [] } = useQuery({
    queryKey: nomenclaturasQueryKey,
    queryFn: fetchNomenclaturas,
  })
  const [conciliateItem, setConciliateItem] = useState<{ entradaId: number; itemNF: ItemNF } | null>(null)
  const [conciliateWith, setConciliateWith] = useState("")
  const [conciliateComboboxOpen, setConciliateComboboxOpen] = useState(false)
  const [openComboboxIds, setOpenComboboxIds] = useState<Record<number, boolean>>({})

  const handleConciliate = async () => {
    if (!conciliateItem || !conciliateWith) return;
    try {
      await api.post(`/api/estoque/entradas/${conciliateItem.entradaId}/conciliar-item/`, {
        item_entrada_id: conciliateItem.itemNF.id,
        item_estoque_id: parseInt(conciliateWith),
      });
      toast({ title: "Item conciliado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: entradasQueryKey });
    } catch {
      toast({ title: "Erro ao conciliar item", variant: "destructive" });
    } finally {
      setConciliateItem(null);
      setConciliateWith("");
    }
  };

  const normalizarMutation = useMutation({
    mutationFn: async ({ entradaId, precadastroId, acao, itemExistenteId, fatorConversao, formaApresentacao }: {
      entradaId: number; precadastroId: number; acao: "novo" | "existente";
      itemExistenteId?: string; fatorConversao?: string; formaApresentacao?: string;
    }) => {
      const body: Record<string, any> = {
        precadastro_id: precadastroId,
        acao,
        item_existente_id: itemExistenteId ? parseInt(itemExistenteId) : undefined,
        fator_conversao: fatorConversao ? parseFloat(fatorConversao) : 1,
        forma_apresentacao: formaApresentacao ?? '',
      };
      const res = await api.post(`/api/estoque/entradas/${entradaId}/normalizar-precadastro/`, body);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] });
      toast({ title: "Item normalizado!", description: "Item pré-cadastrado processado com sucesso." });
      // Remove o item normalizado do dialog sem precisar fechar e reabrir
      setApprovalItem(prev =>
        prev ? { ...prev, itens_precadastro: prev.itens_precadastro.filter(it => it.id !== variables.precadastroId) } : prev
      );
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.response?.data?.detail ?? "Erro ao normalizar item.", variant: "destructive" });
    },
  });

  // Check for new entries on focus (when user returns from NovaEntrada)
  useEffect(() => {
    const handleFocus = () => {
      const newEntries = loadSavedEntries();
      if (newEntries.length > 0) {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const unique = newEntries.filter(e => !existingIds.has(e.id));
          if (unique.length > 0) {
            sessionStorage.removeItem("novas_entradas");
            return [...unique, ...prev];
          }
          return prev;
        });
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Mapeamos os dados reais para se unirem/substituirem o conceito de "items" filtrados
  // Nota: A API retorna Entradas brutas, o mapping visual dependerá das propriedades retornadas (notas, fornecedores, ids)
  const filtered = useMemo(() => {
    const baseList = entradasApi.map(e => ({
      id: e?.id || 0,
      data: e?.data || e?.data_de_chegada || "",
      responsavel: e?.criado_por_nome || "—",
      notaFiscal: String(e?.nota_fiscal_numero || e?.nota_fiscal || `NF-${e?.id}`),
      fornecedor: e?.fornecedor_nome || String(e?.fornecedor || ""),
      unidade: e?.unidade_nome || String(e?.unidade_nome || ""),
      custoTotal: e?.custo_total != null
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.custo_total)
        : "R$ 0,00",
      status: (() => {
        if (e?.status === 'aprovado') return 'Aprovada';
        if (e?.status === 'recusado') return 'Rejeitada';
        return 'Pendente';
      })(),
      _rawStatus: e?.status as string | undefined,
      _criado_por_nome: e?.criado_por_nome,
      _aprovado_por_nome: e?.aprovado_por_nome,
      _aprovado_em: e?.aprovado_em,
      itens: (e?.itens || []).map((it: any) => ({
        id: it.id,
        item: it.item_nome || `Item #${it.item}`,
        quantidade: it.quantidade,
        custoUnitario: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.custo_unitario ?? 0),
      })),
      itens_precadastro: (e?.itens_precadastro || []).map((it: any) => ({
        id: it.id,
        nome_item: it.nome_item,
        quantidade: it.quantidade,
        custo_unitario: Number(it.custo_unitario ?? 0),
        unidade_fornecedor: it.unidade_fornecedor ?? '',
        fator_conversao_fornecedor: it.fator_conversao_fornecedor ?? null,
      })),
      _tipo: (e?.tipo ?? 'compra') as string,
      _insumos: (e?.insumos || []).map((ins: any) => ({
        id: ins.id,
        item_nome: ins.item_nome || `Item #${ins.item}`,
        quantidade: ins.quantidade,
        estoque_origem_nome: ins.estoque_origem_nome || '—',
      })),
    } as EntradaNF & { _rawStatus?: string; _rawId?: number; _criado_por_nome?: string; _aprovado_por_nome?: string; _aprovado_em?: string | null; _tipo?: string; _insumos?: any[] }));

    return baseList.filter(entrada => {

      const matchNome = entrada.fornecedor.toLowerCase().includes(filterNome.toLowerCase())
      const matchNFe = entrada.notaFiscal.toLowerCase().includes(filterNFe.toLowerCase())
      const matchStatus = filterStatus && filterStatus !== "todos" ? entrada.status.toLowerCase() === filterStatus.toLowerCase() : true
      // data from API is YYYY-MM-DD — compare directly without conversion
      const matchDataInicio = filterDataInicio ? entrada.data >= filterDataInicio : true
      const matchDataFim = filterDataFim ? entrada.data <= filterDataFim : true
      return matchNome && matchNFe && matchStatus && matchDataInicio && matchDataFim
    })
  }, [entradasApi, filterNome, filterNFe, filterStatus, filterDataInicio, filterDataFim])

  const paginatedItems = filtered
  const total = serverTotal

  const getExportData = async () => {
    const all = await fetchAllEntradas();
    return all
      .filter(e => {
        const fornecedor = e?.fornecedor_nome ?? '';
        const notaFiscal = e?.nota_fiscal_numero ?? '';
        const status = (() => {
          if (e?.status === 'aprovado') return 'Aprovada';
          if (e?.status === 'recusado') return 'Rejeitada';
          return 'Pendente';
        })();
        const data = e?.data ?? '';
        const matchNome = fornecedor.toLowerCase().includes(filterNome.toLowerCase());
        const matchNFe = notaFiscal.toLowerCase().includes(filterNFe.toLowerCase());
        const matchStatus = filterStatus && filterStatus !== "todos" ? status.toLowerCase() === filterStatus.toLowerCase() : true;
        const matchDataInicio = filterDataInicio ? data >= filterDataInicio : true;
        const matchDataFim = filterDataFim ? data <= filterDataFim : true;
        return matchNome && matchNFe && matchStatus && matchDataInicio && matchDataFim;
      })
      .map(e => ({
        Data: e?.data ?? '',
        Fornecedor: e?.fornecedor_nome ?? '',
        "Nota Fiscal": e?.nota_fiscal_numero ?? '',
        Unidade: e?.unidade_nome ?? '',
        "Custo Total": e?.custo_total ?? 0,
        Status: (() => {
          if (e?.status === 'aprovado') return 'Aprovada';
          if (e?.status === 'recusado') return 'Rejeitada';
          return 'Pendente';
        })(),
        "Criado Por": e?.criado_por_nome ?? '',
        "Aprovado Por": e?.aprovado_por_nome ?? '',
      }));
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      // Se a entrada existir apenas no state (mock), deleta do state
      if (items.some(i => i.id === deleteId)) {
        setItems(prev => prev.filter(i => i.id !== deleteId));
        toast({ title: "Removido", description: "Entrada (Mock) excluída." });
      } else {
        // Se existir na API, invoca a mutação
        deleteMutation.mutate(deleteId);
      }
      setDeleteId(null);
    }
  };

  const openEdit = (e: EntradaNF) => { setEditItem(e); setEditData({ notaFiscal: e.notaFiscal, fornecedor: e.fornecedor, unidade: e.unidade, responsavel: e.responsavel }); };
  const handleSaveEdit = () => { if (editItem) { setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...editData } : i)); setEditItem(null); toast({ title: "Salvo", description: "Entrada atualizada." }); } };
  const deleteItem = items.find(i => i.id === deleteId);

  const handleApprove = (entrada: EntradaNF & { _rawId?: number }) => {
    const apiId = entrada._rawId ?? entrada.id;
    // Call the real backend endpoint
    aprovarMutation.mutate(apiId);
  };

  const handleReject = () => {
    if (rejectItem) {
      const apiId = (rejectItem as any)._rawId ?? rejectItem.id;
      rejeitarMutation.mutate(apiId);
    }
  };

  const handleNormalizar = (entradaId: number, precadastroId: number) => {
    const sel = precadastroSelections[precadastroId];
    if (!sel || !sel.acao) return;
    const conv = conversaoSelections[precadastroId];
    normalizarMutation.mutate({
      entradaId,
      precadastroId,
      acao: sel.acao,
      itemExistenteId: sel.acao === "existente" ? sel.itemId : undefined,
      fatorConversao: conv?.fatorConversao,
      formaApresentacao: conv?.formaApresentacao,
    });
    setPrecadastroSelections(prev => { const next = { ...prev }; delete next[precadastroId]; return next; });
    setConversaoSelections(prev => { const next = { ...prev }; delete next[precadastroId]; return next; });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/entradas/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Entrada</Button>
          <ExportButton getData={getExportData} fileName="estoque-entradas" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Buscar", placeholder: "NF ou fornecedor...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" },
            { type: "text", label: "NF-e", placeholder: "Número da NF-e...", value: filterNFe, onChange: setFilterNFe, width: "min-w-[160px]" },
            { type: "select", label: "Status", placeholder: "Todos", value: filterStatus, onChange: setFilterStatus, options: [{ value: "todos", label: "Todos" }, { value: "pendente", label: "Pendente" }, { value: "aprovada", label: "Aprovada" }, { value: "rejeitada", label: "Rejeitada" }], width: "min-w-[160px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={filtered.length}
        />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-center">Data</TableHead>
                <TableHead >Responsável</TableHead>
                <TableHead >Nota Fiscal</TableHead>
                <TableHead >Fornecedor</TableHead>
                <TableHead >Unidade</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead >Aprovação</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando entradas...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-destructive">Erro ao carregar os dados. Verifique a conexão com a API.</TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma entrada encontrada.</TableCell></TableRow>
              ) : (
                paginatedItems.map((entrada) => (
                  <>
                    <TableRow key={entrada.id}>
                      <TableCell >
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleRow(entrada.id)}>
                          {expandedRows.has(entrada.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">{fmtDate(entrada.data)}</TableCell>
                      <TableCell >{entrada.responsavel}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{(entrada as any)._tipo === 'producao_local' ? '' : entrada.notaFiscal}</span>
                          {(entrada as any)._tipo === 'producao_local' && (
                            <Badge variant="outline">Produção Local</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{(entrada as any)._tipo === 'producao_local' ? '' : entrada.fornecedor}</TableCell>
                      <TableCell >{entrada.unidade}</TableCell>
                      <TableCell >{entrada.custoTotal}</TableCell>
                      <TableCell className="text-center"><StatusBadge status={entrada.status} /></TableCell>
                      <TableCell className="text-center">
                        {/* Approval column — ONLY rendered when canApprove=true.
                            Rule of Gold: assistente/usuario roles → these cells do NOT exist in the DOM. */}
                        {canApprove ? (
                          (entrada as any)._rawStatus === 'pendente' ? (
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                disabled={aprovarMutation.isPending || rejeitarMutation.isPending}
                                onClick={() => {
                                  setApprovalItem(entrada);
                                  const initConversao: Record<number, { fatorConversao: string; formaApresentacao: string }> = {};
                                  entrada.itens_precadastro.forEach(it => {
                                    initConversao[it.id] = {
                                      fatorConversao: it.fator_conversao_fornecedor ? String(it.fator_conversao_fornecedor) : "",
                                      formaApresentacao: it.unidade_fornecedor ?? "",
                                    };
                                  });
                                  setConversaoSelections(initConversao);
                                }}
                              >
                                <ClipboardCheck className="w-3.5 h-3.5" /> Analisar
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {(entrada as any)._aprovado_por_nome && (
                                <div className="flex items-center justify-center gap-1">
                                  <User className="h-3 w-3" />
                                  {(entrada as any)._aprovado_por_nome}
                                </div>
                              )}
                              {(entrada as any)._aprovado_em && (
                                <div className="flex items-center justify-center gap-1">
                                  <CalendarCheck className="h-3 w-3" />
                                  {fmtDate((entrada as any)._aprovado_em)}
                                </div>
                              )}
                              {!(entrada as any)._aprovado_por_nome && <span>—</span>}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <TableActions onView={() => setViewItem(entrada)} onEdit={() => openEdit(entrada)} onDelete={() => setDeleteId(entrada.id)} />
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(entrada.id) && (
                      <TableRow key={`${entrada.id}-items`}>
                        <TableCell colSpan={10} className="p-0">
                          <div className="bg-muted/30 p-4 space-y-4">
                            {/* Itens no estoque */}
                            {entrada.itens.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Itens no Estoque</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead >Item</TableHead>
                                      <TableHead className="text-center">Quantidade</TableHead>
                                      <TableHead className="text-center">Custo Unitário</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {entrada.itens.map(item => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.item}</TableCell>
                                        <TableCell className="text-left">{Number(item.quantidade).toLocaleString('pt-BR')}</TableCell>
                                        <TableCell className="text-center">{item.custoUnitario}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            {/* Itens pré-cadastrados */}
                            {(entrada as any).itens_precadastro?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Itens Pré-Cadastrados</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Nome</TableHead>
                                      <TableHead className="text-right">Qtd Fornecedor</TableHead>
                                      <TableHead className="text-right">Qtd Interna</TableHead>
                                      <TableHead className="text-center">Custo Unitário</TableHead>
                                      <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {(entrada as any).itens_precadastro.map((it: ItemPreCadastroNF) => {
                                      const fator = it.fator_conversao_fornecedor ? parseFloat(String(it.fator_conversao_fornecedor)) : null;
                                      const qtdInterna = fator && fator > 0 ? Math.round(it.quantidade * fator) : null;
                                      return (
                                        <TableRow key={it.id}>
                                          <TableCell>{it.nome_item}</TableCell>
                                          <TableCell className="text-right">
                                            {Number(it.quantidade).toLocaleString('pt-BR')}{it.unidade_fornecedor ? ` ${it.unidade_fornecedor}` : ""}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {qtdInterna !== null
                                              ? <span className="font-semibold">{qtdInterna.toLocaleString('pt-BR')} unid.</span>
                                              : <span className="text-muted-foreground">—</span>}
                                          </TableCell>
                                          <TableCell className="text-center">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.custo_unitario)}</TableCell>
                                          <TableCell className="text-center"><StatusBadge status="Pré-Cadastro" className="text-[10px]" /></TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            {/* Insumos de produção local */}
                            {(entrada as any)._tipo === 'producao_local' && (entrada as any)._insumos?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Insumos Utilizados</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Insumo</TableHead>
                                      <TableHead>Estoque de Origem</TableHead>
                                      <TableHead className="text-right">Qtd Consumida</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {(entrada as any)._insumos.map((ins: any) => (
                                      <TableRow key={ins.id}>
                                        <TableCell>{ins.item_nome}</TableCell>
                                        <TableCell>{ins.estoque_origem_nome}</TableCell>
                                        <TableCell className="text-right">{ins.quantidade}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                            {entrada.itens.length === 0 && !(entrada as any).itens_precadastro?.length && !(entrada as any)._insumos?.length && (
                              <p className="text-xs text-muted-foreground text-center py-2">Nenhum item registrado nesta entrada.</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
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

      {/* Analysis / Approval Dialog */}
      <Dialog open={!!approvalItem} onOpenChange={() => { setApprovalItem(null); setPrecadastroSelections({}); setConversaoSelections({}); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Análise de Entrada — {approvalItem?.notaFiscal}</DialogTitle>
          </DialogHeader>
          {approvalItem && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">Responsável:</span><p className="font-medium">{approvalItem.responsavel}</p></div>
                <div><span className="text-muted-foreground">Fornecedor:</span><p className="font-medium">{approvalItem.fornecedor}</p></div>
                <div><span className="text-muted-foreground">Unidade:</span><p className="font-medium">{approvalItem.unidade}</p></div>
                <div><span className="text-muted-foreground">Custo Total:</span><p className="font-medium">{approvalItem.custoTotal}</p></div>
              </div>

              {/* Itens já no estoque */}
              {approvalItem.itens.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Itens no Estoque</p>
                  <div className="space-y-2">
                    {approvalItem.itens.map(item => (
                      <div key={item.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3 text-sm">
                        <span className="font-medium">{item.item}</span>
                        <span className="text-muted-foreground">Qtd: {item.quantidade} • {item.custoUnitario}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itens pré-cadastrados — normalização */}
              {approvalItem.itens_precadastro.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Itens Pré-Cadastrados</p>
                  <p className="text-xs text-muted-foreground mb-3">Estes itens ainda não existem no catálogo. Normalize cada um antes de aprovar a entrada.</p>
                  <div className="space-y-3">
                    {approvalItem.itens_precadastro.map(it => {
                      const sel = precadastroSelections[it.id] ?? { acao: "", itemId: "" };
                      const isPending = normalizarMutation.isPending;
                      return (
                        <div key={it.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{it.nome_item}</p>
                              <p className="text-xs text-muted-foreground">
                                {it.fator_conversao_fornecedor && parseFloat(String(it.fator_conversao_fornecedor)) > 0 ? (
                                  <>
                                    <span>{Number(it.quantidade).toLocaleString('pt-BR')} {it.unidade_fornecedor || "unid."} × {Number(it.fator_conversao_fornecedor).toLocaleString('pt-BR')} = </span>
                                    <span className="font-semibold text-foreground">{Math.round(it.quantidade * parseFloat(String(it.fator_conversao_fornecedor))).toLocaleString('pt-BR')} unid. internas</span>
                                    <span> • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.custo_unitario)}</span>
                                  </>
                                ) : (
                                  <>Qtd: {Number(it.quantidade).toLocaleString('pt-BR')}{it.unidade_fornecedor ? ` ${it.unidade_fornecedor}` : ""} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(it.custo_unitario)}</>
                                )}
                              </p>
                            </div>
                            <StatusBadge status="Pré-Cadastro" className="text-[10px]" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm" variant={sel.acao === "novo" ? "default" : "outline"}
                                className="h-8 text-xs flex-1"
                                onClick={() => setPrecadastroSelections(p => ({ ...p, [it.id]: { acao: "novo", itemId: "" } }))}
                              >
                                Criar Novo Item
                              </Button>
                              <Button
                                size="sm" variant={sel.acao === "existente" ? "default" : "outline"}
                                className="h-8 text-xs flex-1"
                                onClick={() => setPrecadastroSelections(p => ({ ...p, [it.id]: { acao: "existente", itemId: "" } }))}
                              >
                                Vincular a Existente
                              </Button>
                            </div>
                            {sel.acao === "existente" && (
                              <Popover open={openComboboxIds[it.id] ?? false} onOpenChange={v => setOpenComboboxIds(p => ({ ...p, [it.id]: v }))}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" role="combobox" className="h-8 text-xs w-full justify-between font-normal">
                                    {sel.itemId ? optionsEstoque.find(o => o.value === sel.itemId)?.label : "Selecione o item do estoque..."}
                                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[320px]">
                                  <Command>
                                    <CommandInput placeholder="Buscar item..." className="h-8 text-xs" />
                                    <CommandList>
                                      <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                                      {optionsEstoque.map(opt => (
                                        <CommandItem key={opt.value} value={opt.label} onSelect={() => {
                                          setPrecadastroSelections(p => ({ ...p, [it.id]: { acao: "existente", itemId: opt.value } }));
                                          setOpenComboboxIds(p => ({ ...p, [it.id]: false }));
                                        }}>
                                          <Check className={cn("mr-2 h-3.5 w-3.5", sel.itemId === opt.value ? "opacity-100" : "opacity-0")} />
                                          {opt.label}
                                        </CommandItem>
                                      ))}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            )}
                            {sel.acao && (sel.acao === "novo" || sel.itemId) && (() => {
                              const conv = conversaoSelections[it.id];
                              const conversaoValida = !!conv?.formaApresentacao && !!conv?.fatorConversao && parseFloat(conv.fatorConversao) > 0;
                              return (
                                <>
                                  <div className="border border-border rounded-md p-3 space-y-2 bg-background">
                                    <p className="text-xs font-semibold">Conversão de unidade <span className="text-destructive">*</span></p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Unidade do Fornecedor <span className="text-destructive">*</span></Label>
                                        <Input
                                          className="h-7 text-xs"
                                          placeholder="Ex: CENTO"
                                          value={conv?.formaApresentacao ?? ""}
                                          onChange={e => setConversaoSelections(p => ({ ...p, [it.id]: { ...p[it.id], formaApresentacao: e.target.value } }))}
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Fator (1 unid. = ?) <span className="text-destructive">*</span></Label>
                                        <Input
                                          className="h-7 text-xs"
                                          type="number"
                                          min="0.0001"
                                          step="any"
                                          placeholder="Ex: 100"
                                          value={conv?.fatorConversao ?? ""}
                                          onChange={e => setConversaoSelections(p => ({ ...p, [it.id]: { ...p[it.id], fatorConversao: e.target.value } }))}
                                        />
                                      </div>
                                    </div>
                                    {conv?.fatorConversao && parseFloat(conv.fatorConversao) > 0 && (
                                      <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                                        <span>{Number(it.quantidade).toLocaleString('pt-BR')} {conv.formaApresentacao || "unid."} × {Number(conv.fatorConversao).toLocaleString('pt-BR')} =</span>
                                        <span className="font-semibold text-foreground">
                                          {Math.round(it.quantidade * parseFloat(conv.fatorConversao)).toLocaleString('pt-BR')} unid. internas
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm" className="h-8 text-xs gap-1 self-end"
                                    disabled={isPending || !conversaoValida}
                                    onClick={() => handleNormalizar((approvalItem as any)._rawId ?? approvalItem.id, it.id)}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Confirmar Normalização
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {approvalItem.itens.length === 0 && approvalItem.itens_precadastro.length === 0 && (
                <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded text-center">Nenhum item registrado nesta entrada.</p>
              )}

              <DialogFooter className="gap-2 pt-4">
                <Button variant="outline" onClick={() => { setRejectItem(approvalItem); setApprovalItem(null); setPrecadastroSelections({}); }} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <XCircle className="w-4 h-4" /> Negar
                </Button>
                <Button
                  onClick={() => handleApprove(approvalItem)}
                  disabled={aprovarMutation.isPending || rejeitarMutation.isPending}
                  className="gap-1.5"
                >
                  <ClipboardCheck className="w-4 h-4" /> Aprovar Entrada
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectItem} onOpenChange={() => { setRejectItem(null); setRejectJustificativa(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificativa de Rejeição</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe o motivo para rejeitar a entrada <strong>{rejectItem?.notaFiscal}</strong>.</p>
            <Textarea value={rejectJustificativa} onChange={(e) => setRejectJustificativa(e.target.value)} placeholder="Motivo da rejeição..." className="min-h-[100px]" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectItem(null); setRejectJustificativa(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectJustificativa.trim()}>Confirmar Rejeição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conciliate Dialog (from table) */}
      <Dialog open={!!conciliateItem && !approvalItem} onOpenChange={() => { setConciliateItem(null); setConciliateWith(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conciliar Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Vincule <strong>{conciliateItem?.itemNF.item}</strong> a um item existente no estoque:</p>
            <Popover open={conciliateComboboxOpen} onOpenChange={setConciliateComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {conciliateWith ? optionsEstoque.find(o => o.value === conciliateWith)?.label : "Selecione o item de estoque"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[400px]">
                <Command>
                  <CommandInput placeholder="Buscar item..." />
                  <CommandList>
                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                    {optionsEstoque.map(opt => (
                      <CommandItem key={opt.value} value={opt.label} onSelect={() => {
                        setConciliateWith(opt.value);
                        setConciliateComboboxOpen(false);
                      }}>
                        <Check className={cn("mr-2 h-4 w-4", conciliateWith === opt.value ? "opacity-100" : "opacity-0")} />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setConciliateItem(null); setConciliateWith(""); }}>Cancelar</Button>
            <Button onClick={handleConciliate} disabled={!conciliateWith}>Conciliar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes da Entrada — {viewItem?.notaFiscal}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{fmtDate(viewItem.data)}</p></div>
                <div><span className="text-muted-foreground">Responsável:</span><p className="font-medium">{viewItem.responsavel}</p></div>
                <div><span className="text-muted-foreground">Fornecedor:</span><p className="font-medium">{viewItem.fornecedor}</p></div>
                <div><span className="text-muted-foreground">Unidade:</span><p className="font-medium">{viewItem.unidade}</p></div>
                <div><span className="text-muted-foreground">Custo Total:</span><p className="font-medium">{viewItem.custoTotal}</p></div>
                <div><span className="text-muted-foreground">Status:</span><StatusBadge status={viewItem.status} /></div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Itens</p>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead >Item</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-center">Tipo</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {viewItem.itens.map(it => (
                      <TableRow key={it.id}>
                        <TableCell >{it.item}</TableCell>
                        <TableCell >{it.quantidade}</TableCell>
                        <TableCell >{it.custoUnitario}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={it.tipo === "novo" ? "Pré-Cadastro" : "Aprovada"} className="text-[10px]" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Entrada</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Nota Fiscal</Label><Input value={editData.notaFiscal} onChange={e => setEditData(p => ({ ...p, notaFiscal: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Fornecedor</Label><Input value={editData.fornecedor} onChange={e => setEditData(p => ({ ...p, fornecedor: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Unidade</Label><Input value={editData.unidade} onChange={e => setEditData(p => ({ ...p, unidade: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Responsável</Label><Input value={editData.responsavel} onChange={e => setEditData(p => ({ ...p, responsavel: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir a entrada <strong>{deleteItem?.notaFiscal}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
