import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { Plus, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchContas, contasQueryKey } from "@/services/comercial";

import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Mocks removidos ---



const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Contas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [segmentoFilter, setSegmentoFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  const { data: response, isLoading } = useQuery({
    queryKey: [...contasQueryKey, currentPage, searchTerm],
    queryFn: () => fetchContas(currentPage, searchTerm),
  });
  const contas = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const [viewItem, setViewItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editData, setEditData] = useState({ nome_fantasia: "", razao_social: "", cnpj: "" });

  const segmentos = [...new Set(contas.map((c: any) => c.setor_atuacao))].filter(Boolean);

  const filteredContas = contas.filter((conta: any) => {
    const matchSegmento = !segmentoFilter || conta.setor_atuacao === segmentoFilter;
    return matchSegmento;
  });

  const getStatusBadgeStatus = (status: string): string => 'Em aberto';
  const getPorteLabel = (porte: string) => porte || '-';

  const getExportData = () => filteredContas.map((c: any) => ({
    "Nome Fantasia": c.nome_fantasia,
    "Razão Social": c.razao_social,
    CNPJ: c.cnpj,
    Segmento: c.setor_atuacao,
    Email: c.email,
    Telefone: c.telefone
  }));

  const openEdit = (c: any) => { setEditItem(c); setEditData({ nome_fantasia: c.nome_fantasia, razao_social: c.razao_social, cnpj: c.cnpj }) };
  const handleSaveEdit = () => { toast({ title: "Informação", description: "Edição via API ainda não implementada." }); setEditItem(null); };
  const handleDelete = () => { toast({ title: "Informação", description: "Exclusão via API ainda não implementada." }); setDeleteId(null); };
  const deleteItemData = contas.find(i => i.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate('/comercial/contas/nova')} className="gap-2"><Plus className="w-4 h-4" /> Nova Conta</Button>
        <ExportButton getData={getExportData} fileName="contas" sheetName="Contas" />
      </div>

      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Empresa ou CNPJ...", value: searchTerm, onChange: setSearchTerm, width: "flex-1 min-w-[200px]" },
          {
            type: "select", label: "Status", placeholder: "Todos", value: statusFilter, onChange: setStatusFilter, options: [
              { value: "prospect", label: "Prospect" }, { value: "cliente", label: "Cliente" },
              { value: "inativo", label: "Inativo" }, { value: "churned", label: "Churned" }
            ], width: "min-w-[160px]"
          },
          {
            type: "select", label: "Segmento", placeholder: "Todos", value: segmentoFilter, onChange: setSegmentoFilter,
            options: segmentos.map(s => ({ value: s, label: s })), width: "min-w-[160px]"
          }
        ]}
        resultsCount={totalCount}
      />

      <div className="rounded border border-border">
        <Table>
          <TableHeader><TableRow className="bg-table-header">
            <TableHead>Empresa</TableHead><TableHead>CNPJ</TableHead><TableHead>Segmento</TableHead><TableHead>Porte</TableHead><TableHead>Cidade/UF</TableHead><TableHead>Status</TableHead><TableHead>Limite Crédito</TableHead><TableHead>Responsável</TableHead><TableHead className="w-[50px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredContas.map((conta: any) => (
              <TableRow key={conta.id} className="hover:bg-muted/50 cursor-pointer">
                <TableCell><div className="flex items-center gap-2"><div className="p-2 rounded bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div><div><p className="font-medium">{conta.nome_fantasia}</p><p className="text-xs text-muted-foreground">{conta.razao_social}</p></div></div></TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">{conta.cnpj}</TableCell>
                <TableCell><Badge variant="outline">{conta.setor_atuacao || 'N/A'}</Badge></TableCell>
                <TableCell>{conta.telefone || '-'}</TableCell>
                <TableCell>{conta.email || '-'}</TableCell>
                <TableCell className="whitespace-nowrap"><StatusBadge status="Em aberto" /></TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell><TableActions onView={() => setViewItem(conta)} onEdit={() => openEdit(conta)} onDelete={() => setDeleteId(conta.id)} /></TableCell>
              </TableRow>
            ))}
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
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Conta</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2">
              {[
                { label: 'Nome Fantasia', value: viewItem.nome_fantasia },
                { label: 'Razão Social', value: viewItem.razao_social },
                { label: 'CNPJ', value: viewItem.cnpj },
                { label: 'Setor de Atuação', value: viewItem.setor_atuacao },
                { label: 'Telefone', value: viewItem.telefone },
                { label: 'Email', value: viewItem.email },
                { label: 'Site', value: viewItem.site }
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
        <DialogContent><DialogHeader><DialogTitle>Editar Conta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome Fantasia</Label><Input value={editData.nome_fantasia} onChange={e => setEditData({ ...editData, nome_fantasia: e.target.value })} /></div>
            <div><Label>Razão Social</Label><Input value={editData.razao_social} onChange={e => setEditData({ ...editData, razao_social: e.target.value })} /></div>
            <div><Label>CNPJ</Label><Input value={editData.cnpj} onChange={e => setEditData({ ...editData, cnpj: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir conta?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{deleteItemData?.nome_fantasia}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
