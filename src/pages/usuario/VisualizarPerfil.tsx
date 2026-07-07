import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building2, Briefcase, Calendar, MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/services/pessoas";

export default function VisualizarPerfil() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const getInitials = (first: string, last: string) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.substring(0, 2).toUpperCase();
  };

  const usuario = {
    nome: user?.nome || "Usuário Logado",
    email: user?.email || "N/A",
    telefone: user?.telefone || "N/A",
    cargo: user?.cargo || "N/A",
    departamento: user?.setor || "N/A",
    dataAdmissao: user?.data_admissao || "N/A",
    endereco: user?.endereco || "N/A",
    iniciais: user?.iniciais || getInitials(user?.first_name || "", user?.last_name || "") || "US",
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar e Nome */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 rounded-xl">
                <AvatarFallback className="bg-primary text-primary-foreground text-5xl font-bold rounded-xl">
                  {usuario.iniciais}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">{usuario.nome}</h2>
                <p className="text-muted-foreground">{usuario.cargo}</p>
              </div>
            </div>

            {/* Informações */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium text-foreground truncate">{usuario.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium text-foreground truncate">{usuario.telefone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium text-foreground truncate">{usuario.cargo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p className="font-medium text-foreground truncate">{usuario.departamento}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Data de Admissão</p>
                  <p className="font-medium text-foreground truncate">{usuario.dataAdmissao}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Localização</p>
                  <p className="font-medium text-foreground truncate">{usuario.endereco}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
