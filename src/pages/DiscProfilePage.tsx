import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import NavMenuButton from "@/components/NavMenuButton";

const profileDescriptions: Record<
    string,
    { name: string; emoji: string; color: string; description: string; strengths: string[]; tips: string[] }
> = {
    D: {
        name: "Dominante",
        emoji: "🔥",
        color: "from-red-400 to-rose-500",
        description:
            "Você é orientado a resultados, direto e determinado. Empreendedores com perfil D são ótimos para tomar decisões rápidas e liderar em momentos de pressão.",
        strengths: ["Tomada de decisão rápida", "Foco em resultados", "Liderança natural", "Alta resiliência"],
        tips: [
            "Ouça mais antes de decidir",
            "Delegue sem microgerenciar",
            "Considere o impacto nas pessoas",
        ],
    },
    I: {
        name: "Influente",
        emoji: "✨",
        color: "from-amber-400 to-orange-500",
        description:
            "Você é comunicativo, entusiasta e ótimo em criar conexões. Empreendedores com perfil I são naturais em networking, vendas e em inspirar equipes.",
        strengths: ["Networking e vendas", "Motivar equipes", "Criatividade", "Construir parcerias"],
        tips: [
            "Crie processos para manter o foco",
            "Documente acordos e decisões",
            "Preste atenção nos detalhes operacionais",
        ],
    },
    S: {
        name: "Estável",
        emoji: "🌿",
        color: "from-emerald-400 to-teal-500",
        description:
            "Você é paciente, confiável e metódico. Empreendedores com perfil S são ótimos em construir negócios sólidos e manter equipes coesas a longo prazo.",
        strengths: ["Consistência", "Construir confiança", "Trabalho em equipe", "Planejamento de longo prazo"],
        tips: [
            "Não evite conflitos necessários",
            "Tome decisões mais rápido quando necessário",
            "Saia da zona de conforto com mais frequência",
        ],
    },
    C: {
        name: "Conforme",
        emoji: "🔬",
        color: "from-blue-400 to-indigo-500",
        description:
            "Você é analítico, preciso e orientado a qualidade. Empreendedores com perfil C são ótimos em criar produtos excelentes e tomar decisões baseadas em dados.",
        strengths: ["Análise de dados", "Qualidade do produto", "Planejamento detalhado", "Resolução de problemas complexos"],
        tips: [
            "Não busque perfeição em tudo — lance rápido",
            "Confie mais na intuição para decisões rápidas",
            "Invista em habilidades interpessoais",
        ],
    },
};

export default function DiscProfilePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dominant, setDominant] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, number> | null>(null);

    useEffect(() => {
        if (!user) return;
        const cached = localStorage.getItem(`disc_result_${user.id}`);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setDominant(parsed.dominant ?? null);
                setScores(parsed.counts ?? null);
            } catch {
                // ignore
            }
        }
    }, [user]);

    // If somehow there's no result, redirect to test
    if (!dominant) {
        return (
            <div className="min-h-screen page-gradient flex items-center justify-center px-4">
                <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
                    <p className="text-muted-foreground mb-4">Você ainda não fez o Teste DISC.</p>
                    <Button onClick={() => navigate("/disc")} className="btn-gradient rounded-xl">
                        Fazer o Teste Agora
                    </Button>
                </div>
            </div>
        );
    }

    const profile = profileDescriptions[dominant];

    // Total questions = sum of all scores
    const total = scores ? Object.values(scores).reduce((a, b) => a + b, 0) : 0;

    // Bar colors per profile type
    const barColors: Record<string, string> = {
        D: "bg-gradient-to-r from-red-400 to-rose-500",
        I: "bg-gradient-to-r from-amber-400 to-orange-500",
        S: "bg-gradient-to-r from-emerald-400 to-teal-500",
        C: "bg-gradient-to-r from-blue-400 to-indigo-500",
    };

    const profileNames: Record<string, string> = {
        D: "Dominante",
        I: "Influente",
        S: "Estável",
        C: "Conforme",
    };

    return (
        <div className="min-h-screen page-gradient relative overflow-hidden">
            <div className="glow-orb w-96 h-96 bg-orange-300 -top-32 -right-16" />
            <div className="glow-orb w-72 h-72 bg-indigo-300 bottom-0 -left-16" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-2">
                        <NavMenuButton />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/dashboard")}
                            className="glass-card border-0 hover:bg-white/80"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
                        </Button>
                    </div>
                    <ThemeToggle />
                </motion.div>

                {/* Profile card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-8 text-center mb-6"
                >
                    <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${profile.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}
                    >
                        <span className="text-4xl">{profile.emoji}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                        Seu Perfil DISC: {profile.name}
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">{profile.description}</p>

                    {/* Strengths */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {profile.strengths.map((s, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                                <CheckCircle className="h-3 w-3" /> {s}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Score bars */}
                {scores && total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="glass-card rounded-2xl p-6 mb-6"
                    >
                        <h3 className="font-semibold text-sm text-foreground mb-4"> Distribuição do seu perfil:</h3>
                        <div className="space-y-3">
                            {(["D", "I", "S", "C"] as const).map((key) => {
                                const count = scores[key] ?? 0;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={key}>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span className="font-medium text-foreground">{profileNames[key]}</span>
                                            <span>{pct}%</span>
                                        </div>
                                        <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${barColors[key]}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, delay: 0.2 }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Tips */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-6 mb-6"
                >
                    <h3 className="font-semibold text-sm text-foreground mb-3">💡 Dicas para você</h3>
                    <div className="space-y-2">
                        {profile.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Retake button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <Button
                        onClick={() => navigate("/disc")}
                        variant="outline"
                        className="glass-card border-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold px-8 shadow-md hover:shadow-lg transition-all"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Refazer o Teste DISC
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
