import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, FlaskConical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Exame {
  id: number;
  nome: string;
}

const fetchExames = async (): Promise<Exame[]> => {
  const res = await api.get('/api/lab/exames/');
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export default function Exames() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: exames = [], isLoading } = useQuery({
    queryKey: ['lab-exames'],
    queryFn: fetchExames,
  });

  const createMutation = useMutation({
    mutationFn: (nome: string) => api.post('/api/lab/exames/', { nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-exames'] });
      toast({ title: "Exame criado com sucesso!" });
      setNovoNome("");
      setShowForm(false);
    },
    onError: () => toast({ title: "Erro ao criar exame", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/lab/exames/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-exames'] });
      toast({ title: "Exame removido." });
    },
    onError: () => toast({ title: "Erro ao remover exame", variant: "destructive" }),
  });

  const filtered = exames.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exames</h1>
            <p className="text-sm text-muted-foreground">Tipos de exames cadastrados</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Exame
        </Button>
      </div>

      {showForm && (
        <Card className="border-border">
          <CardContent className="p-4 flex gap-3">
            <Input
              placeholder="Nome do exame..."
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createMutation.mutate(novoNome.trim()); }}
              className="flex-1"
            />
            <Button
              onClick={() => createMutation.mutate(novoNome.trim())}
              disabled={!novoNome.trim() || createMutation.isPending}
            >
              Salvar
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exame..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum exame encontrado.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(exame => (
                <div key={exame.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{exame.id}</Badge>
                    <span className="text-sm font-medium">{exame.nome}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(exame.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
