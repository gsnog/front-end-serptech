import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Map, FileText, Calendar } from "lucide-react";
import api from "@/lib/api";

interface MapaPrincipal {
  id: number;
  nome: string | null;
  data_de_recebimento: string | null;
  arquivo_pdf: string | null;
  medico?: number | null;
}

const fetchMapas = async (): Promise<MapaPrincipal[]> => {
  const res = await api.get('/api/lab/mapas/');
  return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export default function Mapas() {
  const [search, setSearch] = useState("");

  const { data: mapas = [], isLoading } = useQuery({
    queryKey: ['lab-mapas'],
    queryFn: fetchMapas,
  });

  const filtered = mapas.filter(m =>
    (m.nome ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
          <Map className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapas</h1>
          <p className="text-sm text-muted-foreground">Mapas principais cadastrados no laboratório</p>
        </div>
      </div>

      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mapa..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum mapa encontrado.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(mapa => (
                <div key={mapa.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{mapa.id}</Badge>
                    <div>
                      <p className="text-sm font-medium">{mapa.nome ?? "Sem nome"}</p>
                      {mapa.data_de_recebimento && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(mapa.data_de_recebimento).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  {mapa.arquivo_pdf && (
                    <a
                      href={mapa.arquivo_pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" /> PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
