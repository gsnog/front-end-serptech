import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { Topbar } from "@/components/Topbar"
import { ThemeProvider } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

const pageTitles: Record<string, { title: string; description?: string }> = {
  "/": { title: "Dashboard", description: "Visão geral do sistema" },
  "/relatorios": { title: "Relatórios", description: "Gere e exporte relatórios financeiros e operacionais" },
  "/cadastro": { title: "Cadastro", description: "Gerenciamento de cadastros" },
  "/novo-usuario": { title: "Novo Usuário", description: "Cadastro de novo usuário" },
  
  // Cadastro Estoque - Páginas principais
  "/cadastro/estoque/formas-apresentacao": { title: "Formas de Apresentação", description: "Cadastro de formas de apresentação do estoque" },
  "/cadastro/estoque/fornecedores": { title: "Fornecedores", description: "Cadastro de fornecedores do estoque" },
  "/cadastro/estoque/itens": { title: "Itens", description: "Cadastro de itens do estoque" },
  "/cadastro/estoque/setores": { title: "Setores", description: "Cadastro de setores do estoque" },
  "/cadastro/estoque/unidades": { title: "Unidades", description: "Cadastro de unidades do estoque" },
  
  // Cadastro Estoque - Subpáginas
  "/cadastro/estoque/formas-apresentacao/nova": { title: "Formas de Apresentação", description: "Nova Forma de Apresentação" },
  "/cadastro/estoque/fornecedores/novo": { title: "Fornecedores", description: "Novo Fornecedor" },
  "/cadastro/estoque/itens/novo": { title: "Itens", description: "Novo Item" },
  "/cadastro/estoque/setores/novo": { title: "Setores", description: "Novo Setor" },
  "/cadastro/estoque/unidades/nova": { title: "Unidades", description: "Nova Unidade" },
  
  // Cadastro Financeiro - Páginas principais
  "/cadastro/financeiro/conta-bancaria": { title: "Conta Bancária", description: "Cadastro de contas bancárias" },
  "/cadastro/financeiro/clientes": { title: "Clientes", description: "Cadastro de clientes" },
  "/cadastro/financeiro/centro-custo": { title: "Centro de Custo", description: "Cadastro de centros de custo" },
  "/cadastro/financeiro/centro-receita": { title: "Centro de Receita", description: "Cadastro de centros de receita" },
  "/cadastro/financeiro/contabil": { title: "Contábil", description: "Cadastro contábil" },
  "/cadastro/financeiro/categorias": { title: "Categorias", description: "Cadastro de categorias" },
  "/cadastro/financeiro/fornecedores": { title: "Fornecedores", description: "Cadastro de fornecedores financeiros" },
  "/cadastro/financeiro/subcategorias": { title: "Subcategorias", description: "Cadastro de subcategorias" },
  "/cadastro/financeiro/plano-contas": { title: "Plano de Contas", description: "Cadastro do plano de contas" },
  "/cadastro/financeiro/conciliacao-bancaria": { title: "Conciliação Bancária", description: "Conciliação de contas bancárias" },
  "/cadastro/financeiro/transferencias": { title: "Transferências", description: "Cadastro de transferências" },
  
  // Cadastro Financeiro - Subpáginas
  "/cadastro/financeiro/conta-bancaria/nova": { title: "Conta Bancária", description: "Nova Conta Bancária" },
  "/cadastro/financeiro/clientes/novo": { title: "Clientes", description: "Novo Cliente" },
  "/cadastro/financeiro/centro-custo/novo": { title: "Centro de Custo", description: "Novo Centro de Custo" },
  "/cadastro/financeiro/centro-receita/novo": { title: "Centro de Receita", description: "Novo Centro de Receita" },
  "/cadastro/financeiro/contabil/novo": { title: "Contábil", description: "Novo Registro Contábil" },
  "/cadastro/financeiro/categorias/nova": { title: "Categorias", description: "Nova Categoria" },
  "/cadastro/financeiro/fornecedores/novo": { title: "Fornecedores", description: "Novo Fornecedor" },
  "/cadastro/financeiro/subcategorias/nova": { title: "Subcategorias", description: "Nova Subcategoria" },
  "/cadastro/financeiro/plano-contas/novo": { title: "Plano de Contas", description: "Novo Plano de Contas" },
  "/cadastro/financeiro/transferencias/nova": { title: "Transferências", description: "Nova Transferência" },
  
  // Estoque - Páginas principais
  "/estoque/entradas": { title: "Entradas de Estoque", description: "Controle de entrada de materiais" },
  "/estoque/saidas": { title: "Saídas de Estoque", description: "Controle de saída de materiais" },
  "/estoque/inventario": { title: "Inventário", description: "Controle de inventário" },
  "/estoque/locacoes": { title: "Locações", description: "Gerencie todas as locações de unidades" },
  "/estoque/ordem-compra": { title: "Ordem de Compra", description: "Gerenciamento de ordens de compra" },
  "/estoque/ordem-servico": { title: "Ordem de Serviço", description: "Gerenciamento de ordens de serviço" },
  "/estoque/requisicoes": { title: "Requisições", description: "Gerenciamento de requisições" },
  
  // Estoque - Subpáginas
  "/estoque/entradas/nova": { title: "Entradas de Estoque", description: "Nova Entrada" },
  "/estoque/entradas/upload-nfe": { title: "Entradas de Estoque", description: "Upload NF-e" },
  "/estoque/saidas/nova": { title: "Saídas de Estoque", description: "Nova Saída" },
  "/estoque/locacoes/nova": { title: "Locações", description: "Nova Locação" },
  "/estoque/requisicoes/nova": { title: "Requisições", description: "Nova Requisição" },
  "/estoque/ordem-compra/nova": { title: "Ordem de Compra", description: "Nova Ordem de Compra" },
  "/estoque/ordem-servico/nova": { title: "Ordem de Serviço", description: "Nova Ordem de Serviço" },
  
  // Financeiro - Páginas principais
  "/financeiro/contas-receber": { title: "Contas a Receber", description: "Gerenciamento de contas a receber" },
  "/financeiro/contas-pagar": { title: "Contas a Pagar", description: "Gerenciamento de contas a pagar" },
  "/financeiro/fluxo-caixa": { title: "Fluxo de Caixa", description: "Controle de fluxo de caixa" },
  "/financeiro/xml": { title: "XML", description: "Gerenciamento de arquivos XML" },
  
  // Financeiro - Subpáginas
  "/financeiro/contas-receber/nova": { title: "Contas a Receber", description: "Nova Conta a Receber" },
  "/financeiro/contas-pagar/nova": { title: "Contas a Pagar", description: "Nova Conta a Pagar" },
  "/financeiro/contas-receber/relatorio": { title: "Contas a Receber", description: "Relatório de Contas a Receber" },
  "/financeiro/contas-pagar/relatorio": { title: "Contas a Pagar", description: "Relatório de Contas a Pagar" },
  "/financeiro/fluxo-caixa/relatorio": { title: "Fluxo de Caixa", description: "Relatório de Fluxo de Caixa" },
  
  // Patrimônio (under Estoque)
  "/patrimonio": { title: "Patrimônio", description: "Gerenciamento de patrimônio" },

  // Operacional - Lab
  "/operacional/mapas": { title: "Mapas", description: "Mapas do laboratório" },
  "/operacional/exames": { title: "Exames", description: "Tipos de exames" },

  // NF-e
  "/nfe": { title: "NF-e", description: "Gerenciamento de notas fiscais eletrônicas" },
  "/nfe/nova": { title: "NF-e", description: "Nova Nota Fiscal" },
  
  // Usuário
  "/notificacoes": { title: "Notificações", description: "Central de notificações do sistema" },
  "/usuario/visualizar": { title: "Meu Perfil", description: "Visualizar informações do perfil" },
  "/usuario/editar": { title: "Editar Perfil", description: "Alterar informações do perfil" },
  "/usuario/excluir": { title: "Excluir Conta", description: "Remover conta permanentemente" },
  
  // Cadastro - Pessoas
  "/cadastro/pessoas/pessoas": { title: "Pessoas", description: "Cadastro de colaboradores" },
  "/cadastro/pessoas/pessoas/nova": { title: "Pessoas", description: "Nova Pessoa" },
  "/cadastro/pessoas/setores": { title: "Setores/Áreas", description: "Cadastro de setores da empresa" },
  "/cadastro/pessoas/setores/novo": { title: "Setores/Áreas", description: "Novo Setor" },
  
  // Gestão de Pessoas
  "/gestao-pessoas/visao-geral": { title: "Visão Geral RH", description: "Dashboard de Recursos Humanos" },
  "/gestao-pessoas/pessoas": { title: "Pessoas (360º)", description: "Visão completa dos colaboradores" },
  "/gestao-pessoas/hierarquia": { title: "Hierarquia", description: "Organograma da empresa" },
  "/gestao-pessoas/acessos": { title: "Acessos do Sistema", description: "Gerenciamento de permissões" },
  "/gestao-pessoas/dashboards": { title: "Dashboards", description: "Controle de visibilidade" },
  "/gestao-pessoas/auditoria": { title: "Auditoria", description: "Histórico de alterações" },
  
  // Módulos Globais - Header
  "/calendario": { title: "Calendário", description: "Calendário corporativo" },
  "/chat": { title: "Chat", description: "Chat corporativo" },
  "/kanban": { title: "Kanban", description: "Gestão de tarefas e projetos" },
  
  // Comercial
  "/comercial/visao-geral": { title: "Comercial", description: "Visão Geral" },
  "/comercial/leads": { title: "Comercial", description: "Leads" },
  "/comercial/contas": { title: "Comercial", description: "Contas (Empresas)" },
  "/comercial/contatos": { title: "Comercial", description: "Contatos" },
  "/comercial/oportunidades": { title: "Comercial", description: "Oportunidades (Pipeline)" },
  "/comercial/propostas": { title: "Comercial", description: "Propostas" },
  "/comercial/atividades": { title: "Comercial", description: "Atividades" },
  "/comercial/metas": { title: "Comercial", description: "Metas e Forecast" },
  "/comercial/comissoes": { title: "Comercial", description: "Comissões" },
  
  // Marketing
  "/marketing/visao-geral": { title: "Marketing", description: "Visão Geral" },
  "/marketing/campanhas": { title: "Marketing", description: "Campanhas" },
  "/marketing/canais": { title: "Marketing", description: "Canais" },
  "/marketing/leads": { title: "Marketing", description: "Leads (MQL/SQL)" },
  "/marketing/atribuicao": { title: "Marketing", description: "Atribuição e ROI" },
  
  // Dashboards
  "/dashboards/comercial": { title: "Dashboard Comercial", description: "Métricas de vendas" },
  "/dashboards/marketing": { title: "Dashboard Marketing", description: "Métricas de marketing" },
}

function LayoutContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const pageInfo = pageTitles[location.pathname] || { title: "SerpTech", description: "Sistema de Gestão" }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 h-screen overflow-hidden",
          sidebarCollapsed ? "ml-20" : "ml-72"
        )}
      >
        <Topbar 
          sidebarCollapsed={sidebarCollapsed}
          pageTitle={pageInfo.title}
          pageDescription={pageInfo.description}
        />

        {/* Separator line between header and content */}
        <div className="h-px w-full bg-border/60 dark:bg-border/40 shrink-0" />

        <main className={cn(
          "flex-1",
          location.pathname === "/chat" ? "overflow-hidden p-0" : "overflow-y-auto p-6"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function LayoutShell() {
  return (
    <ThemeProvider>
      <LayoutContent />
    </ThemeProvider>
  )
}
