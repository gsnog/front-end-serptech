import { useState } from "react"
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
import { fetchContasReceber, fetchContasPagar, contasReceberQueryKey, contasPagarQueryKey } from "@/services/financeiro"

type TipoRelatorio = "contas-receber" | "contas-pagar" | "fluxo-caixa"
type TipoData = "vencimento" | "faturamento" | "pagamento"
type FiltroTempo = "anual" | "trimestral" | "mensal" | "diario" | "personalizado"

// --- Mocks removidos ---
const mockFluxoCaixa: any[] = []

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

export default function Relatorios() {
  const [tipo, setTipo] = useState<TipoRelatorio>("contas-receber")
  const [tipoData, setTipoData] = useState<TipoData>("vencimento")
  const [filtroTempo, setFiltroTempo] = useState<FiltroTempo>("anual")
  const [ano, setAno] = useState("2026")
  const [trimestre, setTrimestre] = useState("1")
  const [mes, setMes] = useState("01")
  const [dia, setDia] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  // Relacionados filters
  const [cliente, setCliente] = useState("")
  const [contaBancaria, setContaBancaria] = useState("")
  const [classificacao, setClassificacao] = useState("")
  const [categoria, setCategoria] = useState("")
  const [planoContas, setPlanoContas] = useState("")
  const [diretoria, setDiretoria] = useState("")
  const [area, setArea] = useState("")
  const [areaFinal, setAreaFinal] = useState("")
  const [centroReceita, setCentroReceita] = useState("")
  const [status, setStatus] = useState("")

  const [showPopup, setShowPopup] = useState(false)
  const [reportPage, setReportPage] = useState(1)
  const REPORT_PAGE_SIZE = 5

  // Real API data — fetch all (no page param) for totals/sums
  const { data: contasReceberRaw } = useQuery({ queryKey: contasReceberQueryKey, queryFn: fetchContasReceber })
  const { data: contasPagarRaw } = useQuery({ queryKey: contasPagarQueryKey, queryFn: fetchContasPagar })
  const contasReceberApi = Array.isArray(contasReceberRaw) ? contasReceberRaw : (contasReceberRaw?.results ?? [])
  const contasPagarApi = Array.isArray(contasPagarRaw) ? contasPagarRaw : (contasPagarRaw?.results ?? [])

  // Map API data to display format
  const contasReceberDisplay = contasReceberApi.map(cr => ({
    codigo: `CR${String(cr.id).padStart(3, '0')}`,
    cliente: cr.cliente_nome || String(cr.cliente || '—'),
    vencimento: cr.data_de_vencimento || '—',
    faturamento: cr.data_de_faturamento || '—',
    pagamento: '—',
    valor: cr.valor_do_titulo != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cr.valor_do_titulo) : 'R$ 0,00',
    status: cr.status || '—',
    categoria: '—',
    contaBancaria: '—',
    classificacao: '—',
  }))

  const contasPagarDisplay = contasPagarApi.map(cp => ({
    codigo: `CP${String(cp.id).padStart(3, '0')}`,
    beneficiario: cp.fornecedor_nome || String(cp.beneficiario || '—'),
    vencimento: cp.data_de_vencimento || '—',
    faturamento: cp.data_de_faturamento || '—',
    pagamento: '—',
    valor: cp.valor_do_titulo != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cp.valor_do_titulo) : 'R$ 0,00',
    status: cp.status || '—',
    categoria: '—',
    contaBancaria: '—',
    classificacao: '—',
  }))

  const getData = () => {
    if (tipo === "contas-receber") return contasReceberDisplay
    if (tipo === "contas-pagar") return contasPagarDisplay
    return mockFluxoCaixa
  }

  const getPagedData = () => {
    const all = getData()
    const start = (reportPage - 1) * REPORT_PAGE_SIZE
    return all.slice(start, start + REPORT_PAGE_SIZE)
  }
  const reportTotalPages = Math.ceil(getData().length / REPORT_PAGE_SIZE)

  const getExportData = () => {
    const data = getData()
    return data.map(item => ({ ...item }))
  }

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    const label = tipo === "contas-receber" ? "Contas a Receber" : tipo === "contas-pagar" ? "Contas a Pagar" : "Fluxo de Caixa"
    exportData(getExportData() as Record<string, unknown>[], `Relatório ${label}`, format)
  }

  const SelectFilter = ({ label: lbl, value: val, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{lbl}</Label>
      <Select value={val} onValueChange={onChange}>
        <SelectTrigger className="w-full"><SelectValue placeholder="---" /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">

        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            {/* Primary filters */}
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

              {/* Dynamic time filters */}
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

            {/* Extra row for trimestral/mensal year + personalizado end */}
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
            <div className="border-t border-border pt-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Relacionados</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectFilter label="Cliente:" value={cliente} onChange={setCliente} options={[
                  { value: "abc", label: "Cliente ABC" }, { value: "xyz", label: "Cliente XYZ" }, { value: "def", label: "Cliente DEF" },
                ]} />
                <SelectFilter label="Conta Bancária:" value={contaBancaria} onChange={setContaBancaria} options={[
                  { value: "bb", label: "Banco do Brasil" }, { value: "itau", label: "Itaú" }, { value: "bradesco", label: "Bradesco" },
                ]} />
                <SelectFilter label="Classificação:" value={classificacao} onChange={setClassificacao} options={[
                  { value: "receita-op", label: "Receita Operacional" }, { value: "receita-extra", label: "Receita Extra" }, { value: "despesa-op", label: "Despesa Operacional" },
                ]} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <SelectFilter label="Categoria:" value={categoria} onChange={setCategoria} options={[
                  { value: "servicos", label: "Serviços" }, { value: "produtos", label: "Produtos" }, { value: "consultoria", label: "Consultoria" },
                ]} />
                <SelectFilter label="Plano de Contas:" value={planoContas} onChange={setPlanoContas} options={[
                  { value: "plano1", label: "Plano Principal" }, { value: "plano2", label: "Plano Auxiliar" },
                ]} />
                <SelectFilter label="Diretoria:" value={diretoria} onChange={setDiretoria} options={[
                  { value: "financeira", label: "Financeira" }, { value: "operacional", label: "Operacional" }, { value: "comercial", label: "Comercial" },
                ]} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <SelectFilter label="Área:" value={area} onChange={setArea} options={[
                  { value: "adm", label: "Administrativo" }, { value: "ti", label: "TI" }, { value: "producao", label: "Produção" },
                ]} />
                <SelectFilter label="Área Final:" value={areaFinal} onChange={setAreaFinal} options={[
                  { value: "adm", label: "Administrativo" }, { value: "ti", label: "TI" }, { value: "producao", label: "Produção" },
                ]} />
                <SelectFilter label="Centro de Receita:" value={centroReceita} onChange={setCentroReceita} options={[
                  { value: "cr1", label: "Centro Principal" }, { value: "cr2", label: "Centro Secundário" },
                ]} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <SelectFilter label="Status:" value={status} onChange={setStatus} options={[
                  { value: "em-aberto", label: "Em Aberto" }, { value: "paga", label: "Paga/Recebida" }, { value: "vencida", label: "Vencida" },
                ]} />
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={() => { setShowPopup(true); setReportPage(1); }} className="gap-2">
                <FileText className="h-4 w-4" />
                Gerar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Relatório - {tipo === "contas-receber" ? "Contas a Receber" : tipo === "contas-pagar" ? "Contas a Pagar" : "Fluxo de Caixa"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filtroTempo === "anual" ? `Ano ${ano}` : filtroTempo === "trimestral" ? `${trimestres.find(t => t.value === trimestre)?.label} - ${ano}` : filtroTempo === "mensal" ? `${meses.find(m => m.value === mes)?.label} - ${ano}` : filtroTempo === "diario" ? dia : `${dataInicio} a ${dataFim}`}
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
              {/* Summary */}
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Registros</p>
                  <p className="text-xl font-bold text-primary mt-1">{getData().length}</p>
                </div>
                {tipo !== "fluxo-caixa" && (
                  <>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Em Aberto</p>
                      <p className="text-xl font-bold text-primary mt-1">{getData().filter((i: any) => i.status === "Em Aberto").length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{tipo === "contas-receber" ? "Recebidas" : "Pagas"}</p>
                      <p className="text-xl font-bold text-primary mt-1">{getData().filter((i: any) => i.status === "Recebida" || i.status === "Paga").length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidas</p>
                      <p className="text-xl font-bold text-primary mt-1">{getData().filter((i: any) => i.status === "Vencida").length}</p>
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
                      <TableHead className="text-center text-foreground font-semibold">Vencimento</TableHead>
                      <TableHead className="text-foreground font-semibold">Categoria</TableHead>
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
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell className="font-semibold">{item.valor}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {tipo === "contas-pagar" && (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
                      <TableHead className="text-foreground font-semibold">Código</TableHead>
                      <TableHead className="text-foreground font-semibold">Beneficiário</TableHead>
                      <TableHead className="text-center text-foreground font-semibold">Vencimento</TableHead>
                      <TableHead className="text-foreground font-semibold">Categoria</TableHead>
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
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell className="font-semibold">{item.valor}</TableCell>
                        <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {tipo === "fluxo-caixa" && (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
                      <TableHead className="text-center text-foreground font-semibold">Data</TableHead>
                      <TableHead className="text-foreground font-semibold">Descrição</TableHead>
                      <TableHead className="text-foreground font-semibold">Entrada</TableHead>
                      <TableHead className="text-foreground font-semibold">Saída</TableHead>
                      <TableHead className="text-right text-foreground font-semibold">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockFluxoCaixa.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.data}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="font-semibold text-lime-600">{item.entrada}</TableCell>
                        <TableCell className="font-semibold text-rose-500">{item.saida}</TableCell>
                        <TableCell className="font-bold">{item.saldo}</TableCell>
                      </TableRow>
                    ))}
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