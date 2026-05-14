import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, X, Loader2 } from "lucide-react"
import { exportData } from "@/lib/exportData"
import {
  fetchPessoasRelatorio,
  fetchSetores,
  fetchCargos,
  pessoasRelatorioQueryKey,
  setoresQueryKey,
  cargosQueryKey,
  type Pessoa,
  type Setor,
} from "@/services/pessoas"

const NONE = "__all__"
const PAGE_SIZE = 10

const SelectFilter = ({
  label: lbl,
  value: val,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">{lbl}</Label>
    <Select value={val || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="---" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>---</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export default function RelatorioPessoas() {
  const [setorId, setSetorId] = useState("")
  const [cargoId, setCargoId] = useState("")
  const [comGestor, setComGestor] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [page, setPage] = useState(1)

  const { data: todasPessoas = [], isLoading } = useQuery({
    queryKey: pessoasRelatorioQueryKey,
    queryFn: () => fetchPessoasRelatorio(),
  })

  const { data: setoresRaw } = useQuery({
    queryKey: setoresQueryKey,
    queryFn: () => fetchSetores(),
  })

  const { data: cargosRaw = [] } = useQuery({
    queryKey: cargosQueryKey,
    queryFn: fetchCargos,
  })

  const setoresList: Setor[] = Array.isArray(setoresRaw)
    ? setoresRaw
    : (setoresRaw as any)?.results ?? []

  const filtradas = useMemo(() => {
    return todasPessoas.filter((p: Pessoa) => {
      if (setorId && String(p.setor_id) !== setorId) return false
      if (cargoId && String(p.cargo_id) !== cargoId) return false
      if (comGestor === "sim" && !p.supervisor_id) return false
      if (comGestor === "nao" && p.supervisor_id) return false
      return true
    })
  }, [todasPessoas, setorId, cargoId, comGestor])

  const totalPages = Math.ceil(filtradas.length / PAGE_SIZE)
  const paginadas = filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleGerar = () => {
    setPage(1)
    setShowPopup(true)
  }

  const handleExport = (format: "pdf" | "csv" | "excel") => {
    const exportable = filtradas.map((p) => ({
      Nome: p.nome,
      "E-mail": p.email,
      Cargo: p.cargo || "—",
      Setor: p.setor || "—",
      Unidade: p.unidade || "—",
      Gestor: p.supervisor_nome || "—",
    }))
    exportData(exportable as Record<string, unknown>[], "Relatório de Pessoas", format)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectFilter
                label="Setor:"
                value={setorId}
                onChange={setSetorId}
                options={setoresList.map((s) => ({ value: String(s.id), label: s.nome }))}
              />
              <SelectFilter
                label="Cargo:"
                value={cargoId}
                onChange={setCargoId}
                options={cargosRaw.map((c) => ({ value: String(c.id), label: c.nome }))}
              />
              <SelectFilter
                label="Gestor:"
                value={comGestor}
                onChange={setComGestor}
                options={[
                  { value: "sim", label: "Com gestor" },
                  { value: "nao", label: "Sem gestor" },
                ]}
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleGerar} className="gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Gerar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Relatório de Pessoas</h3>
                <p className="text-sm text-muted-foreground">
                  {filtradas.length} pessoa{filtradas.length !== 1 ? "s" : ""} encontrada
                  {filtradas.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("pdf")}>
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("csv")}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("excel")}>
                  <Download className="h-3.5 w-3.5" /> XLSX
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowPopup(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-xl font-bold text-primary mt-1">{filtradas.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Com Gestor</p>
                  <p className="text-xl font-bold text-primary mt-1">
                    {filtradas.filter((p) => p.supervisor_id).length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Sem Gestor</p>
                  <p className="text-xl font-bold text-primary mt-1">
                    {filtradas.filter((p) => !p.supervisor_id).length}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Setores</p>
                  <p className="text-xl font-bold text-primary mt-1">
                    {new Set(filtradas.map((p) => p.setor_id).filter(Boolean)).size}
                  </p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
                    <TableHead className="text-foreground font-semibold">Nome</TableHead>
                    <TableHead className="text-foreground font-semibold">E-mail</TableHead>
                    <TableHead className="text-foreground font-semibold">Cargo</TableHead>
                    <TableHead className="text-foreground font-semibold">Setor</TableHead>
                    <TableHead className="text-foreground font-semibold">Unidade</TableHead>
                    <TableHead className="text-foreground font-semibold">Gestor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginadas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                      <TableCell>{p.cargo || "—"}</TableCell>
                      <TableCell>{p.setor || "—"}</TableCell>
                      <TableCell>{p.unidade || "—"}</TableCell>
                      <TableCell>{p.supervisor_nome || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {filtradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma pessoa encontrada com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} ({filtradas.length} registros)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </Button>
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
