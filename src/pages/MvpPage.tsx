import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Rocket,
    Target,
    Users,
    Lightbulb,
    DollarSign,
    Sparkles,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import NavMenuButton from "@/components/NavMenuButton";

interface MvpData {
    problem: string;
    solution: string;
    target_audience: string;
    value_proposition: string;
    revenue_model: string;
    key_features: string[];
    next_steps: string[];
}

const MVP_EXTRACTION_PROMPT = `Analise a conversa e extraia os dados para o MVP da empresa do empreendedor.
Retorne SOMENTE JSON válido (sem markdown):
{"problem":"problema que resolve","solution":"solução proposta","target_audience":"público-alvo","value_proposition":"proposta de valor única","revenue_model":"modelo de receita","key_features":["feature1","feature2","feature3"],"next_steps":["passo1","passo2","passo3"]}
Regras: só extraia o que foi explicitamente dito ou pode ser claramente inferido; campos sem info ficam vazios; responda em português.`;

export default function MvpPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [mvpData, setMvpData] = useState<MvpData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchMvpData();
    }, [user]);

    const fetchMvpData = async () => {
        if (!user) return;
        try {
            // Try to load from localStorage first (persisted MVP)
            const stored = localStorage.getItem(`mvp_data_${user.id}`);
            if (stored) {
                setMvpData(JSON.parse(stored));
                setLoading(false);
                return;
            }

            // Otherwise, generate from chat history
            await generateMvpFromChat();
        } catch {
            setLoading(false);
        }
    };

    const generateMvpFromChat = async () => {
        if (!user) return;
        setGenerating(true);

        try {
            // Fetch all chat messages from user's sessions
            const { data: sessions } = await supabase
                .from("chat_sessions")
                .select("id")
                .eq("user_id", user.id);

            if (!sessions || sessions.length === 0) {
                setLoading(false);
                setGenerating(false);
                return;
            }

            const sessionIds = sessions.map((s) => s.id);
            const { data: messages } = await supabase
                .from("chat_messages")
                .select("role, content")
                .in("session_id", sessionIds)
                .order("created_at", { ascending: true })
                .limit(30);

            if (!messages || messages.length < 4) {
                setLoading(false);
                setGenerating(false);
                return;
            }

            const conversationText = messages
                .slice(-20)
                .map((m) => `${m.role === "assistant" ? "IA" : "User"}: ${m.content.slice(0, 300)}`)
                .join("\n");

            const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!geminiKey) {
                toast({ title: "Chave Gemini não configurada", variant: "destructive" });
                setLoading(false);
                setGenerating(false);
                return;
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: `${MVP_EXTRACTION_PROMPT}\n\n--- CONVERSA ---\n${conversationText}` }],
                                role: "user",
                            },
                        ],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 600,
                            responseMimeType: "application/json",
                        },
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("API error");
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("No content");

            const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned) as MvpData;

            setMvpData(parsed);
            localStorage.setItem(`mvp_data_${user.id}`, JSON.stringify(parsed));
        } catch (error) {
            console.error("MVP generation error:", error);
            toast({ title: "Erro ao gerar MVP", description: "Continue conversando no chat para mais dados.", variant: "destructive" });
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    const hasContent = (val: string | string[] | undefined) => {
        if (Array.isArray(val)) return val.filter(Boolean).length > 0;
        return !!val && val.trim().length > 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen page-gradient">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <Skeleton className="h-10 w-48 glass-card mb-8" />
                    <div className="grid md:grid-cols-2 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-36 glass-card rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const sections = mvpData
        ? [
            {
                title: "Problema",
                content: mvpData.problem,
                icon: <AlertCircle className="h-5 w-5" />,
                color: "from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30",
                iconColor: "text-red-500",
            },
            {
                title: "Solução",
                content: mvpData.solution,
                icon: <Lightbulb className="h-5 w-5" />,
                color: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
                iconColor: "text-amber-500",
            },
            {
                title: "Público-Alvo",
                content: mvpData.target_audience,
                icon: <Users className="h-5 w-5" />,
                color: "from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30",
                iconColor: "text-blue-500",
            },
            {
                title: "Proposta de Valor",
                content: mvpData.value_proposition,
                icon: <Target className="h-5 w-5" />,
                color: "from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30",
                iconColor: "text-indigo-500",
            },
            {
                title: "Modelo de Receita",
                content: mvpData.revenue_model,
                icon: <DollarSign className="h-5 w-5" />,
                color: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
                iconColor: "text-emerald-500",
            },
        ]
        : [];

    return (
        <div className="min-h-screen page-gradient relative overflow-hidden">
            <div className="glow-orb w-96 h-96 bg-purple-400 -top-32 -right-16" />
            <div className="glow-orb w-72 h-72 bg-blue-300 bottom-0 -left-16" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
                >
                    <div className="flex items-center gap-2">
                        <NavMenuButton />

                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                                <Rocket className="h-7 w-7 text-primary" /> Seu MVP
                            </h1>
                            <p className="text-white text-sm mt-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                                Visão gerada pela IA com base nas suas conversas
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateMvpFromChat}
                            disabled={generating}
                            className="glass-card border-0 hover:bg-white/80 text-sm"
                        >
                            <Sparkles className="h-4 w-4 mr-1.5" />
                            {generating ? "Gerando..." : "Atualizar MVP"}
                        </Button>
                        <ThemeToggle />
                    </div>
                </motion.div>

                {!mvpData ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-2xl p-10 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
                            <Rocket className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">MVP em construção</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                            Converse mais com o Effie sobre sua ideia de negócio. A IA vai extrair automaticamente os elementos do seu MVP a partir da conversa.
                        </p>
                        <Button
                            onClick={() => navigate("/chat")}
                            className="btn-gradient rounded-xl font-semibold px-8"
                        >
                            Ir para o Chat
                        </Button>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {/* Main cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {sections.map((section, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                    className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${section.color}`}
                                >
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className={`w-9 h-9 rounded-xl bg-white/60 dark:bg-white/10 flex items-center justify-center ${section.iconColor}`}>
                                            {section.icon}
                                        </div>
                                        <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {hasContent(section.content) ? (
                                            section.content
                                        ) : (
                                            <span className="italic opacity-60">Converse no chat para descobrir...</span>
                                        )}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Features */}
                        {hasContent(mvpData.key_features) && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="glass-card rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30"
                            >
                                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-500" /> Funcionalidades-Chave
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {mvpData.key_features.filter(Boolean).map((f, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                                        >
                                            <CheckCircle className="h-3 w-3" /> {f}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Next Steps */}
                        {hasContent(mvpData.next_steps) && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="glass-card rounded-2xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30"
                            >
                                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                                    <Rocket className="h-4 w-4 text-emerald-500" /> Próximos Passos
                                </h3>
                                <div className="space-y-2">
                                    {mvpData.next_steps.filter(Boolean).map((step, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2.5 text-sm text-muted-foreground"
                                        >
                                            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
