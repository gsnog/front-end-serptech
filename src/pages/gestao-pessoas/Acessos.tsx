import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Shield, Users, Lock, ChevronDown, ChevronRight, Save, Loader2, Trash2 } from "lucide-react";
import { systemRoles } from "@/contexts/PermissionsContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPessoas, setGrupoPessoa, pessoasQueryKey, type Pessoa } from "@/services/pessoas";
import { fetchRoles, setRolePermissions, createRole, deleteRole, rolesQueryKey, type RoleAPI } from "@/services/roles";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Permission } from "@/contexts/PermissionsContext";

// ── Módulos com sub-grupos de features ───────────────────────────────────────

type Feature      = { id: string; nome: string; acoes: string[]; hasScope?: boolean };
// module: permission module ID for this group (may differ from parent mod.id for cadastro groups)
type FeatureGroup = { label: string; module: string; features: Feature[] };
type Modulo       = { id: string; nome: string; groups: FeatureGroup[] };

const modulosSistema: Modulo[] = [
  {
    id: 'dashboard', nome: 'Dashboard', groups: [
      { label: 'Dashboards', module: 'dashboard', features: [
        { id: 'dashboard_geral',      nome: 'Dashboard Geral',              acoes: ['view'] },
        { id: 'dashboard_financeiro', nome: 'Dashboard Financeiro',         acoes: ['view'] },
        { id: 'dashboard_estoque',    nome: 'Dashboard Estoque',            acoes: ['view'] },
        { id: 'dashboard_patrimonio', nome: 'Dashboard Patrimônio',         acoes: ['view'] },
        { id: 'dashboard_comercial',  nome: 'Dashboard Comercial',          acoes: ['view'] },
        { id: 'dashboard_rh',         nome: 'Dashboard Gestão de Pessoas',  acoes: ['view'] },
      ]},
    ]
  },
  {
    id: 'estoque', nome: 'Estoque', groups: [
      { label: 'Cadastro', module: 'cadastro_estoque', features: [
        { id: 'cad_est_fornecedores', nome: 'Fornecedores', acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_est_itens',        nome: 'Itens',        acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_est_setores',      nome: 'Setores',      acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_est_unidades',     nome: 'Unidades',     acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_est_softwares',    nome: 'Softwares',    acoes: ['view', 'create', 'edit', 'delete'] },
      ]},
      { label: 'Operacional', module: 'estoque', features: [
        { id: 'est_entradas',         nome: 'Entradas',                  acoes: ['view', 'create', 'edit', 'delete', 'approve'] },
        { id: 'est_inventario',       nome: 'Inventário',                acoes: ['view'] },
        { id: 'est_saidas',           nome: 'Saídas',                    acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'est_transferencias',   nome: 'Transferências de Estoque', acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'est_patrimonio',       nome: 'Patrimônio',                acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'est_pedidos_internos', nome: 'Pedidos Internos',          acoes: ['view', 'create', 'edit', 'delete', 'approve', 'deliver'], hasScope: true },
        { id: 'est_ordens_compra',    nome: 'Ordem de Compra',           acoes: ['view', 'create', 'edit', 'delete', 'approve', 'deliver', 'buy'], hasScope: true },
        { id: 'est_ordens_servico',   nome: 'Ordem de Serviço',          acoes: ['view', 'create', 'edit', 'delete', 'approve'], hasScope: true },
      ]},
    ]
  },
  {
    id: 'financeiro', nome: 'Financeiro', groups: [
      { label: 'Cadastro', module: 'cadastro_financeiro', features: [
        { id: 'cad_fin_conta_bancaria', nome: 'Conta Bancária',       acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_conciliacao',    nome: 'Conciliação Bancária', acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_transferencias', nome: 'Transferências',       acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_clientes',       nome: 'Clientes',             acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_centro_custo',   nome: 'Centro de Custo',      acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_centro_receita', nome: 'Centro de Receita',    acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_categorias',     nome: 'Categorias',           acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_subcategorias',  nome: 'Subcategorias',        acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_fin_plano_contas',   nome: 'Plano de Contas',      acoes: ['view', 'create', 'edit', 'delete'] },
      ]},
      { label: 'Operacional', module: 'financeiro', features: [
        { id: 'fin_contas_receber', nome: 'Contas a Receber', acoes: ['view', 'create', 'edit', 'delete', 'export'] },
        { id: 'fin_contas_pagar',   nome: 'Contas a Pagar',   acoes: ['view', 'create', 'edit', 'delete', 'export'] },
        { id: 'fin_fluxo_caixa',    nome: 'Fluxo de Caixa',   acoes: ['view', 'export'] },
        { id: 'fin_notas_fiscais',  nome: 'Notas Fiscais',     acoes: ['view', 'create', 'edit', 'delete', 'export'] },
      ]},
    ]
  },
  {
    id: 'operacional', nome: 'Operacional', groups: [
      { label: 'Operacional', module: 'operacional', features: [
        { id: 'op_mapas',  nome: 'Mapas',  acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'op_exames', nome: 'Exames', acoes: ['view', 'create', 'edit', 'delete'] },
      ]},
    ]
  },
  {
    id: 'gestao_pessoas', nome: 'Gestão de Pessoas', groups: [
      { label: 'Cadastro', module: 'cadastro_pessoas', features: [
        { id: 'cad_pess_pessoas', nome: 'Pessoas', acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'cad_pess_cargos',  nome: 'Cargos',  acoes: ['view', 'create', 'edit', 'delete'] },
      ]},
      { label: 'Gestão', module: 'gestao_pessoas', features: [
        { id: 'gp_pessoas',    nome: 'Pessoas (360º)', acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'gp_medicos',    nome: 'Médicos',        acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'gp_hierarquia', nome: 'Hierarquia',     acoes: ['view'] },
        { id: 'gp_permissoes', nome: 'Permissões',     acoes: ['view', 'create', 'edit', 'delete'] },
        { id: 'gp_dashboards', nome: 'Dashboards',     acoes: ['view'] },
        { id: 'gp_auditoria',  nome: 'Auditoria',      acoes: ['view'] },
      ]},
    ]
  },
  {
    id: 'relatorios', nome: 'Relatórios', groups: [
      { label: 'Relatórios', module: 'relatorios', features: [
        { id: 'relatorios', nome: 'Relatórios Financeiros', acoes: ['view', 'export'] },
      ]},
    ]
  },
];

const acoesLabels: Record<string, string> = {
  view: 'Ver', create: 'Criar', edit: 'Editar', delete: 'Excluir', approve: 'Aprovar', deliver: 'Entregar', buy: 'Comprar', export: 'Exportar',
};
const allAcoes = Object.keys(acoesLabels);

// ── Helpers ───────────────────────────────────────────────────────────────────

type PermissionsMap = Record<string, Set<string>>;
/** featureId → 'self' | 'all' (only relevant for hasScope features) */
type ScopeMap = Record<string, 'self' | 'all'>;

/** Converts backend Permission[] → local PermissionsMap keyed by feature id */
function permissionsToMap(permissions: Permission[]): PermissionsMap {
  const map: PermissionsMap = {};
  for (const p of permissions) {
    const featureKey = p.page !== 'all' ? p.page : p.module;
    map[featureKey] = new Set(p.actions);
  }
  return map;
}

/** Extracts scope values from backend permissions for hasScope features */
function permissionsToScopeMap(permissions: Permission[]): ScopeMap {
  const map: ScopeMap = {};
  for (const p of permissions) {
    const featureKey = p.page !== 'all' ? p.page : p.module;
    map[featureKey] = (p.scope === 'all' ? 'all' : 'self');
  }
  return map;
}

/** Converts local PermissionsMap → backend Permission[], using scopeMap for scope */
function mapToPermissions(map: PermissionsMap, scopeMap: ScopeMap = {}): Permission[] {
  const result: Permission[] = [];
  for (const [featureId, actions] of Object.entries(map)) {
    if (actions.size === 0) continue;
    let module = 'all';
    outer: for (const mod of modulosSistema) {
      for (const group of mod.groups) {
        if (group.features.find(f => f.id === featureId)) {
          module = group.module;
          break outer;
        }
      }
    }
    // Dashboard features usam o featureId como module (ex: 'dashboard_estoque')
    // para bater com a verificação do backend em _build_permissions.
    const isDashboard = module === 'dashboard';
    result.push({
      module: isDashboard ? featureId : module,
      page:   isDashboard ? 'all' : featureId,
      actions: Array.from(actions),
      scope: scopeMap[featureId] ?? 'all',
    });
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Acessos() {
  const { hasPermission, isStaff } = usePermissions();
  const staff = isStaff();
  const canView = staff || hasPermission('gestao_pessoas', 'gp_permissoes', 'view');
  const isAdmin = staff || hasPermission('gestao_pessoas', 'gp_permissoes', 'edit');

  const [activeTab, setActiveTab]         = useState("perfis");
  const [searchTerm, setSearchTerm]       = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [newProfileDialog, setNewProfileDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDesc, setNewProfileDesc] = useState("");

  // Local edits: roleId → PermissionsMap (only for unsaved changes)
  const [localEdits, setLocalEdits] = useState<Record<number, PermissionsMap>>({});
  const [localScopes, setLocalScopes] = useState<Record<number, ScopeMap>>({});
  const [dirtyRoles, setDirtyRoles] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
  });

  const { data: pessoasResponse, isLoading: pessoasLoading } = useQuery({
    queryKey: pessoasQueryKey,
    queryFn: () => fetchPessoas(1, '', 200),
  });
  const pessoas: Pessoa[] = pessoasResponse?.results ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const savePermsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: Permission[] }) =>
      setRolePermissions(id, permissions),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      setDirtyRoles(prev => { const n = new Set(prev); n.delete(updated.id); return n; });
      setLocalEdits(prev => { const n = { ...prev }; delete n[updated.id]; return n; });
      setLocalScopes(prev => { const n = { ...prev }; delete n[updated.id]; return n; });
      toast({ title: "Permissões salvas", description: `Perfil "${updated.name}" atualizado.` });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Erro ao salvar permissões.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const [userRoles, setUserRoles]     = useState<Record<number, string>>({});
  const [savingId, setSavingId]       = useState<number | null>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);

  const createRoleMutation = useMutation({
    mutationFn: (name: string) => createRole(name),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      setNewProfileName('');
      setNewProfileDesc('');
      setNewProfileDialog(false);
      setSelectedRoleId(created.id);
      toast({ title: 'Perfil criado', description: `Perfil "${created.name}" criado com sucesso.` });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Erro ao criar perfil.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      if (selectedRoleId === deleteDialogId) setSelectedRoleId(null);
      setDeleteDialogId(null);
      toast({ title: 'Perfil excluído' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Erro ao excluir perfil.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
      setDeleteDialogId(null);
    },
  });

  const grupoMutation = useMutation({
    mutationFn: ({ id, grupo }: { id: number; grupo: string }) => setGrupoPessoa(id, grupo),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: pessoasQueryKey });
      setUserRoles(prev => { const n = { ...prev }; delete n[updated.id]; return n; });
      toast({ title: "Perfil atualizado", description: `${updated.nome} → ${updated.role}` });
      setSavingId(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || "Erro ao atualizar perfil.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setSavingId(null);
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const selectedRole: RoleAPI | undefined = roles.find(r => r.id === selectedRoleId);

  /** Returns the permissions map for the selected role (local edits or from server) */
  const getPermsMap = (roleId: number): PermissionsMap => {
    if (localEdits[roleId]) return localEdits[roleId];
    const role = roles.find(r => r.id === roleId);
    return role ? permissionsToMap(role.permissions) : {};
  };

  /** Returns the scope map for the selected role (local edits or from server) */
  const getScopeMap = (roleId: number): ScopeMap => {
    if (localScopes[roleId]) return localScopes[roleId];
    const role = roles.find(r => r.id === roleId);
    return role ? permissionsToScopeMap(role.permissions) : {};
  };

  const getFeatureScope = (featureId: string): 'self' | 'all' => {
    if (!selectedRoleId) return 'self';
    return getScopeMap(selectedRoleId)[featureId] ?? 'self';
  };

  const toggleScope = (featureId: string, scope: 'self' | 'all') => {
    if (!selectedRoleId || isAdminRole(selectedRole) || !isAdmin) return;
    setLocalScopes(prev => {
      const base = getScopeMap(selectedRoleId);
      return { ...prev, [selectedRoleId]: { ...base, [featureId]: scope } };
    });
    setDirtyRoles(prev => new Set(prev).add(selectedRoleId));
  };

  const isAdminRole = (role?: RoleAPI) => role?.name?.toLowerCase() === 'admin';

  const isChecked = (featureId: string, acao: string): boolean => {
    if (!selectedRoleId) return false;
    if (isAdminRole(selectedRole)) return true;
    return getPermsMap(selectedRoleId)[featureId]?.has(acao) ?? false;
  };

  const togglePermission = (featureId: string, acao: string) => {
    if (!selectedRoleId || isAdminRole(selectedRole) || !isAdmin) return;
    setLocalEdits(prev => {
      const base = getPermsMap(selectedRoleId);
      const current = new Set(base[featureId] ?? []);
      current.has(acao) ? current.delete(acao) : current.add(acao);
      return { ...prev, [selectedRoleId]: { ...base, [featureId]: current } };
    });
    setDirtyRoles(prev => new Set(prev).add(selectedRoleId));
  };

  const handleSavePermissions = () => {
    if (!selectedRoleId || !dirtyRoles.has(selectedRoleId)) return;
    const map = getPermsMap(selectedRoleId);
    const scopes = getScopeMap(selectedRoleId);
    savePermsMutation.mutate({ id: selectedRoleId, permissions: mapToPermissions(map, scopes) });
  };

  const handleApplyRole = (pessoa: Pessoa) => {
    const grupo = userRoles[pessoa.id];
    if (!grupo) return;
    setSavingId(pessoa.id);
    grupoMutation.mutate({ id: pessoa.id, grupo });
  };

  const toggleModuleExpand = (modId: string) =>
    setExpandedModules(prev => { const n = new Set(prev); n.has(modId) ? n.delete(modId) : n.add(modId); return n; });

  const filteredPessoas = useMemo(() =>
    pessoas.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())),
    [pessoas, searchTerm],
  );

  // Display list: server roles + system role names for any missing
  const allRolesDisplay = useMemo(() => {
    if (roles.length) return roles;
    return systemRoles.map((r, i) => ({ id: i + 1, name: r.id, permissions: [] } as RoleAPI));
  }, [roles]);

  // ── Guard ─────────────────────────────────────────────────────────────────────

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground">Você não tem permissão para visualizar esta página.</p>
      </div>
    );
  }

  const isSaving = savePermsMutation.isPending;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="perfis"   className="gap-2"><Shield className="h-4 w-4" />Perfis de Acesso</TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2"><Users  className="h-4 w-4" />Usuários e Atribuições</TabsTrigger>
        </TabsList>

        {/* ── Perfis ── */}
        <TabsContent value="perfis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Lista de perfis */}
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Perfis</CardTitle>
                  <Button size="sm" className="gap-1" onClick={() => setNewProfileDialog(true)}>
                    <Plus className="h-4 w-4" />Novo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[480px] px-6 py-4 space-y-2">
                {rolesLoading
                  ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)
                  : allRolesDisplay.map((role) => {
                    const isProtected = ['admin','diretor','gestor','usuario','assistente','rh_admin','rh_leitura'].includes(role.name.toLowerCase());
                    return (
                      <div key={role.id} className="relative group">
                        <button
                          onClick={() => { setSelectedRoleId(role.id); setExpandedModules(new Set()); }}
                          className={cn(
                            "w-full p-3 pr-9 rounded border text-left transition-colors",
                            selectedRoleId === role.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-foreground capitalize">{role.name}</div>
                            {dirtyRoles.has(role.id) && (
                              <span className="text-xs text-amber-500 font-medium">não salvo</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {systemRoles.find(r => r.id === role.name)?.description || 'Perfil personalizado'}
                          </div>
                        </button>
                        {!isProtected && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteDialogId(role.id); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                }
                </div>
              </CardContent>
            </Card>

            {/* Permissões do perfil selecionado */}
            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Permissões: {selectedRole?.name || "Selecione um perfil"}
                    {isAdminRole(selectedRole) && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(acesso total — não editável)</span>
                    )}
                  </CardTitle>
                  {selectedRoleId && !isAdminRole(selectedRole) && dirtyRoles.has(selectedRoleId) && (
                    <Button size="sm" onClick={handleSavePermissions} disabled={isSaving} className="gap-1">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedRoleId ? (
                  <div className="space-y-1">
                    {modulosSistema.map(modulo => {
                      const totalFeatures = modulo.groups.reduce((acc, g) => acc + g.features.length, 0);
                      return (
                        <div key={modulo.id} className="border border-border rounded overflow-hidden">
                          <button
                            onClick={() => toggleModuleExpand(modulo.id)}
                            className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
                          >
                            {expandedModules.has(modulo.id)
                              ? <ChevronDown  className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-medium text-foreground text-sm">{modulo.nome}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{totalFeatures} features</span>
                          </button>
                          {expandedModules.has(modulo.id) && (
                            <div className="border-t border-border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-xs">Feature</TableHead>
                                    {allAcoes.map(a => (
                                      <TableHead key={a} className="text-center w-16 text-xs">{acoesLabels[a]}</TableHead>
                                    ))}
                                    <TableHead className="text-xs w-36">Visibilidade</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {modulo.groups.map((group, gi) => (
                                    <React.Fragment key={`group-${gi}`}>
                                      {modulo.groups.length > 1 && (
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                          <TableCell
                                            colSpan={allAcoes.length + 2}
                                            className="py-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                                          >
                                            {group.label}
                                          </TableCell>
                                        </TableRow>
                                      )}
                                      {group.features.map(feat => {
                                        const hasView = isAdminRole(selectedRole) || getPermsMap(selectedRoleId!)[feat.id]?.has('view');
                                        return (
                                        <TableRow key={feat.id}>
                                          <TableCell className="text-sm">{feat.nome}</TableCell>
                                          {allAcoes.map(acao => (
                                            <TableCell key={acao} className="text-center">
                                              {feat.acoes.includes(acao) ? (
                                                <Checkbox
                                                  checked={isChecked(feat.id, acao)}
                                                  onCheckedChange={() => togglePermission(feat.id, acao)}
                                                  disabled={isAdminRole(selectedRole) || !isAdmin}
                                                />
                                              ) : (
                                                <span className="text-muted-foreground/30">—</span>
                                              )}
                                            </TableCell>
                                          ))}
                                          <TableCell>
                                            {feat.hasScope && hasView ? (
                                              <Select
                                                value={isAdminRole(selectedRole) ? 'all' : getFeatureScope(feat.id)}
                                                onValueChange={(v) => toggleScope(feat.id, v as 'self' | 'all')}
                                                disabled={isAdminRole(selectedRole) || !isAdmin}
                                              >
                                                <SelectTrigger className="h-7 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="self">Somente as suas</SelectItem>
                                                  <SelectItem value="all">Todas</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <span className="text-muted-foreground/30 text-xs">—</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                        );
                                      })}
                                    </React.Fragment>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">Selecione um perfil</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Usuários ── */}
        <TabsContent value="usuarios" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Atribuição de Perfis</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pessoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pessoa</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Perfil Atual</TableHead>
                      <TableHead>Alterar Perfil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pessoasLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                      : filteredPessoas.map((pessoa) => (
                        <TableRow key={pessoa.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                                {pessoa.iniciais}
                              </div>
                              <span className="font-medium">{pessoa.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>{pessoa.setor || "—"}</TableCell>
                          <TableCell>{pessoa.cargo || "—"}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">{pessoa.role}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={userRoles[pessoa.id] || ''}
                                onValueChange={(v) => setUserRoles(prev => ({ ...prev, [pessoa.id]: v }))}
                                disabled={!isAdmin}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder={pessoa.role} />
                                </SelectTrigger>
                                <SelectContent>
                                  {allRolesDisplay.map((role) => (
                                    <SelectItem key={role.id} value={role.name}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {isAdmin && userRoles[pessoa.id] && userRoles[pessoa.id] !== pessoa.role && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApplyRole(pessoa)}
                                  disabled={savingId === pessoa.id}
                                >
                                  {savingId === pessoa.id ? "..." : "Aplicar"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog — Novo Perfil */}
      <Dialog open={newProfileDialog} onOpenChange={setNewProfileDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Perfil de Acesso</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Perfil <span className="text-destructive">*</span></Label>
              <Input
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Ex: Supervisor de Estoque"
                onKeyDown={(e) => e.key === 'Enter' && newProfileName.trim() && createRoleMutation.mutate(newProfileName.trim())}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Input
                value={newProfileDesc}
                onChange={(e) => setNewProfileDesc(e.target.value)}
                placeholder="Descreva as responsabilidades"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewProfileDialog(false); setNewProfileName(''); setNewProfileDesc(''); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => createRoleMutation.mutate(newProfileName.trim())}
              disabled={!newProfileName.trim() || createRoleMutation.isPending}
            >
              {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Perfil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog — Confirmar exclusão */}
      <AlertDialog open={deleteDialogId !== null} onOpenChange={(open) => { if (!open) setDeleteDialogId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o perfil <strong>{allRolesDisplay.find(r => r.id === deleteDialogId)?.name}</strong>?
              Usuários com este perfil ficarão sem grupo atribuído. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialogId !== null && deleteRoleMutation.mutate(deleteDialogId)}
            >
              {deleteRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
