import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-dlc.png";
import logoDark from "@/assets/Logo - DLC dark - mode (1).png";
import { authService } from "@/services/auth";

export default function VerificarCodigo() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) navigate("/esqueci-senha", { replace: true });
  }, [email, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.verifyCode({ email: email!, code: code.trim() });
      navigate("/nova-senha", { state: { email, code: code.trim() } });
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      setError(msg || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    try {
      await authService.forgotPassword({ email: email! });
      toast.success("Código reenviado! Verifique seu e-mail.");
    } catch {
      toast.error("Erro ao reenviar o código. Tente novamente.");
    } finally {
      setResending(false);
    }
  }

  if (!email) return null;

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
          <h1 className="text-4xl font-bold text-white text-center mb-4">Verifique seu e-mail</h1>
          <p className="text-white/70 text-center text-lg max-w-md">
            Digite o código de 6 dígitos que enviamos para o seu endereço de e-mail.
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
            <button
              type="button"
              onClick={() => navigate("/esqueci-senha")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Alterar e-mail
            </button>
            <h2 className="text-3xl font-bold text-foreground mb-2">Digite o código</h2>
            <p className="text-muted-foreground">
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-foreground font-medium">
                Código de verificação
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="000000"
                className={`text-center tracking-[0.5em] text-2xl font-mono h-14 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                  error ? "border-destructive focus:ring-destructive/20 focus:border-destructive" : ""
                }`}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                "Verificar código"
              )}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || loading}
              className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-1 disabled:opacity-50"
            >
              {resending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              {resending ? "Reenviando..." : "Não recebi o código — reenviar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
