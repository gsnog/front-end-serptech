import { useState } from "react";
import { fmtDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { Plus, FileDown, RotateCcw, XCircle, Copy } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye } from "lucide-react";

const mockNotas = [
  { id: 1, numero: 152, serie: "1", cliente: "ABC Ltda", data: "18/02/2026", valor: "R$ 5.400,00", status: "Autorizada", tipo: "NF-e", ultimoRetorno: "Autorizado - 100" },
  { id: 2, numero: 151, serie: "1", cliente: "XYZ SA", data: "17/02/2026", valor: "R$ 12.800,00", status: "Rejeitada", tipo: "NF-e", ultimoRetorno: "Erro 539 - Duplicidade" },
  { id: 3, numero: 150, serie: "1", cliente: "DEF ME", data: "16/02/2026", valor: "R$ 3.200,00", status: "Rascunho", tipo: "NF-e", ultimoRetorno: "—" },
  { id: 4, numero: 48, serie: "1", cliente: "GHI Consultoria", data: "15/02/2026", valor: "R$ 8.500,00", status: "Autorizada", tipo: "NFS-e", ultimoRetorno: "Autorizado" },
  { id: 5, numero: 149, serie: "1", cliente: "JKL Ind.", data: "14/02/2026", valor: "R$ 22.000,00", status: "Cancelada", tipo: "NF-e", ultimoRetorno: "Cancelamento homologado" },
  { id: 6, numero: 148, serie: "1", cliente: "MNO Serv.", data: "13/02/2026", valor: "R$ 1.800,00", status: "Enviada", tipo: "NFS-e", ultimoRetorno: "Aguardando retorno" },
];

const NotasFiscais = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [tipoFilter, setTipoFilter] = useState("todos");

  const filtered = mockNotas.filter(n => {
    const matchSearch = n.cliente.toLowerCase().includes(search.toLowerCase()) || String(n.numero).includes(search);
    const matchStatus = statusFilter === "todos" || n.status === statusFilter;
    const matchTipo = tipoFilter === "todos" || n.tipo === tipoFilter;
    return matchSearch && matchStatus && matchTipo;
  });

  const getExportData = () => filtered.map(n => ({ Nº: n.numero, Série: n.serie, Cliente: n.cliente, Data: n.data, Valor: n.valor, Status: n.status, Tipo: n.tipo }));

  return (
    <div className="flex flex-col h-full bg-background"><div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate("/fiscal/notas/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Nota Fiscal</Button>
        <ExportButton getData={getExportData} fileName="notas-fiscais" />
      </div>

      <FilterSection fields={[
        { type: "text" as const, label: "Buscar", placeholder: "Nº ou cliente...", value: search, onChange: setSearch, width: "flex-1 min-w-[180px]" },
      ]} resultsCount={filtered.length}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="Rascunho">Rascunho</SelectItem>
            <SelectItem value="Enviada">Enviada</SelectItem>
            <SelectItem value="Autorizada">Autorizada</SelectItem>
            <SelectItem value="Rejeitada">Rejeitada</SelectItem>
            <SelectItem value="Cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="NF-e">NF-e</SelectItem>
            <SelectItem value="NFS-e">NFS-e</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-table-header">
            <TableHead className="font-semibold">Nº</TableHead>
            <TableHead className="font-semibold">Série</TableHead>
            <TableHead className="font-semibold">Cliente</TableHead>
            <TableHead className="text-center font-semibold">Data</TableHead>
            <TableHead className="text-right font-semibold">Valor Total</TableHead>
            <TableHead className="text-center font-semibold">Tipo</TableHead>
            <TableHead className="text-center font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Último Retorno</TableHead>
            <TableHead className="text-center font-semibold">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma nota encontrada.</TableCell></TableRow> :
              filtered.map(n => (
                <TableRow key={n.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-mono font-bold">{n.numero}</TableCell>
                  <TableCell >{n.serie}</TableCell>
                  <TableCell className="font-medium">{n.cliente}</TableCell>
                  <TableCell className="text-center text-sm">{fmtDate(n.data)}</TableCell>
                  <TableCell className="font-semibold">{n.valor}</TableCell>
                  <TableCell className="text-center"><StatusBadge status={n.tipo} /></TableCell>
                  <TableCell className="text-center"><StatusBadge status={n.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{n.ultimoRetorno}</TableCell>
                  <TableCell >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem className="gap-2" onClick={() => navigate(`/fiscal/notas/${n.id}`)}><Eye className="h-4 w-4" />Visualizar</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><FileDown className="h-4 w-4" />Baixar XML</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><FileDown className="h-4 w-4" />Baixar PDF/DANFE</DropdownMenuItem>
                        {n.status === "Rejeitada" && <DropdownMenuItem className="gap-2" onClick={() => toast({ title: "Reenviando...", description: `Nota #${n.numero} está sendo reenviada.` })}><RotateCcw className="h-4 w-4" />Reenviar</DropdownMenuItem>}
                        {n.status === "Autorizada" && <DropdownMenuItem className="gap-2 text-destructive" onClick={() => toast({ title: "Cancelamento", description: `Solicitação de cancelamento para nota #${n.numero}.` })}><XCircle className="h-4 w-4" />Cancelar</DropdownMenuItem>}
                        <DropdownMenuItem className="gap-2" onClick={() => toast({ title: "Duplicada", description: `Rascunho criado a partir da nota #${n.numero}.` })}><Copy className="h-4 w-4" />Duplicar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div></div>
  );
};

export default NotasFiscais;