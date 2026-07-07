import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-dlc.png";
import logoDark from "@/assets/Logo - DLC dark - mode (1).png";
import { authService } from "@/services/auth";

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword({ email: email.trim().toLowerCase() });
      navigate("/verificar-codigo", { state: { email: email.trim().toLowerCase() } });
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      setError(msg || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(var(--system-base))] to-[hsl(var(--system-dark))] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <img src={logo} alt="DLC Logo" className="w-48 mb-8 drop-shadow-2xl dark:hidden" />
          <img src={logoDark} alt="DLC Logo" className="hidden w-48 mb-8 drop-shadow-2xl dark:block" />
          <h1 className="text-4xl font-bold text-white text-center mb-4">Recupere seu acesso</h1>
          <p className="text-white/70 text-center text-lg max-w-md">
            Informe seu e-mail cadastrado e enviaremos um código de verificação.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="DLC Logo" className="w-32 dark:hidden" />
            <img src={logoDark} alt="DLC Logo" className="hidden w-32 dark:block" />
          </div>

          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </Link>
            <h2 className="text-3xl font-bold text-foreground mb-2">Esqueceu a senha?</h2>
            <p className="text-muted-foreground">
              Informe o e-mail cadastrado e enviaremos um código de recuperação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={`pl-10 h-12 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    error ? "border-destructive focus:ring-destructive/20 focus:border-destructive" : ""
                  }`}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enviando...</span>
                </div>
              ) : (
                "Enviar código"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
