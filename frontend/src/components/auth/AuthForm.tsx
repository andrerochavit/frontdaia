import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) {
        toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Verifique seu email", description: "Enviamos um link de confirmação." });
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Algo deu errado. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else {
        onAuthSuccess();
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Algo deu errado. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erro", description: "Digite seu email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Email enviado! 📧",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setShowForgotPassword(false);
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Algo deu errado. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden page-gradient">
      {/* Decorative orbs */}
      <div className="glow-orb w-96 h-96 bg-blue-300 -top-24 -left-24" />
      <div className="glow-orb w-80 h-80 bg-indigo-300 -bottom-16 -right-16" />
      <div className="glow-orb w-64 h-64 bg-sky-200 top-1/3 right-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glass Card */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Effie</h1>
            <p className="text-sm text-muted-foreground">Seu mentor de empreendedorismo com IA</p>
          </div>

          {/* Forgot Password View */}
          {showForgotPassword ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={() => setShowForgotPassword(false)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao login
              </button>
              <h2 className="text-lg font-semibold text-foreground mb-1">Recuperar Senha</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input h-11 rounded-xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl btn-gradient font-semibold"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Link de Recuperação
                </Button>
              </form>
            </motion.div>
          ) : (
            /* Tabs */
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 glass-card rounded-xl p-1 border-0">
                <TabsTrigger
                  value="signin"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                >
                  Registrar
                </TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input h-11 rounded-xl"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl btn-gradient font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Crie uma senha (mín. 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input h-11 rounded-xl"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl btn-gradient font-semibold mt-2"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </motion.div>
    </div>
  );
}