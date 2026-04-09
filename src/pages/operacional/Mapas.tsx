import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Plus, FileText, Loader2, ChevronRight, Upload, AlertCircle, CheckCircle, Edit2, X, Search, Trash2 } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { toast } from "@/hooks/use-toast";
import {
  fetchMapas, deleteMapa, uploadMapa, fetchMapaFilhos,
  updateMapaFilho, setMapaFilhoPendente, conciliarMapaFilho,
  mapasQueryKey, mapaFilhosQueryKey,
  type MapaPrincipal, type MapaFilho, type MapasFiltros,
} from "@/services/operacional";
import { fetchMedicos, type Medico } from "@/services/pessoas";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return status === 'concluido'
    ? <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle className="h-3 w-3" />Concluído</Badge>
    : <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1"><AlertCircle className="h-3 w-3" />Pendente</Badge>;
}

// ─── Child maps panel ─────────────────────────────────────────────────────────
function FilhosPanel({ mapaId, onClose }: { mapaId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [pendenteId, setPendenteId] = useState<number | null>(null);
  const [pendenteObs, setPendenteObs] = useState("");
  const [conciliarId, setConciliarId] = useState<number | null>(null);
  const [conciliarFilho, setConciliarFilho] = useState<MapaFilho | null>(null);
  const [conciliarObs, setConciliarObs] = useState("");
  const conciliarFileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: mapaFilhosQueryKey(mapaId) });
    queryClient.invalidateQueries({ queryKey: mapasQueryKey });
  };

  const { data: filhos = [], isLoading } = useQuery({
    queryKey: mapaFilhosQueryKey(mapaId),
    queryFn: () => fetchMapaFilhos(mapaId),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, nome }: { id: number; nome: string }) => updateMapaFilho(id, nome),
    onSuccess: () => { invalidate(); setEditId(null); },
    onError: () => toast({ title: "Erro ao renomear.", variant: "destructive" }),
  });

  const pendenteMutation = useMutation({
    mutationFn: ({ id, obs }: { id: number; obs: string }) => setMapaFilhoPendente(id, obs),
    onSuccess: () => { invalidate(); setPendenteId(null); setPendenteObs(""); },
    onError: () => toast({ title: "Erro ao marcar como pendente.", variant: "destructive" }),
  });

  const conciliarMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => conciliarMapaFilho(id, formData),
    onSuccess: () => { invalidate(); setConciliarId(null); setConciliarFilho(null); setConciliarObs(""); toast({ title: "Mapa conciliado com sucesso." }); },
    onError: () => toast({ title: "Erro ao conciliar.", variant: "destructive" }),
  });

  const handleConciliar = () => {
    const file = conciliarFileRef.current?.files?.[0];
    if (!file) { toast({ title: "Selecione um arquivo PDF.", variant: "destructive" }); return; }
    const fd = new FormData();
    fd.append('arquivo_pdf', file);
    if (conciliarObs) fd.append('observacao', conciliarObs);
    conciliarMutation.mutate({ id: conciliarId!, formData: fd });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Mapas Filhos — #{mapaId}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filhos.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Nenhum mapa filho encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome (Página)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PDF Atual</TableHead>
                  <TableHead>PDF Original</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filhos.map((filho: MapaFilho) => (
                  <TableRow key={filho.id}>
                    <TableCell>
                      {editId === filho.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editNome}
                            onChange={e => setEditNome(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button size="sm" className="h-7 px-2"
                            disabled={renameMutation.isPending}
                            onClick={() => renameMutation.mutate({ id: filho.id, nome: editNome })}>
                            {renameMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono text-sm">{filho.nome}</span>
                          {filho.observacao && filho.status === 'pendente' && (
                            <p className="text-xs text-yellow-600 mt-0.5 truncate max-w-[180px]" title={filho.observacao}>
                              {filho.observacao}
                            </p>
                          )}
                          {filho.observacao_conciliacao && filho.status === 'concluido' && filho.arquivo_pdf_original_url && (
                            <p className="text-xs text-green-600 mt-0.5 truncate max-w-[180px]" title={filho.observacao_conciliacao}>
                              {filho.observacao_conciliacao}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={filho.status} /></TableCell>
                    <TableCell>
                      {filho.arquivo_pdf_url ? (
                        <a href={filho.arquivo_pdf_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <FileText className="h-3 w-3" /> Ver
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {filho.arquivo_pdf_original_url ? (
                        <a href={filho.arquivo_pdf_original_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                          <FileText className="h-3 w-3" /> Original
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="ghost" className="h-7 px-2" title="Renomear"
                          onClick={() => { setEditId(filho.id); setEditNome(filho.nome); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {filho.status === 'concluido' && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-yellow-600" title="Marcar como pendente"
                            onClick={() => { setPendenteId(filho.id); setPendenteObs(""); }}>
                            <AlertCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {filho.status === 'pendente' && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600" title="Conciliar"
                            onClick={() => { setConciliarId(filho.id); setConciliarFilho(filho); setConciliarObs(""); }}>
                            <Upload className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Mark as pending dialog */}
      <AlertDialog open={pendenteId !== null} onOpenChange={() => setPendenteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como pendente</AlertDialogTitle>
            <AlertDialogDescription>Informe o motivo da pendência (opcional).</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={pendenteObs} onChange={e => setPendenteObs(e.target.value)} placeholder="Motivo..." rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              disabled={pendenteMutation.isPending}
              onClick={() => pendenteMutation.mutate({ id: pendenteId!, obs: pendenteObs })}>
              {pendenteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conciliar dialog */}
      <Dialog open={conciliarId !== null} onOpenChange={() => { setConciliarId(null); setConciliarFilho(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Conciliar mapa pendente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Mapa pendente */}
            <div className="rounded border border-border p-3 bg-muted/30 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Mapa pendente: <span className="font-mono">{conciliarFilho?.nome}</span>
              </p>
              {conciliarFilho?.arquivo_pdf_url && (
                <a href={conciliarFilho.arquivo_pdf_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <FileText className="h-4 w-4" /> Ver PDF do mapa pendente
                </a>
              )}
            </div>

            {/* Motivo da pendência */}
            {conciliarFilho?.observacao && (
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3 space-y-1">
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Motivo da pendência</p>
                <p className="text-sm text-yellow-900 whitespace-pre-wrap">{conciliarFilho.observacao}</p>
              </div>
            )}

            {/* Novo PDF */}
            <div>
              <Label>Novo PDF <span className="text-destructive">*</span></Label>
              <Input type="file" accept="application/pdf" ref={conciliarFileRef} className="mt-1" />
            </div>

            {/* Observação da conciliação */}
            <div>
              <Label>Observação da conciliação</Label>
              <Textarea value={conciliarObs} onChange={e => setConciliarObs(e.target.value)}
                placeholder="Descreva o que foi corrigido…" rows={3} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConciliarId(null); setConciliarFilho(null); }}>Cancelar</Button>
            <Button onClick={handleConciliar} disabled={conciliarMutation.isPending}>
              {conciliarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Mapas() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filhosMapaId, setFilhosMapaId] = useState<number | null>(null);

  // Filter state
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroMedico, setFiltroMedico] = useState("none");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Upload form state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadMedico, setUploadMedico] = useState<string>("none");
  const [uploadDate, setUploadDate] = useState("");

  const filtros: MapasFiltros = {
    nome: filtroNome || undefined,
    medico: filtroMedico !== "none" ? filtroMedico : undefined,
    data_inicio: filtroDataInicio || undefined,
    data_fim: filtroDataFim || undefined,
  };

  const resetFiltros = () => {
    setFiltroNome(""); setFiltroMedico("none");
    setFiltroDataInicio(""); setFiltroDataFim("");
    setPage(1);
  };

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: response, isLoading } = useQuery({
    queryKey: [...mapasQueryKey, page, filtros],
    queryFn: () => fetchMapas(page, filtros),
  });
  const mapas: MapaPrincipal[] = response?.results ?? [];
  const total = response?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const { data: medicosResp } = useQuery({
    queryKey: ['medicos'],
    queryFn: () => fetchMedicos(),
  });
  const medicos: Medico[] = medicosResp?.results ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidateMapas = () => queryClient.invalidateQueries({ queryKey: mapasQueryKey });

  const uploadMutation = useMutation({
    mutationFn: uploadMapa,
    onSuccess: (data) => {
      invalidateMapas();
      setIsUploadOpen(false);
      setUploadMedico("none");
      setUploadDate("");
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: `Mapa criado: ${data.filhos_count} página(s) identificada(s).` });
      // Automatically open the filhos panel for validation
      setFilhosMapaId(data.id);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || "Erro ao processar o PDF.";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMapa,
    onSuccess: () => { invalidateMapas(); setDeleteId(null); toast({ title: "Mapa excluído." }); },
    onError: () => toast({ title: "Erro ao excluir.", variant: "destructive" }),
  });

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast({ title: "Selecione um arquivo PDF.", variant: "destructive" }); return; }
    const fd = new FormData();
    fd.append('arquivo_pdf', file);
    if (uploadMedico && uploadMedico !== "none") fd.append('medico', uploadMedico);
    if (uploadDate) fd.append('data_de_recebimento', uploadDate);
    uploadMutation.mutate(fd);
  };

  const deleteTarget = mapas.find(m => m.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapas</h1>
            <p className="text-sm text-muted-foreground">Upload de PDFs com identificação por OCR</p>
          </div>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Mapa
        </Button>
      </div>

      {/* Filters */}
      <div className="filter-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Nome do arquivo…" value={filtroNome}
            onChange={e => { setFiltroNome(e.target.value); setPage(1); }}
            className="pl-9" />
        </div>
        <Select value={filtroMedico} onValueChange={v => { setFiltroMedico(v); setPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Médico" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Todos os médicos</SelectItem>
            {medicos.map(m => (
              <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input type="date" value={filtroDataInicio}
              onChange={e => { setFiltroDataInicio(e.target.value); setPage(1); }} />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input type="date" value={filtroDataFim}
              onChange={e => { setFiltroDataFim(e.target.value); setPage(1); }} />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={resetFiltros} className="text-muted-foreground">
          Limpar filtros
        </Button>
      </div>

      {/* Table */}
      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead className="w-8" />
              <TableHead>Nome</TableHead>
              <TableHead>Médico</TableHead>
              <TableHead>Data de Recebimento</TableHead>
              <TableHead className="text-center">Páginas</TableHead>
              <TableHead className="text-center">Pendentes</TableHead>
              <TableHead className="text-center">PDF Original</TableHead>
              <TableHead className="text-center w-[60px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </TableCell></TableRow>
            ) : mapas.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                Nenhum mapa encontrado.
              </TableCell></TableRow>
            ) : (
              mapas.map(mapa => (
                <TableRow key={mapa.id} className="hover:bg-table-hover transition-colors cursor-pointer"
                  onClick={() => setFilhosMapaId(mapa.id)}>
                  <TableCell className="w-8 pl-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{mapa.nome ?? "—"}</TableCell>
                  <TableCell>{mapa.medico_nome ?? "—"}</TableCell>
                  <TableCell>
                    {mapa.data_de_recebimento
                      ? new Date(mapa.data_de_recebimento + 'T00:00:00').toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />{mapa.filhos_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {mapa.pendentes_count > 0
                      ? <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{mapa.pendentes_count}</Badge>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    {mapa.arquivo_pdf_url ? (
                      <a href={mapa.arquivo_pdf_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <FileText className="h-3 w-3" /> PDF
                      </a>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    <TableActions onDelete={() => setDeleteId(mapa.id)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Upload Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={isUploadOpen} onOpenChange={v => { if (!uploadMutation.isPending) setIsUploadOpen(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Novo Mapa — Upload PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Arquivo PDF <span className="text-destructive">*</span></Label>
              <Input type="file" accept="application/pdf" ref={fileRef} className="mt-1" disabled={uploadMutation.isPending} />
              <p className="text-xs text-muted-foreground mt-1">
                O sistema irá identificar e separar cada página automaticamente via OCR.
              </p>
            </div>
            <div>
              <Label>Médico</Label>
              <Select value={uploadMedico} onValueChange={setUploadMedico} disabled={uploadMutation.isPending}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o médico (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {medicos.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Recebimento</Label>
              <Input type="date" value={uploadDate} onChange={e => setUploadDate(e.target.value)}
                className="mt-1" disabled={uploadMutation.isPending} />
            </div>

            {uploadMutation.isPending && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded border border-primary/20">
                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">Processando PDF…</p>
                  <p className="text-xs text-muted-foreground">O OCR pode levar alguns segundos por página.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploadMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="gap-2">
              {uploadMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando…</>
                : <><Upload className="h-4 w-4" /> Enviar e Processar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Child maps panel ────────────────────────────────────────────────────── */}
      {filhosMapaId !== null && (
        <FilhosPanel mapaId={filhosMapaId} onClose={() => setFilhosMapaId(null)} />
      )}

      {/* ── Delete dialog ────────────────────────────────────────────────────────── */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir <strong>"{deleteTarget?.nome ?? `#${deleteId}`}"</strong> e todos os seus arquivos?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
