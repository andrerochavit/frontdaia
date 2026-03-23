import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";

export default function TermosPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen page-gradient relative overflow-hidden flex flex-col">
            <div className="glow-orb w-80 h-80 bg-blue-200/30 -top-24 -left-20" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl flex-1">
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="glass-card border-0 hover:bg-white/80 h-9 w-9 rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground">Termos de Uso</h1>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 sm:p-8 prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm text-muted-foreground mb-6">Última atualização: Março de 2026</p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">1. Aceitação dos Termos</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Ao acessar e utilizar o Effie, você concorda com estes Termos de Uso. Caso não concorde com qualquer parte, não utilize nossos serviços.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">2. Descrição do Serviço</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        O Effie é um assistente de empreendedorismo baseado em inteligência artificial que utiliza o método Effectuation para guiar empreendedores na criação e desenvolvimento de seus negócios. O serviço inclui chat com IA, análise de perfil empreendedor, gestão de rede de contatos e geração de MVP.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">3. Uso Adequado</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Você se compromete a usar o Effie de forma ética e legal. As respostas geradas pela IA são sugestões e não substituem consultoria profissional especializada em negócios, finanças ou jurídica.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">4. Conta do Usuário</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Você é responsável por manter a confidencialidade da sua conta e senha. Notifique-nos imediatamente caso suspeite de uso não autorizado.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">5. Propriedade Intelectual</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Todo o conteúdo, design e tecnologia do Effie são protegidos por direitos autorais. Você mantém a propriedade das informações que compartilha na plataforma.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">6. Limitação de Responsabilidade</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        O Effie é fornecido "como está". Não garantimos resultados específicos de negócio. As orientações da IA devem ser validadas com profissionais qualificados antes de tomar decisões importantes.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">7. Modificações</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma.
                    </p>
                </motion.div>
            </div>


        </div>
    );
}
