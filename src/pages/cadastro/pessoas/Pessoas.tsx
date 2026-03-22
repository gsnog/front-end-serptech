import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { fetchPessoas, fetchSetores, pessoasQueryKey, setoresQueryKey, type Pessoa } from "@/services/pessoas";

const TIPOS_VINCULO = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "Estagiário", label: "Estagiário" },
  { value: "Temporário", label: "Temporário" },
  { value: "Terceirizado", label: "Terceirizado" },
];

export default function Pessoas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [setorFilter, setSetorFilter] = useState("all");
  const [cargoFilter, setCargoFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Pessoa | null>(null);

  const BASE_URL = api.defaults.baseURL || "http://127.0.0.1:8000";

  const [currentPage, setCurrentPage] = useState(1);
  const { data: pessoasResponse, isLoading, isError } = useQuery({
    queryKey: [...pessoasQueryKey, currentPage],
    queryFn: () => fetchPessoas(currentPage),
  });
  const pessoas: Pessoa[] = Array.isArray(pessoasResponse) ? pessoasResponse : (pessoasResponse?.results ?? []);
  const totalCount = Array.isArray(pessoasResponse) ? pessoasResponse.length : (pessoasResponse?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const { data: setores = [] } = useQuery({
    queryKey: setoresQueryKey,
    queryFn: fetchSetores,
  });

  // Unique cargos from API data
  const uniqueCargos = useMemo(() => {
    const seen = new Set<string>();
    return pessoas.filter(p => p.cargo && !seen.has(p.cargo) && seen.add(p.cargo)).map(p => p.cargo);
  }, [pessoas]);

  const filteredPessoas = useMemo(() => pessoas.filter((pessoa) => {
    const matchesSearch =
      pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pessoa.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = setorFilter === "all" || String(pessoa.setor_id) === setorFilter;
    const matchesCargo = cargoFilter === "all" || pessoa.cargo === cargoFilter;
    return matchesSearch && matchesSetor && matchesCargo;
  }), [pessoas, searchTerm, setorFilter, cargoFilter]);

  const getExportData = () => filteredPessoas.map(p => ({
    Nome: p.nome, Email: p.email, Cargo: p.cargo, Setor: p.setor || "—",
    Gestor: p.supervisor_nome || "—", Role: p.role,
  }));

  const deletePessoa = pessoas.find(p => p.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/cadastro/pessoas/pessoas/nova")} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Pessoa
          </Button>
          <ExportButton getData={getExportData} fileName="cadastro-pessoas" />
        </div>
      </div>

      {/* Filters */}
      <div className="filter-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={setorFilter} onValueChange={setSetorFilter}>
            <SelectTrigger><SelectValue placeholder="Setor/Área" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {setores.map((setor) => (
                <SelectItem key={setor.id} value={String(setor.id)}>{setor.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cargoFilter} onValueChange={setCargoFilter}>
            <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              {uniqueCargos.map((cargo) => (
                <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
              <TableHead className="text-foreground font-semibold">Nome</TableHead>
              <TableHead className="text-foreground font-semibold">Setor/Área</TableHead>
              <TableHead className="text-foreground font-semibold">Cargo</TableHead>
              <TableHead className="text-foreground font-semibold">Gestor Direto</TableHead>
              <TableHead className="text-foreground font-semibold">Role</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-destructive">
                  Erro ao carregar pessoas. Verifique a conexão com a API.
                </TableCell>
              </TableRow>
            ) : filteredPessoas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="font-medium">Nenhuma pessoa encontrada</p>
                    <p className="text-sm">Cadastre um usuário no sistema para que ele apareça aqui.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPessoas.map((pessoa) => (
                <TableRow key={pessoa.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 shrink-0">
                        {pessoa.profile_image ? (
                          <img
                            src={pessoa.profile_image.startsWith('http') ? pessoa.profile_image : `${BASE_URL}${pessoa.profile_image}`}
                            alt={pessoa.iniciais}
                            className="h-9 w-9 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-initials')?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`fallback-initials flex h-9 w-9 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold ${pessoa.profile_image ? 'hidden' : ''}`}>
                          {pessoa.iniciais || (pessoa.nome ? pessoa.nome.charAt(0).toUpperCase() : "?")}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{pessoa.nome}</div>
                        <div className="text-sm text-muted-foreground">{pessoa.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{pessoa.setor || "—"}</TableCell>
                  <TableCell>{pessoa.cargo || "—"}</TableCell>
                  <TableCell>{pessoa.supervisor_nome || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={pessoa.role} />
                  </TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onView={() => setViewItem(pessoa)}
                      onEdit={() => navigate(`/gestao-pessoas/pessoas/${pessoa.id}`)}
                      onDelete={() => setDeleteId(pessoa.id)}
                    />
                  </TableCell>
                </TableRow>
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

      {
        !isLoading && (
          <div className="text-sm text-muted-foreground">
            Exibindo {filteredPessoas.length} de {pessoas.length} pessoas
          </div>
        )
      }

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {viewItem && (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold">
                    {viewItem.iniciais}
                  </div>
                  {viewItem.nome}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-3 py-2">
              <InfoRow label="E-mail" value={viewItem.email} />
              <InfoRow label="Cargo" value={viewItem.cargo || "—"} />
              <InfoRow label="Setor" value={viewItem.setor || "—"} />
              <InfoRow label="Gestor" value={viewItem.supervisor_nome || "—"} />
              <InfoRow label="Role" value={viewItem.role} />
              <div className="pt-3 flex justify-end">
                <Button size="sm" onClick={() => { setViewItem(null); navigate(`/gestao-pessoas/pessoas/${viewItem.id}`); }}>
                  Ver Perfil 360º
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir <strong>{deletePessoa?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast({ title: "Funcionalidade em desenvolvimento", description: "A exclusão de usuários deve ser feita pelo Django Admin." });
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
