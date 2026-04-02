import { useState, useEffect } from "react"
import {
  LayoutGrid,
  ClipboardList,
  Package,
  TrendingUp,
  DollarSign,
  Building2,
  UserRoundPlus,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Sun,
  Moon,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"
import { Badge } from "@/components/ui/badge"
import { usePermissions } from "@/contexts/PermissionsContext"
import logoSerpLight from "@/assets/logo-serp-light.png"
import logoSerpDark from "@/assets/logo-serp-dark.png"
import logoIcone from "@/assets/Logo_Serp_27.png"


const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutGrid, help: "Visão geral com indicadores e métricas do sistema." },
  {
    title: "Cadastro",
    icon: ClipboardList,
    basePath: "/cadastro",
    help: "Cadastro de dados mestres: itens, fornecedores, clientes, setores e contas.",
    subItems: [
      {
        title: "Estoque", help: "Cadastros relacionados ao controle de estoque.", subItems: [
          { title: "Fornecedores", url: "/cadastro/estoque/fornecedores" },
          { title: "Itens", url: "/cadastro/estoque/itens" },
          { title: "Setores", url: "/cadastro/estoque/setores" },
          { title: "Unidades", url: "/cadastro/estoque/unidades" },
        ]
      },
      {
        title: "Financeiro", help: "Cadastros financeiros: contas, centros de custo e planos de contas.", subItems: [
          { title: "Conta Bancária", url: "/cadastro/financeiro/conta-bancaria" },
          { title: "Conciliação Bancária", url: "/cadastro/financeiro/conciliacao-bancaria" },
          { title: "Transferências", url: "/cadastro/financeiro/transferencias" },
          { title: "Clientes", url: "/cadastro/financeiro/clientes" },
          { title: "Centro de Custo", url: "/cadastro/financeiro/centro-custo" },
          { title: "Centro de Receita", url: "/cadastro/financeiro/centro-receita" },
          { title: "Contábil", url: "/cadastro/financeiro/contabil" },
          { title: "Categorias", url: "/cadastro/financeiro/categorias" },
          { title: "Fornecedores", url: "/cadastro/financeiro/fornecedores" },
          { title: "Subcategorias", url: "/cadastro/financeiro/subcategorias" },
          { title: "Plano de Contas", url: "/cadastro/financeiro/plano-contas" },
        ]
      },
      {
        title: "Pessoas", help: "Cadastro de pessoas, setores e cargos.", subItems: [
          { title: "Pessoas", url: "/cadastro/pessoas/pessoas" },
          { title: "Setores/Áreas", url: "/cadastro/pessoas/setores" },
          { title: "Cargos", url: "/cadastro/pessoas/cargos" },
        ]
      },
    ]
  },
  {
    title: "Comercial",
    icon: TrendingUp,
    basePath: "/comercial",
    badge: "BETA",
    help: "Gestão comercial: leads, oportunidades e propostas.",
    subItems: [
      { title: "Leads", url: "/comercial/leads" },
      { title: "Contas", url: "/comercial/contas" },
      { title: "Contatos", url: "/comercial/contatos" },
      { title: "Oportunidades", url: "/comercial/oportunidades" },
      { title: "Propostas", url: "/comercial/propostas" },
      { title: "Atividades", url: "/comercial/atividades" },
    ]
  },
  {
    title: "Estoque",
    icon: Package,
    basePath: "/estoque",
    help: "Controle de estoque: entradas, saídas, inventário, requisições e patrimônio.",
    subItems: [
      { title: "Entradas", url: "/estoque/entradas" },
      { title: "Inventário", url: "/estoque/inventario" },
      { title: "Locações", url: "/estoque/locacoes" },
      { title: "Ordem de Compra", url: "/estoque/ordem-compra" },
      { title: "Ordem de Serviço", url: "/estoque/ordem-servico" },
      { title: "Pedidos Internos", url: "/estoque/pedidos-internos" },
      { title: "Saídas", url: "/estoque/saidas" },
      { title: "Patrimônio", url: "/patrimonio" },
    ]
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    basePath: "/financeiro",
    help: "Módulo financeiro: contas a pagar/receber, fluxo de caixa e XML.",
    subItems: [
      { title: "Contas a Receber", url: "/financeiro/contas-receber" },
      { title: "Contas a Pagar", url: "/financeiro/contas-pagar" },
      { title: "Fluxo de Caixa", url: "/financeiro/fluxo-caixa" },
      { title: "Notas Fiscais", url: "/financeiro/xml" },
    ]
  },
  {
    title: "Operacional",
    icon: BarChart3,
    basePath: "/operacional",
    help: "Laboratório: mapas e exames.",
    subItems: [
      { title: "Mapas", url: "/operacional/mapas" },
      { title: "Exames", url: "/operacional/exames" },
    ]
  },

  {
    title: "Gestão de Pessoas",
    icon: UserRoundPlus,
    basePath: "/gestao-pessoas",
    badge: "BETA",
    help: "RH e gestão de pessoas: visão 360º, hierarquia, permissões e auditoria.",
    subItems: [
      { title: "Pessoas (360º)", url: "/gestao-pessoas/pessoas" },
      { title: "Hierarquia", url: "/gestao-pessoas/hierarquia" },
      { title: "Permissões", url: "/gestao-pessoas/acessos" },
      { title: "Dashboards", url: "/gestao-pessoas/dashboards" },
      { title: "Auditoria", url: "/gestao-pessoas/auditoria" },
    ]
  },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, help: "Geração de relatórios financeiros e operacionais." },
]

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const [activeItem, setActiveItem] = useState<string>("Dashboard")
  const { theme, toggleTheme } = useTheme()
  const { logout } = usePermissions()

  const toggleMenu = (label: string, isSubMenu = false) => {
    setOpenMenus((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label)
      }

      if (isSubMenu) {
        return [...prev, label]
      }

      const mainMenuTitles = menuItems.filter(item => item.subItems).map(item => item.title)
      const filteredMenus = prev.filter(item => !mainMenuTitles.includes(item))
      return [...filteredMenus, label]
    })
  }

  useEffect(() => {
    for (const item of menuItems) {
      if (item.url && location.pathname === item.url) {
        setActiveItem(item.title)
      } else if (item.basePath && location.pathname.startsWith(item.basePath)) {
        setActiveItem(item.title)
        if (!openMenus.includes(item.title)) {
          setOpenMenus(prev => [...prev, item.title])
        }
      }
    }
  }, [location.pathname])

  const isItemActive = (item: typeof menuItems[0]) => {
    if (item.url) return location.pathname === item.url
    if (item.basePath) return location.pathname.startsWith(item.basePath)
    return false
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-300 border-r border-border",
        collapsed ? "w-20" : "w-72"
      )}
      style={{ background: "hsl(var(--sidebar-bg))" }}
    >
      {/* Logo */}
      <div className="relative flex h-20 items-center justify-center border-b border-[hsl(var(--sidebar-border))] px-4">
        <div className="relative flex items-center justify-center overflow-hidden w-full h-full">
          <img
            src={logoIcone}
            alt="S"
            className={cn(
              "absolute object-contain transition-all duration-300 ease-in-out h-12",
              collapsed ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
          />
          <img
            src={theme === "dark" ? logoSerpDark : logoSerpLight}
            alt="SERP"
            className={cn(
              "absolute object-contain transition-all duration-300 ease-in-out h-32",
              collapsed ? "opacity-0 scale-75" : "opacity-100 scale-100"
            )}
          />
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-4 bottom-0 translate-y-1/2 grid place-items-center h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform z-10"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 sidebar-nav-scroll px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      "sidebar-item w-full",
                      isItemActive(item) && "active"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0 text-[hsl(var(--sidebar-foreground))]" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm text-[hsl(var(--sidebar-foreground))] flex items-center gap-2">
                          {item.title}
                          {'badge' in item && item.badge && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary bg-primary text-primary-foreground font-semibold">
                              {item.badge}
                            </Badge>
                          )}
                        </span>
                        {openMenus.includes(item.title) ? (
                          <ChevronDown className="h-4 w-4 text-[hsl(var(--sidebar-foreground))]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[hsl(var(--sidebar-foreground))]" />
                        )}
                      </>
                    )}
                  </button>

                  {!collapsed && openMenus.includes(item.title) && (
                    <ul className="mt-1 space-y-1 pl-4">
                      {item.subItems.map((subItem) => (
                        'subItems' in subItem && subItem.subItems ? (
                          <li key={subItem.title}>
                            <button
                              onClick={() => toggleMenu(`${item.title}-${subItem.title}`, true)}
                              className="sidebar-item w-full text-sm"
                            >
                              <span className="flex-1 text-left text-[hsl(var(--sidebar-muted))]">
                                {subItem.title}
                              </span>

                              {openMenus.includes(`${item.title}-${subItem.title}`) ? (
                                <ChevronDown className="h-3 w-3 text-foreground dark:text-primary" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-foreground dark:text-primary" />
                              )}
                            </button>

                            {openMenus.includes(`${item.title}-${subItem.title}`) && (
                              <ul className="mt-1 space-y-1 pl-4">
                                {subItem.subItems.map((nestedItem) => (
                                  <li key={nestedItem.title}>
                                    <NavLink
                                      to={nestedItem.url}
                                      className={({ isActive }) =>
                                        cn(
                                          "sidebar-item text-xs",
                                          isActive
                                            ? "sidebar-nav-active"
                                            : "text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))]"
                                        )
                                      }
                                    >
                                      {nestedItem.title}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ) : (
                          <li key={subItem.title}>
                            <NavLink
                              to={'url' in subItem ? subItem.url : '#'}
                              className={({ isActive }) =>
                                cn(
                                  "sidebar-item text-sm",
                                  isActive
                                    ? "sidebar-nav-active"
                                    : "text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-foreground))]"
                                )
                              }
                            >
                              {subItem.title}
                            </NavLink>
                          </li>
                        )
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.url!}
                  className={({ isActive }) =>
                    cn("sidebar-item", isActive && "active")
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0 text-[hsl(var(--sidebar-foreground))]" />
                  {!collapsed && (
                    <>
                      <span className="text-sm text-[hsl(var(--sidebar-foreground))]">
                        {item.title}
                      </span>

                    </>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3 space-y-1">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="sidebar-item w-full"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0 text-[hsl(var(--sidebar-foreground))]" />
          ) : (
            <Moon className="h-5 w-5 shrink-0 text-[hsl(var(--sidebar-foreground))]" />
          )}
          {!collapsed && (
            <>
              <span className="text-sm text-[hsl(var(--sidebar-foreground))]">
                {theme === "dark" ? "Modo Diurno" : "Modo Noturno"}
              </span>

            </>
          )}
        </button>

        {/* Logout */}
        <button
          className="sidebar-item w-full text-red-500 hover:bg-red-500/20"
          onClick={logout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="text-sm">Sair</span>

            </>
          )}
        </button>
      </div>
    </aside>
  )
}
