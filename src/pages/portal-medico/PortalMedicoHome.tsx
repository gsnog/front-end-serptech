import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fmtDate } from '@/lib/utils'
import { Upload, Search, ChevronDown, ChevronUp, ExternalLink, CheckCircle, AlertCircle, Clock, Send, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  fetchMeusMapas,
  fetchFilhosMapa,
  uploadMapaMedico,
  getStatusPortal,
  STATUS_PORTAL_LABEL,
  STATUS_PORTAL_CLASS,
  portalMedicoKeys,
  type MapaPortal,
  type MapaFilhoPortal,
} from '@/services/portalMedico'

export default function PortalMedicoHome() {
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: portalMedicoKeys.mapas({ nome: busca }),
    queryFn: () => fetchMeusMapas({ nome: busca || undefined }),
  })

  const { data: filhos, isLoading: carregandoFilhos } = useQuery({
    queryKey: portalMedicoKeys.filhos(expandido!),
    queryFn: () => fetchFilhosMapa(expandido!),
    enabled: expandido !== null,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meus Mapas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe o status dos mapas que você enviou
          </p>
        </div>
        <Button className="gap-2" onClick={() => setModalAberto(true)}>
          <Upload className="h-4 w-4" />
          Enviar Mapa
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por lâmina..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Status:</span>
        <Badge className="bg-primary/20 text-primary border-transparent gap-1"><CheckCircle className="h-3 w-3" />Processado</Badge>
        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-transparent gap-1"><Clock className="h-3 w-3" />Em Revisão</Badge>
        <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border-transparent gap-1"><AlertCircle className="h-3 w-3" />Com Pendência</Badge>
        <Badge className="bg-muted text-muted-foreground border-transparent gap-1"><Send className="h-3 w-3" />Enviado</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !data?.results?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhum mapa encontrado.</p>
            <Button variant="link" className="mt-2" onClick={() => setModalAberto(true)}>
              Enviar seu primeiro mapa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.results.map((mapa) => (
            <MapaCard
              key={mapa.id}
              mapa={mapa}
              expandido={expandido === mapa.id}
              onToggle={() =>
                setExpandido((atual) => (atual === mapa.id ? null : mapa.id))
              }
              filhos={expandido === mapa.id ? filhos : undefined}
              carregandoFilhos={expandido === mapa.id && carregandoFilhos}
            />
          ))}
        </div>
      )}

      <EnviarMapaModal
        aberto={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  )
}

function EnviarMapaModal({ aberto, onClose }: { aberto: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      formData.append('arquivo_pdf', arquivo!)
      return uploadMapaMedico(formData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: portalMedicoKeys.mapasAll })
      toast({
        title: 'Mapa enviado com sucesso!',
        description: `${data.filhos_count ?? 0} lâminas identificadas e aguardando revisão.`,
      })
      resetAndClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Erro ao enviar o mapa. Tente novamente.'
      toast({ title: 'Erro no envio', description: msg, variant: 'destructive' })
    },
  })

  function resetAndClose() {
    setArquivo(null)
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  function handleClose() {
    if (mutation.isPending) return
    resetAndClose()
  }

  function handleFileSelect(file: File) {
    if (file.type !== 'application/pdf') {
      toast({ title: 'Formato inválido', description: 'Apenas arquivos PDF são aceitos.', variant: 'destructive' })
      return
    }
    setArquivo(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Mapa</DialogTitle>
          <DialogDescription>
            Envie o PDF do mapa. As lâminas serão identificadas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={[
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
            ].join(' ')}
          >
            {arquivo ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="text-left min-w-0">
                  <p className="font-medium text-sm truncate">{arquivo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 ml-2 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setArquivo(null)
                    if (inputRef.current) inputRef.current.value = ''
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">
                  Clique para selecionar ou arraste o PDF aqui
                </p>
                <p className="text-xs text-muted-foreground">PDF, tamanho máximo 50 MB</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileSelect(f)
            }}
          />

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              O mapa ficará com status <strong>Aguardando Análise</strong> até ser validado pela equipe interna.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={() => mutation.mutate()}
              disabled={!arquivo || mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? 'Enviando...' : 'Enviar Mapa'}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MapaCard({
  mapa,
  expandido,
  onToggle,
  filhos,
  carregandoFilhos,
}: {
  mapa: MapaPortal
  expandido: boolean
  onToggle: () => void
  filhos?: MapaFilhoPortal[]
  carregandoFilhos?: boolean
}) {
  const statusPortal = getStatusPortal(mapa)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-4 px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="font-medium truncate">
                {mapa.nome ?? `Mapa #${mapa.id}`}
              </span>
              <Badge className={`gap-1 ${STATUS_PORTAL_CLASS[statusPortal]}`}>
                {statusPortal === 'processado' && <CheckCircle className="h-3 w-3" />}
                {statusPortal === 'em_revisao' && <Clock className="h-3 w-3" />}
                {statusPortal === 'com_pendencia' && <AlertCircle className="h-3 w-3" />}
                {statusPortal === 'enviado' && <Send className="h-3 w-3" />}
                {STATUS_PORTAL_LABEL[statusPortal]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {fmtDate(mapa.data_de_recebimento)}
              {' · '}
              {mapa.filhos_count}{' '}
              {mapa.filhos_count === 1 ? 'mapa' : 'mapas'}
              {mapa.pendentes_count > 0 && (
                <span className="text-destructive ml-2">
                  · {mapa.pendentes_count} com pendência
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mapa.arquivo_pdf_url && (
              <a href={mapa.arquivo_pdf_url} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="gap-1.5"
            >
              {expandido ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {expandido ? 'Fechar' : 'Ver Mapas'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expandido && (
        <CardContent className="pt-0 pb-4 px-5 border-t">
          {carregandoFilhos ? (
            <div className="space-y-2 pt-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !filhos?.length ? (
            <p className="text-sm text-muted-foreground pt-3">
              Nenhuma lâmina encontrada.
            </p>
          ) : (
            <div className="divide-y pt-2">
              {filhos.map((filho) => (
                <div
                  key={filho.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <FilhoStatusBadge status={filho.status} />
                    <span className="text-sm">{filho.nome}</span>
                    {filho.observacao && (
                      <span className="text-xs text-muted-foreground italic">
                        "{filho.observacao}"
                      </span>
                    )}
                  </div>
                  {filho.arquivo_pdf_url && (
                    <a
                      href={filho.arquivo_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver PDF
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function FilhoStatusBadge({
  status,
}: {
  status: 'concluido' | 'pendente' | 'aguardando_verificacao'
}) {
  if (status === 'concluido')
    return <Badge className="bg-primary/20 text-primary border-transparent gap-1 text-xs"><CheckCircle className="h-3 w-3" />OK</Badge>
  if (status === 'aguardando_verificacao')
    return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-transparent gap-1 text-xs"><Clock className="h-3 w-3" />Em Revisão</Badge>
  return <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border-transparent gap-1 text-xs"><AlertCircle className="h-3 w-3" />Pendência</Badge>
}
