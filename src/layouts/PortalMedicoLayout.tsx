import { useEffect, useState } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { LogOut, FileText, Microscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchMedicoMe, type MedicoMe } from '@/services/portalMedico'

export default function PortalMedicoLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [medico, setMedico] = useState<MedicoMe | null>(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/portal-medico/login', { replace: true })
      return
    }

    fetchMedicoMe()
      .then(setMedico)
      .catch(() => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/portal-medico/login?erro=acesso-negado', { replace: true })
      })
      .finally(() => setVerificando(false))
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/portal-medico/login', { replace: true })
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Verificando acesso...</p>
      </div>
    )
  }

  const navItems = [
    { to: '/portal-medico', label: 'Meus Mapas', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Microscope className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Portal do Médico</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <Button
                variant={location.pathname === to ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {medico && (
            <span className="text-sm text-muted-foreground">
              {medico.nome} — CRM {medico.crm}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 max-w-5xl">
        <Outlet context={{ medico }} />
      </main>
    </div>
  )
}
