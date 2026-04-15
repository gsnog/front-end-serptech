import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ShieldCheck, ShieldOff, UserCheck, UserX, ChevronLeft, ChevronRight, KeyRound, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface AdminUser {
  id: number
  username: string
  email: string
  nome: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string | null
  role: string
  groups_list: { id: number; name: string }[]
}

interface PaginatedUsers {
  count: number
  next: string | null
  previous: string | null
  results: AdminUser[]
}

export default function AdminUsuarios() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [usernameTarget, setUsernameTarget] = useState<AdminUser | null>(null)
  const [newUsername, setNewUsername] = useState('')
  const PAGE_SIZE = 15
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<PaginatedUsers>({
    queryKey: ['admin-usuarios', search, page],
    queryFn: () =>
      api.get('/api/admin/usuarios/', {
        params: { search, page, page_size: PAGE_SIZE },
      }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const toggleStaff = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/usuarios/${id}/toggle-staff/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Status staff atualizado.')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao atualizar.')
    },
  })

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.post(`/api/admin/usuarios/${id}/reset-password/`, { password }),
    onSuccess: () => {
      setResetTarget(null)
      setNewPassword('')
      toast.success('Senha redefinida com sucesso.')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao redefinir senha.')
    },
  })

  const updateUsername = useMutation({
    mutationFn: ({ id, username }: { id: number; username: string }) =>
      api.patch(`/api/admin/usuarios/${id}/update-username/`, { username }),
    onSuccess: () => {
      setUsernameTarget(null)
      setNewUsername('')
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      toast.success('Nome de usuário atualizado.')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao atualizar usuário.')
    },
  })

  const toggleActive = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/usuarios/${id}/toggle-active/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Status do usuário atualizado.')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Erro ao atualizar.')
    },
  })

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou usuário..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Usuário / E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead className="text-center">Ativo</TableHead>
              <TableHead className="text-center">Staff</TableHead>
              <TableHead>Entrou em</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map(user => (
                <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.nome}</span>
                      {user.is_superuser && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Superuser
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={user.is_superuser || toggleActive.isPending}
                          onClick={() => toggleActive.mutate(user.id)}
                        >
                          {user.is_active ? (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {user.is_superuser ? 'Superuser não pode ser alterado' : user.is_active ? 'Clique para desativar' : 'Clique para ativar'}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={user.is_superuser || toggleStaff.isPending}
                          onClick={() => toggleStaff.mutate(user.id)}
                        >
                          {user.is_staff ? (
                            <ShieldCheck className="h-4 w-4 text-purple-500" />
                          ) : (
                            <ShieldOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {user.is_superuser ? 'Superuser sempre é staff' : user.is_staff ? 'Clique para remover staff' : 'Clique para tornar staff'}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.date_joined)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.last_login)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => { setUsernameTarget(user); setNewUsername(user.username) }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Alterar nome de usuário</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => { setResetTarget(user); setNewPassword('') }}
                          >
                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Redefinir senha</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{data.count} usuário{data.count !== 1 ? 's' : ''} no total</span>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Página {page} de {totalPages}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog alterar username */}
      <Dialog open={!!usernameTarget} onOpenChange={open => { if (!open) { setUsernameTarget(null); setNewUsername('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar nome de usuário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Alterando usuário de <span className="font-medium text-foreground">{usernameTarget?.nome}</span>.
          </p>
          <div className="space-y-2">
            <Label htmlFor="new-username">Novo nome de usuário</Label>
            <Input
              id="new-username"
              type="text"
              placeholder="ex: joao.silva"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && usernameTarget && newUsername)
                  updateUsername.mutate({ id: usernameTarget.id, username: newUsername })
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUsernameTarget(null); setNewUsername('') }}>
              Cancelar
            </Button>
            <Button
              disabled={!newUsername || updateUsername.isPending}
              onClick={() => usernameTarget && updateUsername.mutate({ id: usernameTarget.id, username: newUsername })}
            >
              {updateUsername.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog reset de senha */}
      <Dialog open={!!resetTarget} onOpenChange={open => { if (!open) { setResetTarget(null); setNewPassword('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Definindo nova senha para <span className="font-medium text-foreground">{resetTarget?.nome}</span>.
          </p>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && resetTarget && newPassword)
                  resetPassword.mutate({ id: resetTarget.id, password: newPassword })
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPassword('') }}>
              Cancelar
            </Button>
            <Button
              disabled={!newPassword || resetPassword.isPending}
              onClick={() => resetTarget && resetPassword.mutate({ id: resetTarget.id, password: newPassword })}
            >
              {resetPassword.isPending ? 'Salvando...' : 'Redefinir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
