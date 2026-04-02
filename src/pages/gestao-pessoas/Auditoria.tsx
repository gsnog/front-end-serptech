import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Clock, User, Settings, FileText, DollarSign, Shield } from "lucide-react";
import { FilterSection } from "@/components/FilterSection";
import { SortableHead } from "@/components/SortableHead";
import { usePagination } from "@/hooks/usePagination";
import { useSortable } from "@/hooks/useSortable";

// Logs de auditoria — dados estáticos temporários (futuro: endpoint /api/auditoria/)
const auditLogs = [
  { id: 1, tipo: "acesso", acao: "Perfil alterado para 'Gestor'", pessoa: "Usuário", pessoaId: "0", usuario: "Admin", dataHora: "04/02/2026 15:30:45", detalhes: "Perfil anterior: Usuário" },
  { id: 2, tipo: "salario", acao: "Salário atualizado", pessoa: "Usuário", pessoaId: "0", usuario: "Admin", dataHora: "04/02/2026 14:20:00", detalhes: "Aguardando dados reais" },
];

const tipoIcons: Record<string, typeof Clock> = {
  acesso: Shield, salario: DollarSign, gestor: User, dashboard: Settings, documento: FileText, setor: User,
};

const tipoColors: Record<string, string> = {
  acesso: "bg-blue-500/10 text-blue-600", salario: "bg-primary/10 text-primary",
  gestor: "bg-purple-500/10 text-purple-600", dashboard: "bg-orange-500/10 text-orange-600",
  documento: "bg-yellow-500/10 text-yellow-600", setor: "bg-cyan-500/10 text-cyan-600",
};

export default function Auditoria() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [usuarioFilter, setUsuarioFilter] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  const usuariosUnicos = Array.from(new Set(auditLogs.map(l => l.usuario)));

  const filteredLogs = useMemo(() => auditLogs.filter((log) => {
    const matchesSearch =
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.pessoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "all" || log.tipo === tipoFilter;
    const matchesUsuario = !usuarioFilter || log.usuario === usuarioFilter;
    // dataHora format: "DD/MM/YYYY HH:mm:ss"
    const logDate = log.dataHora.split(" ")[0].split("/").reverse().join("-");
    const matchesDataInicio = filterDataInicio ? logDate >= filterDataInicio : true;
    const matchesDataFim = filterDataFim ? logDate <= filterDataFim : true;
    return matchesSearch && matchesTipo && matchesUsuario && matchesDataInicio && matchesDataFim;
  }), [searchTerm, tipoFilter, usuarioFilter, filterDataInicio, filterDataFim]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filteredLogs);
  const { page, goToPage, totalPages, paginatedItems, total, hasNext, hasPrev } = usePagination(sorted);

  return (
    <div className="space-y-6">
      <FilterSection
        fields={[
          { type: "text", label: "Buscar", placeholder: "Ação, pessoa ou detalhes...", value: searchTerm, onChange: setSearchTerm, width: "flex-1 min-w-[200px]" },
          { type: "select", label: "Tipo", placeholder: "Todos", value: tipoFilter === "all" ? "" : tipoFilter, onChange: (v) => setTipoFilter(v || "all"), options: [{ value: "acesso", label: "Acesso" }, { value: "salario", label: "Salário" }, { value: "gestor", label: "Gestor" }, { value: "dashboard", label: "Dashboard" }, { value: "documento", label: "Documento" }, { value: "setor", label: "Setor" }], width: "min-w-[160px]" },
          { type: "select", label: "Usuário", placeholder: "Todos", value: usuarioFilter, onChange: setUsuarioFilter, options: [{ value: "todos", label: "Todos" }, ...usuariosUnicos.map(u => ({ value: u, label: u }))], width: "min-w-[160px]" },
          { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
          { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
        ]}
        resultsCount={filteredLogs.length}
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
                  <SortableHead label="Pessoa" field="pessoa" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Por" field="usuario" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHead label="Data/Hora" field="dataHora" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <TableHead className="font-semibold">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((log) => {
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
                      <TableCell>{log.pessoa}</TableCell>
                      <TableCell className="text-muted-foreground">{log.usuario}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.dataHora}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{log.detalhes}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">{(page-1)*20+1}–{Math.min(page*20,total)} de {total} registros</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => goToPage(page-1)} disabled={!hasPrev}>Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => goToPage(page+1)} disabled={!hasNext}>Próxima</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
