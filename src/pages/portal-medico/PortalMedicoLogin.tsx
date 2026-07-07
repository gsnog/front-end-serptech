import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Microscope, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api'
import { fetchMedicoMe } from '@/services/portalMedico'

export default function PortalMedicoLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    fetchMedicoMe()
      .then(() => navigate('/portal-medico', { replace: true }))
      .catch(() => {})
  }, [navigate])

  const erroAcesso =
    searchParams.get('erro') === 'acesso-negado'
      ? 'Sua conta não possui acesso ao portal médico.'
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    try {
      const { data } = await api.post('/api/token/', { username, password })
      localStorage.setItem('accessToken', data.access)
      localStorage.setItem('refreshToken', data.refresh)

      await fetchMedicoMe()
      navigate('/portal-medico', { replace: true })
    } catch (err: any) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')

      if (err?.response?.status === 404) {
        setErro('Sua conta não possui perfil de médico.')
      } else if (err?.response?.status === 401) {
        setErro('Usuário ou senha incorretos.')
      } else {
        setErro('Erro ao conectar. Tente novamente.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Microscope className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Portal do Médico</CardTitle>
          <CardDescription>
            Entre com seu login e senha para acessar seus mapas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(erro || erroAcesso) && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{erro ?? erroAcesso}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={carregando}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={carregando}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
