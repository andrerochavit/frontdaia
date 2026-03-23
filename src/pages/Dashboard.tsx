import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Navigation, Target, Users, TrendingUp, MessageSquare, LogOut, Brain, Network, Sparkles, Rocket, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";

interface EffectuationProfileData {
  quem_sou: string;
  o_que_sei: string;
  o_que_quero: string;
  o_que_invisto: string;
  quem_conheco: string[];
}

const profileDescriptions: Record<string, { name: string; emoji: string; color: string; description: string }> = {
  D: {
    name: "Dominante",
    emoji: "🔥",
    color: "from-red-400 to-rose-500",
    description: "Orientado a resultados, direto e determinado.",
  },
  I: {
    name: "Influente",
    emoji: "✨",
    color: "from-amber-400 to-orange-500",
    description: "Comunicativo, entusiasta e ótimo em criar conexões.",
  },
  S: {
    name: "Estável",
    emoji: "🌿",
    color: "from-emerald-400 to-teal-500",
    description: "Paciente, confiável e metódico.",
  },
  C: {
    name: "Conforme",
    emoji: "🔬",
    color: "from-blue-400 to-indigo-500",
    description: "Analítico, preciso e orientado a qualidade.",
  },
};

const ROLE_COLORS: Record<string, string> = {
  mentor: "#4F7FFF",
  fornecedor: "#22C55E",
  tecnico: "#F59E0B",
  parceiro: "#EF4444",
  investidor: "#8B5CF6",
  cliente: "#14B8A6",
  outro: "#94A3B8",
};

const ROLE_LABELS: Record<string, string> = {
  mentor: "Mentor",
  fornecedor: "Suprimento",
  tecnico: "Técnico",
  parceiro: "Parceiro",
  investidor: "Investidor",
  cliente: "Cliente",
  outro: "Outro",
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<EffectuationProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [networkCount, setNetworkCount] = useState(0);
  const [networkRoles, setNetworkRoles] = useState<{ name: string, value: number, fill: string }[]>([]);
  const [discResult, setDiscResult] = useState<string | null>(null);

  // Get user display info
  const userMeta = user?.user_metadata;
  const displayName = userMeta?.display_name || userMeta?.full_name || user?.email?.split("@")[0] || "";
  const avatarEmoji = userMeta?.avatar_emoji || "😊";
  const avatarUrl = userMeta?.avatar_url;

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Fetch AI-inferred effectuation profile
        const { data: profile, error: profileError } = await supabase
          .from("effectuation_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        if (profile) {
          setProfileData({
            quem_sou: profile.quem_sou,
            o_que_sei: profile.o_que_sei,
            o_que_quero: profile.o_que_quero,
            o_que_invisto: profile.o_que_invisto,
            quem_conheco: profile.quem_conheco as string[],
          });
          setHasProfile(true);
        }

        // Fetch network contacts count and roles
        const { data: contactsData } = await supabase
          .from("network_contacts")
          .select("role")
          .eq("user_id", user.id);

        if (contactsData) {
          setNetworkCount(contactsData.length);
          const rolesCount: Record<string, number> = {};
          contactsData.forEach(c => {
            const r = c.role || "outro";
            rolesCount[r] = (rolesCount[r] || 0) + 1;
          });
          const mappedRoles = Object.entries(rolesCount)
            .sort((a, b) => b[1] - a[1]) // Sort by count descending
            .map(([role, count]) => {
              // Simplify label: take only first word or capitalize
              let label = ROLE_LABELS[role] || role;
              label = label.split(' ')[0]; // Take only first word for simplicity
              label = label.charAt(0).toUpperCase() + label.slice(1);

              const fill = ROLE_COLORS[role] || `hsl(${Math.abs(role.split("").reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) % 360}, 65%, 55%)`;
              return {
                name: label,
                value: count,
                fill: fill,
              };
            }).slice(0, 5); // Limit to top 5
          setNetworkRoles(mappedRoles);
        } else {
          setNetworkCount(0);
          setNetworkRoles([]);
        }

        // Load DISC result from localStorage
        const cached = localStorage.getItem(`disc_result_${user.id}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setDiscResult(parsed.dominant ?? null);
          } catch {
            // ignore
          }
        }
      } catch {
        toast({ title: "Erro inesperado", description: "Não foi possível carregar seu perfil.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, toast]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch {
      toast({ title: "Erro ao sair", description: "Tente novamente", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen page-gradient">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48 glass-card" />
            <Skeleton className="h-10 w-24 glass-card" />
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 glass-card rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const discProfile = discResult ? profileDescriptions[discResult] : null;

  const profileCards = profileData
    ? [
      {
        title: "Quem Eu Sou",
        content: profileData.quem_sou,
        icon: <Sparkles className="h-5 w-5 text-primary" />,
        color: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      },
      {
        title: "O Que Eu Sei",
        content: profileData.o_que_sei,
        icon: <Navigation className="h-5 w-5 text-primary" />,
        color: "from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30",
      },
      {
        title: "O Que Eu Quero",
        content: profileData.o_que_quero,
        icon: <Target className="h-5 w-5 text-primary" />,
        color: "from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30",
      },
      {
        title: "O Que Eu Invisto",
        content: profileData.o_que_invisto,
        icon: <TrendingUp className="h-5 w-5 text-primary" />,
        color: "from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30",
      },
    ]
    : [];

  return (
    <div className="min-h-screen page-gradient relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="glow-orb w-72 h-72 bg-blue-300 -top-52 -right-16" />
      <div className="glow-orb w-72 h-72 bg-indigo-300 bottom-0 -left-16" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-4">

            {/* Profile avatar */}
            <button
              onClick={() => navigate("/profile")}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors hover:scale-105 active:scale-95"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-2xl">{avatarEmoji}</span>
              )}
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Olá, <span className="text-primary">{displayName}</span>! 👋
              </h1>
              <p className="text-foreground mt-1 text-sm sm:text-base">
                Sua jornada empreendedora começa aqui.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="glass-card border-0 hover:bg-white/80 transition-all"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Sair
            </Button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          {/* Chat Action */}
          <button
            onClick={() => navigate("/chat")}
            className="group glass-card rounded-xl p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-0 flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-sm mb-2">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Chat Effie</h3>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">Mentoria personalizada</p>
          </button>

          {/* Network Action */}
          <button
            onClick={() => navigate("/network")}
            className="group glass-card rounded-xl p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-0 flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm mb-2">
              <Network className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Rede de Contatos</h3>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
              {networkCount > 0 ? `${networkCount} contatos` : "Construa sua rede"}
            </p>
          </button>

          {/* MVP Action */}
          <button
            onClick={() => navigate("/mvp")}
            className="group glass-card rounded-xl p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-0 flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-sm mb-2">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Meu MVP</h3>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">Visão do negócio</p>
          </button>

          {/* DISC Action */}
          {discProfile ? (
            <button
              onClick={() => navigate("/disc-profile")}
              className="group glass-card rounded-xl p-4 border-0 flex flex-col items-center justify-center text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${discProfile.color} flex items-center justify-center shadow-sm mb-2`}>
                <span className="text-lg">{discProfile.emoji}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">DISC: {discProfile.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">Ver meu perfil</p>
            </button>
          ) : (
            <button
              onClick={() => navigate("/disc")}
              className="group glass-card rounded-xl p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-0 flex flex-col items-center justify-center"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-sm mb-2">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Perfil DISC</h3>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">Descubra seu estilo</p>
            </button>
          )}
        </motion.div>

        {/* Effectuation Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl"></span> Seu Perfil Effectuation
            </h2>
            {hasProfile && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium glass-card px-3 py-1.5 rounded-full">
                <Sparkles className="h-3 w-3" /> Inferido por IA
              </span>
            )}
          </div>

          {!hasProfile ? (
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="md:col-span-2 glass-card rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Perfil em construção
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Converse com o Effie para que a IA construa automaticamente seu perfil empreendedor. Quanto mais você conversa, mais completo fica seu perfil!
                </p>
                <Button
                  onClick={() => navigate("/chat")}
                  className="btn-gradient rounded-xl font-semibold px-8"
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> Iniciar Conversa
                </Button>
              </motion.div>

              {/* Chart for empty Network */}
              <div className="md:col-span-1 glass-card rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-2">Sua Rede</h3>
                <p className="text-sm text-muted-foreground opacity-60 mb-4">Sua rede estratégica está vazia.</p>
                <Button onClick={() => navigate("/network")} variant="outline" size="sm" className="w-full">
                  Adicionar Contatos
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                {profileCards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className={`glass-card rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-br ${card.color} bg-opacity-40`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {card.icon}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground">{card.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {card.content || <span className="italic opacity-60">Ainda inferindo...</span>}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Chart for Network */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="md:col-span-1 glass-card rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 bg-opacity-40 flex flex-col items-center relative"
              >
                <div className="flex items-center justify-between mb-2 w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Sua Rede</h3>
                  </div>
                  <button
                    onClick={() => navigate("/network")}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                  >
                    Ver Tudo
                  </button>
                </div>

                <div className="flex-1 w-full flex flex-col items-center justify-center gap-4">
                  {networkRoles.length > 0 ? (
                    <>
                      <div className="relative w-full h-[180px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip
                              contentStyle={{
                                borderRadius: '12px',
                                fontSize: '11px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(4px)'
                              }}
                              itemStyle={{ color: '#1e293b' }}
                            />
                            <Pie
                              data={networkRoles}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                              isAnimationActive={true}
                              animationDuration={800}
                              stroke="none"
                            >
                              {networkRoles.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity outline-none" />
                              ))}
                            </Pie>
                            <text
                              x="50%"
                              y="50%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-foreground font-bold text-xl"
                            >
                              {networkCount}
                            </text>
                            <text
                              x="50%"
                              y="62%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-muted-foreground text-[10px] uppercase tracking-wider font-medium"
                            >
                              conexões
                            </text>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 w-full">
                        {networkRoles.slice(0, 4).map((role, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: role.fill }} />
                            <span className="text-[10px] text-muted-foreground font-medium">{role.name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center w-full py-4">
                      <p className="text-xs text-muted-foreground opacity-60 mb-3">
                        Nenhum contato estratégico.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => navigate("/network")} className="w-full text-xs h-8">
                        Adicionar
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}