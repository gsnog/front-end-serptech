import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/StatusBadge"
import { FileText, Download, X } from "lucide-react"
import { exportData } from "@/lib/exportData"
import {
  fetchContasReceberAll, fetchContasPagarAll,
  fetchClientes, fetchContasBancarias, fetchCategoriasFinanceiras,
  fetchClassificacoesFinanceiras, fetchPlanoContas, fetchCentrosCusto,
  contasReceberAllQueryKey, contasPagarAllQueryKey,
  clientesQueryKey, contasBancariasQueryKey,
  categoriasFinanceirasQueryKey, classificacoesFinanceirasQueryKey,
  planoContasQueryKey, centrosCustoQueryKey,
} from "@/services/financeiro"

type TipoRelatorio = "contas-receber" | "contas-pagar" | "fluxo-caixa"
type TipoData = "vencimento" | "faturamento" | "pagamento"
type FiltroTempo = "anual" | "trimestral" | "mensal" | "diario" | "personalizado"

const trimestres = [
  { value: "1", label: "1º Trimestre (Jan-Mar)" },
  { value: "2", label: "2º Trimestre (Abr-Jun)" },
  { value: "3", label: "3º Trimestre (Jul-Set)" },
  { value: "4", label: "4º Trimestre (Out-Dez)" },
]

const meses = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
]

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string | null | undefined) => {
  if (!d || d === '—') return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

export default function Relatorios() {
  const [tipo, setTipo] = useState<TipoRelatorio>("contas-receber")
  const [tipoData, setTipoData] = useState<TipoData>("vencimento")
  const [filtroTempo, setFiltroTempo] = useState<FiltroTempo>("anual")
  const [ano, setAno] = useState(String(new Date().getFullYear()))
  const [trimestre, setTrimestre] = useState("1")
  const [mes, setMes] = useState("01")
  const [dia, setDia] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const [clienteId, setClienteId] = useState("")
  const [beneficiarioId, setBeneficiarioId] = useState("")
  const [contaBancariaId, setContaBancariaId] = useState("")
  const [classificacaoId, setClassificacaoId] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [planoContasId, setPlanoContasId] = useState("")
  const [centroId, setCentroId] = useState("")
  const [status, setStatus] = useState("")

  const [showPopup, setShowPopup] = useState(false)
  const [reportPage, setReportPage] = useState(1)
  const REPORT_PAGE_SIZE = 5

  // Dados principais
  const { data: contasReceberRaw } = useQuery({ queryKey: contasReceberAllQueryKey, queryFn: fetchContasReceberAll })
  const { data: contasPagarRaw } = useQuery({ queryKey: contasPagarAllQueryKey, queryFn: fetchContasPagarAll })

  // Dados para dropdowns
  const { data: clientesRaw } = useQuery({ queryKey: clientesQueryKey, queryFn: fetchClientes })
  const { data: contasBancariasRaw } = useQuery({ queryKey: contasBancariasQueryKey, queryFn: fetchContasBancarias })
  const { data: categoriasRaw } = useQuery({ queryKey: categoriasFinanceirasQueryKey, queryFn: fetchCategoriasFinanceiras })
  const { data: classificacoesRaw } = useQuery({ queryKey: classificacoesFinanceirasQueryKey, queryFn: fetchClassificacoesFinanceiras })
  const { data: planoContasRaw } = useQuery({ queryKey: planoContasQueryKey, queryFn: fetchPlanoContas })
  const { data: centrosCustoRaw } = useQuery({ queryKey: centrosCustoQueryKey, queryFn: fetchCentrosCusto })

  const contasReceberApi = contasReceberRaw ?? []
  const contasPagarApi = contasPagarRaw ?? []
  const clientesList = Array.isArray(clientesRaw) ? clientesRaw : (clientesRaw as any)?.results ?? []
  const contasBancariasList = Array.isArray(contasBancariasRaw) ? contasBancariasRaw : (contasBancariasRaw as any)?.results ?? []
  const categoriasList = Array.isArray(categoriasRaw) ? categoriasRaw : (categoriasRaw as any)?.results ?? []
  const classificacoesList = Array.isArray(classificacoesRaw) ? classificacoesRaw : (classificacoesRaw as any)?.results ?? []
  const planoContasList = Array.isArray(planoContasRaw) ? planoContasRaw : (planoContasRaw as any)?.results ?? []
  const centrosCustoList = Array.isArray(centrosCustoRaw) ? centrosCustoRaw : (centrosCustoRaw as any)?.results ?? []

  const beneficiariosList = useMemo(() => {
    const seen = new Set<number>()
    return contasPagarApi
      .filter((cp: any) => cp.beneficiario && cp.fornecedor_nome && !seen.has(cp.beneficiario) && seen.add(cp.beneficiario))
      .map((cp: any) => ({ value: String(cp.beneficiario), label: cp.fornecedor_nome }))
  }, [contasPagarApi])

  // Resolve qual campo de data usar conforme tipoData selecionado (vencimento/faturamento apenas)
  const getDateField = (item: any): string | null => {
    if (tipoData === "faturamento") return item.data_de_faturamento ?? null
    return item.data_de_vencimento ?? null
  }

  // Verifica se uma data (string YYYY-MM-DD) está dentro do período selecionado
  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const y = d.getFullYear()
    const m = d.getMonth() + 1

    if (filtroTempo === "anual") return y === parseInt(ano)
    if (filtroTempo === "trimestral") {
      const q = parseInt(trimestre)
      const startM = (q - 1) * 3 + 1
      return y === parseInt(ano) && m >= startM && m < startM + 3
    }
    if (filtroTempo === "mensal") return y === parseInt(ano) && m === parseInt(mes)
    if (filtroTempo === "diario") return dia ? dateStr.startsWith(dia) : true
    if (filtroTempo === "personalizado") return (!dataInicio || dateStr >= dataInicio) && (!dataFim || dateStr <= dataFim)
    return true
  }

  const filteredContasReceber = useMemo(() => {
    return contasReceberApi.filter((cr: any) => {
      if (tipoData === "pagamento") {
        const parcelas: any[] = cr.parcelas ?? []
        if (!parcelas.some(p => p.data_de_pagamento && isInPeriod(p.data_de_pagamento))) return false
      } else {
        if (!isInPeriod(getDateField(cr))) return false
      }
      if (clienteId && String(cr.cliente) !== clienteId) return false
      if (status && cr.status !== status) return false
      if (planoContasId && String(cr.plano_de_contas) !== planoContasId) return false
      if (centroId && String(cr.centro_de_receita) !== centroId) return false
      if (classificacaoId && String(cr.classificacao) !== classificacaoId) return false
      if (categoriaId && String(cr.categoria) !== categoriaId) return false
      return true
    })
  }, [contasReceberApi, tipoData, filtroTempo, ano, trimestre, mes, dia, dataInicio, dataFim, clienteId, status, planoContasId, centroId, classificacaoId, categoriaId])

  const filteredContasPagar = useMemo(() => {
    return contasPagarApi.filter((cp: any) => {
      if (tipoData === "pagamento") {
        const parcelas: any[] = cp.parcelas ?? []
        if (!parcelas.some(p => p.data_de_pagamento && isInPeriod(p.data_de_pagamento))) return false
      } else {
        if (!isInPeriod(getDateField(cp))) return false
      }
      if (beneficiarioId && String(cp.beneficiario) !== beneficiarioId) return false
      if (status && cp.status !== status) return false
      if (planoContasId && String(cp.plano_de_contas) !== planoContasId) return false
      if (centroId && String(cp.centro_de_custo) !== centroId) return false
      if (classificacaoId && String(cp.classificacao) !== classificacaoId) return false
      if (categoriaId && String(cp.categoria) !== categoriaId) return false
      return true
    })
  }, [contasPagarApi, tipoData, filtroTempo, ano, trimestre, mes, dia, dataInicio, dataFim, beneficiarioId, status, planoContasId, centroId, classificacaoId, categoriaId])

  // Fluxo de caixa como extrato: só parcelas pagas no período, ordenadas por data de pagamento
  const fluxoCaixaDisplay = useMemo(() => {
    const linhas: { data: string; descricao: string; tipo: 'entrada' | 'saida'; valor: number }[] = []

    contasReceberApi.forEach((cr: any) => {
      const parcelas: any[] = cr.parcelas ?? []
      parcelas.forEach(p => {
        if (!p.data_de_pagamento) return
        if (!isInPeriod(p.data_de_pagamento)) return
        linhas.push({
          data: p.data_de_pagamento,
          descricao: cr.cliente_nome || String(cr.cliente || '—'),
          tipo: 'entrada',
          valor: p.valor ?? 0,
        })
      })
    })

    contasPagarApi.forEach((cp: any) => {
      const parcelas: any[] = cp.parcelas ?? []
      parcelas.forEach(p => {
        if (!p.data_de_pagamento) return
        if (!isInPeriod(p.data_de_pagamento)) return
        linhas.push({
          data: p.data_de_pagamento,
          descricao: cp.fornecedor_nome || String(cp.beneficiario || '—'),
          tipo: 'saida',
          valor: p.valor ?? 0,
        })
      })
    })

    linhas.sort((a, b) => a.data.localeCompare(b.data))

    let saldoAcc = 0
    return linhas.map(item => {
      saldoAcc += item.tipo === 'entrada' ? item.valor : -item.valor
      return {
        data: fmtDate(item.data),
        descricao: item.descricao,
        saldo: fmt(saldoAcc),
        _entradaVal: item.tipo === 'entrada' ? item.valor : 0,
        _saidaVal: item.tipo === 'saida' ? item.valor : 0,
        entrada: item.tipo === 'entrada' ? fmt(item.valor) : '—',
        saida: item.tipo === 'saida' ? fmt(item.valor) : '—',
      }
    })
  }, [contasReceberApi, contasPagarApi, filtroTempo, ano, trimestre, mes, dia, dataInicio, dataFim])

  const contasReceberDisplay = filteredContasReceber.map(cr => ({
    codigo: `CR${String(cr.id).padStart(3, '0')}`,
    cliente: cr.cliente_nome || String(cr.cliente || '—'),
    vencimento: fmtDate(cr.data_de_vencimento),
    faturamento: fmtDate(cr.data_de_faturamento),
    valor: fmt(cr.valor_total ?? 0),
    status: cr.status || '—',
  }))

  const contasPagarDisplay = filteredContasPagar.map(cp => ({
    codigo: `CP${String(cp.id).padStart(3, '0')}`,
    beneficiario: cp.fornecedor_nome || String(cp.beneficiario || '—'),
    vencimento: fmtDate(cp.data_de_vencimento),
    faturamento: fmtDate(cp.data_de_faturamento),
    valor: fmt(cp.valor_total ?? 0),
    status: cp.status || '—',
  }))

  const getData = () => {
    if (tipo === "contas-receber") return contasReceberDisplay
    if (tipo === "contas-pagar") return contasPagarDisplay
    return fluxoCaixaDisplay
  }

  const getPagedData = () => {
    const all = getData()
    const start = (reportPage - 1) * REPORT_PAGE_SIZE
    return all.slice(start, start + REPORT_PAGE_SIZE)
  }
  const reportTotalPages = Math.ceil(getData().length / REPORT_PAGE_SIZE)

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    const label = tipo === "contas-receber" ? "Contas a Receber" : tipo === "contas-pagar" ? "Contas a Pagar" : "Fluxo de Caixa"
    const exportable = getData().map(({ ...item }: any) => {
      delete item._entradaVal; delete item._saidaVal; return item
    })
    exportData(exportable as Record<string, unknown>[], `Relatório ${label}`, format)
  }

  const NONE = "__all__"
  const SelectFilter = ({ label: lbl, value: val, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{lbl}</Label>
      <Select value={val || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
        <SelectTrigger className="w-full"><SelectValue placeholder="---" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>---</SelectItem>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            {/* Filtros principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SelectFilter label="Tipo:" value={tipo} onChange={(v) => setTipo(v as TipoRelatorio)} options={[
                { value: "contas-receber", label: "Contas a Receber" },
                { value: "contas-pagar", label: "Contas a Pagar" },
                { value: "fluxo-caixa", label: "Fluxo de Caixa" },
              ]} />
              <SelectFilter label="Data:" value={tipoData} onChange={(v) => setTipoData(v as TipoData)} options={[
                { value: "vencimento", label: "Data de Vencimento" },
                { value: "faturamento", label: "Data de Faturamento" },
                { value: "pagamento", label: "Data de Pagamento" },
              ]} />
              <SelectFilter label="Filtrar por:" value={filtroTempo} onChange={(v) => setFiltroTempo(v as FiltroTempo)} options={[
                { value: "anual", label: "Anual" },
                { value: "trimestral", label: "Trimestral" },
                { value: "mensal", label: "Mensal" },
                { value: "diario", label: "Diário" },
                { value: "personalizado", label: "Personalizado" },
              ]} />

              {filtroTempo === "anual" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Ano:</Label>
                  <Input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2026" />
                </div>
              )}
              {filtroTempo === "trimestral" && (
                <SelectFilter label="Trimestre:" value={trimestre} onChange={setTrimestre} options={trimestres} />
              )}
              {filtroTempo === "mensal" && (
                <SelectFilter label="Mês:" value={mes} onChange={setMes} options={meses} />
              )}
              {filtroTempo === "diario" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Data:</Label>
                  <Input type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
                </div>
              )}
              {filtroTempo === "personalizado" && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Data Início:</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                </div>
              )}
            </div>

            {(filtroTempo === "trimestral" || filtroTempo === "mensal") && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Ano:</Label>
                  <Input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2026" />
                </div>
              </div>
            )}
            {filtroTempo === "personalizado" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Data Fim:</Label>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
              </div>
            )}

            {/* Relacionados */}
            {tipo !== "fluxo-caixa" && <div className="border-t border-border pt-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Relacionados</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tipo !== "contas-pagar" ? (
                  <SelectFilter label="Cliente:" value={clienteId} onChange={setClienteId}
                    options={clientesList.map((c: any) => ({ value: String(c.id), label: c.nome }))} />
                ) : (
                  <SelectFilter label="Beneficiário:" value={beneficiarioId} onChange={setBeneficiarioId}
                    options={beneficiariosList} />
                )}
                <SelectFilter label="Conta Bancária:" value={contaBancariaId} onChange={setContaBancariaId}
                  options={contasBancariasList.map((c: any) => ({ value: String(c.id), label: `${c.banco} - ${c.numero_conta}` }))} />
                <SelectFilter label="Classificação:" value={classificacaoId} onChange={setClassificacaoId}
                  options={classificacoesList.map((c: any) => ({ value: String(c.id), label: c.nome }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <SelectFilter label="Categoria:" value={categoriaId} onChange={setCategoriaId}
                  options={categoriasList.map((c: any) => ({ value: String(c.id), label: c.nome }))} />
                <SelectFilter label="Plano de Contas:" value={planoContasId} onChange={setPlanoContasId}
                  options={planoContasList.map((p: any) => ({ value: String(p.id), label: [p.id_plano, p.classificacao_nome, p.categoria_nome].filter(Boolean).join(" - ") }))} />
                <SelectFilter label="Centro de Custo:" value={centroId} onChange={setCentroId}
                  options={centrosCustoList.map((c: any) => ({ value: String(c.id), label: c.centro_id ?? String(c.id) }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <SelectFilter label="Status:" value={status} onChange={setStatus} options={[
                  { value: "Pago", label: "Pago" },
                  { value: "Parcialmente Feito", label: "Parcialmente Feito" },
                  { value: "Não Efetuado", label: "Não Efetuado" },
                ]} />
              </div>
            </div>}

            <div className="pt-4">
              <Button onClick={() => { setShowPopup(true); setReportPage(1) }} className="gap-2">
                <FileText className="h-4 w-4" />
                Gerar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popup de resultados */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Relatório - {tipo === "contas-receber" ? "Contas a Receber" : tipo === "contas-pagar" ? "Contas a Pagar" : "Fluxo de Caixa"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filtroTempo === "anual" ? `Ano ${ano}`
                    : filtroTempo === "trimestral" ? `${trimestres.find(t => t.value === trimestre)?.label} - ${ano}`
                    : filtroTempo === "mensal" ? `${meses.find(m => m.value === mes)?.label} - ${ano}`
                    : filtroTempo === "diario" ? dia
                    : `${dataInicio} a ${dataFim}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('pdf')}>
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('csv')}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('excel')}>
                  <Download className="h-3.5 w-3.5" /> XLSX
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowPopup(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Resumo */}
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Registros</p>
                  <p className="text-xl font-bold text-primary mt-1">{getData().length}</p>
                </div>
                {tipo === "fluxo-caixa" && (
                  <>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Entradas</p>
                      <p className="text-xl font-bold text-lime-600 mt-1">
                        {fmt(fluxoCaixaDisplay.reduce((s, i) => s + (i._entradaVal ?? 0), 0))}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Saídas</p>
                      <p className="text-xl font-bold text-rose-500 mt-1">
                        {fmt(fluxoCaixaDisplay.reduce((s, i) => s + (i._saidaVal ?? 0), 0))}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Final</p>
                      <p className="text-xl font-bold text-primary mt-1">
                        {fluxoCaixaDisplay.length > 0 ? fluxoCaixaDisplay[fluxoCaixaDisplay.length - 1].saldo : fmt(0)}
                      </p>
                    </div>
                  </>
                )}
                {tipo !== "fluxo-caixa" && (
                  <>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Não Efetuado</p>
                      <p className="text-xl font-bold text-primary mt-1">{getData().filter((i: any) => i.status === "Não Efetuado").length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Pago</p>
                      <p className="text-xl font-bold text-primary mt-1">{getData().filter((i: any) => i.status === "Pago").length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Parcial</p>
                      <p className="text-xl font-bold text-primary mt-1">{getData().filter((i: any) => i.status === "Parcialmente Feito").length}</p>
                    </div>
                  </>
                )}
              </div>

              {tipo === "contas-receber" && (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
                      <TableHead className="text-foreground font-semibold">Código</TableHead>
                      <TableHead className="text-foreground font-semibold">Cliente</TableHead>
                      <TableHead className="text-foreground font-semibold">Vencimento</TableHead>
                      <TableHead className="text-foreground font-semibold">Faturamento</TableHead>
                      <TableHead className="text-right text-foreground font-semibold">Valor</TableHead>
                      <TableHead className="text-center text-foreground font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(getPagedData() as typeof contasReceberDisplay).map((item) => (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                        <TableCell>{item.cliente}</TableCell>
                        <TableCell>{item.vencimento}</TableCell>
                        <TableCell>{item.faturamento}</TableCell>
                        <TableCell className="text-right font-semibold text-lime-600">+{item.valor}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                    {contasReceberDisplay.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado para o período selecionado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {tipo === "contas-pagar" && (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
                      <TableHead className="text-foreground font-semibold">Código</TableHead>
                      <TableHead className="text-foreground font-semibold">Beneficiário</TableHead>
                      <TableHead className="text-foreground font-semibold">Vencimento</TableHead>
                      <TableHead className="text-foreground font-semibold">Faturamento</TableHead>
                      <TableHead className="text-right text-foreground font-semibold">Valor</TableHead>
                      <TableHead className="text-center text-foreground font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(getPagedData() as typeof contasPagarDisplay).map((item) => (
                      <TableRow key={item.codigo}>
                        <TableCell className="font-medium text-xs">{item.codigo}</TableCell>
                        <TableCell>{item.beneficiario}</TableCell>
                        <TableCell>{item.vencimento}</TableCell>
                        <TableCell>{item.faturamento}</TableCell>
                        <TableCell className="text-right font-semibold text-rose-500">-{item.valor}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                    {contasPagarDisplay.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado para o período selecionado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {tipo === "fluxo-caixa" && (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
                      <TableHead className="text-foreground font-semibold">Data</TableHead>
                      <TableHead className="text-foreground font-semibold">Descrição</TableHead>
                      <TableHead className="text-right text-foreground font-semibold">Valor</TableHead>
                      <TableHead className="text-right text-foreground font-semibold">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(getPagedData() as typeof fluxoCaixaDisplay).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.data}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className={`text-right font-semibold ${item._entradaVal > 0 ? "text-lime-600" : "text-rose-500"}`}>
                          {item._entradaVal > 0 ? `+${item.entrada}` : `-${item.saida}`}
                        </TableCell>
                        <TableCell className="text-right font-bold">{item.saldo}</TableCell>
                      </TableRow>
                    ))}
                    {fluxoCaixaDisplay.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum registro encontrado para o período selecionado.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {reportTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <span className="text-sm text-muted-foreground">Página {reportPage} de {reportTotalPages} ({getData().length} registros)</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setReportPage(p => Math.max(1, p - 1))} disabled={reportPage === 1}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setReportPage(p => Math.min(reportTotalPages, p + 1))} disabled={reportPage === reportTotalPages}>Próxima</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
