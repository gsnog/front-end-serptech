import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { TableActions } from "@/components/TableActions";
import { Plus, Search, Users, ArrowRight, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchLeadsMarketing, leadsMarketingQueryKey, fetchCampanhas, campanhasQueryKey, fetchCanais, canaisQueryKey } from "@/services/marketing";

export default function LeadsMarketing() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [canalFilter, setCanalFilter] = useState("__all__");

  const [currentPage, setCurrentPage] = useState(1);
  const { data: pageResponse } = useQuery({
    queryKey: [...leadsMarketingQueryKey, currentPage],
    queryFn: () => fetchLeadsMarketing(currentPage),
  });
  const fetchedLeads = Array.isArray(pageResponse) ? pageResponse : (pageResponse?.results ?? []);
  const totalCount = Array.isArray(pageResponse) ? pageResponse.length : (pageResponse?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);
  const { data: campanhasData = [] as any[] } = useQuery({ queryKey: campanhasQueryKey, queryFn: fetchCampanhas });
  const { data: canaisData = [] as any[] } = useQuery({ queryKey: canaisQueryKey, queryFn: fetchCanais });
  const [leadsMarketing, setLeadsMarketing] = useState<any[]>([]);

  useEffect(() => {
    if (fetchedLeads.length > 0) {
      setLeadsMarketing(fetchedLeads);
    }
  }, [fetchedLeads]);

  const filteredLeads = leadsMarketing.filter((lead: any) => {
    const matchSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === "__all__" || lead.status === statusFilter;
    const matchCanal = canalFilter === "__all__" || String(lead.canal_origem) === canalFilter;
    return matchSearch && matchStatus && matchCanal;
  });

  const getStatusBadgeStatus = (status: string): string => {
    switch (status) {
      case 'lead': return 'Em aberto';
      case 'mql': return 'Em andamento';
      case 'sql': return 'Processando';
      case 'convertido': return 'Entrada';
      case 'descartado': return 'Vencida';
      default: return 'Em aberto';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'lead': 'Lead',
      'mql': 'MQL',
      'sql': 'SQL',
      'convertido': 'Convertido',
      'descartado': 'Descartado'
    };
    return labels[status] || status;
  };

  const getCampanhaNome = (campanhaId?: number) => {
    if (!campanhaId) return '-';
    const campanha = campanhasData.find((c: any) => c.id === campanhaId);
    return campanha?.nome || '-';
  };

  const getCanalNome = (canalId?: number) => {
    if (!canalId) return '-';
    const canal = canaisData.find((c: any) => c.id === canalId);
    return canal?.nome || '-';
  };

  // Contadores
  const countByStatus = {
    lead: leadsMarketing.filter((l: any) => l.status === 'lead').length,
    mql: leadsMarketing.filter((l: any) => l.status === 'mql').length,
    sql: leadsMarketing.filter((l: any) => l.status === 'sql').length,
    convertido: leadsMarketing.filter((l: any) => l.status === 'convertido').length,
  };

  return (
    <div className="space-y-6">
      {/* Funil visual */}
      <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded">
        <div className="text-center px-6 py-3 bg-card rounded border border-border">
          <p className="text-2xl font-bold">{countByStatus.lead}</p>
          <p className="text-sm text-muted-foreground">Leads</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-center px-6 py-3 bg-card rounded border border-border">
          <p className="text-2xl font-bold text-warning">{countByStatus.mql}</p>
          <p className="text-sm text-muted-foreground">MQL</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-center px-6 py-3 bg-card rounded border border-border">
          <p className="text-2xl font-bold text-primary">{countByStatus.sql}</p>
          <p className="text-sm text-muted-foreground">SQL</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <div className="text-center px-6 py-3 bg-card rounded border border-border">
          <p className="text-2xl font-bold text-success">{countByStatus.convertido}</p>
          <p className="text-sm text-muted-foreground">Convertidos</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-[300px]"
          />
        </div>
        <Button onClick={() => navigate('/marketing/leads/novo')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
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
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="mql">MQL</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
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
                {canaisData.map((canal: any) => (
                  <SelectItem key={canal.id} value={String(canal.id)}>{canal.nome}</SelectItem>
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
            {filteredLeads.length} resultado(s)
          </span>
        </div>
      </Card>

      {/* Tabela */}
      <div className="rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Campanha</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead: any) => (
              <TableRow key={lead.id} className="hover:bg-muted/50 cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{lead.nome}</span>
                  </div>
                </TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.empresa || '-'}</TableCell>
                <TableCell>{'-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getCanalNome(lead.canal_origem)}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {getCampanhaNome(lead.campanha_origem)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${lead.pontuacao >= 70 ? 'bg-success' :
                            lead.pontuacao >= 40 ? 'bg-warning' : 'bg-muted-foreground'
                          }`}
                        style={{ width: `${lead.pontuacao}%` }}
                      />
                    </div>
                    <span className="text-sm">{lead.pontuacao}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {lead.status === 'mql' && <Target className="h-3 w-3 text-warning" />}
                    {lead.status === 'sql' && <Target className="h-3 w-3 text-primary" />}
                    <StatusBadge status={getStatusBadgeStatus(lead.status)} />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.criado_em ? new Date(lead.criado_em).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
                <TableCell>
                  <TableActions
                    onView={() => { }}
                    onEdit={() => { }}
                    onDelete={() => { }}
                  />
                </TableCell>
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
    </div>
  );
}
