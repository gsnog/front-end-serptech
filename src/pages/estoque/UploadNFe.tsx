import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { SimpleFormWizard } from "@/components/SimpleFormWizard"
import { FormActionBar } from "@/components/FormActionBar"
import { FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { fetchUnidades, unidadesQueryKey } from "@/services/estoque"

export default function UploadNFe() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  const { data: unidadesRaw = [] } = useQuery({ queryKey: unidadesQueryKey, queryFn: fetchUnidades })
  const unidades = Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? []

  const [unidadeId, setUnidadeId] = useState("")
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [pdfNf, setPdfNf] = useState<File | null>(null)
  const [pdfBoleto, setPdfBoleto] = useState<File | null>(null)

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/api/estoque/entradas/importar-xml/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas_estoque'] })
      toast({ title: "NF-e importada com sucesso!" })
      navigate("/estoque/entradas")
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail
      const msgs = detail ?? (
        error.response?.data && typeof error.response.data === "object"
          ? Object.entries(error.response.data).map(([k, v]) => `${k}: ${v}`).join(" | ")
          : "Erro ao processar a NF-e."
      )
      toast({ title: "Erro ao importar", description: msgs, variant: "destructive" })
    },
    onSettled: () => setIsSaving(false),
  })

  const handleEnviar = () => {
    if (!unidadeId) {
      toast({ title: "Selecione a unidade de destino", variant: "destructive" })
      return
    }
    if (!xmlFile) {
      toast({ title: "Selecione o arquivo XML", variant: "destructive" })
      return
    }

    setIsSaving(true)
    const formData = new FormData()
    formData.append('xml_file', xmlFile)
    formData.append('unidade', unidadeId)
    if (pdfNf) formData.append('pdf_nf', pdfNf)
    if (pdfBoleto) formData.append('pdf_ticket', pdfBoleto)

    mutation.mutate(formData)
  }

  const handleCancelar = () => navigate("/estoque/entradas")

  return (
    <SimpleFormWizard title="Upload de NF-e">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da NF-e</h2>
                <p className="text-sm text-muted-foreground">Faça o upload do XML e dos documentos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unidade de Destino <span className="text-destructive">*</span></Label>
                <Select value={unidadeId} onValueChange={setUnidadeId}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {unidades.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">PDF da NF</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfNf(e.target.files?.[0] || null)}
                  className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">PDF dos Boletos</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfBoleto(e.target.files?.[0] || null)}
                  className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Arquivo XML <span className="text-destructive">*</span></Label>
              <Input
                type="file"
                accept=".xml"
                onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
                className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground">O XML será processado pelo servidor para extrair fornecedor, itens, parcelas e valores automaticamente.</p>
            </div>

            <FormActionBar
              onSave={handleEnviar}
              onCancel={handleCancelar}
              isSaving={isSaving}
              saveLabel="Enviar XML"
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  )
}
