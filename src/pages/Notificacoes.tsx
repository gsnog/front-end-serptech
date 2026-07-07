import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Package,
  DollarSign,
  FileText,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotificacoes,
  marcarLida,
  marcarTodasLidas,
  limparTodasNotificacoes,
  Notificacao
} from "@/services/notificacoes";

const tipoIcone = {
  alerta: AlertCircle,
  estoque: Package,
  financeiro: DollarSign,
  documento: FileText,
};

const tipoCores = {
  alerta: "bg-amber-500/10 text-amber-500",
  estoque: "bg-blue-500/10 text-blue-500",
  financeiro: "bg-primary/10 text-primary",
  documento: "bg-violet-500/10 text-violet-500",
};

export default function Notificacoes() {
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState<"todas" | "nao-lidas">("todas");

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: fetchNotificacoes
  });

  const mutationMarcarLida = useMutation({
    mutationFn: marcarLida,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
  });

  const mutationMarcarTodasLidas = useMutation({
    mutationFn: marcarTodasLidas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      toast.success("Todas as notificações foram marcadas como lidas.");
    }
  });

  const mutationLimparTodas = useMutation({
    mutationFn: limparTodasNotificacoes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      toast.success("Todas as notificações foram removidas.");
    }
  });

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const notificacoesFiltradas = filtro === "nao-lidas"
    ? notificacoes.filter(n => !n.lida)
    : notificacoes;

  const handleMarcarLida = (id: number) => {
    mutationMarcarLida.mutate(id);
  };

  const handleMarcarTodasLidas = () => {
    mutationMarcarTodasLidas.mutate();
  };

  const handleLimparTodas = () => {
    mutationLimparTodas.mutate();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando notificações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant={filtro === "todas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("todas")}
              className="transition-all duration-200"
            >
              Todas ({notificacoes.length})
            </Button>
            <Button
              variant={filtro === "nao-lidas" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro("nao-lidas")}
              className="transition-all duration-200"
            >
              Não lidas ({naoLidas})
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarcarTodasLidas}
            disabled={naoLidas === 0}
            className="gap-2 transition-all duration-200"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLimparTodas}
            disabled={notificacoes.length === 0}
            className="gap-2 text-destructive hover:text-white hover:bg-destructive transition-all duration-200"
          >
            <Trash2 className="h-4 w-4" />
            Limpar todas
          </Button>
        </div>
      </div>

      {/* Lista de notificações */}
      <div className="space-y-3">
        {notificacoesFiltradas.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Nenhuma notificação
              </h3>
              <p className="text-muted-foreground">
                {filtro === "nao-lidas"
                  ? "Você leu todas as suas notificações."
                  : "Você não tem notificações no momento."}
              </p>
            </CardContent>
          </Card>
        ) : (
          notificacoesFiltradas.map((notificacao) => {
            const Icone = tipoIcone[notificacao.tipo];
            return (
              <Card
                key={notificacao.id}
                className={cn(
                  "border-border transition-all hover:shadow-md",
                  !notificacao.lida && "border-l-4 border-l-primary bg-primary/5"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Ícone */}
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded",
                      tipoCores[notificacao.tipo]
                    )}>
                      <Icone className="h-5 w-5" />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {notificacao.titulo}
                            </h3>
                            {!notificacao.lida && (
                              <Badge variant="default" className="text-xs">
                                Nova
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notificacao.mensagem}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(notificacao.criado_em).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        <div className="flex gap-1">
                          {!notificacao.lida && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarcarLida(notificacao.id)}
                              className="h-8 px-2 text-xs gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
