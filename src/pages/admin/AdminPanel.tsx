import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck, UserX, ShieldCheck, UsersRound, ArrowRight, Bot } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminStats {
  total_usuarios: number
  usuarios_ativos: number
  usuarios_inativos: number
  staff: number
  grupos: { id: number; name: string; total_users: number }[]
}

export default function AdminPanel() {
  const navigate = useNavigate()

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/usuarios/stats/').then(r => r.data),
  })

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats?.total_usuarios,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Usuários Ativos',
      value: stats?.usuarios_ativos,
      icon: UserCheck,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Usuários Inativos',
      value: stats?.usuarios_inativos,
      icon: UserX,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      title: 'Usuários Staff',
      value: stats?.staff,
      icon: ShieldCheck,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.title}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-12 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{card.value ?? '—'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gerenciamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/admin-panel/usuarios')}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/admin-panel/tokens-automacao')}
            >
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Tokens de Automação
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Grupos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              Grupos (Papéis)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {stats?.grupos.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-1 border-b last:border-0">
                    <span className="text-sm capitalize">{g.name}</span>
                    <Badge variant="secondary">{g.total_users} usuário{g.total_users !== 1 ? 's' : ''}</Badge>
                  </div>
                ))}
                {!stats?.grupos.length && (
                  <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
