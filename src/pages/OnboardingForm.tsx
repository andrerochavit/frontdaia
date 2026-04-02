import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Navigation, Target, Users, TrendingUp, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormData {
  whatYouKnow: string;
  whatYouWant: string;
  whoYouKnow: string;
  whatYouInvest: string;
}

const questions = [
  {
    id: "whatYouKnow",
    title: "O que você sabe?",
    description: "Suas habilidades, expertise, conhecimento e experiência",
    icon: <Navigation className="h-6 w-6 text-primary" />,
    placeholder: "Ex: 5 anos em desenvolvimento de software, MBA em marketing, fluente em 3 idiomas...",
    gradient: "from-sky-400 to-blue-500",
  },
  {
    id: "whatYouWant",
    title: "O que você quer?",
    description: "Seus objetivos, aspirações e o tipo de negócio que você imagina",
    icon: <Target className="h-6 w-6 text-primary" />,
    placeholder: "Ex: Construir um produto SaaS para pequenas empresas, criar um negócio sustentável...",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: "whoYouKnow",
    title: "Quem você conhece?",
    description: "Sua rede, potenciais parceiros, mentores e contatos",
    icon: <Users className="h-6 w-6 text-primary" />,
    placeholder: "Ex: Ex-colegas em tech, rede de ex-alunos da universidade, contatos do setor...",
    gradient: "from-indigo-400 to-violet-500",
  },
  {
    id: "whatYouInvest",
    title: "O que você tem para investir?",
    description: "Seu tempo disponível, dinheiro, recursos e compromissos",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    placeholder: "Ex: 20 horas por semana, R$ 15.000 de economia, escritório em casa...",
    gradient: "from-violet-400 to-purple-500",
  },
];

export default function OnboardingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    whatYouKnow: "",
    whatYouWant: "",
    whoYouKnow: "",
    whatYouInvest: "",
  });

  const currentQuestion = questions[step];
  const isLastStep = step === questions.length - 1;
  const progress = ((step) / questions.length) * 100;

  const handleNext = () => {
    const value = formData[currentQuestion.id as keyof FormData];
    if (!value.trim()) {
      toast({ title: "Campo obrigatório", description: "Por favor, preencha este campo antes de continuar.", variant: "destructive" });
      return;
    }
    if (!isLastStep) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Autenticação necessária", description: "Faça login para continuar.", variant: "destructive" });
      return;
    }
    if (Object.values(formData).some((v) => !v.trim())) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("onboarding_data").upsert(
        {
          user_id: user.id,
          what_you_know: formData.whatYouKnow.trim(),
          what_you_want: formData.whatYouWant.trim(),
          who_you_know: formData.whoYouKnow.trim(),
          what_you_invest: formData.whatYouInvest.trim(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        // Detect duplicate email
        const isDuplicate = error.message?.toLowerCase().includes('already registered') || 
                             error.message?.toLowerCase().includes('user_already_exists');
        const message = isDuplicate 
          ? "Este email já está cadastrado. Faça login ou use outro email."
          : error.message;
        toast({ title: isDuplicate ? "Email já em uso" : "Erro ao registrar", description: message, variant: "destructive" });
      } else {
        toast({ title: "Perfil completo! 🎉", description: "Bem-vindo ao Effie!" });
        navigate("/dashboard");
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Algo deu errado. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen page-gradient flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Decorative orbs */}
      <div className="glow-orb w-80 h-80 bg-blue-300 -top-24 -left-20" />
      <div className="glow-orb w-72 h-72 bg-indigo-300 bottom-0 -right-16" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Vamos Te Conhecer Melhor</h1>
          <p className="text-muted-foreground text-sm">
            Responda {questions.length} perguntas rápidas para personalizar sua experiência.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Pergunta {step + 1} de {questions.length}</span>
            <span>{Math.round(progress + (100 / questions.length))}% completo</span>
          </div>
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress + (100 / questions.length)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-3">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i < step ? "bg-primary" : i === step ? "bg-primary w-5" : "bg-primary/20"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-2xl p-7"
          >
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentQuestion.gradient} flex items-center justify-center shadow-md`}>
                <div className="text-white">
                  {currentQuestion.icon}
                </div>
              </div>
              <div>
                <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">
                  Princípio {step + 1}
                </div>
                <h2 className="text-lg font-bold text-foreground">{currentQuestion.title}</h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{currentQuestion.description}</p>

            <Label htmlFor={currentQuestion.id} className="sr-only">{currentQuestion.title}</Label>
            <Textarea
              id={currentQuestion.id}
              placeholder={currentQuestion.placeholder}
              value={formData[currentQuestion.id as keyof FormData]}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
              }
              className="glass-input min-h-[130px] resize-none rounded-xl text-sm"
            />

            {/* Navigation */}
            <div className="flex gap-3 mt-5">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 glass-card border-0 hover:bg-white/70 transition-all"
                  disabled={loading}
                >
                  ← Voltar
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 btn-gradient h-11 rounded-xl font-semibold"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isLastStep ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalizar
                  </>
                ) : (
                  "Próxima →"
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Summary pills (already answered) */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex flex-wrap gap-2 justify-center"
          >
            {questions.slice(0, step).map((q, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="flex items-center gap-1.5 px-3 py-1 glass-card rounded-full text-xs text-primary font-medium hover:shadow transition-all"
              >
                <CheckCircle className="h-3 w-3" /> {q.title}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Get the correct application URL for auth redirects
 * Checks VITE_APP_URL env first, falls back to window.location.origin
 */
export function getAppUrl(): string {
  const env = import.meta.env.VITE_APP_URL?.trim();
  if (env) {
    return env.replace(/\/+$/, ""); // Remove trailing slashes
  }
  return window.location.origin;
}

export function redirectTo(url: string): string {
  return `${getAppUrl()}/${url}`;
}

/**
 * DiscGuard — wraps protected routes and redirects to /disc if the user
 * hasn't completed the DISC assessment yet.
 *
 * Checks Supabase disc_results table (source of truth)
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscGuard({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [checking, setChecking] = useState(true);
    const [hasDisc, setHasDisc] = useState(false);

    useEffect(() => {
        if (!user) {
            setHasDisc(false);
            setChecking(false);
            return;
        }

        // Check if user has already completed DISC in Supabase
        checkExistingDisc();
    }, [user, location.pathname]);

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

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="space-y-4 w-full max-w-md px-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    if (!hasDisc) {
        return <Navigate to="/disc" replace />;
    }

    return <>{children}</>;
}