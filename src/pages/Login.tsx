import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import logo from "@/assets/logo-dlc.png";
import logoDark from "@/assets/Logo - DLC dark - mode (1).png";
import { Footer } from "@/components/Footer";
import api from "@/lib/api";
import { LoginResponse } from "@/types/auth";
import { usePermissions, availableDashboards, type UserPermissions } from "@/contexts/PermissionsContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = usePermissions();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    try {
      // DRF SimpleJWT espera "username" e "password"
      const response = await api.post<LoginResponse>("/api/token/", {
        username: email,
        password: password,
      });

      const { access, refresh, user, permissions } = response.data;

      if (user) {
        // Usa as permissões vindas do backend; caso a API ainda não as retorne
        // (ex: usuário sem grupo), monta um fallback mínimo.
        const normalizedRole = user.role?.toLowerCase() || 'usuario';
        const resolvedPermissions: UserPermissions = permissions ?? {
          userId: String(user.id),
          roles: [normalizedRole],
          permissions: [],
          dashboardAccess: availableDashboards.map(d => ({
            dashboardId: d.id,
            canView: normalizedRole === 'admin',
            canViewSensitive: normalizedRole === 'admin',
          })),
          exceptions: [],
        };
        login(access, refresh, resolvedPermissions);
      }

      toast.success("Login realizado com sucesso!");
      navigate("/"); // Redireciona para o painel principal
    } catch (error: any) {
      console.error("Erro no login:", error);
      const status = error.response?.status;
      if (status === 401 || status === 400 || status === 422) {
        toast.error("E-mail ou senha incorretos. Verifique suas credenciais.");
      } else if (!status) {
        toast.error("Servidor indisponível. Verifique se o backend está ativo.");
      } else {
        toast.error("Ocorreu um erro ao tentar fazer login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(var(--system-base))] to-[hsl(var(--system-dark))] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <img
            src={logo}
            alt="SERP Logo"
            className="w-48 mb-8 drop-shadow-2xl dark:hidden"
          />
          <img
            src={logoDark}
            alt="SERP Logo"
            className="hidden w-48 mb-8 drop-shadow-2xl dark:block"
          />
          <h1 className="text-4xl font-bold text-white text-center mb-4">
            Sistema de Gestão
          </h1>
          <p className="text-white/70 text-center text-lg max-w-md">
            Gerencie suas operações financeiras, estoque e patrimônio de forma integrada e eficiente.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src={logo}
              alt="SERP Logo"
              className="w-32 dark:hidden"
            />
            <img
              src={logoDark}
              alt="SERP Logo"
              className="hidden w-32 dark:block"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                E-mail ou Usuário
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="e-mail ou usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Lembrar-me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                onClick={() => toast.info("Funcionalidade em breve")}
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-muted-foreground">
            Não possui uma conta?{" "}
            <button
              type="button"
              className="text-primary hover:text-primary/80 font-semibold transition-colors"
              onClick={() => toast.info("Funcionalidade em breve")}
            >
              Solicitar acesso
            </button>
          </p>

          {/* Footer padrão de responsabilidade */}
          <Footer className="mt-8 border-t-0 bg-transparent px-0 py-0" />
        </div>
      </div>
    </div>
  );
};

export default Login;
