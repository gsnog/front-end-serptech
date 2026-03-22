import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { TableActions } from "@/components/TableActions";
import { Plus, Search, Megaphone, Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchCampanhas, campanhasQueryKey, calcularMetricasCampanha, fetchCanais, canaisQueryKey } from "@/services/marketing";

// --- Stub temporário para evitar crashes por mock deletado ---
const pessoasMock: any[] = [];




const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function Campanhas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [canalFilter, setCanalFilter] = useState("__all__");

  const [currentPage, setCurrentPage] = useState(1);
  const { data: pageResponse } = useQuery({
    queryKey: [...campanhasQueryKey, currentPage],
    queryFn: () => fetchCampanhas(currentPage),
  });
  const fetchedCampanhas = Array.isArray(pageResponse) ? pageResponse : (pageResponse?.results ?? []);
  const totalCount = Array.isArray(pageResponse) ? pageResponse.length : (pageResponse?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);
  const { data: canaisData = [] as any[] } = useQuery({ queryKey: canaisQueryKey, queryFn: fetchCanais });
  const [campanhas, setCampanhas] = useState<any[]>([]);

  useEffect(() => {
    if (fetchedCampanhas.length > 0) {
      setCampanhas(fetchedCampanhas);
    }
  }, [fetchedCampanhas]);

  const canais = [...new Set(campanhas.map(c => c.canal_principal || 'N/A'))];

  const filteredCampanhas = campanhas.filter((campanha: any) => {
    const matchSearch = campanha.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "__all__" || campanha.status === statusFilter;
    const matchCanal = canalFilter === "__all__" || campanha.canal_principal === canalFilter;
    return matchSearch && matchStatus && matchCanal;
  });

  const getStatusBadgeStatus = (status: string): string => {
    switch (status) {
      case 'planejada': return 'Processando';
      case 'ativa': return 'Entrada';
      case 'pausada': return 'Em andamento';
      case 'finalizada': return 'Normal';
      default: return 'Em aberto';
    }
  };

  const getOwnerName = (ownerId: string) => {
    const pessoa = pessoasMock.find(p => p.id === ownerId);
    return pessoa?.nome.split(' ')[0] || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-[300px]"
          />
        </div>
        <Button onClick={() => navigate('/marketing/campanhas/nova')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border border-border rounded p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="planejada">Planejada</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Canal:</span>
            <Select value={canalFilter} onValueChange={setCanalFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {canais.map(canal => (
                  <SelectItem key={canal} value={canal}>{canal}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("__all__");
              setCanalFilter("__all__");
              setSearchTerm("");
            }}
          >
            Limpar Filtros
          </Button>

          <span className="ml-auto text-sm text-muted-foreground">
            {filteredCampanhas.length} resultado(s)
          </span>
        </div>
      </Card>

      {/* Tabela */}
      <div className="rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead>Campanha</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Gasto</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampanhas.map((campanha: any) => {
              const metricas = calcularMetricasCampanha() as any;
              const orcamentoNum = parseFloat(campanha.orcamento || '0');
              const gastoNum = parseFloat(campanha.custo_real || '0');
              const progressoOrcamento = orcamentoNum > 0 ? (gastoNum / orcamentoNum) * 100 : 0;

              return (
                <TableRow key={campanha.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{campanha.nome}</p>
                        <p className="text-xs text-muted-foreground">{campanha.tipo_campanha}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{campanha.canal_principal || 'Multi'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {campanha.data_inicio ? new Date(campanha.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'} -
                      {campanha.data_fim ? new Date(campanha.data_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(orcamentoNum)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="text-sm">{formatCurrency(gastoNum)}</span>
                      <Progress value={progressoOrcamento} className="h-1.5 w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{metricas.leads || 0}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${(metricas.roi || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {(metricas.roi || 0) > 0 ? '+' : ''}{(metricas.roi || 0).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getStatusBadgeStatus(campanha.status)} />
                  </TableCell>
                  <TableCell>{campanha.criador}</TableCell>
                  <TableCell>
                    <TableActions
                      onView={() => { }}
                      onEdit={() => { }}
                      onDelete={() => { }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
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
