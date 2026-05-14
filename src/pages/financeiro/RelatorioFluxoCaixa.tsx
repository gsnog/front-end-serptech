import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { SimpleFormWizard } from "@/components/SimpleFormWizard"
import { FileText } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  fetchContasReceberAll, fetchContasPagarAll,
  contasReceberAllQueryKey, contasPagarAllQueryKey,
} from "@/services/financeiro"

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

const NONE = "__all__"

export default function RelatorioFluxoCaixa() {
  const navigate = useNavigate()
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [beneficiarioId, setBeneficiarioId] = useState("")

  const { data: contasReceberRaw } = useQuery({ queryKey: contasReceberAllQueryKey, queryFn: fetchContasReceberAll })
  const { data: contasPagarRaw } = useQuery({ queryKey: contasPagarAllQueryKey, queryFn: fetchContasPagarAll })

  const contasReceberApi = contasReceberRaw ?? []
  const contasPagarApi = contasPagarRaw ?? []

  const beneficiariosList = useMemo(() => {
    const seen = new Set<string>()
    const lista: { value: string; label: string }[] = []
    contasReceberApi.forEach((cr: any) => {
      const nome = cr.cliente_nome
      if (nome && !seen.has(`r-${cr.cliente}`)) {
        seen.add(`r-${cr.cliente}`)
        lista.push({ value: `r-${cr.cliente}`, label: nome })
      }
    })
    contasPagarApi.forEach((cp: any) => {
      const nome = cp.fornecedor_nome
      if (nome && !seen.has(`p-${cp.beneficiario}`)) {
        seen.add(`p-${cp.beneficiario}`)
        lista.push({ value: `p-${cp.beneficiario}`, label: nome })
      }
    })
    return lista.sort((a, b) => a.label.localeCompare(b.label))
  }, [contasReceberApi, contasPagarApi])

  const isInPeriod = (dateStr: string | null | undefined): boolean => {
    if (!dateStr) return false
    const d = dateStr.split('T')[0]
    return (!dataInicio || d >= dataInicio) && (!dataFim || d <= dataFim)
  }

  const extrato = useMemo(() => {
    const linhas: { data: string; descricao: string; tipo: 'entrada' | 'saida'; valor: number; key: string }[] = []

    contasReceberApi.forEach((cr: any) => {
      if (beneficiarioId && beneficiarioId !== `r-${cr.cliente}`) return
      const parcelas: any[] = cr.parcelas ?? []
      parcelas.forEach(p => {
        if (!p.data_de_pagamento || !isInPeriod(p.data_de_pagamento)) return
        linhas.push({ data: p.data_de_pagamento, descricao: cr.cliente_nome || '—', tipo: 'entrada', valor: p.valor ?? 0, key: `r-${cr.id}-${p.id}` })
      })
    })

    contasPagarApi.forEach((cp: any) => {
      if (beneficiarioId && beneficiarioId !== `p-${cp.beneficiario}`) return
      const parcelas: any[] = cp.parcelas ?? []
      parcelas.forEach(p => {
        if (!p.data_de_pagamento || !isInPeriod(p.data_de_pagamento)) return
        linhas.push({ data: p.data_de_pagamento, descricao: cp.fornecedor_nome || '—', tipo: 'saida', valor: p.valor ?? 0, key: `p-${cp.id}-${p.id}` })
      })
    })

    linhas.sort((a, b) => a.data.localeCompare(b.data))

    let saldoAcc = 0
    return linhas.map(item => {
      saldoAcc += item.tipo === 'entrada' ? item.valor : -item.valor
      return {
        key: item.key,
        data: fmtDate(item.data),
        descricao: item.descricao,
        isEntrada: item.tipo === 'entrada',
        valor: item.tipo === 'entrada' ? `+${fmt(item.valor)}` : `-${fmt(item.valor)}`,
        saldo: fmt(saldoAcc),
        _saldo: saldoAcc,
        _val: item.valor,
      }
    })
  }, [contasReceberApi, contasPagarApi, dataInicio, dataFim, beneficiarioId])

  const totalEntradas = extrato.filter(i => i.isEntrada).reduce((s, i) => s + i._val, 0)
  const totalSaidas = extrato.filter(i => !i.isEntrada).reduce((s, i) => s + i._val, 0)
  const saldoPeriodo = extrato.length > 0 ? extrato[extrato.length - 1]._saldo : 0

  return (
    <SimpleFormWizard title="Fluxo de Caixa">
      <div className="space-y-6">
        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Extrato</h2>
                  <p className="text-sm text-muted-foreground">Parcelas pagas no período</p>
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => navigate("/relatorios")}>
                <FileText className="h-4 w-4" /> Ver Relatórios
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Beneficiário</Label>
                <Select value={beneficiarioId || NONE} onValueChange={v => setBeneficiarioId(v === NONE ? "" : v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="---" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value={NONE}>---</SelectItem>
                    {beneficiariosList.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Início</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="form-input" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Fim</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="form-input" />
              </div>
            </div>
          </CardContent>
        </Card>

        {extrato.length > 0 && (
          <Card className="border-border shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Entradas</p>
                  <p className="text-xl font-bold text-lime-600 mt-1">{fmt(totalEntradas)}</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Saídas</p>
                  <p className="text-xl font-bold text-rose-500 mt-1">{fmt(totalSaidas)}</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo do Período</p>
                  <p className={`text-xl font-bold mt-1 ${saldoPeriodo >= 0 ? 'text-lime-600' : 'text-rose-500'}`}>{fmt(saldoPeriodo)}</p>
                </div>
              </div>

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
                  {extrato.map(item => (
                    <TableRow key={item.key}>
                      <TableCell>{item.data}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell className={`text-right font-semibold ${item.isEntrada ? 'text-lime-600' : 'text-rose-500'}`}>
                        {item.valor}
                      </TableCell>
                      <TableCell className="text-right font-bold">{item.saldo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </SimpleFormWizard>
  )
}
