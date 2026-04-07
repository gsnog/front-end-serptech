import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LayoutDashboard, Shield, Users, Eye } from "lucide-react";
import { availableDashboards, systemRoles } from "@/contexts/PermissionsContext";
import { useQuery } from "@tanstack/react-query";
import { fetchPessoas, pessoasQueryKey, type Pessoa } from "@/services/pessoas";

export default function Dashboards() {
  const [activeTab, setActiveTab] = useState("perfis");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pessoasResponse, isLoading } = useQuery({
    queryKey: pessoasQueryKey,
    queryFn: () => fetchPessoas(1, '', 200),
  });
  const pessoas: Pessoa[] = pessoasResponse?.results ?? [];

  const filteredPessoas = useMemo(() =>
    pessoas.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())),
    [pessoas, searchTerm]
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="perfis" className="gap-2">
            <Shield className="h-4 w-4" /> Por Perfil
          </TabsTrigger>
          <TabsTrigger value="pessoas" className="gap-2">
            <Users className="h-4 w-4" /> Por Pessoa (Exceções)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfis" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" /> Visibilidade de Dashboards por Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Perfil</TableHead>
                      {availableDashboards.map((dash) => (
                        <TableHead key={dash.id} className="text-center">
                          {dash.name.replace("Dashboard ", "")}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        {availableDashboards.map((dash) => (
                          <TableCell key={dash.id} className="text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Switch defaultChecked={role.id === 'admin' || role.id === 'diretor'} disabled={role.id === 'admin'} />
                                <span className="text-xs text-muted-foreground">Ver</span>
                              </div>
                              {dash.sensitive && (
                                <div className="flex items-center gap-2">
                                  <Switch defaultChecked={role.id === 'admin'} disabled={role.id === 'admin'} />
                                  <span className="text-xs text-muted-foreground">$$$</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pessoas" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Exceções por Pessoa</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar pessoa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pessoa</TableHead>
                      <TableHead>Role</TableHead>
                      {availableDashboards.map((dash) => (
                        <TableHead key={dash.id} className="text-center min-w-[120px]">
                          {dash.name.replace("Dashboard ", "")}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          {availableDashboards.map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredPessoas.slice(0, 10).map((pessoa) => (
                      <TableRow key={pessoa.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                              {pessoa.iniciais}
                            </div>
                            <span className="font-medium">{pessoa.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{pessoa.role}</TableCell>
                        {availableDashboards.map((dash) => (
                          <TableCell key={dash.id} className="text-center">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Clique nos ícones para alternar a visibilidade de cada dashboard para cada pessoa.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
