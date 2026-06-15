import { useState, useMemo } from "react";
import { fmtDate, todayStr } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Phone, Mail, FileText, CheckCircle, Clock, AlertTriangle, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAtividades, fetchOportunidades, fetchLeads, atividadesQueryKey } from "@/services/comercial";
import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/hooks/usePagination";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Mocks removidos ---



export default function Atividades() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filterResponsavel, setFilterResponsavel] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [view, setView] = useState<"meu-dia" | "pendencias" | "todas">("meu-dia");

  useRealtimeUpdates([[...atividadesQueryKey]]);

  const { data: atividadesResponse, isLoading } = useQuery({
    queryKey: atividadesQueryKey,
    queryFn: () => fetchAtividades(),
  });
  const atividades = Array.isArray(atividadesResponse) ? atividadesResponse : (atividadesResponse?.results ?? []);
  const { data: oportunidades = [] } = useQuery({ queryKey: ['crm_oportunidades'], queryFn: fetchOportunidades });
  const { data: leads = [] } = useQuery({ queryKey: ['crm_leads'], queryFn: fetchLeads });

  const [viewItem, setViewItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editData, setEditData] = useState({ titulo: "", tipo: "", data: "", hora: "" });

  const today = todayStr();

  const handleStatusChange = (id: number, newStatus: string) => {
    toast({ title: "Informaçao", description: "Alteração de status via API ainda não implementada." });
  };

  const handleCheckboxToggle = (id: number, currentStatus: string) => {
    handleStatusChange(id, currentStatus === 'concluida' ? 'pendente' : 'concluida');
  };

  const responsaveisUnicos = Array.from(new Set(atividades.map((a: any) => String(a.responsavel)).filter(Boolean)));
  const responsavelOptions = [
    { value: "todos", label: "Todos" },
    ...responsaveisUnicos.map(r => ({ value: r, label: r }))
  ];

  const filteredAtividades = useMemo(() => atividades.filter(atividade => {
    const matchSearch = !searchTerm || atividade.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !tipoFilter || atividade.tipo === tipoFilter;
    const matchStatus = !statusFilter || atividade.status === statusFilter;
    const matchResponsavel = !filterResponsavel || filterResponsavel === "todos" || String(atividade.responsavel) === filterResponsavel;
    const matchDataInicio = filterDataInicio ? atividade.data >= filterDataInicio : true;
    const matchDataFim = filterDataFim ? atividade.data <= filterDataFim : true;
    let matchView = true;
    if (view === "meu-dia") matchView = atividade.data === today;
    else if (view === "pendencias") matchView = atividade.status === 'pendente';
    return matchSearch && matchTipo && matchStatus && matchResponsavel && matchDataInicio && matchDataFim && matchView;
  }), [atividades, searchTerm, tipoFilter, statusFilter, filterResponsavel, filterDataInicio, filterDataFim, view, today]);

  const { page, goToPage, totalPages, paginatedItems, total, hasNext, hasPrev } = usePagination(filteredAtividades);

  const getRelacionadoLabel = (atividade: any) => {
    if (atividade.oportunidade) return oportunidades.find(o => o.id === atividade.oportunidade)?.titulo;
    if (atividade.lead) return leads.find(l => l.id === atividade.lead)?.nome;
    return null;
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'reuniao': return <Calendar className="h-4 w-4" />;
      case 'ligacao': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'tarefa': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTipoBgColor = (tipo: string) => {
    switch (tipo) {
      case 'reuniao': return 'bg-primary/10 text-primary';
      case 'ligacao': return 'bg-success/10 text-success';
      case 'email': return 'bg-info/10 text-info';
      case 'tarefa': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string, data: string) => {
    const isOverdue = status === 'pendente' && data < todayStr();
    if (status === 'concluida') return <CheckCircle className="h-4 w-4 text-success" />;
    if (isOverdue) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  const atividadesVencidas = atividades.filter(a => a.status === 'pendente' && a.data < todayStr()).length;
  const atividadesHoje = atividades.filter(a => a.data === today).length;

  const getExportData = () => filteredAtividades.map(a => ({ Título: a.titulo, Tipo: a.tipo, Status: a.status, Data: a.data, Hora: a.hora || '-', Responsável: a.responsavel }));

  const openEdit = (a: any) => { setEditItem(a); setEditData({ titulo: a.titulo, tipo: a.tipo, data: a.data, hora: a.hora || "" }); };
  const handleSaveEdit = () => { toast({ title: "Informação", description: "Edição via API ainda não implementada." }); setEditItem(null); };
  const handleDelete = () => { toast({ title: "Informação", description: "Exclusão via API ainda não implementada." }); setDeleteId(null); };
  const deleteItemData = atividades.find(i => i.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border rounded p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Hoje</p><p className="text-2xl font-bold">{atividadesHoje}</p></div>
          </div>
        </Card>
        <Card className="border border-border rounded p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Pendentes</p><p className="text-2xl font-bold">{atividades.filter(a => a.status === 'pendente').length}</p></div>
          </div>
        </Card>
        <Card className="border border-border rounded p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Vencidas</p><p className="text-2xl font-bold text-destructive">{atividadesVencidas}</p></div>
          </div>
        </Card>
        <Card className="border border-border rounded p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Concluídas</p><p className="text-2xl font-bold">{atividades.filter(a => a.status === 'concluida').length}</p></div>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="meu-dia">Meu Dia</TabsTrigger>
              <TabsTrigger value="pendencias">Pendências</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton getData={getExportData} fileName="atividades" />
          <Button onClick={() => navigate('/comercial/atividades/nova')} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Atividade
          </Button>
        </div>
      </div>

      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Buscar atividades...", value: searchTerm, onChange: setSearchTerm, width: "flex-1 min-w-[200px]" },
          {
            type: "select", label: "Tipo", placeholder: "Todos", value: tipoFilter, onChange: setTipoFilter, options: [
              { value: "reuniao", label: "Reunião" }, { value: "ligacao", label: "Ligação" },
              { value: "email", label: "Email" }, { value: "tarefa", label: "Tarefa" }, { value: "follow-up", label: "Follow-up" }
            ], width: "min-w-[140px]"
          },
          {
            type: "select", label: "Status", placeholder: "Todos", value: statusFilter, onChange: setStatusFilter, options: [
              { value: "pendente", label: "Pendente" }, { value: "concluida", label: "Concluída" }, { value: "cancelada", label: "Cancelada" }
            ], width: "min-w-[140px]"
          },
          { type: "select", label: "Responsável", placeholder: "Todos", value: filterResponsavel, onChange: setFilterResponsavel, options: responsavelOptions, width: "min-w-[160px]" },
          { type: "date", label: "Data de", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[155px]" },
          { type: "date", label: "Data até", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[155px]" }
        ]}
        resultsCount={filteredAtividades.length}
      />

      <div className="space-y-3">
        {paginatedItems.map((atividade) => {
          const isOverdue = atividade.status === 'pendente' && new Date(atividade.data) < new Date();
          const relacionado = getRelacionadoLabel(atividade);
          return (
            <Card key={atividade.id} className={`border rounded p-4 hover:shadow-md transition-shadow ${isOverdue ? 'border-destructive/50' : 'border-border'}`}>
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={atividade.status === 'concluida'}
                  onCheckedChange={() => handleCheckboxToggle(atividade.id, atividade.status)}
                  className="mt-1 cursor-pointer"
                />
                <div className={`p-2 rounded ${getTipoBgColor(atividade.tipo)}`}>{getTipoIcon(atividade.tipo)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-medium ${atividade.status === 'concluida' ? 'line-through text-muted-foreground' : ''}`}>
                        {atividade.titulo}
                      </h3>
                      {relacionado && (
                        <p className="text-sm text-muted-foreground mt-0.5">{relacionado}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(atividade.status, atividade.data)}
                      <Badge variant="outline" className={isOverdue ? 'border-destructive text-destructive' : ''}>
                        {fmtDate(atividade.data)} {atividade.hora && `às ${atividade.hora}`}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Responsável: {atividade.responsavel}</span>
                    <Badge variant="secondary" className="capitalize">{atividade.tipo}</Badge>
                    <Select value={atividade.status} onValueChange={(v) => handleStatusChange(atividade.id, v)}>
                      <SelectTrigger className="h-7 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1 ml-auto">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(atividade)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(atividade)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(atividade.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">{(page-1)*20+1}–{Math.min(page*20,total)} de {total} registros</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => goToPage(page-1)} disabled={!hasPrev}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => goToPage(page+1)} disabled={!hasNext}>Próxima</Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Atividade</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Título: viewItem.titulo, Tipo: viewItem.tipo, Status: viewItem.status, Data: viewItem.data, Hora: viewItem.hora || '-', Responsável: viewItem.responsavel, Relacionado: getRelacionadoLabel(viewItem) || '-' }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium capitalize">{v as string}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Atividade</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={editData.titulo} onChange={e => setEditData({ ...editData, titulo: e.target.value })} /></div>
            <div><Label>Tipo</Label><Input value={editData.tipo} onChange={e => setEditData({ ...editData, tipo: e.target.value })} /></div>
            <div><Label>Data</Label><Input type="date" value={editData.data} onChange={e => setEditData({ ...editData, data: e.target.value })} /></div>
            <div><Label>Hora</Label><Input value={editData.hora} onChange={e => setEditData({ ...editData, hora: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir atividade?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{deleteItemData?.titulo}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
