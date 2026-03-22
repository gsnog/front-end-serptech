import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/TableActions";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { Plus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchContatos, fetchContas } from "@/services/comercial";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Contatos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [papelFilter, setPapelFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  const { data: contatosResponse, isLoading: isLoadingContatos } = useQuery({
    queryKey: ['crm_contatos', currentPage, searchTerm],
    queryFn: () => fetchContatos(currentPage, searchTerm),
  });
  const contatosData = Array.isArray(contatosResponse) ? contatosResponse : (contatosResponse?.results ?? []);
  const totalCount = Array.isArray(contatosResponse) ? contatosResponse.length : (contatosResponse?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);
  const { data: contasData = [] } = useQuery({ queryKey: ['crm_contas'], queryFn: fetchContas });

  const getContaNome = (contaId: number) => {
    const conta = contasData.find(c => c.id === contaId);
    return conta ? conta.nome_fantasia : 'N/A';
  };

  const [editItem, setEditItem] = useState<any | null>(null);
  const [editData, setEditData] = useState({ nome: "", cargo: "", email: "", telefone: "" });
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredContatos = contatosData;

  const getPapelLabel = (papel: string) => { const labels: Record<string, string> = { 'decisor': 'Decisor', 'influenciador': 'Influenciador', 'usuario': 'Usuário', 'compras': 'Compras' }; return labels[papel] || papel; };
  const getPapelVariant = (papel: string): "default" | "secondary" | "outline" | "destructive" => { switch (papel) { case 'decisor': return 'default'; case 'influenciador': return 'secondary'; default: return 'outline'; } };

  const getExportData = () => filteredContatos.map(c => ({
    Nome: c.nome,
    Cargo: c.cargo || '',
    Email: c.email || '',
    Telefone: c.telefone || '',
    Empresa: getContaNome(c.conta)
  }));

  const openEdit = (c: any) => { setEditItem(c); setEditData({ nome: c.nome, cargo: c.cargo || '', email: c.email || '', telefone: c.telefone || '' }) };
  const handleSaveEdit = () => { toast({ title: "Informação", description: "Edição via API ainda não implementada neste dashboard." }); setEditItem(null); };
  const handleDelete = () => { toast({ title: "Informação", description: "Exclusão via API ainda não implementada neste dashboard." }); setDeleteId(null); };
  const deleteItemData = contatosData.find(i => i.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate('/comercial/contatos/novo')} className="gap-2"><Plus className="w-4 h-4" /> Novo Contato</Button>
        <ExportButton getData={getExportData} fileName="contatos" sheetName="Contatos" />
      </div>

      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Nome, email ou cargo...", value: searchTerm, onChange: setSearchTerm, width: "flex-1 min-w-[200px]" },
          {
            type: "select", label: "Papel", placeholder: "Todos", value: papelFilter, onChange: setPapelFilter, options: [
              { value: "decisor", label: "Decisor" }, { value: "influenciador", label: "Influenciador" },
              { value: "usuario", label: "Usuário" }, { value: "compras", label: "Compras" }
            ], width: "min-w-[160px]"
          }
        ]}
        resultsCount={totalCount}
      />

      <div className="rounded border border-border">
        <Table>
          <TableHeader><TableRow className="bg-table-header">
            <TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead>Papel</TableHead><TableHead>Empresa</TableHead><TableHead>Tags</TableHead><TableHead className="w-[50px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filteredContatos.map((contato) => {
              return (
                <TableRow key={contato.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div><span className="font-medium">{contato.nome}</span></div></TableCell>
                  <TableCell>{contato.cargo}</TableCell><TableCell>{contato.email}</TableCell><TableCell>{contato.telefone}</TableCell>
                  <TableCell><Badge variant="outline">{contato.principal ? 'Principal' : 'Secundário'}</Badge></TableCell>
                  <TableCell>{getContaNome(contato.conta)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">CRM</Badge></TableCell>
                  <TableCell><TableActions onView={() => setViewItem(contato)} onEdit={() => openEdit(contato)} onDelete={() => setDeleteId(contato.id)} /></TableCell>
                </TableRow>
              );
            })}
            {filteredContatos.length === 0 && !isLoadingContatos && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum contato encontrado.</TableCell>
              </TableRow>
            )}
            {isLoadingContatos && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground italic">Carregando contatos...</TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>Detalhes do Contato</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2">
              {[
                { label: 'Nome', value: viewItem.nome },
                { label: 'Cargo', value: viewItem.cargo },
                { label: 'Email', value: viewItem.email },
                { label: 'Telefone', value: viewItem.telefone },
                { label: 'Empresa', value: getContaNome(viewItem.conta) },
                { label: 'Principal', value: viewItem.principal ? 'Sim' : 'Não' }
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
        <DialogContent><DialogHeader><DialogTitle>Editar Contato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editData.nome} onChange={e => setEditData({ ...editData, nome: e.target.value })} /></div>
            <div><Label>Cargo</Label><Input value={editData.cargo} onChange={e => setEditData({ ...editData, cargo: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={editData.telefone} onChange={e => setEditData({ ...editData, telefone: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir contato?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{deleteItemData?.nome}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
