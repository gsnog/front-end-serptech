import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Clock, User, Settings, FileText, DollarSign, Shield } from "lucide-react";
import { FilterSection } from "@/components/FilterSection";
import { SortableHead } from "@/components/SortableHead";
import { useSortable } from "@/hooks/useSortable";
import { useQuery } from "@tanstack/react-query";
import { fetchAuditoria, auditoriaQueryKey, type RegistroAuditoria } from "@/services/pessoas";

const tipoIcons: Record<string, typeof Clock> = {
  acesso: Shield, salario: DollarSign, gestor: User, dashboard: Settings,
  documento: FileText, setor: User, cargo: Settings, cadastro: User, status: User,
};

const tipoColors: Record<string, string> = {
  acesso: "bg-blue-500/10 text-blue-600",
  salario: "bg-primary/10 text-primary",
  gestor: "bg-purple-500/10 text-purple-600",
  dashboard: "bg-orange-500/10 text-orange-600",
  documento: "bg-yellow-500/10 text-yellow-600",
  setor: "bg-cyan-500/10 text-cyan-600",
  cargo: "bg-indigo-500/10 text-indigo-600",
  cadastro: "bg-green-500/10 text-green-600",
  status: "bg-rose-500/10 text-rose-600",
};

const PAGE_SIZE = 20;

export default function Auditoria() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: [...auditoriaQueryKey, page, searchTerm, tipoFilter, filterDataInicio, filterDataFim],
    queryFn: () => fetchAuditoria(
      page,
      searchTerm,
      tipoFilter === "all" ? "" : tipoFilter,
      filterDataInicio,
      filterDataFim,
      PAGE_SIZE,
    ),
    placeholderData: (prev) => prev,
  });

  const logs: RegistroAuditoria[] = response?.results ?? [];
  const total = response?.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(logs);

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Ação, pessoa ou detalhes...", value: searchTerm, onChange: handleFilterChange(setSearchTerm), width: "flex-1 min-w-[200px]" },
          {
            type: "select", label: "Tipo", placeholder: "Todos", value: tipoFilter === "all" ? "" : tipoFilter,
            onChange: (v) => { setTipoFilter(v || "all"); setPage(1); },
            options: [
              { value: "acesso", label: "Acesso" }, { value: "salario", label: "Salário" },
              { value: "gestor", label: "Gestor" }, { value: "setor", label: "Setor" },
              { value: "cargo", label: "Cargo" }, { value: "documento", label: "Documento" },
              { value: "cadastro", label: "Cadastro" }, { value: "status", label: "Status" },
            ],
            width: "min-w-[160px]",
          },
          { type: "date", label: "Data Início", value: filterDataInicio, onChange: handleFilterChange(setFilterDataInicio), width: "min-w-[160px]" },
          { type: "date", label: "Data Fim", value: filterDataFim, onChange: handleFilterChange(setFilterDataFim), width: "min-w-[160px]" },
        ]}
        resultsCount={total}
      />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="w-24 font-semibold">Tipo</TableHead>
                  <SortableHead label="Ação" field="acao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Pessoa" field="pessoa_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Por" field="usuario_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Data/Hora" field="data_hora" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <TableHead className="font-semibold">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : sorted.map((log) => {
                  const Icon = tipoIcons[log.tipo] || Clock;
                  const colorClass = tipoColors[log.tipo] || "bg-muted text-muted-foreground";
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className={`inline-flex items-center justify-center p-2 rounded ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.acao}</TableCell>
                      <TableCell>{log.pessoa_nome}</TableCell>
                      <TableCell className="text-muted-foreground">{log.usuario_nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.data_hora}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.detalhes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} registros
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Próxima</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
