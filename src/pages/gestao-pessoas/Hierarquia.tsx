import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPessoas, pessoasQueryKey, type Pessoa } from "@/services/pessoas";
import { cn } from "@/lib/utils";

interface HierarchyNode {
  pessoa: Pessoa;
  subordinados: HierarchyNode[];
  isExpanded: boolean;
}

function buildHierarchy(supervisorId: number | null, pessoas: Pessoa[], expandedNodes: Set<number>): HierarchyNode[] {
  const subs = pessoas.filter(p => p.supervisor_id === supervisorId);
  return subs.map(p => ({
    pessoa: p,
    subordinados: buildHierarchy(p.id, pessoas, expandedNodes),
    isExpanded: expandedNodes.has(p.id),
  }));
}

function PersonCard({ pessoa, onClick }: { pessoa: Pessoa; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded border cursor-pointer transition-all hover:shadow-md border-border bg-card hover:bg-muted/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-bold">
        {pessoa.iniciais}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{pessoa.nome}</p>
        <p className="text-sm text-muted-foreground truncate">{pessoa.cargo || "—"}</p>
        <p className="text-xs text-muted-foreground">{pessoa.setor || "—"}</p>
      </div>
    </div>
  );
}

function HierarchyTreeNode({ node, level = 0, toggleExpand }: { node: HierarchyNode; level?: number; toggleExpand: (id: number) => void; }) {
  const hasSubordinados = node.subordinados.length > 0;
  return (
    <div className="relative">
      <div className={cn("flex items-center gap-2", level > 0 && "ml-8")}>
        {hasSubordinados ? (
          <button onClick={() => toggleExpand(node.pessoa.id)} className="p-1 hover:bg-muted rounded">
            {node.isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        ) : <div className="w-6" />}
        <div className="flex-1 max-w-xs"><PersonCard pessoa={node.pessoa} /></div>
      </div>
      {node.isExpanded && hasSubordinados && (
        <div className="mt-2 space-y-2 border-l-2 border-muted ml-4 pl-4">
          {node.subordinados.map(sub => (
            <HierarchyTreeNode key={sub.pessoa.id} node={sub} level={level + 1} toggleExpand={toggleExpand} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Hierarquia() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"gestor" | "area">("gestor");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const { data: pessoasResponse, isLoading } = useQuery({
    queryKey: pessoasQueryKey,
    queryFn: () => fetchPessoas(1, '', 200),
  });
  const pessoas: Pessoa[] = pessoasResponse?.results ?? [];

  const pessoasSemGestor = useMemo(() =>
    pessoas.filter(p => !p.supervisor_id && p.cargo !== 'Diretor'),
    [pessoas]
  );

  const hierarchyByGestor = useMemo(() => {
    const topLevel = pessoas.filter(p => !p.supervisor_id);
    return topLevel.map(p => ({
      pessoa: p,
      subordinados: buildHierarchy(p.id, pessoas, expandedNodes),
      isExpanded: expandedNodes.has(p.id),
    }));
  }, [pessoas, expandedNodes]);

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {pessoasSemGestor.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-500">
                  {pessoasSemGestor.length} pessoa(s) sem supervisor definido
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {pessoasSemGestor.map(p => p.nome).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "gestor" | "area")}>
        <TabsList>
          <TabsTrigger value="gestor" className="gap-2"><Users className="h-4 w-4" />Por Supervisor</TabsTrigger>
          <TabsTrigger value="area" className="gap-2"><Building2 className="h-4 w-4" />Por Área</TabsTrigger>
        </TabsList>

        <TabsContent value="gestor" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Organograma por Cadeia de Supervisão</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : hierarchyByGestor.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum usuário cadastrado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {hierarchyByGestor.map(node => (
                    <HierarchyTreeNode key={node.pessoa.id} node={node} toggleExpand={toggleExpand} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="area" className="mt-6">
          {(() => {
            const setoresMapped: Record<string, Pessoa[]> = {};
            pessoas.forEach(p => {
              const key = p.setor || "Sem Setor";
              if (!setoresMapped[key]) setoresMapped[key] = [];
              setoresMapped[key].push(p);
            });
            const setoresKeys = Object.keys(setoresMapped);

            if (isLoading) {
              return (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              );
            }

            if (setoresKeys.length === 0) {
              return (
                <Card className="border-border">
                  <CardHeader><CardTitle>Por Setor/Área</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Nenhum usuário cadastrado ainda. Adicione colaboradores para visualizar a hierarquia por área.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-4">
                {setoresKeys.map(setor => (
                  <Card key={setor} className="border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {setor}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          ({setoresMapped[setor].length} pessoa{setoresMapped[setor].length !== 1 ? "s" : ""})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {setoresMapped[setor].map(p => (
                          <PersonCard key={p.id} pessoa={p} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
