import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"

const SaidasPendentes = () => {
  const [filterBeneficiario, setFilterBeneficiario] = useState("")
  const [filterDocumento, setFilterDocumento] = useState("")
  const [filterData, setFilterData] = useState("")

  const saidas = [
    { dataLancamento: "02/06/2025", beneficiario: "Empresa ABC", documento: "NI", valorTitulo: "R$ 1.500,00", valorTotal: "R$ 1.500,00" }
  ]

  const filteredSaidas = useMemo(() => {
    return saidas.filter(saida => {
      const matchBeneficiario = saida.beneficiario.toLowerCase().includes(filterBeneficiario.toLowerCase())
      const matchDocumento = saida.documento.toLowerCase().includes(filterDocumento.toLowerCase())
      const matchData = filterData ? saida.dataLancamento.includes(filterData.split("-").reverse().join("/")) : true
      return matchBeneficiario && matchDocumento && matchData
    })
  }, [filterBeneficiario, filterDocumento, filterData])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 items-center">
          <Button className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground">Adicionar</Button>
          <Button className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground">Relatório</Button>
        </div>

        <FilterSection
          fields={[
            {
              type: "text",
              label: "Beneficiário",
              placeholder: "Buscar beneficiário...",
              value: filterBeneficiario,
              onChange: setFilterBeneficiario,
              width: "flex-1 min-w-[200px]"
            },
            {
              type: "text",
              label: "Documento",
              placeholder: "Buscar documento...",
              value: filterDocumento,
              onChange: setFilterDocumento,
              width: "min-w-[180px]"
            },
            {
              type: "date",
              label: "Data",
              value: filterData,
              onChange: setFilterData,
              width: "min-w-[160px]"
            }
          ]}
          resultsCount={filteredSaidas.length}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Data Lançamento</TableHead>
              <TableHead >Beneficiário</TableHead>
              <TableHead >Documento</TableHead>
              <TableHead className="text-right">Valor Título</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSaidas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma saída encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredSaidas.map((saida, index) => (
                <TableRow key={index}>
                  <TableCell >{saida.dataLancamento}</TableCell>
                  <TableCell >{saida.beneficiario}</TableCell>
                  <TableCell >{saida.documento}</TableCell>
                  <TableCell >{saida.valorTitulo}</TableCell>
                  <TableCell >{saida.valorTotal}</TableCell>
                  <TableCell >
                    <Button size="sm" className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs">Ações</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SaidasPendentes