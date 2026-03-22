import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Upload, ChevronDown, ChevronRight, XCircle, Link2, ClipboardCheck, CheckCircle, User, CalendarCheck } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { usePermissions } from "@/contexts/PermissionsContext"
import { Entradas } from "@/types/estoque"
import { fetchItensEstoque } from "@/services/estoque"

interface ItemNF {
  id: number;
  item: string;
  marca: string;
  quantidade: number;
  custoUnitario: string;
  especificacoes: string;
  tipo: "novo" | "existente";
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
  const { currentUser } = usePermissions();

  // ── RBAC guard: only gestor/diretor/admin see and trigger approval actions
  const APPROVAL_ROLES = ["admin", "diretor", "gestor"];
  const currentRole = (currentUser?.roles?.[0] ?? "usuario").toLowerCase();
  const canApprove = APPROVAL_ROLES.includes(currentRole);

  // Fetch reais da API
  const [currentPage, setCurrentPage] = useState(1);
  const { data: entradasResponse, isLoading, isError } = useQuery({
    queryKey: ['entradas_estoque', currentPage],
    queryFn: async () => {
      const res = await api.get('/api/estoque/entradas/', { params: { page: currentPage } });
      return res.data;
    }
  });
  const entradasApi = Array.isArray(entradasResponse) ? entradasResponse : (entradasResponse?.results ?? []);
  const totalCount = Array.isArray(entradasResponse) ? entradasResponse.length : (entradasResponse?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const { data: itensEstoque = [] } = useQuery({
    queryKey: ['itens_estoque'],
    queryFn: fetchItensEstoque
  });

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

  const [items, setItems] = useState<EntradaNF[]>(() => {
    const newEntries = loadSavedEntries();
    return [...newEntries, ...mockEntradas];
  });

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
  // Conciliation
  const [conciliateItem, setConciliateItem] = useState<{ entrada: EntradaNF; itemNF: ItemNF } | null>(null)
  const [conciliateWith, setConciliateWith] = useState("")

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
    // Simularemos o merge ou substituição dos mocks. Aqui substituiremos na base de "entradasApi" se disponíveis,
    // ou deixamos o mock para não quebrar a UI se a API ainda estiver vazia/sendo povoada localmente.
    const hasApiData = Array.isArray(entradasApi) && entradasApi.length > 0;
    const baseList = hasApiData ?
      entradasApi.map(e => ({
        id: e?.id || 0,
        data: e?.data || e?.data_de_chegada || "",
        responsavel: e?.criado_por_nome || "—",
        notaFiscal: e?.nota_fiscal || e?.numeracao_nf || `NF-${e?.id}`,
        fornecedor: e?.fornecedor_nome || String(e?.fornecedor || ""),
        unidade: "—",
        custoTotal: e?.custo_total != null
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e.custo_total)
          : "R$ 0,00",
        status: (() => {
          // Map backend lowercase to display label for StatusBadge
          if (e?.status === 'aprovado') return 'Aprovada';
          if (e?.status === 'recusado') return 'Rejeitada';
          return 'Pré-Cadastro'; // pendente default
        })(),
        _rawStatus: e?.status as string | undefined,
        _rawId: e?.id,
        _criado_por_nome: e?.criado_por_nome,
        _aprovado_por_nome: e?.aprovado_por_nome,
        _aprovado_em: e?.aprovado_em,
        itens: []
      } as EntradaNF & { _rawStatus?: string; _rawId?: number; _criado_por_nome?: string; _aprovado_por_nome?: string; _aprovado_em?: string | null }))
      : items;

    return baseList.filter(entrada => {
      const matchNome = entrada.notaFiscal.toLowerCase().includes(filterNome.toLowerCase()) || entrada.fornecedor.toLowerCase().includes(filterNome.toLowerCase())
      const matchNFe = entrada.notaFiscal.toLowerCase().includes(filterNFe.toLowerCase())
      const matchStatus = filterStatus && filterStatus !== "todos" ? entrada.status.toLowerCase() === filterStatus.toLowerCase() : true
      const matchDataInicio = filterDataInicio ? entrada.data >= filterDataInicio.split("-").reverse().join("/") : true
      const matchDataFim = filterDataFim ? entrada.data <= filterDataFim.split("-").reverse().join("/") : true
      return matchNome && matchNFe && matchStatus && matchDataInicio && matchDataFim
    })
  }, [items, entradasApi, filterNome, filterNFe, filterStatus, filterDataInicio, filterDataFim])

  const getExportData = () => filtered.map(e => ({ Data: e.data, Responsável: e.responsavel, "Nota Fiscal": e.notaFiscal, Fornecedor: e.fornecedor, Unidade: e.unidade, "Custo Total": e.custoTotal, Status: e.status }));

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

  const handleConciliate = () => {
    if (conciliateItem && conciliateWith) {
      setItems(prev => prev.map(entrada => {
        if (entrada.id === conciliateItem.entrada.id) {
          return {
            ...entrada,
            itens: entrada.itens.map(it => it.id === conciliateItem.itemNF.id ? { ...it, tipo: "existente" as const, item: optionsEstoque.find(i => i.value === conciliateWith)?.label || it.item } : it)
          }
        }
        return entrada
      }));
      setConciliateItem(null);
      setConciliateWith("");
      toast({ title: "Conciliado", description: "Item conciliado com estoque existente." });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/entradas/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Entrada</Button>
          <Button onClick={() => navigate("/estoque/entradas/upload-nfe")} variant="outline" className="gap-2 border-border"><Upload className="w-4 h-4" />Upload NF-e<ChevronDown className="w-4 h-4" /></Button>
          <ExportButton getData={getExportData} fileName="estoque-entradas" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Buscar", placeholder: "NF ou fornecedor...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" },
            { type: "text", label: "NF-e", placeholder: "Número da NF-e...", value: filterNFe, onChange: setFilterNFe, width: "min-w-[160px]" },
            { type: "select", label: "Status", placeholder: "Todos", value: filterStatus, onChange: setFilterStatus, options: [{ value: "todos", label: "Todos" }, { value: "pré-cadastro", label: "Pré-Cadastro" }, { value: "aprovada", label: "Aprovada" }, { value: "rejeitada", label: "Rejeitada" }], width: "min-w-[160px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={totalCount}
        />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-12"></TableHead>
                <TableHead className="text-center">Data</TableHead>
                <TableHead className="text-center">Responsável</TableHead>
                <TableHead className="text-center">Nota Fiscal</TableHead>
                <TableHead className="text-center">Fornecedor</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-center">Custo Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Aprovação</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando entradas...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-destructive">Erro ao carregar os dados. Verifique a conexão com a API.</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma entrada encontrada.</TableCell></TableRow>
              ) : (
                filtered.map((entrada) => (
                  <>
                    <TableRow key={entrada.id}>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleRow(entrada.id)}>
                          {expandedRows.has(entrada.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">{entrada.data}</TableCell>
                      <TableCell className="text-center">{entrada.responsavel}</TableCell>
                      <TableCell className="text-center">{entrada.notaFiscal}</TableCell>
                      <TableCell className="text-center">{entrada.fornecedor}</TableCell>
                      <TableCell className="text-center">{entrada.unidade}</TableCell>
                      <TableCell className="text-center">{entrada.custoTotal}</TableCell>
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
                                onClick={() => setApprovalItem(entrada)}
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
                                  {new Date((entrada as any)._aprovado_em).toLocaleDateString('pt-BR')}
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
                          <div className="bg-muted/30 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Itens da Nota Fiscal</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-center">Item</TableHead>
                                  <TableHead className="text-center">Marca</TableHead>
                                  <TableHead className="text-center">Quantidade</TableHead>
                                  <TableHead className="text-center">Custo Unitário</TableHead>
                                  <TableHead className="text-center">Especificações</TableHead>
                                  <TableHead className="text-center">Tipo</TableHead>
                                  {entrada.status === "Pré-Cadastro" && <TableHead className="text-center">Conciliar</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {entrada.itens.map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell className="text-center">{item.item}</TableCell>
                                    <TableCell className="text-center">{item.marca}</TableCell>
                                    <TableCell className="text-center">{item.quantidade}</TableCell>
                                    <TableCell className="text-center">{item.custoUnitario}</TableCell>
                                    <TableCell className="text-center">{item.especificacoes}</TableCell>
                                    <TableCell className="text-center">
                                      <StatusBadge status={item.tipo === "novo" ? "Pré-Cadastro" : "Aprovada"} className="text-[10px] min-w-[70px]" />
                                    </TableCell>
                                    {entrada.status === "Pré-Cadastro" && (
                                      <TableCell className="text-center">
                                        {item.tipo === "novo" && (
                                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-blue-600" onClick={() => setConciliateItem({ entrada, itemNF: item })}>
                                            <Link2 className="w-3 h-3" /> Conciliar
                                          </Button>
                                        )}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
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
              <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages} ({totalCount} registros)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis / Approval Dialog */}
      <Dialog open={!!approvalItem} onOpenChange={() => setApprovalItem(null)}>
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

              <div>
                <p className="text-sm font-semibold mb-3">Itens para análise</p>
                <div className="space-y-3">
                  {approvalItem.itens.map(item => (
                    <div key={item.id} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{item.item}</p>
                          <p className="text-xs text-muted-foreground">{item.marca} • Qtd: {item.quantidade} • {item.custoUnitario} {item.especificacoes && `• ${item.especificacoes}`}</p>
                        </div>
                        <StatusBadge status={item.tipo === "novo" ? "Pré-Cadastro" : "Aprovada"} className="text-[10px] min-w-[70px]" />
                      </div>
                      {item.tipo === "novo" && (
                        <div className="flex items-end gap-3 bg-muted/40 rounded p-3">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Conciliar com item existente (opcional)</Label>
                            <Select
                              value={conciliateItem?.itemNF.id === item.id ? conciliateWith : ""}
                              onValueChange={(v) => {
                                setConciliateItem({ entrada: approvalItem, itemNF: item });
                                setConciliateWith(v);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent className="bg-popover">
                                {optionsEstoque.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          {conciliateItem?.itemNF.id === item.id && conciliateWith && (
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={handleConciliate}>
                              <Link2 className="w-3 h-3" /> Conciliar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded">
                <strong>Nota:</strong> Itens marcados como "Novo" serão automaticamente cadastrados em Cadastro → Estoque → Itens ao aprovar esta entrada.
              </p>

              <DialogFooter className="gap-2 pt-4">
                <Button variant="outline" onClick={() => { setRejectItem(approvalItem); setApprovalItem(null); }} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <XCircle className="w-4 h-4" /> Negar
                </Button>
                <Button onClick={() => handleApprove(approvalItem)} className="gap-1.5">
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
            <Select value={conciliateWith} onValueChange={setConciliateWith}>
              <SelectTrigger><SelectValue placeholder="Selecione o item de estoque" /></SelectTrigger>
              <SelectContent className="bg-popover">
                {optionsEstoque.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
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
                <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{viewItem.data}</p></div>
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
                    <TableHead className="text-center">Item</TableHead><TableHead className="text-center">Qtd</TableHead><TableHead className="text-center">Custo</TableHead><TableHead className="text-center">Tipo</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {viewItem.itens.map(it => (
                      <TableRow key={it.id}>
                        <TableCell className="text-center">{it.item}</TableCell>
                        <TableCell className="text-center">{it.quantidade}</TableCell>
                        <TableCell className="text-center">{it.custoUnitario}</TableCell>
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
