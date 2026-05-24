import { useState } from "react";
import { fmtDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchPropostas, fetchOportunidades, fetchContas } from "@/services/comercial";
import { useQuery } from "@tanstack/react-query";

import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Mocks removidos ---



const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Propostas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const { data: propostasResponse, isLoading: isLoadingPropostas } = useQuery({
    queryKey: ['crm_propostas', currentPage],
    queryFn: () => fetchPropostas(currentPage),
  });
  const propostas = Array.isArray(propostasResponse) ? propostasResponse : (propostasResponse?.results ?? []);
  const totalCount = Array.isArray(propostasResponse) ? propostasResponse.length : (propostasResponse?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);
  const { data: oportunidades = [] } = useQuery({ queryKey: ['crm_oportunidades'], queryFn: fetchOportunidades });
  const { data: contas = [] } = useQuery({ queryKey: ['crm_contas'], queryFn: fetchContas });

  const getContaNome = (contaId: number) => contas.find(c => c.id === contaId)?.nome_fantasia || 'N/A';
  const getOpTitulo = (opId: number) => oportunidades.find(o => o.id === opId)?.titulo || 'N/A';

  const [viewItem, setViewItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editData, setEditData] = useState({ numero: "", valor: "", validade: "" });

  const filteredPropostas = propostas.filter(proposta => {
    const contaNome = getContaNome(proposta.conta);
    const matchSearch = !searchTerm || proposta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contaNome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || proposta.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadgeStatus = (status: string): string => {
    switch (status) { case 'rascunho': return 'Processando'; case 'enviada': return 'Em andamento'; case 'aprovada': return 'Entrada'; case 'recusada': return 'Vencida'; case 'expirada': return 'Crítico'; default: return 'Em aberto'; }
  };
  const getExportData = () => filteredPropostas.map(p => ({
    "Nº Proposta": p.numero,
    Conta: getContaNome(p.conta),
    Oportunidade: getOpTitulo(p.oportunidade),
    Valor: p.valor,
    Status: p.status,
    Validade: p.validade,
    Versão: p.versao,
    Responsável: p.responsavel
  }));

  const openEdit = (p: any) => { setEditItem(p); setEditData({ numero: p.numero, valor: String(p.valor), validade: p.validade }) };
  const handleSaveEdit = () => { toast({ title: "Informaçao", description: "Edição via API ainda não implementada." }); setEditItem(null); };
  const handleDelete = () => { toast({ title: "Informação", description: "Exclusão via API ainda não implementada." }); setDeleteId(null); };
  const deleteItemData = propostas.find(i => i.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate('/comercial/propostas/nova')} className="gap-2"><Plus className="w-4 h-4" /> Nova Proposta</Button>
        <ExportButton getData={getExportData} fileName="propostas" sheetName="Propostas" />
      </div>

      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Nº proposta ou conta...", value: searchTerm, onChange: setSearchTerm, width: "flex-1 min-w-[200px]" },
          {
            type: "select", label: "Status", placeholder: "Todos", value: statusFilter, onChange: setStatusFilter, options: [
              { value: "rascunho", label: "Rascunho" }, { value: "enviada", label: "Enviada" },
              { value: "aprovada", label: "Aprovada" }, { value: "recusada", label: "Recusada" }, { value: "expirada", label: "Expirada" }
            ], width: "min-w-[160px]"
          }
        ]}
        resultsCount={filteredPropostas.length}
      />

      <div className="rounded border border-border">
        <Table>
          <TableHeader><TableRow className="bg-table-header">
            <TableHead>Nº Proposta</TableHead><TableHead>Conta</TableHead><TableHead>Oportunidade</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-center">Validade</TableHead><TableHead>Versão</TableHead><TableHead>Responsável</TableHead><TableHead className="w-[50px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredPropostas.map((proposta) => {
              const isExpired = proposta.validade && new Date(proposta.validade) < new Date() && proposta.status === 'enviada';
              return (
                <TableRow key={proposta.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-medium">{proposta.numero}</span></div></TableCell>
                  <TableCell>{getContaNome(proposta.conta)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{getOpTitulo(proposta.oportunidade)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(Number(proposta.valor))}</TableCell>
                  <TableCell><StatusBadge status={isExpired ? 'Crítico' : getStatusBadgeStatus(proposta.status)} /></TableCell>
                  <TableCell className={isExpired ? 'text-destructive' : ''}>{fmtDate(proposta.validade)}</TableCell>
                  <TableCell><Badge variant="outline">v{proposta.versao}</Badge></TableCell>
                  <TableCell>{proposta.responsavel}</TableCell>
                  <TableCell><TableActions onView={() => setViewItem(proposta)} onEdit={() => openEdit(proposta)} onDelete={() => setDeleteId(proposta.id)} /></TableCell>
                </TableRow>
              );
            })}
            {filteredPropostas.length === 0 && !isLoadingPropostas && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma proposta encontrada.</TableCell>
              </TableRow>
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

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Proposta</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2">
              {[
                { label: 'Nº Proposta', value: viewItem.numero },
                { label: 'Conta', value: getContaNome(viewItem.conta) },
                { label: 'Oportunidade', value: getOpTitulo(viewItem.oportunidade) },
                { label: 'Valor', value: formatCurrency(Number(viewItem.valor)) },
                { label: 'Status', value: viewItem.status },
                { label: 'Validade', value: fmtDate(viewItem.validade) },
                { label: 'Versão', value: `v${viewItem.versao}` },
                { label: 'Responsável', value: viewItem.responsavel }
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-1 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value || 'N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Proposta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Número</Label><Input value={editData.numero} onChange={e => setEditData({ ...editData, numero: e.target.value })} /></div>
            <div><Label>Valor</Label><Input type="number" value={editData.valor} onChange={e => setEditData({ ...editData, valor: e.target.value })} /></div>
            <div><Label>Validade</Label><Input type="date" value={editData.validade} onChange={e => setEditData({ ...editData, validade: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir proposta?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{deleteItemData?.numero}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
