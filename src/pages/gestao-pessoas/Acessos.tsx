import { useState, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Shield, Users, Edit, Lock, ChevronDown, ChevronRight } from "lucide-react";
import { systemRoles } from "@/contexts/PermissionsContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPessoas, setGrupoPessoa, pessoasQueryKey, type Pessoa } from "@/services/pessoas";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Módulos com features granulares
const modulosSistema = [
  {
    id: 'dashboard', nome: 'Dashboard', features: [
      { id: 'dashboard_geral', nome: 'Dashboard Geral', acoes: ['view'] },
      { id: 'dashboard_financeiro', nome: 'Dashboard Financeiro', acoes: ['view'] },
      { id: 'dashboard_estoque', nome: 'Dashboard Estoque', acoes: ['view'] },
      { id: 'dashboard_comercial', nome: 'Dashboard Comercial', acoes: ['view'] },
    ]
  },
  {
    id: 'estoque', nome: 'Estoque', features: [
      { id: 'est_entradas', nome: 'Entradas', acoes: ['view', 'create', 'edit', 'delete'] },
      { id: 'est_inventario', nome: 'Inventário', acoes: ['view', 'create', 'edit', 'delete'] },
      { id: 'est_saidas', nome: 'Saídas', acoes: ['view', 'create', 'edit', 'delete'] },
      { id: 'est_requisicoes', nome: 'Requisições', acoes: ['view', 'create', 'edit', 'delete', 'approve'] },
    ]
  },
  {
    id: 'financeiro', nome: 'Financeiro', features: [
      { id: 'fin_contas_receber', nome: 'Contas a Receber', acoes: ['view', 'create', 'edit', 'delete', 'export'] },
      { id: 'fin_contas_pagar', nome: 'Contas a Pagar', acoes: ['view', 'create', 'edit', 'delete', 'export'] },
      { id: 'fin_fluxo_caixa', nome: 'Fluxo de Caixa', acoes: ['view', 'export'] },
    ]
  },
  {
    id: 'gestao_pessoas', nome: 'Gestão de Pessoas', features: [
      { id: 'gp_pessoas', nome: 'Pessoas (360º)', acoes: ['view', 'create', 'edit', 'delete'] },
      { id: 'gp_hierarquia', nome: 'Hierarquia', acoes: ['view'] },
      { id: 'gp_permissoes', nome: 'Permissões', acoes: ['view', 'create', 'edit', 'delete'] },
    ]
  },
];

const acoesLabels: Record<string, string> = {
  view: 'Ver', create: 'Criar', edit: 'Editar', delete: 'Excluir', approve: 'Aprovar', export: 'Exportar',
};

const allAcoes = Object.keys(acoesLabels);
type PermissionsMap = Record<string, Set<string>>;

export default function Acessos() {
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission('all', 'all', 'delete');

  const [activeTab, setActiveTab] = useState("perfis");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [newProfileDialog, setNewProfileDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDesc, setNewProfileDesc] = useState("");
  const [customRoles, setCustomRoles] = useState<Array<{ id: string; name: string; description: string }>>([]);

  const [rolePermissions, setRolePermissions] = useState<Record<string, PermissionsMap>>(() => {
    const map: Record<string, PermissionsMap> = {};
    const adminPerms: PermissionsMap = {};
    modulosSistema.forEach(mod => mod.features.forEach(feat => { adminPerms[feat.id] = new Set(feat.acoes); }));
    map['admin'] = adminPerms;
    systemRoles.filter(r => r.id !== 'admin').forEach(r => { map[r.id] = {}; });
    return map;
  });

  const queryClient = useQueryClient();

  const { data: pessoasResponse, isLoading } = useQuery({
    queryKey: pessoasQueryKey,
    queryFn: () => fetchPessoas(1, '', 200),
  });
  const pessoas: Pessoa[] = pessoasResponse?.results ?? [];

  const [userRoles, setUserRoles] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

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

  const handleApplyRole = (pessoa: Pessoa) => {
    const grupo = userRoles[pessoa.id];
    if (!grupo) return;
    setSavingId(pessoa.id);
    grupoMutation.mutate({ id: pessoa.id, grupo });
  };

  const filteredPessoas = useMemo(() =>
    pessoas.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())),
    [pessoas, searchTerm]
  );

  const allRoles = [...systemRoles, ...customRoles];

  const toggleModuleExpand = (modId: string) => {
    setExpandedModules(prev => { const n = new Set(prev); n.has(modId) ? n.delete(modId) : n.add(modId); return n; });
  };

  const togglePermission = (featureId: string, acao: string) => {
    if (!selectedRole || selectedRole === 'admin' || !isAdmin) return;
    setRolePermissions(prev => {
      const roleCopy = { ...prev };
      const perms = { ...roleCopy[selectedRole] };
      const current = perms[featureId] ? new Set(perms[featureId]) : new Set<string>();
      current.has(acao) ? current.delete(acao) : current.add(acao);
      perms[featureId] = current;
      roleCopy[selectedRole] = perms;
      return roleCopy;
    });
  };

  const isChecked = (featureId: string, acao: string): boolean => {
    if (!selectedRole) return false;
    if (selectedRole === 'admin') return true;
    return rolePermissions[selectedRole]?.[featureId]?.has(acao) ?? false;
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const id = newProfileName.toLowerCase().replace(/\s+/g, '_');
    setCustomRoles(prev => [...prev, { id, name: newProfileName.trim(), description: newProfileDesc.trim() }]);
    setRolePermissions(prev => ({ ...prev, [id]: {} }));
    setNewProfileName(""); setNewProfileDesc(""); setNewProfileDialog(false);
    toast({ title: "Perfil criado", description: `Perfil "${newProfileName}" criado.` });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem gerenciar acessos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="perfis" className="gap-2"><Shield className="h-4 w-4" />Perfis de Acesso</TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" />Usuários e Atribuições</TabsTrigger>
        </TabsList>

        <TabsContent value="perfis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Perfis</CardTitle>
                  <Button size="sm" className="gap-1" onClick={() => setNewProfileDialog(true)}>
                    <Plus className="h-4 w-4" />Novo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {allRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setExpandedModules(new Set()); }}
                    className={cn(
                      "w-full p-3 rounded border text-left transition-colors",
                      selectedRole === role.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="font-medium text-foreground">{role.name}</div>
                    <div className="text-sm text-muted-foreground">{role.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Permissões: {allRoles.find(r => r.id === selectedRole)?.name || "Selecione um perfil"}
                  {selectedRole === 'admin' && <span className="ml-2 text-xs font-normal text-muted-foreground">(acesso total - não editável)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRole ? (
                  <div className="space-y-1">
                    {modulosSistema.map(modulo => (
                      <div key={modulo.id} className="border border-border rounded overflow-hidden">
                        <button onClick={() => toggleModuleExpand(modulo.id)} className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors">
                          {expandedModules.has(modulo.id) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium text-foreground text-sm">{modulo.nome}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{modulo.features.length} features</span>
                        </button>
                        {expandedModules.has(modulo.id) && (
                          <div className="border-t border-border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Feature</TableHead>
                                  {allAcoes.map(a => <TableHead key={a} className="text-center w-16 text-xs">{acoesLabels[a]}</TableHead>)}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {modulo.features.map(feat => (
                                  <TableRow key={feat.id}>
                                    <TableCell className="text-sm">{feat.nome}</TableCell>
                                    {allAcoes.map(acao => (
                                      <TableCell key={acao} className="text-center">
                                        {feat.acoes.includes(acao) ? (
                                          <Checkbox checked={isChecked(feat.id, acao)} onCheckedChange={() => togglePermission(feat.id, acao)} disabled={selectedRole === 'admin'} />
                                        ) : <span className="text-muted-foreground/30">—</span>}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-12 text-muted-foreground">Selecione um perfil</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Atribuição de Perfis</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar pessoa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
                        </TableRow>
                      ))
                    ) : filteredPessoas.map((pessoa) => (
                      <TableRow key={pessoa.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">{pessoa.iniciais}</div>
                            <span className="font-medium">{pessoa.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>{pessoa.setor || "—"}</TableCell>
                        <TableCell>{pessoa.cargo || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{pessoa.role}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={userRoles[pessoa.id] || ''}
                              onValueChange={(v) => setUserRoles(prev => ({ ...prev, [pessoa.id]: v }))}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder={pessoa.role} />
                              </SelectTrigger>
                              <SelectContent>
                                {allRoles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {userRoles[pessoa.id] && userRoles[pessoa.id] !== pessoa.role && (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={newProfileDialog} onOpenChange={setNewProfileDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Perfil de Acesso</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome do Perfil <span className="text-destructive">*</span></Label>
              <Input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} placeholder="Ex: Supervisor de Estoque" />
            </div>
            <div className="space-y-2"><Label>Descrição</Label>
              <Input value={newProfileDesc} onChange={(e) => setNewProfileDesc(e.target.value)} placeholder="Descreva as responsabilidades" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProfileDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateProfile}>Criar Perfil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
