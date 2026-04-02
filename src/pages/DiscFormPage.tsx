import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    ArrowLeft,
    ChevronRight,
    CheckCircle,
    ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DiscQuestion {
    id: number;
    question: string;
    options: {
        label: string;
        profile: "D" | "I" | "S" | "C";
    }[];
}

const discQuestions: DiscQuestion[] = [
    {
        id: 1,
        question: "Quando surge um problema no negócio, qual é sua primeira reação?",
        options: [
            { label: "Tomo a frente e resolvo imediatamente", profile: "D" },
            { label: "Reúno a equipe para discutir soluções", profile: "I" },
            { label: "Analiso a situação com calma antes de agir", profile: "S" },
            { label: "Pesquiso dados e referências antes de decidir", profile: "C" },
        ],
    },
    {
        id: 2,
        question: "Como você prefere trabalhar num novo projeto?",
        options: [
            { label: "Definir metas ambiciosas e ir atrás", profile: "D" },
            { label: "Colaborar com pessoas entusiasmadas", profile: "I" },
            { label: "Planejar cada etapa com cuidado", profile: "S" },
            { label: "Criar processos e métricas detalhados", profile: "C" },
        ],
    },
    {
        id: 3,
        question: "O que mais te motiva no empreendedorismo?",
        options: [
            { label: "Conquistar resultados rápidos e visíveis", profile: "D" },
            { label: "Inspirar pessoas e criar impacto social", profile: "I" },
            { label: "Construir algo sólido e duradouro", profile: "S" },
            { label: "Resolver problemas complexos com excelência", profile: "C" },
        ],
    },
    {
        id: 4,
        question: "Como você lida com críticas ao seu trabalho?",
        options: [
            { label: "Escuto, mas confio no meu instinto", profile: "D" },
            { label: "Valorizo o feedback e busco consenso", profile: "I" },
            { label: "Reflito com calma e ajusto se fizer sentido", profile: "S" },
            { label: "Analiso se a crítica é fundamentada com dados", profile: "C" },
        ],
    },
    {
        id: 5,
        question: "Como você se comporta em reuniões de negócio?",
        options: [
            { label: "Vou direto ao ponto e quero decisões rápidas", profile: "D" },
            { label: "Gosto de criar rapport e energia positiva", profile: "I" },
            { label: "Ouço todos antes de dar minha opinião", profile: "S" },
            { label: "Preparo dados e apresentações detalhadas", profile: "C" },
        ],
    },
    {
        id: 6,
        question: "Quando precisa tomar uma decisão importante, você...",
        options: [
            { label: "Decide rápido — oportunidades não esperam", profile: "D" },
            { label: "Consulta pessoas de confiança", profile: "I" },
            { label: "Pesa prós e contras com tempo", profile: "S" },
            { label: "Coleta o máximo de informações possível", profile: "C" },
        ],
    },
    {
        id: 7,
        question: "Num time, qual papel você naturalmente assume?",
        options: [
            { label: "Líder — direciono e cobro resultados", profile: "D" },
            { label: "Comunicador — conecto e motivo as pessoas", profile: "I" },
            { label: "Mediador — mantenho a harmonia do grupo", profile: "S" },
            { label: "Analista — garanto qualidade e precisão", profile: "C" },
        ],
    },
    {
        id: 8,
        question: "Qual qualidade é mais importante num parceiro de negócio?",
        options: [
            { label: "Ambição e velocidade de execução", profile: "D" },
            { label: "Carisma e habilidade de networking", profile: "I" },
            { label: "Confiabilidade e comprometimento", profile: "S" },
            { label: "Competência técnica e atenção a detalhes", profile: "C" },
        ],
    },
    {
        id: 9,
        question: "Quando algo dá errado, como você reage?",
        options: [
            { label: "Adapto o plano e sigo em frente rápido", profile: "D" },
            { label: "Mantenho o otimismo e reúno a equipe", profile: "I" },
            { label: "Aceito, reflito e traço um novo plano", profile: "S" },
            { label: "Investigo a causa raiz antes de qualquer ação", profile: "C" },
        ],
    },
    {
        id: 10,
        question: "O que te descreve melhor como empreendedor?",
        options: [
            { label: "Determinado e orientado a resultados", profile: "D" },
            { label: "Entusiasta e inspirador", profile: "I" },
            { label: "Paciente e metodológico", profile: "S" },
            { label: "Perfeccionista e analítico", profile: "C" },
        ],
    },
];

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

export default function DiscFormPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, "D" | "I" | "S" | "C">>({});
    const [result, setResult] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    // true = user never did DISC before (came from onboarding)
    const [isFirstTime, setIsFirstTime] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        // Check if user has already completed DISC in Supabase
        checkExistingDisc();
    }, [user]);

    const checkExistingDisc = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from("disc_results")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();
            
            setIsFirstTime(!data);
            if (data) setShowIntro(false);
        } catch (err) {
            console.error("Error checking existing DISC:", err);
            setIsFirstTime(true);
        }
    };

    // Auto-redirect to home after DISC completion (first-time or retake)
    useEffect(() => {
        if (result) {
            const delay = isFirstTime ? 2500 : 3500;
            const timer = setTimeout(() => navigate("/dashboard"), delay);
            return () => clearTimeout(timer);
        }
    }, [result, isFirstTime, navigate]);

    const question = discQuestions[currentQuestion];
    const totalQuestions = discQuestions.length;
    const progress = ((currentQuestion + (answers[question?.id] ? 1 : 0)) / totalQuestions) * 100;

    const handleAnswer = (profile: "D" | "I" | "S" | "C") => {
        const newAnswers = { ...answers, [question.id]: profile };
        setAnswers(newAnswers);

        if (currentQuestion < totalQuestions - 1) {
            setTimeout(() => setCurrentQuestion((prev) => prev + 1), 300);
        } else {
            // Calculate result
            calculateResult(newAnswers);
        }
    };

    const calculateResult = async (finalAnswers: Record<number, "D" | "I" | "S" | "C">) => {
        const counts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
        Object.values(finalAnswers).forEach((p) => (counts[p] = (counts[p] || 0) + 1));

        const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        setResult(dominant);

        // Save to Supabase
        if (user) {
            setSaving(true);
            try {
                const { error } = await supabase.from("disc_results").upsert(
                    {
                        user_id: user.id,
                        d_score: counts.D,
                        i_score: counts.I,
                        s_score: counts.S,
                        c_score: counts.C,
                        dominant_profile: dominant,
                        answers: finalAnswers,
                        updated_at: new Date().toISOString(),
                    }
                );

                if (error) {
                    console.error("Error saving DISC result:", error);
                }
            } catch (err) {
                console.error("Error saving DISC result to DB:", err);
            } finally {
                setSaving(false);
            }
        }

        // Toast feedback
        if (isFirstTime) {
            toast({
                title: "Perfil DISC concluído! 🎉",
                description: "Bem-vindo ao Effie! Redirecionando...",
            });
        } else {
            toast({
                title: "Perfil DISC atualizado! ✅",
                description: "Redirecionando para a Home...",
            });
        }
    };

    // Result screen
    if (result) {
        const profile = profileDescriptions[result];
        return (
            <div className="min-h-screen page-gradient relative overflow-hidden">
                <div className="glow-orb w-96 h-96 bg-orange-300 -top-32 -right-16" />
                <div className="glow-orb w-72 h-72 bg-orange-300 bottom-0 -left-16" />

                <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
                    <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                                {isFirstTime ? "🎉" : "✅"} Redirecionando para a Home...
                            </div>
                            <ThemeToggle />
                        </div>
                    </motion.div>

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
                        <h2 className="text-2xl font-bold text-foreground mb-1">
                            Seu Perfil: {profile.name}
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">{profile.description}</p>

                        {/* Strengths */}
                        <div className="flex flex-wrap gap-2 justify-center mb-6">
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

                    {/* Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card rounded-2xl p-6"
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

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6 text-center"
                    >

                        <Button onClick={() => navigate("/dashboard")} className="btn-gradient rounded-xl">
                            {isFirstTime ? "Ir para a Home" : "Voltar à Home"}
                        </Button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Intro screen for first-time users
    if (isFirstTime && showIntro) {
        return (
            <div className="min-h-screen page-gradient relative overflow-hidden flex flex-col items-center justify-center px-4 py-8">
                <div className="glow-orb w-80 h-80 bg-orange-300 -top-24 -left-20" />
                <div className="glow-orb w-72 h-72 bg-orange-300 bottom-0 -right-16" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full max-w-md text-center"
                >
                    <div className="glass-card rounded-2xl p-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <span className="text-4xl">🧩</span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-3">
                            Vamos descobrir seu perfil!
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto">
                            Antes de começar, faremos um teste rápido de <span className="font-semibold text-foreground">10 perguntas</span> para
                            entender seu estilo de empreendedorismo. Isso ajuda o Effie a personalizar
                            sua experiência e dar conselhos mais certeiros. Leva menos de 2 minutos! ⏱️
                        </p>
                        <Button
                            onClick={() => setShowIntro(false)}
                            className="btn-gradient rounded-xl font-semibold px-8 h-12 text-base"
                        >
                            Iniciar Teste 🚀
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Questionnaire screen
    return (
        <div className="min-h-screen page-gradient relative overflow-hidden flex flex-col items-center justify-center px-4 py-8">
            <div className="glow-orb w-80 h-80 bg-orange-300 -top-24 -left-20" />
            <div className="glow-orb w-72 h-72 bg-indigo-300 bottom-0 -right-16" />

            <div className="relative z-10 w-full max-w-xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        {/* Only show back button if user has already done DISC */}
                        {!isFirstTime ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/dashboard")}
                                className="glass-card border-0 hover:bg-white/80"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
                            </Button>
                        ) : (
                            <div className="text-xs text-muted-foreground px-2 py-1 glass-card rounded-lg">
                                Passo obrigatório para começar
                            </div>
                        )}
                        <ThemeToggle />
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center mx-auto mb-3 shadow-md">
                            <ClipboardList className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">Perfil DISC Empreendedor</h1>
                        <p className="text-sm text-muted-foreground">
                            Descubra seu estilo de empreendedorismo em {totalQuestions} perguntas rápidas
                        </p>
                    </div>
                </motion.div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>
                            Pergunta {currentQuestion + 1} de {totalQuestions}
                        </span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.25 }}
                        className="glass-card rounded-2xl p-6"
                    >
                        <h2 className="text-base font-semibold text-foreground mb-5">{question.question}</h2>

                        <div className="space-y-2.5">
                            {question.options.map((option, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => handleAnswer(option.profile)}
                                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 border cursor-pointer group ${answers[question.id] === option.profile
                                        ? "bg-primary/10 border-primary/30 text-primary"
                                        : "glass-card border-transparent hover:shadow-md hover:-translate-y-0.5"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${answers[question.id] === option.profile
                                                ? "bg-primary text-white"
                                                : "bg-primary/10 text-primary/60 group-hover:bg-primary/20"
                                                }`}
                                        >
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className="text-sm font-medium">{option.label}</span>
                                        <ChevronRight
                                            className={`h-4 w-4 ml-auto shrink-0 transition-opacity ${answers[question.id] === option.profile ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-50"
                                                }`}
                                        />
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {currentQuestion > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentQuestion((prev) => prev - 1)}
                                className="mt-4 text-xs text-muted-foreground hover:text-foreground"
                            >
                                ← Pergunta anterior
                            </Button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
