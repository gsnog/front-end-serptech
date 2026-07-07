import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { LayoutGrid, FileText, LogOut, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Topbar } from '@/components/Topbar'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/hooks/useTheme'
import { useTheme } from '@/hooks/useTheme'
import { fetchMedicoMe, type MedicoMe } from '@/services/portalMedico'
import logoDlcLight from '@/assets/logo-dlc.png'
import logoDlcDark from '@/assets/Logo - DLC dark - mode (1).png'
import logoIcone from '@/assets/logo-dlc.png'

const navItems = [
  { to: '/portal-medico',         label: 'Dashboard',   icon: LayoutGrid, end: true },
  { to: '/portal-medico/mapas',   label: 'Meus Mapas',  icon: FileText },
]

const pageTitles: Record<string, { title: string; description: string }> = {
  '/portal-medico':       { title: 'Portal do Médico', description: 'Visão geral dos seus mapas' },
  '/portal-medico/mapas': { title: 'Portal do Médico', description: 'Meus mapas enviados' },
}

function PortalMedicoSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { theme } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-300 border-r border-border',
        collapsed ? 'w-20' : 'w-72'
      )}
      style={{ background: 'hsl(var(--sidebar-bg))' }}
    >
      {/* Logo */}
      <div className="relative flex h-20 items-center justify-center border-b border-[hsl(var(--sidebar-border))] px-4">
        <div className="relative flex items-center justify-center overflow-hidden w-full h-full">
          <img
            src={logoIcone}
            alt="DLC"
            className={cn(
              'absolute object-contain transition-all duration-300 ease-in-out h-12',
              collapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            )}
          />
          <img
            src={theme === 'dark' ? logoDlcDark : logoDlcLight}
            alt="DLC Diagnósticos"
            className={cn(
              'absolute object-contain transition-all duration-300 ease-in-out h-32',
              collapsed ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
            )}
          />
        </div>

        <button
          onClick={onToggle}
          className="absolute -right-4 bottom-0 translate-y-1/2 grid place-items-center h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform z-10"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive && 'active'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0 text-[hsl(var(--sidebar-foreground))]" />
                {!collapsed && (
                  <span className="text-sm text-[hsl(var(--sidebar-foreground))]">{label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom: sair */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-3 py-3">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0 text-[hsl(var(--sidebar-foreground))]" />
          {!collapsed && (
            <span className="text-sm text-[hsl(var(--sidebar-foreground))]">Sair</span>
          )}
        </button>
      </div>
    </aside>
  )
}

function PortalMedicoContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [medico, setMedico] = useState<MedicoMe | null>(null)
  const [verificando, setVerificando] = useState(true)

  const token = localStorage.getItem('accessToken')
  if (!token) return <Navigate to="/login" replace />

  useEffect(() => {
    fetchMedicoMe()
      .then(setMedico)
      .catch(() => navigate('/acesso-negado', { replace: true }))
      .finally(() => setVerificando(false))
  }, [navigate])

  if (verificando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  const pageInfo = pageTitles[location.pathname] ?? { title: 'Portal do Médico', description: '' }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PortalMedicoSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 h-screen overflow-hidden',
          collapsed ? 'ml-20' : 'ml-72'
        )}
      >
        <Topbar
          sidebarCollapsed={collapsed}
          pageTitle={pageInfo.title}
          pageDescription={medico ? `${medico.nome} — CRM ${medico.crm}` : pageInfo.description}
        />
        <div className="h-px w-full bg-border/60 dark:bg-border/40 shrink-0" />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ medico }} />
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default function PortalMedicoShell() {
  return (
    <ThemeProvider>
      <PortalMedicoContent />
    </ThemeProvider>
  )
}
