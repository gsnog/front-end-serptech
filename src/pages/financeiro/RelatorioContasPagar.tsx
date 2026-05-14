import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { SimpleFormWizard } from "@/components/SimpleFormWizard"
import { FormActionBar } from "@/components/FormActionBar"
import { FileText, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  fetchContasBancarias, fetchPlanoContas, fetchCentrosCusto,
  contasBancariasQueryKey, planoContasQueryKey, centrosCustoQueryKey,
} from "@/services/financeiro"
import api from "@/lib/api"
import { toast } from "@/hooks/use-toast"

type FiltroPeriodo = "anual" | "trimestral" | "mensal" | "personalizado"
type DateFilter = "due_date" | "payment_date" | "billing_date"

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

export default function RelatorioContasPagar() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("anual")
  const [dateFilter, setDateFilter] = useState<DateFilter>("due_date")
  const [ano, setAno] = useState(String(new Date().getFullYear()))
  const [mes, setMes] = useState("1")
  const [trimestre, setTrimestre] = useState("1")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [centroCustoId, setCentroCustoId] = useState("")
  const [contaBancariaId, setContaBancariaId] = useState("")
  const [planoContasId, setPlanoContasId] = useState("")
  const [status, setStatus] = useState("")

  const { data: contasBancarias } = useQuery({ queryKey: contasBancariasQueryKey, queryFn: fetchContasBancarias })
  const { data: planoContas } = useQuery({ queryKey: planoContasQueryKey, queryFn: fetchPlanoContas })
  const { data: centrosCusto } = useQuery({ queryKey: centrosCustoQueryKey, queryFn: fetchCentrosCusto })

  const contasBancariasList = Array.isArray(contasBancarias) ? contasBancarias : (contasBancarias as any)?.results ?? []
  const planoContasList = Array.isArray(planoContas) ? planoContas : (planoContas as any)?.results ?? []
  const centrosCustoList = Array.isArray(centrosCusto) ? centrosCusto : (centrosCusto as any)?.results ?? []

  const handleGerar = async () => {
    if (filtroPeriodo === "personalizado" && (!dataInicio || !dataFim)) {
      toast({ title: "Preencha as datas de início e fim", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const params: Record<string, string> = { filtro_periodo: filtroPeriodo, ano, date_filter: dateFilter }
      if (filtroPeriodo === "mensal") params.mes = mes
      if (filtroPeriodo === "trimestral") params.trimestre = trimestre
      if (filtroPeriodo === "personalizado") {
        params.data_inicio = dataInicio
        params.data_fim = dataFim
      }
      if (centroCustoId) params.centro_de_custo = centroCustoId
      if (contaBancariaId) params.conta_bancaria = contaBancariaId
      if (planoContasId) params.plano_de_contas = planoContasId
      if (status) params.status = status

      const response = await api.get("/api/financial/gerar_relatorio_contas_pagar/", {
        params,
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }))
      window.open(url, "_blank")
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
    } catch {
      toast({ title: "Erro ao gerar relatório", description: "Verifique os filtros e tente novamente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoltar = () => navigate("/financeiro/contas-pagar")

  return (
    <SimpleFormWizard title="Relatório Contas a Pagar">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Filtros do Relatório</h2>
                <p className="text-sm text-muted-foreground">Configure os filtros para gerar o relatório</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filtrar por</Label>
                <Select value={filtroPeriodo} onValueChange={(v) => setFiltroPeriodo(v as FiltroPeriodo)}>
                  <SelectTrigger className="form-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Data</Label>
                <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                  <SelectTrigger className="form-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="due_date">Data de Vencimento</SelectItem>
                    <SelectItem value="payment_date">Data de Pagamento</SelectItem>
                    <SelectItem value="billing_date">Data de Faturamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filtroPeriodo !== "personalizado" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ano</Label>
                  <Input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2026" className="form-input" />
                </div>
              )}

              {filtroPeriodo === "trimestral" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Trimestre</Label>
                  <Select value={trimestre} onValueChange={setTrimestre}>
                    <SelectTrigger className="form-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="1">1º Trimestre</SelectItem>
                      <SelectItem value="2">2º Trimestre</SelectItem>
                      <SelectItem value="3">3º Trimestre</SelectItem>
                      <SelectItem value="4">4º Trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filtroPeriodo === "mensal" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mês</Label>
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger className="form-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      {MESES.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filtroPeriodo === "personalizado" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data Início</Label>
                    <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="form-input" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data Fim</Label>
                    <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="form-input" />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Relacionados</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Centro de Custo</Label>
                  <Select value={centroCustoId || "__none__"} onValueChange={(v) => setCentroCustoId(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="form-input"><SelectValue placeholder="---" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="__none__">---</SelectItem>
                      {centrosCustoList.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.centro_id ?? c.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Conta Bancária</Label>
                  <Select value={contaBancariaId || "__none__"} onValueChange={(v) => setContaBancariaId(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="form-input"><SelectValue placeholder="---" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="__none__">---</SelectItem>
                      {contasBancariasList.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.banco} - {c.numero_conta}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Plano de Contas</Label>
                  <Select value={planoContasId || "__none__"} onValueChange={(v) => setPlanoContasId(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="form-input"><SelectValue placeholder="---" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="__none__">---</SelectItem>
                      {planoContasList.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>{[p.id_plano, p.classificacao_nome, p.categoria_nome].filter(Boolean).join(" - ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={status || "__none__"} onValueChange={(v) => setStatus(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="form-input"><SelectValue placeholder="---" /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="__none__">---</SelectItem>
                      <SelectItem value="Em Aberto">Em Aberto</SelectItem>
                      <SelectItem value="Efetuado">Efetuado</SelectItem>
                      <SelectItem value="Vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <FormActionBar
              onSave={handleGerar}
              onCancel={handleVoltar}
              isSaving={isLoading}
              saveLabel="Gerar"
              cancelLabel="Voltar"
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  )
}
