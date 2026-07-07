import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Copy, Trash2, ToggleLeft, ToggleRight, Bot } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'

interface TokenAutomacao {
  id: number
  nome: string
  token: string
  ativo: boolean
  criado_em: string
}

const queryKey = ['admin-tokens-automacao']

export default function AdminTokensAutomacao() {
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [novoNome, setNovoNome] = useState('')

  const { data: tokens, isLoading } = useQuery<TokenAutomacao[]>({
    queryKey,
    queryFn: () => api.get('/api/lab/tokens-automacao/').then(r =>
      Array.isArray(r.data) ? r.data : r.data.results ?? []
    ),
  })

  const criarMutation = useMutation({
    mutationFn: (nome: string) =>
      api.post('/api/lab/tokens-automacao/', { nome }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Token criado com sucesso.')
      setNovoNome('')
      setDialogAberto(false)
    },
    onError: () => toast.error('Erro ao criar token.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      api.patch(`/api/lab/tokens-automacao/${id}/`, { ativo }).then(r => r.data),
    onSuccess: (data: TokenAutomacao) => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(`Token ${data.ativo ? 'ativado' : 'desativado'}.`)
    },
    onError: () => toast.error('Erro ao atualizar token.'),
  })

  const deletarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/lab/tokens-automacao/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success('Token removido.')
    },
    onError: () => toast.error('Erro ao remover token.'),
  })

  function copiarToken(token: string) {
    navigator.clipboard.writeText(token)
    toast.success('Token copiado para a área de transferência.')
  }

  function handleCriar() {
    if (!novoNome.trim()) return
    criarMutation.mutate(novoNome.trim())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tokens de Automação</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as credenciais de acesso para bots e integrações externas
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo Token
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Token (UUID)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !tokens?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum token cadastrado. Crie um para integrar o bot.
                </TableCell>
              </TableRow>
            ) : (
              tokens.map(t => (
                <TableRow key={t.id} className={!t.ativo ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono truncate max-w-[220px]">
                        {t.token}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copiarToken(t.token)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar token</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.ativo ? 'default' : 'secondary'}>
                      {t.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(t.criado_em).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleMutation.mutate({ id: t.id, ativo: !t.ativo })}
                            disabled={toggleMutation.isPending}
                          >
                            {t.ativo
                              ? <ToggleRight className="h-4 w-4 text-green-500" />
                              : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            }
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t.ativo ? 'Desativar' : 'Ativar'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deletarMutation.mutate(t.id)}
                            disabled={deletarMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remover token</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de criação */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Token de Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome-token">Nome / Identificação</Label>
              <Input
                id="nome-token"
                placeholder="ex: Bot Telegram"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCriar()}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O UUID será gerado automaticamente pelo servidor. Copie-o após a criação.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriar}
              disabled={!novoNome.trim() || criarMutation.isPending}
            >
              {criarMutation.isPending ? 'Criando...' : 'Criar Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
