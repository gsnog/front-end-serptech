import { useState } from "react";
import { fmtDate } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { StatusBadge } from "@/components/StatusBadge";
import {
  fetchConciliacoes, deleteConciliacao,
  conciliacoesQueryKey, type Conciliacao,
} from "@/services/financeiro";

const ConciliacaoBancaria = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchConta, setSearchConta] = useState("");
  const [searchData, setSearchData] = useState("");

  const { data: items = [], isLoading } = useQuery({ queryKey: conciliacoesQueryKey, queryFn: fetchConciliacoes });

  const filterFields = [
    { type: "text" as const, label: "Conta", placeholder: "Buscar conta...", value: searchConta, onChange: setSearchConta, width: "flex-1 min-w-[200px]" },
    { type: "date" as const, label: "Data", value: searchData, onChange: setSearchData, width: "min-w-[160px]" }
  ];

  const filteredConciliacoes = items.filter(c =>
    c.descricao?.toLowerCase().includes(searchConta.toLowerCase()) ||
    c.numero_conta?.includes(searchConta)
  );

  const pendingCount = items.filter(c => c.conciliacao === "Não Efetuado").length;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="ml-auto">
            <span className="px-4 py-2 rounded bg-warning/20 text-warning font-medium text-sm">
              Conciliações Pendentes: {pendingCount}
            </span>
          </div>
        </div>
        <FilterSection fields={filterFields} resultsCount={filteredConciliacoes.length} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-center font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Conta</TableHead>
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="text-right font-semibold">Valor</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filteredConciliacoes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma conciliação encontrada.</TableCell></TableRow>
              ) : (
                filteredConciliacoes.map((c) => (
                  <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="text-center">{fmtDate(c.data)}</TableCell>
                    <TableCell className="font-medium">{c.numero_conta}</TableCell>
                    <TableCell >{c.descricao}</TableCell>
                    <TableCell className="text-right font-semibold">R$ {c.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={c.conciliacao} /></TableCell>
                    <TableCell className="text-center"><TableActions onView={() => { }} onEdit={() => { }} onDelete={() => { }} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ConciliacaoBancaria;