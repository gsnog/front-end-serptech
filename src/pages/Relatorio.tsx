import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import api from "@/lib/api"
import {
  fetchContasBancarias, fetchCentrosCusto, fetchPlanoContas, fetchClientes,
  contasBancariasQueryKey, centrosCustoQueryKey, planoContasQueryKey, clientesQueryKey,
} from "@/services/financeiro"
import { fetchFornecedores, fornecedoresQueryKey } from "@/services/estoque"

type Tipo = "contas-pagar" | "contas-receber"
type DateFilter = "due_date" | "payment_date" | "billing_date"
type FiltroPeriodo = "anual" | "trimestral" | "mensal" | "personalizado"

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

const NONE = "__none__"

const Relatorio = () => {
  const [tipo, setTipo] = useState<Tipo>("contas-pagar")
  const [dateFilter, setDateFilter] = useState<DateFilter>("due_date")
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>("anual")
  const [ano, setAno] = useState(String(new Date().getFullYear()))
  const [mes, setMes] = useState("1")
  const [trimestre, setTrimestre] = useState("1")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [fornecedorId, setFornecedorId] = useState("")
  const [contaBancariaId, setContaBancariaId] = useState("")
  const [planoContasId, setPlanoContasId] = useState("")
  const [centroCustoId, setCentroCustoId] = useState("")
  const [status, setStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { data: contasBancarias } = useQuery({ queryKey: contasBancariasQueryKey, queryFn: fetchContasBancarias })
  const { data: centrosCusto } = useQuery({ queryKey: centrosCustoQueryKey, queryFn: fetchCentrosCusto })
  const { data: planoContas } = useQuery({ queryKey: planoContasQueryKey, queryFn: fetchPlanoContas })
  const { data: clientes } = useQuery({ queryKey: clientesQueryKey, queryFn: fetchClientes })
  const { data: fornecedores } = useQuery({ queryKey: fornecedoresQueryKey, queryFn: () => fetchFornecedores() })

  const contasBancariasList = Array.isArray(contasBancarias) ? contasBancarias : (contasBancarias as any)?.results ?? []
  const centrosCustoList = Array.isArray(centrosCusto) ? centrosCusto : (centrosCusto as any)?.results ?? []
  const planoContasList = Array.isArray(planoContas) ? planoContas : (planoContas as any)?.results ?? []
  const clientesList = Array.isArray(clientes) ? clientes : (clientes as any)?.results ?? []
  const fornecedoresList = Array.isArray(fornecedores) ? fornecedores : (fornecedores as any)?.results ?? []

  const handleGerar = async () => {
    if (filtroPeriodo === "personalizado" && (!dataInicio || !dataFim)) {
      toast({ title: "Preencha as datas de início e fim", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const params: Record<string, string> = {
        filtro_periodo: filtroPeriodo,
        date_filter: dateFilter,
        ano,
      }

      if (filtroPeriodo === "mensal") params.mes = mes
      if (filtroPeriodo === "trimestral") params.trimestre = trimestre
      if (filtroPeriodo === "personalizado") {
        params.data_inicio = dataInicio
        params.data_fim = dataFim
      }

      if (tipo === "contas-pagar") {
        if (fornecedorId) params.beneficiario = fornecedorId
        if (contaBancariaId) params.conta_bancaria = contaBancariaId
        if (planoContasId) params.plano_de_contas = planoContasId
        if (centroCustoId) params.centro_de_custo = centroCustoId
        if (status) params.status = status
      } else {
        if (clienteId) params.client = clienteId
        if (contaBancariaId) params.bank_account = contaBancariaId
        if (planoContasId) params.chart_of_accounts = planoContasId
        if (centroCustoId) params.cost_center = centroCustoId
        if (status) params.status = status
      }

      const endpoint = tipo === "contas-pagar"
        ? "/api/financial/gerar_relatorio_contas_pagar/"
        : "/api/financial/relatorio-contas-receber/"

      const response = await api.get(endpoint, { params, responseType: "blob" })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }))
      window.open(url, "_blank")
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
    } catch {
      toast({ title: "Erro ao gerar relatório", description: "Verifique os filtros e tente novamente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Tipo</label>
            <Select value={tipo} onValueChange={(v) => { setTipo(v as Tipo); setClienteId(""); setFornecedorId("") }}>
              <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="contas-pagar">Contas a Pagar</SelectItem>
                <SelectItem value="contas-receber">Contas a Receber</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Data</label>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="due_date">Data de Vencimento</SelectItem>
                <SelectItem value="payment_date">Data de Pagamento</SelectItem>
                <SelectItem value="billing_date">Data de Faturamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Filtrar por</label>
            <Select value={filtroPeriodo} onValueChange={(v) => setFiltroPeriodo(v as FiltroPeriodo)}>
              <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
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

          {filtroPeriodo !== "personalizado" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Ano</label>
              <Input
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                placeholder="Ano"
                className="bg-[#efefef] !text-[#22265B] placeholder:!text-[#22265B] placeholder:opacity-100 h-10 px-3 rounded"
              />
            </div>
          )}

          {filtroPeriodo === "trimestral" && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Trimestre</label>
              <Select value={trimestre} onValueChange={setTrimestre}>
                <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                  <SelectValue />
                </SelectTrigger>
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
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Mês</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                  <SelectValue />
                </SelectTrigger>
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
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Data Fim</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded"
                />
              </div>
            </>
          )}
        </div>

        <h2 className="text-xl font-semibold text-foreground">Relacionados</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tipo === "contas-receber" ? (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Cliente</label>
                <Select value={clienteId || NONE} onValueChange={(v) => setClienteId(v === NONE ? "" : v)}>
                  <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value={NONE}>-</SelectItem>
                    {clientesList.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Beneficiário</label>
                <Select value={fornecedorId || NONE} onValueChange={(v) => setFornecedorId(v === NONE ? "" : v)}>
                  <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value={NONE}>-</SelectItem>
                    {fornecedoresList.map((f: any) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Conta Bancária</label>
              <Select value={contaBancariaId || NONE} onValueChange={(v) => setContaBancariaId(v === NONE ? "" : v)}>
                <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value={NONE}>-</SelectItem>
                  {contasBancariasList.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.banco} - {c.numero_conta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Plano de Contas</label>
              <Select value={planoContasId || NONE} onValueChange={(v) => setPlanoContasId(v === NONE ? "" : v)}>
                <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value={NONE}>-</SelectItem>
                  {planoContasList.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {[p.id_plano, p.classificacao_nome, p.categoria_nome].filter(Boolean).join(" - ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Centro de Custo</label>
              <Select value={centroCustoId || NONE} onValueChange={(v) => setCentroCustoId(v === NONE ? "" : v)}>
                <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value={NONE}>-</SelectItem>
                  {centrosCustoList.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.centro_id ?? c.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
              <Select value={status || NONE} onValueChange={(v) => setStatus(v === NONE ? "" : v)}>
                <SelectTrigger className="bg-[#efefef] !text-[#22265B] h-10 px-3 rounded">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value={NONE}>-</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleGerar}
              disabled={isLoading}
              className="rounded bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? "Gerando..." : "Gerar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Relatorio
