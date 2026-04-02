import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import {
  Bot, MessageSquare,
  Navigation, Target, Users, Lightbulb, TrendingUp,
  X, Check, Search, Layers, Rocket, Sparkles, LineChart,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Footer } from "@/components/Footer";

import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";


// ─── Principles data for flip cards ───────────────────────────────────────────
const principles = [
  {
    id: "bird-in-hand",
    title: "Pássaro na Mão",
    shortDesc: "Comece com o que você já tem",
    microExplanation: "Use quem você é, o que sabe e quem conhece para começar agora.",
    icon: <Navigation className="h-6 w-6" />,
    iconColor: "text-blue-500",
    bgColor: "from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40",
    example:
      "Exemplo: Um designer gráfico usa suas habilidades para lançar uma marca de camisetas personalizadas, sem precisar aprender áreas desconhecidas.",
  },
  {
    id: "affordable-loss",
    title: "Perda Aceitável",
    shortDesc: "Arrisque só o que pode perder",
    microExplanation: "Defina quanto você pode arriscar antes de investir.",
    icon: <Target className="h-6 w-6" />,
    iconColor: "text-emerald-500",
    bgColor: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40",
    example:
      "Exemplo: Ao invés de investir todas as economias, um empreendedor aloca apenas R$500/mês que pode perder sem impacto.",
  },
  {
    id: "crazy-quilt",
    title: "Colcha de Retalhos",
    shortDesc: "Cresça com parcerias",
    microExplanation: "Traga pessoas para o projeto e construa em rede.",
    icon: <Users className="h-6 w-6" />,
    iconColor: "text-purple-500",
    bgColor: "from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40",
    example:
      "Exemplo: Um founder convida um amigo designer e um ex-colega programador, cada um contribuindo com o que sabe.",
  },
  {
    id: "lemonade",
    title: "Limonada",
    shortDesc: "Transforme surpresas em vantagem",
    microExplanation: "Transforme obstáculos e imprevistos em novas oportunidades.",
    icon: <Lightbulb className="h-6 w-6" />,
    iconColor: "text-amber-500",
    bgColor: "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40",
    example:
      "Exemplo: Uma confeiteira que enfrenta cancelamentos e aproveita os produtos prontos para vender combos promocionais.",
  },
  {
    id: "pilot-in-plane",
    title: "Piloto no Avião",
    shortDesc: "Você controla o futuro",
    microExplanation: "Construa o futuro a partir das ações de hoje, sem depender de previsões.",
    icon: <TrendingUp className="h-6 w-6" />,
    iconColor: "text-rose-500",
    bgColor: "from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40",
    example:
      "Exemplo: Em vez de criar um plano de 5 anos, defina micro-metas semanais e ajuste a direção com base no feedback real.",
  },
];

// ─── Comparison data ──────────────────────────────────────────────────────────
const chatgptItems = [
  "Respostas genéricas para qualquer assunto",
  "Sem foco em empreendedorismo",
  "Não oferece estrutura ou acompanhamento",
  "Não adaptado ao método Effectuation",
];

const effieItems = [
  "Respostas focadas em pequenos empreendedores",
  "Estrutura guiada pelo método Effectuation",
  "Dashboard para acompanhar sua evolução",
  "Perguntas direcionadas para cada etapa do negócio",
];

// ─── Product showcase steps (Reduced to 3) ──────────────────────────────────────────────────
const productSteps = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "Descubra seus recursos",
    desc: "O Effie mapeia suas habilidades, contatos e recursos disponíveis.",
    color: "from-blue-400 to-sky-500",
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Construa hipóteses",
    desc: "Gere ideias validáveis com base no que você já tem em mãos.",
    color: "from-purple-400 to-indigo-500",
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Evolua seu MVP",
    desc: "Acompanhe seus próximos passos gerados estruturadamente pela IA.",
    color: "from-orange-400 to-rose-500",
  },
];

const comparisonData = {
  traditional: {
    title: "Planejamento Causal",
    icon: <LineChart className="w-10 h-10 mx-auto text-muted-foreground" />,
    points: [
      "Foca em objetivos pré-definidos",
      "Tenta prever o futuro (incerto)",
      "Evita riscos e surpresas",
      "Baseado em planos rígidos de longo prazo",
    ],
  },
  effectuation: {
    title: "Método Effectuation",
    icon: <Rocket className="w-10 h-10 mx-auto text-primary" />,
    points: [
      "Foca nos meios já disponíveis",
      "Cria o futuro através da ação",
      "Alavanca surpresas como oportunidades",
      "Baseado em parcerias e perdas acessíveis",
    ],
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [sliderValue, setSliderValue] = useState(50);

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  // Chat Genérico perde destaque
  const chatOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);
  const chatScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Effie ganha destaque
  const effieOpacity = useTransform(scrollYProgress, [0, 0.5], [0.4, 1]);
  const effieScale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1.05]);


  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 page-gradient opacity-50 dark:opacity-20 pointer-events-none" />

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="fixed w-full top-0 z-50 backdrop-blur-xl border-b bg-white/70 border-border/50 dark:bg-[#0a0e1a]/80 dark:border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 btn-gradient rounded-lg flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-foreground dark:text-white">Effie</span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section — Adaptive light/dark */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-24 pb-20">
          {/* Background: light gradient / dark solid */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-sky-50 dark:from-[#0a0e1a] dark:via-[#0a0e1a] dark:to-[#0a0e1a]" />
          {/* Glow effects */}
          <div className="absolute top-[-20%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 dark:bg-blue-600/15 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] rounded-full bg-indigo-400/15 dark:bg-indigo-600/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] rounded-full bg-sky-400/10 dark:bg-blue-500/8 blur-[80px] pointer-events-none" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(100,100,180,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
            {/* Left: Copy */}
            <div className="text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>O seu co-fundador de IA</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight text-foreground dark:text-white"
              >
                Transforme Ideias em{" "}
                <TypeAnimation
                  sequence={[
                    "Negócios Reais",
                    2500,
                    "O Primeiro Passo",
                    2500,
                    "O Próximo Sucesso",
                    2500
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                  className="text-primary dark:text-blue-400 block"
                />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground dark:text-slate-400 mb-10 max-w-xl leading-relaxed"
              >
                Mais que um simples chat: uma plataforma estruturada baseada nos princípios reais de empreendedorismo.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button size="lg"
                  className="text-lg px-8 py-7 rounded-2xl btn-gradient font-bold"
                  onClick={() => navigate('/auth')}>
                  Começar Grátis <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline"
                  className="text-lg px-8 py-7 rounded-2xl glass-card border-border hover:bg-muted/50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                  onClick={() => scrollToSection('problema')}>
                  Entenda como
                </Button>
              </motion.div>
            </div>

            {/* Right: Chat Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="relative hidden lg:block"
            >
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-blue-400/10 dark:bg-blue-500/10 rounded-3xl blur-2xl pointer-events-none" />

              <div className="relative rounded-2xl border border-border/50 dark:border-white/10 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl shadow-2xl shadow-blue-200/40 dark:shadow-blue-900/20 overflow-hidden">
                {/* Title bar */}
                <div className="h-11 bg-slate-100 dark:bg-[#1a2235] border-b border-border/50 dark:border-white/5 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  <div className="ml-3 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md btn-gradient flex items-center justify-center">
                      <MessageSquare className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-foreground/80 dark:text-white/80 text-sm font-semibold">Effie</span>
                  </div>
                </div>

                {/* Chat body */}
                <div className="p-5 space-y-4 min-h-[340px] flex flex-col justify-end">
                  {/* User message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="self-end max-w-[80%]"
                  >
                    <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-lg shadow-blue-600/20">
                      <div className="flex items-center gap-2 mb-0">
                        <span>😊</span>
                        <span>Quero criar um app de organização para estudantes</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* AI response */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="self-start max-w-[90%]"
                  >
                    <div className="bg-slate-50 dark:bg-[#1a2235] border border-border/50 dark:border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-lg">
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 mt-0.5"><div className="w-5 h-5 rounded-md btn-gradient flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 text-white" />
                        </div></span>
                        <p className="text-muted-foreground dark:text-slate-300">
                          Entendi! Vou gerar um MVP inicial para um app de organização voltado para estudantes. Aqui estão as primeiras definições para o seu projeto:
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* MVP Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="self-start max-w-[90%]"
                  >
                    <div className="bg-blue-50 dark:bg-[#131c2e] border border-blue-200/50 dark:border-blue-500/20 rounded-xl p-4 shadow-lg">
                      {/* Header with loading dots */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-foreground dark:text-white font-semibold text-sm">Gerando MVP...</span>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '450ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '600ms' }} />
                        </div>
                      </div>
                      {/* MVP Items */}
                      <div className="space-y-2.5 text-sm">
                        {[
                          { label: "Público-alvo:", text: "Estudantes universitários que buscam melhor organização." },
                          { label: "Problema:", text: "Estudantes têm dificuldade em gerenciar tarefas e prazos." },
                          { label: "Solução:", text: "Um app que centraliza calendário, listas de tarefas e lembretes." },
                          { label: "Funcionalidades-chave:", text: "Criação e gerenciamento de tarefas, calendário integrado e lembretes inteli..." },
                        ].map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 2.0 + i * 0.2 }}
                            className="flex items-start gap-2"
                          >
                            <Check className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                            <p className="text-muted-foreground dark:text-slate-300">
                              <span className="text-foreground dark:text-white font-medium">{item.label}</span> {item.text}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Input bar */}
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a2235] border border-border/50 dark:border-white/10 rounded-xl px-4 py-3">
                    <span className="text-muted-foreground dark:text-slate-500 text-sm flex-1">Digite sua ideia...</span>
                    <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Storytelling Sections ──────────────────────────────────────────────── */}
        <section id="problema" className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
                  <span>O Problema</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                  Empreendedores com grandes ideias <span className="text-muted-foreground">merecem clareza para colocá-las em prática.</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl">
                  Muitas ideias promissoras ficam pelo caminho não por falta de potencial, mas porque os métodos tradicionais de planejamento pedem respostas que ainda estão em construção. Que tal um caminho mais leve e prático?
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass-card p-8 rounded-3xl border-destructive/20 relative"
              >
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-destructive/10 rounded-full blur-2xl" />
                <LineChart className="w-12 h-12 text-destructive mb-6" />
                <h3 className="text-xl font-bold mb-3">A barreira invisível</h3>
                <p className="text-muted-foreground">"Eu preciso de um plano de negócios perfeito, investimento inicial enorme e certezas incontestáveis antes de dar o primeiro passo."</p>
              </motion.div>
            </div>

            <div className="h-24 w-px bg-gradient-to-b from-border to-primary/50 mx-auto my-12" />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                className="order-2 md:order-1 glass-card p-8 rounded-3xl border-primary/30 relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                <Bot className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-3">Inteligência Estruturada</h3>
                <p className="text-muted-foreground">Nossa IA não apenas gera textos. Ela guia suas ações, extrai seus recursos atuais e acompanha sua execução diária.</p>
              </motion.div>

              <motion.div
                className="order-1 md:order-2 text-right"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex justify-end items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <span>A Solução</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                  Effie conversa com você <span className="text-primary">e cria seu MVP automaticamente.</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Sem planilhas complexas, sem jargões. Apenas um papo objetivo que transforma o que você já sabe e tem em mãos num negócio pronto para rodar.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Product Showcase ──────────── */}
        <section id="product-showcase" className="py-16 px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-5xl mx-auto"
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground mb-4">
              Como funciona
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-12 max-w-lg mx-auto">
              3 passos simples para lançar o seu produto usando o que já tem
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card border-border/50 rounded-3xl p-8 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20`}>
                    <div className="text-white">{step.icon}</div>
                  </div>
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">
                    Passo {i + 1}
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Section: 5 Principles ─────────────────── */}
        <section id="effectuation-method" className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-6xl mx-auto"
          >
            <p className="text-sm sm:text-base text-primary mb-3 max-w-lg mx-auto font-medium tracking-wide uppercase">
              A Fundação Científica
            </p>

            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
              Os 5 Princípios da Effectuation
            </h2>
            <p className="text-base text-muted-foreground mb-12 max-w-2xl mx-auto">
              O método estudado em empreendedores de sucesso para criar negócios no mundo real, mesmo com recursos limitados na fase inicial. Passe o mouse para ver os exemplos práticos.
            </p>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {principles.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="group [perspective:1000px]"
                >
                  <div className="relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-active:[transform:rotateY(180deg)]">
                    {/* Front */}
                    <div
                      className={`absolute inset-0 rounded-3xl border border-border/50 glass-card p-5 flex flex-col items-center justify-center text-center [backface-visibility:hidden] bg-gradient-to-br ${p.bgColor}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center mb-4 shadow-sm border border-black/5 dark:border-white/5 ${p.iconColor}`}>
                        {p.icon}
                      </div>
                      <h3 className="font-bold text-base text-foreground mb-2">{p.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        {p.microExplanation}
                      </p>
                    </div>
                    {/* Back */}
                    <div
                      className={`absolute inset-0 rounded-3xl border border-border/50 glass-card p-5 flex flex-col items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br ${p.bgColor}`}
                    >
                      <span className={`font-bold text-xs uppercase tracking-wider mb-4 ${p.iconColor}`}>
                        {p.title}
                      </span>
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        {p.example}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        

    <section id="comparison" ref={ref} className="py-32 px-4">
      <div className="text-center max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 px-2 leading-snug">
          <span className="text-muted-foreground">
            Chats Genéricos respondem perguntas.
          </span>
          <br />
          <span className="text-foreground">
            Effie constrói negócios com você.
          </span>
        </h2>

        <p className="text-base text-muted-foreground mb-16">
          Role para ver a diferença
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* Chat Genérico */}
          <motion.div
            style={{ opacity: chatOpacity, scale: chatScale }}
            className="glass-card rounded-3xl p-8 text-left border-border/50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">
                Chats Genéricos
              </span>
            </div>

            <ul className="space-y-4">
              {chatgptItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <X className="h-5 w-5 text-destructive shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Effie */}
          <motion.div
            style={{ opacity: effieOpacity, scale: effieScale }}
            className="glass-card rounded-3xl p-8 text-left ring-2 ring-primary/50 shadow-xl shadow-primary/10 relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl btn-gradient flex items-center justify-center shadow-md">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-bold text-lg text-foreground">
                    Effie
                  </span>
                </div>

                <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  Recomendado
                </span>
              </div>

              <ul className="space-y-4">
                {effieItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-foreground font-medium"
                  >
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  ;


        {/* ── Final CTA ────────────────────────────── */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl opacity-50 dark:opacity-20 pointer-events-none" />

          <div className="container mx-auto max-w-3xl text-center relative z-10 glass-card rounded-3xl p-12 border-primary/20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
              Sua ideia não precisa ser <span className="text-primary">perfeita</span>. Ela precisa ser <span className="text-primary">real</span>.
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Pare de planejar demais e venha descobrir como os empreendedores que dão certo realmente dão o primeiro passo. Comece grátis e estruture sua ideia hoje.
            </p>

            <div className="flex justify-center">
              <button
                className="w-full sm:w-auto h-auto text-base sm:text-lg px-4 sm:px-10 py-4 sm:py-8 rounded-2xl btn-gradient font-bold shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 whitespace-normal"
                onClick={() => navigate('/auth')}
              >
                Descubra os novos recursos
              </button>
            </div>
          </div>
        </section>


      </div>
    </div>
  );
}