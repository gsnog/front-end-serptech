import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-dlc.png";
import logoDark from "@/assets/Logo - DLC dark - mode (1).png";
import { authService } from "@/services/auth";

export default function NovaSenha() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string | undefined;
  const code = location.state?.code as string | undefined;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email || !code) navigate("/esqueci-senha", { replace: true });
  }, [email, code, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({
        email: email!,
        code: code!,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      setError(msg || "Erro ao redefinir a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!email || !code) return null;

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
          <h1 className="text-4xl font-bold text-white text-center mb-4">
            {success ? "Senha redefinida!" : "Crie uma nova senha"}
          </h1>
          <p className="text-white/70 text-center text-lg max-w-md">
            {success
              ? "Sua senha foi alterada com sucesso. Faça login com suas novas credenciais."
              : "Escolha uma senha segura com pelo menos 8 caracteres."}
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

          {success ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Senha redefinida!</h2>
                <p className="text-muted-foreground">
                  Sua senha foi alterada com sucesso. Use suas novas credenciais para entrar.
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25"
              >
                Ir para o login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Nova senha</h2>
                <p className="text-muted-foreground">Escolha uma senha segura para proteger sua conta.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      className="pl-10 pr-10 h-12 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-foreground font-medium">
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      className={`pl-10 pr-10 h-12 rounded-lg border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                        error ? "border-destructive" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Redefinindo...</span>
                    </div>
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
