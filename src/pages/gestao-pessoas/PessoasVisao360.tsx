import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Settings, LayoutDashboard, Users } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { fetchPessoas, fetchSetores, pessoasQueryKey, setoresQueryKey, type Pessoa } from "@/services/pessoas";

export default function PessoasVisao360() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [setorFilter, setSetorFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  const { data: pessoasResponse, isLoading } = useQuery({
    queryKey: [...pessoasQueryKey, currentPage, searchTerm],
    queryFn: () => fetchPessoas(currentPage, searchTerm),
  });
  const pessoas: Pessoa[] = pessoasResponse?.results ?? [];
  const totalCount = pessoasResponse?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  const { data: setoresResponse } = useQuery({
    queryKey: setoresQueryKey,
    queryFn: () => fetchSetores(),
  });
  const setores = Array.isArray(setoresResponse) ? setoresResponse : (setoresResponse as any)?.results ?? [];

  const filteredPessoas = useMemo(() => pessoas.filter((pessoa) => {
    const matchesSetor = setorFilter === "all" || String(pessoa.setor_id) === setorFilter;
    return matchesSetor;
  }), [pessoas, setorFilter]);

  return (
    <div className="space-y-6">
      <div className="filter-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
        </div>
      </div>

      <div className="rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Gestor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Ações Rápidas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredPessoas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="font-medium">Nenhuma pessoa encontrada</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPessoas.map((pessoa) => (
                <TableRow key={pessoa.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold">
                        {pessoa.iniciais}
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
                  <TableCell><StatusBadge status={pessoa.role} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/gestao-pessoas/pessoas/${pessoa.id}`)}>
                        <Eye className="h-4 w-4" /> Perfil 360º
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/gestao-pessoas/acessos?pessoa=${pessoa.id}`)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/gestao-pessoas/dashboards?pessoa=${pessoa.id}`)}>
                        <LayoutDashboard className="h-4 w-4" />
                      </Button>
                    </div>
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
    </div>
  );
}
