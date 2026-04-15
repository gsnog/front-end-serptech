import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ClipboardCheck, CheckCircle, User } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { SortableHead } from "@/components/SortableHead";
import { toast } from "@/hooks/use-toast";
import { useSortable } from "@/hooks/useSortable";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  fetchOrdensServico, deleteOrdemServico, ordensServicoQueryKey, type OrdemServico,
  fetchFornecedores, fornecedoresQueryKey,
} from "@/services/estoque";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

const TIPO_LABEL: Record<string, string> = {
  servicos_gerais: "Serviços Gerais",
  imobilizado: "Patrimônio / Imobilizado",
  suporte: "Suporte de TI",
};

const MANAGE_ROLES = ["admin", "diretor", "gestor"];

const OrdemServicoPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { currentUser, getScope } = usePermissions();
  const currentRole = (currentUser?.roles?.[0] ?? "usuario").toLowerCase();
  const canManage = MANAGE_ROLES.includes(currentRole);
  const scope = getScope('estoque', 'est_ordens_servico');
  const currentUserId = currentUser?.userId ? Number(currentUser.userId) : null;

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") ?? "");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<OrdemServico | null>(null);
  const [analisarItem, setAnalisarItem] = useState<OrdemServico | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [dataResolucao, setDataResolucao] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");

  useRealtimeUpdates([[...ordensServicoQueryKey]]);

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, filterStatus, filterTipo, filterResponsavel]);

  const { data: response, isLoading } = useQuery({
    queryKey: [...ordensServicoQueryKey, page],
    queryFn: () => fetchOrdensServico(page),
  });
  const allItems = response?.results ?? [];
  const serverTotal = response?.count ?? 0;

  const { data: fornecedoresRaw = [] } = useQuery({ queryKey: fornecedoresQueryKey, queryFn: fetchFornecedores });
  const fornecedores = (Array.isArray(fornecedoresRaw) ? fornecedoresRaw : (fornecedoresRaw as any)?.results ?? []) as any[];
  const fornecedorOptions = fornecedores.map((f: any) => ({ value: String(f.id), label: f.nome }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ordensServicoQueryKey });

  const deleteMutation = useMutation({
    mutationFn: deleteOrdemServico,
    onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Removida", description: "Ordem de serviço excluída." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const resetAnalisar = () => { setAnalisarItem(null); setFeedbackText(""); setDataResolucao(""); setFornecedorId(""); };

  const finalizarMutation = useMutation({
    mutationFn: async ({ id, feedback, data_de_resolucao, fornecedor }: { id: number; feedback: string; data_de_resolucao: string; fornecedor: string }) =>
      (await api.post(`/api/estoque/ordens-servico/${id}/finalizar/`, { feedback, data_de_resolucao, fornecedor: fornecedor || undefined })).data,
    onSuccess: () => {
      invalidate();
      resetAnalisar();
      toast({ title: "Finalizada!", description: "Ordem de serviço finalizada com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao finalizar", description: error.response?.data?.detail ?? "Tente novamente.", variant: "destructive" });
    },
  });

  const responsaveisUnicos = Array.from(new Set(allItems.map(o => o.usuario_nome).filter(Boolean)));
  const responsavelOptions = [
    { value: "todos", label: "Todos" },
    ...responsaveisUnicos.map(r => ({ value: r!, label: r! }))
  ];

  const filtered = useMemo(() => allItems.filter(o => {
    const matchSearch =
      o.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      o.tipo_de_ordem?.toLowerCase().includes(search.toLowerCase()) ||
      o.usuario_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus && filterStatus !== "todos" ? o.status === filterStatus : true;
    const matchTipo = filterTipo && filterTipo !== "todos" ? o.tipo_de_ordem === filterTipo : true;
    const matchResponsavel = filterResponsavel && filterResponsavel !== "todos" ? o.usuario_nome === filterResponsavel : true;
    const matchScope = scope === 'self' && currentUserId != null ? o.user === currentUserId : true;
    return matchSearch && matchStatus && matchTipo && matchResponsavel && matchScope;
  }), [allItems, search, filterStatus, filterTipo, filterResponsavel, scope, currentUserId]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered);
  const total = serverTotal;
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const getExportData = () => filtered.map(o => ({
    Nº: o.numero,
    Tipo: TIPO_LABEL[o.tipo_de_ordem || ""] || o.tipo_de_ordem,
    Descrição: o.descricao,
    Status: o.status === 'analise' ? 'Em Análise' : 'Finalizado',
    Solicitante: o.usuario_nome,
  }));
  const deleteItemObj = allItems.find(i => i.id === deleteId);

  const statusLabel = (s?: string) => s === 'analise' ? 'Em Análise' : s === 'finalizado' ? 'Finalizado' : (s || '');

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/estoque/ordem-servico/nova")} className="gap-2">
            <Plus className="w-4 h-4" />Nova Ordem de Serviço
          </Button>
          <ExportButton getData={getExportData} fileName="ordens-servico" />
        </div>
        <p className="text-sm text-muted-foreground">
          Utilize para registrar e acompanhar serviços de manutenção ou terceirizados.
        </p>
        <FilterSection
          fields={[
            { type: "text" as const, label: "Buscar", placeholder: "Buscar por tipo, descrição ou solicitante...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" },
            {
              type: "select" as const, label: "Status", placeholder: "Todos", value: filterStatus, onChange: setFilterStatus,
              options: [
                { value: "todos", label: "Todos" },
                { value: "analise", label: "Em Análise" },
                { value: "finalizado", label: "Finalizado" },
              ], width: "min-w-[160px]"
            },
            {
              type: "select" as const, label: "Tipo", placeholder: "Todos", value: filterTipo, onChange: setFilterTipo,
              options: [
                { value: "todos", label: "Todos" },
                { value: "servicos_gerais", label: "Serviços Gerais" },
                { value: "imobilizado", label: "Patrimônio / Imobilizado" },
                { value: "suporte", label: "Suporte de TI" },
              ], width: "min-w-[200px]"
            },
            { type: "select" as const, label: "Responsável", placeholder: "Todos", value: filterResponsavel, onChange: setFilterResponsavel, options: responsavelOptions, width: "min-w-[160px]" }
          ]}
          resultsCount={filtered.length}
        />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <SortableHead label="Nº" field="numero" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Tipo" field="tipo_de_ordem" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Descrição" field="descricao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Solicitante" field="usuario_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead label="Status" field="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <TableHead className="font-semibold">Finalizado por</TableHead>
                {canManage && <TableHead className="font-semibold">Gestão</TableHead>}
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={canManage ? 8 : 7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : sorted.length === 0 ? (
                <TableRow><TableCell colSpan={canManage ? 8 : 7} className="text-center py-8 text-muted-foreground">Nenhuma ordem de serviço encontrada.</TableCell></TableRow>
              ) : sorted.map(o => (
                <TableRow key={o.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-mono">{o.numero}</TableCell>
                  <TableCell >{TIPO_LABEL[o.tipo_de_ordem || ""] || o.tipo_de_ordem}</TableCell>
                  <TableCell className="font-medium">{o.descricao}</TableCell>
                  <TableCell >{o.usuario_nome}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={statusLabel(o.status)} />
                  </TableCell>
                  <TableCell >
                    {o.finalizado_por_nome ? (
                      <span className="text-xs flex items-center justify-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {o.finalizado_por_nome}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell >
                      {o.status === 'analise' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => { setAnalisarItem(o); setFeedbackText(""); setDataResolucao(new Date().toISOString().split("T")[0]); setFornecedorId(""); }}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" /> Analisar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Finalizada
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <TableActions
                      onView={() => setViewItem(o)}
                      onEdit={() => navigate(`/estoque/ordem-servico/${o.id}`)}
                      onDelete={() => setDeleteId(o.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Modal: Visualizar */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>OS #{viewItem?.numero} — {TIPO_LABEL[viewItem?.tipo_de_ordem || ""] || viewItem?.tipo_de_ordem}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="text-muted-foreground">Solicitante</span><span className="font-medium">{viewItem.usuario_nome || "—"}</span>
                <span className="text-muted-foreground">Status</span><span className="font-medium">{statusLabel(viewItem.status)}</span>
                <span className="text-muted-foreground">Data Solicitação</span><span className="font-medium">{viewItem.data_solicitacao || "—"}</span>
                {viewItem.data_de_resolucao && <><span className="text-muted-foreground">Data Resolução</span><span className="font-medium">{viewItem.data_de_resolucao}</span></>}
                {viewItem.status === 'finalizado' && viewItem.fornecedor_nome && <><span className="text-muted-foreground">Fornecedor Responsável</span><span className="font-medium">{viewItem.fornecedor_nome}</span></>}
                {viewItem.finalizado_por_nome && <><span className="text-muted-foreground">Finalizado por</span><span className="font-medium flex items-center gap-1"><User className="w-3 h-3 text-muted-foreground" />{viewItem.finalizado_por_nome}</span></>}
              </div>
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-1">Descrição</p>
                <p className="font-medium">{viewItem.descricao}</p>
              </div>
              {viewItem.filho_servicos_gerais && viewItem.filho_servicos_gerais.length > 0 && (
                <div className="border-t pt-3 space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Serviços Gerais</p>
                  {viewItem.filho_servicos_gerais.map(f => (
                    <div key={f.id} className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Unidade</span><span>{f.unidade_nome || f.unidade}</span>
                      <span className="text-muted-foreground">Setor</span><span>{f.setor_nome || f.setor}</span>
                      <span className="text-muted-foreground">Tipo Serviço</span><span>{f.tipo_servico}</span>
                    </div>
                  ))}
                </div>
              )}
              {viewItem.filho_imobilizado && viewItem.filho_imobilizado.length > 0 && (
                <div className="border-t pt-3 space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Patrimônio</p>
                  {viewItem.filho_imobilizado.map(f => (
                    <div key={f.id} className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Patrimônio</span><span>{f.patrimonio_codigo || f.patrimonio}</span>
                      <span className="text-muted-foreground">Tipo Serviço</span><span>{f.tipo_servico}</span>
                    </div>
                  ))}
                </div>
              )}
              {viewItem.filho_suporte && viewItem.filho_suporte.length > 0 && (
                <div className="border-t pt-3 space-y-1">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Suporte de TI</p>
                  {viewItem.filho_suporte.map(f => (
                    <div key={f.id} className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Tipo Suporte</span><span>{f.tipo_suporte}</span>
                      {f.software_nome && <><span className="text-muted-foreground">Software</span><span>{f.software_nome}</span></>}
                    </div>
                  ))}
                </div>
              )}
              {viewItem.feedback && viewItem.feedback !== 'Feedback ainda não cadastrado' && (
                <div className="border-t pt-3">
                  <p className="text-muted-foreground mb-1">Feedback</p>
                  <p>{viewItem.feedback}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Analisar / Finalizar */}
      <Dialog open={!!analisarItem} onOpenChange={resetAnalisar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Analisar OS #{analisarItem?.numero}
            </DialogTitle>
          </DialogHeader>
          {analisarItem && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 rounded bg-muted/30 border">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium">{TIPO_LABEL[analisarItem.tipo_de_ordem || ""] || analisarItem.tipo_de_ordem}</span>
                <span className="text-muted-foreground">Solicitante</span>
                <span className="font-medium">{analisarItem.usuario_nome || "—"}</span>
                <span className="text-muted-foreground">Data Abertura</span>
                <span className="font-medium">{analisarItem.data_solicitacao || "—"}</span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Descrição</p>
                <p className="font-medium">{analisarItem.descricao}</p>
              </div>

              {analisarItem.filho_servicos_gerais && analisarItem.filho_servicos_gerais.length > 0 && (
                <div className="space-y-1 p-3 rounded bg-muted/30 border">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Serviços Gerais</p>
                  {analisarItem.filho_servicos_gerais.map(f => (
                    <div key={f.id} className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Unidade</span><span>{f.unidade_nome || f.unidade}</span>
                      <span className="text-muted-foreground">Setor</span><span>{f.setor_nome || f.setor}</span>
                      <span className="text-muted-foreground">Tipo Serviço</span><span>{f.tipo_servico}</span>
                    </div>
                  ))}
                </div>
              )}
              {analisarItem.filho_imobilizado && analisarItem.filho_imobilizado.length > 0 && (
                <div className="space-y-1 p-3 rounded bg-muted/30 border">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Patrimônio</p>
                  {analisarItem.filho_imobilizado.map(f => (
                    <div key={f.id} className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Patrimônio</span><span>{f.patrimonio_codigo || f.patrimonio}</span>
                      <span className="text-muted-foreground">Tipo Serviço</span><span>{f.tipo_servico}</span>
                    </div>
                  ))}
                </div>
              )}
              {analisarItem.filho_suporte && analisarItem.filho_suporte.length > 0 && (
                <div className="space-y-1 p-3 rounded bg-muted/30 border">
                  <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Suporte de TI</p>
                  {analisarItem.filho_suporte.map(f => (
                    <div key={f.id} className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">Tipo Suporte</span><span>{f.tipo_suporte}</span>
                      {f.software_nome && <><span className="text-muted-foreground">Software</span><span>{f.software_nome}</span></>}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data de Finalização <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={dataResolucao}
                      onChange={e => setDataResolucao(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fornecedor do Serviço (opcional)</Label>
                    <SearchableSelect
                      options={fornecedorOptions}
                      value={fornecedorId}
                      onValueChange={setFornecedorId}
                      placeholder="Selecione o fornecedor"
                      searchPlaceholder="Pesquisar..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Feedback / Resolução (opcional)</Label>
                  <Textarea
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    placeholder="Descreva a resolução ou observações sobre o atendimento..."
                    className="form-input min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 pt-2 border-t">
            <Button variant="outline" onClick={resetAnalisar} disabled={finalizarMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!dataResolucao) {
                  toast({ title: "Informe a data de finalização", variant: "destructive" });
                  return;
                }
                analisarItem && finalizarMutation.mutate({
                  id: analisarItem.id,
                  feedback: feedbackText,
                  data_de_resolucao: dataResolucao,
                  fornecedor: fornecedorId,
                });
              }}
              disabled={finalizarMutation.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {finalizarMutation.isPending ? "Finalizando..." : "Finalizar OS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Excluir */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir a OS <strong>#{deleteItemObj?.numero}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription>
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

export default OrdemServicoPage;
