import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LayoutShell from "@/layouts/LayoutShell";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { WebRTCProvider } from "@/contexts/WebRTCContext";
import { ChatProvider } from "@/contexts/ChatContext";
import Dashboard from "./pages/Dashboard";
import FluxoCaixa from "./pages/FluxoCaixa";
import NovaTransacao from "./pages/financeiro/NovaTransacao";
import RelatorioFluxoCaixa from "./pages/financeiro/RelatorioFluxoCaixa";
import NFe from "./pages/NFe";
import RelatorioNFe from "./pages/financeiro/RelatorioNFe";
import Patrimonio from "./pages/Patrimonio";
import Relatorio from "./pages/Relatorio";
import Relatorios from "./pages/Relatorios";
import ContasPagar from "./pages/ContasPagar";
import NovaContaPagar from "./pages/financeiro/NovaContaPagar";
import RelatorioContasPagar from "./pages/financeiro/RelatorioContasPagar";
import ContasReceber from "./pages/ContasReceber";
import NovaContaReceber from "./pages/financeiro/NovaContaReceber";
import RelatorioContasReceber from "./pages/financeiro/RelatorioContasReceber";
import ConciliacaoBancaria from "./pages/financeiro/ConciliacaoBancaria";
import LancamentoSaida from "./pages/LancamentoSaida";
import NovoNFe from "./pages/NovoNFe";
import SaidasPendentes from "./pages/SaidasPendentes";
import EstoqueEntradas from "./pages/EstoqueEntradas";
import NovaEntrada from "./pages/estoque/NovaEntrada";
import UploadNFe from "./pages/estoque/UploadNFe";
import RelatorioEntradas from "./pages/estoque/RelatorioEntradas";
import EstoqueTransferencias from "./pages/estoque/EstoqueTransferencias";
import NovaTransferenciaEstoque from "./pages/estoque/NovaTransferenciaEstoque";
import EstoqueInventario from "./pages/EstoqueInventario";
import RelatorioInventario from "./pages/estoque/RelatorioInventario";
import EstoqueLocacoes from "./pages/EstoqueLocacoes";
import NovaLocacao from "./pages/estoque/NovaLocacao";
import RelatorioLocacoes from "./pages/estoque/RelatorioLocacoes";
import EstoqueRequisicoes from "./pages/EstoqueRequisicoes";
import NovaRequisicao from "./pages/estoque/NovaRequisicao";
import RelatorioRequisicoes from "./pages/estoque/RelatorioRequisicoes";
import EstoqueSaidas from "./pages/EstoqueSaidas";
import NovaSaida from "./pages/estoque/NovaSaida";
import RelatorioSaidas from "./pages/estoque/RelatorioSaidas";
import OrdemCompra from "./pages/OrdemCompra";
import NovaOrdemCompra from "./pages/NovaOrdemCompra";
import RelatorioOrdemCompra from "./pages/estoque/RelatorioOrdemCompra";
import OrdemServico from "./pages/OrdemServico";
import NovaOrdemServico from "./pages/NovaOrdemServico";
import Cadastro from "./pages/Cadastro";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Cadastro - Estoque
import FornecedoresEstoque from "./pages/cadastro/estoque/Fornecedores";
import NovoFornecedor from "./pages/cadastro/estoque/NovoFornecedor";
import Itens from "./pages/cadastro/estoque/Itens";
import NovoItem from "./pages/cadastro/estoque/NovoItem";
import Setores from "./pages/cadastro/estoque/Setores";
import NovoSetor from "./pages/cadastro/estoque/NovoSetor";
import Unidades from "./pages/cadastro/estoque/Unidades";
import NovaUnidade from "./pages/cadastro/estoque/NovaUnidade";
import SoftwarePage from "./pages/cadastro/estoque/Software";

// Cadastro - Financeiro
import ContaBancaria from "./pages/cadastro/financeiro/ContaBancaria";
import NovaContaBancaria from "./pages/cadastro/financeiro/NovaContaBancaria";
import Transferencias from "./pages/cadastro/financeiro/Transferencias";
import NovaTransferencia from "./pages/cadastro/financeiro/NovaTransferencia";
import Clientes from "./pages/cadastro/financeiro/Clientes";
import NovoCliente from "./pages/cadastro/financeiro/NovoCliente";
import CentroCusto from "./pages/cadastro/financeiro/CentroCusto";
import NovoCentroCusto from "./pages/cadastro/financeiro/NovoCentroCusto";
import CentroReceita from "./pages/cadastro/financeiro/CentroReceita";
import NovoCentroReceita from "./pages/cadastro/financeiro/NovoCentroReceita";
import Contabil from "./pages/cadastro/financeiro/Contabil";
import NovoContabil from "./pages/cadastro/financeiro/NovoContabil";
import Categorias from "./pages/cadastro/financeiro/Categorias";
import NovaCategoria from "./pages/cadastro/financeiro/NovaCategoria";
import FornecedoresFinanceiro from "./pages/cadastro/financeiro/Fornecedores";
import NovoFornecedorFinanceiro from "./pages/cadastro/financeiro/NovoFornecedorFinanceiro";
import Subcategorias from "./pages/cadastro/financeiro/Subcategorias";
import NovaSubcategoria from "./pages/cadastro/financeiro/NovaSubcategoria";
import PlanoContas from "./pages/cadastro/financeiro/PlanoContas";
import NovoPlanoContas from "./pages/cadastro/financeiro/NovoPlanoContas";


// Operacional
import Mapas from "./pages/operacional/Mapas";
import Exames from "./pages/operacional/Exames";

// Usuário
import VisualizarPerfil from "./pages/usuario/VisualizarPerfil";
import Login from "./pages/Login";
import Notificacoes from "./pages/Notificacoes";

// Cadastro - Pessoas
import Pessoas from "./pages/cadastro/pessoas/Pessoas";
import NovaPessoa from "./pages/cadastro/pessoas/NovaPessoa";
import SetoresAreas from "./pages/cadastro/pessoas/SetoresAreas";
import NovoSetorPessoas from "./pages/cadastro/pessoas/NovoSetor";
import Cargos from "./pages/cadastro/pessoas/Cargos";
import NovoCargo from "./pages/cadastro/pessoas/NovoCargo";

// Gestão de Pessoas
import PessoasVisao360 from "./pages/gestao-pessoas/PessoasVisao360";
import PessoaDetalhe from "./pages/gestao-pessoas/PessoaDetalhe";
import Hierarquia from "./pages/gestao-pessoas/Hierarquia";
import Acessos from "./pages/gestao-pessoas/Acessos";
import DashboardsGestao from "./pages/gestao-pessoas/Dashboards";
import Auditoria from "./pages/gestao-pessoas/Auditoria";

// Módulos Globais (Header)
import Calendario from "./pages/Calendario";
import Chat from "./pages/Chat";
import Kanban from "./pages/Kanban";

// Comercial
import LeadsComercial from "./pages/comercial/Leads";
import ContasComercial from "./pages/comercial/Contas";
import ContatosComercial from "./pages/comercial/Contatos";
import OportunidadesComercial from "./pages/comercial/Oportunidades";
import PropostasComercial from "./pages/comercial/Propostas";
import AtividadesComercial from "./pages/comercial/Atividades";
import NovoLead from "./pages/comercial/NovoLead";
import NovaContaComercial from "./pages/comercial/NovaConta";
import NovoContato from "./pages/comercial/NovoContato";
import NovaOportunidade from "./pages/comercial/NovaOportunidade";
import NovaProposta from "./pages/comercial/NovaProposta";
import NovaAtividade from "./pages/comercial/NovaAtividade";

// Dashboards
import DashboardComercial from "./pages/dashboards/DashboardComercial";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PermissionsProvider>
        <ChatProvider>
          <WebRTCProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<LayoutShell />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixa />} />
                  <Route path="/financeiro/fluxo-caixa/nova" element={<NovaTransacao />} />
                  <Route path="/financeiro/fluxo-caixa/relatorio" element={<RelatorioFluxoCaixa />} />
                  <Route path="/financeiro/contas-pagar" element={<ContasPagar />} />
                  <Route path="/financeiro/contas-pagar/nova" element={<NovaContaPagar />} />
                  <Route path="/financeiro/contas-pagar/relatorio" element={<RelatorioContasPagar />} />
                  <Route path="/financeiro/contas-receber" element={<ContasReceber />} />
                  <Route path="/financeiro/contas-receber/nova" element={<NovaContaReceber />} />
                  <Route path="/financeiro/contas-receber/relatorio" element={<RelatorioContasReceber />} />
                  <Route path="/cadastro/financeiro/conciliacao-bancaria" element={<ConciliacaoBancaria />} />
                  <Route path="/financeiro/lancamento-saida" element={<LancamentoSaida />} />
                  <Route path="/financeiro/saidas-pendentes" element={<SaidasPendentes />} />
                  <Route path="/financeiro/xml" element={<NFe />} />
                  <Route path="/financeiro/xml/relatorio" element={<RelatorioNFe />} />
                  <Route path="/nfe" element={<NFe />} />
                  <Route path="/nfe/nova" element={<NovoNFe />} />
                  <Route path="/novo-nfe" element={<NovoNFe />} />
                  <Route path="/estoque/xml" element={<NFe />} />
                  <Route path="/patrimonio" element={<Patrimonio />} />
                  <Route path="/relatorio" element={<Relatorio />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/estoque/entradas" element={<ErrorBoundary><EstoqueEntradas /></ErrorBoundary>} />
                  <Route path="/estoque/entradas/nova" element={<NovaEntrada />} />
                  <Route path="/estoque/entradas/upload-nfe" element={<UploadNFe />} />
                  <Route path="/estoque/entradas/relatorio" element={<RelatorioEntradas />} />
                  <Route path="/estoque/transferencias" element={<EstoqueTransferencias />} />
                  <Route path="/estoque/transferencias/nova" element={<NovaTransferenciaEstoque />} />
                  <Route path="/estoque/inventario" element={<EstoqueInventario />} />
                  <Route path="/estoque/inventario/relatorio" element={<RelatorioInventario />} />
                  <Route path="/estoque/saidas" element={<EstoqueSaidas />} />
                  <Route path="/estoque/saidas/nova" element={<NovaSaida />} />
                  <Route path="/estoque/saidas/relatorio" element={<RelatorioSaidas />} />
                  <Route path="/estoque/locacoes" element={<EstoqueLocacoes />} />
                  <Route path="/estoque/locacoes/nova" element={<NovaLocacao />} />
                  <Route path="/estoque/locacoes/relatorio" element={<RelatorioLocacoes />} />
                  <Route path="/estoque/pedidos-internos" element={<EstoqueRequisicoes />} />
                  <Route path="/estoque/pedidos-internos/nova" element={<NovaRequisicao />} />
                  <Route path="/estoque/pedidos-internos/relatorio" element={<RelatorioRequisicoes />} />
                  <Route path="/estoque/requisicoes" element={<EstoqueRequisicoes />} />
                  <Route path="/estoque/requisicoes/nova" element={<NovaRequisicao />} />
                  <Route path="/estoque/requisicoes/relatorio" element={<RelatorioRequisicoes />} />
                  <Route path="/estoque/ordem-compra" element={<OrdemCompra />} />
                  <Route path="/estoque/ordem-compra/nova" element={<NovaOrdemCompra />} />
                  <Route path="/estoque/ordem-compra/:id" element={<NovaOrdemCompra />} />
                  <Route path="/estoque/ordem-compra/relatorio" element={<RelatorioOrdemCompra />} />
                  <Route path="/estoque/ordem-servico" element={<OrdemServico />} />
                  <Route path="/estoque/ordem-servico/nova" element={<NovaOrdemServico />} />
                  <Route path="/estoque/ordem-servico/:id" element={<NovaOrdemServico />} />

                  {/* Cadastro - Estoque */}
                  <Route path="/cadastro/estoque/fornecedores" element={<FornecedoresEstoque />} />
                  <Route path="/cadastro/estoque/fornecedores/novo" element={<NovoFornecedor />} />
                  <Route path="/cadastro/estoque/itens" element={<Itens />} />
                  <Route path="/cadastro/estoque/itens/novo" element={<NovoItem />} />
                  <Route path="/cadastro/estoque/setores" element={<Setores />} />
                  <Route path="/cadastro/estoque/setores/novo" element={<NovoSetor />} />
                  <Route path="/cadastro/estoque/unidades" element={<Unidades />} />
                  <Route path="/cadastro/estoque/unidades/nova" element={<NovaUnidade />} />
                  <Route path="/cadastro/estoque/software" element={<SoftwarePage />} />

                  {/* Cadastro - Financeiro */}
                  <Route path="/cadastro/financeiro/conta-bancaria" element={<ContaBancaria />} />
                  <Route path="/cadastro/financeiro/conta-bancaria/nova" element={<NovaContaBancaria />} />
                  <Route path="/cadastro/financeiro/transferencias" element={<Transferencias />} />
                  <Route path="/cadastro/financeiro/transferencias/nova" element={<NovaTransferencia />} />
                  <Route path="/cadastro/financeiro/clientes" element={<Clientes />} />
                  <Route path="/cadastro/financeiro/clientes/novo" element={<NovoCliente />} />
                  <Route path="/cadastro/financeiro/centro-custo" element={<CentroCusto />} />
                  <Route path="/cadastro/financeiro/centro-custo/novo" element={<NovoCentroCusto />} />
                  <Route path="/cadastro/financeiro/centro-receita" element={<CentroReceita />} />
                  <Route path="/cadastro/financeiro/centro-receita/novo" element={<NovoCentroReceita />} />
                  <Route path="/cadastro/financeiro/contabil" element={<Contabil />} />
                  <Route path="/cadastro/financeiro/contabil/novo" element={<NovoContabil />} />
                  <Route path="/cadastro/financeiro/categorias" element={<Categorias />} />
                  <Route path="/cadastro/financeiro/categorias/nova" element={<NovaCategoria />} />
                  <Route path="/cadastro/financeiro/fornecedores" element={<FornecedoresFinanceiro />} />
                  <Route path="/cadastro/financeiro/fornecedores/novo" element={<NovoFornecedorFinanceiro />} />
                  <Route path="/cadastro/financeiro/subcategorias" element={<Subcategorias />} />
                  <Route path="/cadastro/financeiro/subcategorias/nova" element={<NovaSubcategoria />} />
                  <Route path="/cadastro/financeiro/plano-contas" element={<PlanoContas />} />
                  <Route path="/cadastro/financeiro/plano-contas/novo" element={<NovoPlanoContas />} />


                  {/* Operacional */}
                  <Route path="/operacional/mapas" element={<Mapas />} />
                  <Route path="/operacional/exames" element={<Exames />} />

                  <Route path="/novo-usuario" element={<NovaPessoa />} />
                  <Route path="/planos" element={<Dashboard />} />

                  {/* Cadastro - Pessoas */}
                  <Route path="/cadastro/pessoas/pessoas" element={<Pessoas />} />
                  <Route path="/cadastro/pessoas/pessoas/nova" element={<NovaPessoa />} />
                  <Route path="/cadastro/pessoas/setores" element={<SetoresAreas />} />
                  <Route path="/cadastro/pessoas/setores/novo" element={<NovoSetorPessoas />} />
                  <Route path="/cadastro/pessoas/cargos" element={<Cargos />} />
                  <Route path="/cadastro/pessoas/cargos/novo" element={<NovoCargo />} />

                  {/* Gestão de Pessoas */}
                  <Route path="/gestao-pessoas/pessoas" element={<PessoasVisao360 />} />
                  <Route path="/gestao-pessoas/pessoas/:id" element={<PessoaDetalhe />} />
                  <Route path="/gestao-pessoas/hierarquia" element={<Hierarquia />} />
                  <Route path="/gestao-pessoas/acessos" element={<Acessos />} />
                  <Route path="/gestao-pessoas/dashboards" element={<DashboardsGestao />} />
                  <Route path="/gestao-pessoas/auditoria" element={<Auditoria />} />

                  {/* Usuário e Notificações */}
                  <Route path="/usuario/visualizar" element={<VisualizarPerfil />} />
                  <Route path="/notificacoes" element={<Notificacoes />} />

                  {/* Módulos Globais - Header */}
                  <Route path="/calendario" element={<Calendario />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/kanban" element={<Kanban />} />

                  {/* Comercial */}
                  <Route path="/comercial/leads" element={<LeadsComercial />} />
                  <Route path="/comercial/leads/novo" element={<NovoLead />} />
                  <Route path="/comercial/contas" element={<ContasComercial />} />
                  <Route path="/comercial/contas/nova" element={<NovaContaComercial />} />
                  <Route path="/comercial/contatos" element={<ContatosComercial />} />
                  <Route path="/comercial/contatos/novo" element={<NovoContato />} />
                  <Route path="/comercial/oportunidades" element={<OportunidadesComercial />} />
                  <Route path="/comercial/oportunidades/nova" element={<NovaOportunidade />} />
                  <Route path="/comercial/propostas" element={<PropostasComercial />} />
                  <Route path="/comercial/propostas/nova" element={<NovaProposta />} />
                  <Route path="/comercial/atividades" element={<AtividadesComercial />} />
                  <Route path="/comercial/atividades/nova" element={<NovaAtividade />} />

                  {/* Dashboards Globais */}
                  <Route path="/dashboards/comercial" element={<DashboardComercial />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WebRTCProvider>
        </ChatProvider>
      </PermissionsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
