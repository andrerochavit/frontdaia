import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, CheckCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecoverySession, setIsRecoverySession] = useState(false);
    const [success, setSuccess] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        // Listen for the PASSWORD_RECOVERY event from Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setIsRecoverySession(true);
            }
        });

        // Also check if we already have a session (user clicked the link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsRecoverySession(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
            return;
        }

        if (password !== confirmPassword) {
            toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                toast({ title: "Erro", description: error.message, variant: "destructive" });
            } else {
                setSuccess(true);
                toast({ title: "Senha atualizada! 🎉", description: "Você será redirecionado..." });
                setTimeout(() => navigate("/dashboard"), 2500);
            }
        } catch {
            toast({ title: "Erro inesperado", description: "Algo deu errado. Tente novamente.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden page-gradient">
            <div className="glow-orb w-96 h-96 bg-blue-300 -top-24 -left-24" />
            <div className="glow-orb w-80 h-80 bg-indigo-300 -bottom-16 -right-16" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="glass-card rounded-2xl p-8 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-lg">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Redefinir Senha</h1>
                        <p className="text-sm text-muted-foreground">Crie uma nova senha para sua conta</p>
                    </div>

                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-6"
                        >
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-emerald-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground mb-1">Senha atualizada!</h2>
                            <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
                        </motion.div>
                    ) : !isRecoverySession ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-8 w-8 text-primary/50" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground mb-2">Aguardando verificação...</h2>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Clique no link enviado para seu email. Se não recebeu, volte à tela de login e solicite novamente.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4 glass-card border-0"
                                onClick={() => navigate("/auth")}
                            >
                                Voltar ao Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="new-password" className="text-sm font-medium">Nova Senha</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="glass-input h-11 rounded-xl"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirmar Senha</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="glass-input h-11 rounded-xl"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl btn-gradient font-semibold"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Nova Senha
                            </Button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
