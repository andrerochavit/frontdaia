import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";

export default function PrivacidadePage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen page-gradient relative overflow-hidden flex flex-col">
            <div className="glow-orb w-80 h-80 bg-indigo-200/30 -top-24 -right-20" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl flex-1">
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="glass-card border-0 hover:bg-white/80 h-9 w-9 rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground">Política de Privacidade</h1>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 sm:p-8 prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm text-muted-foreground mb-6">Última atualização: Março de 2026</p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">1. Dados Coletados</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Coletamos informações que você nos fornece diretamente: nome, e-mail, dados do perfil empreendedor, mensagens no chat, contatos da rede e resultados do teste DISC.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">2. Uso dos Dados</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Seus dados são utilizados para: personalizar a experiência com o Effie, gerar recomendações de negócio, construir seu perfil empreendedor e melhorar nossos serviços.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">3. Processamento por IA</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Suas conversas são processadas por modelos de inteligência artificial para gerar respostas personalizadas. Não compartilhamos o conteúdo das suas conversas com terceiros para fins de marketing.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">4. Armazenamento</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Seus dados são armazenados de forma segura utilizando Supabase com criptografia. Dados sensíveis são protegidos com as melhores práticas de segurança da indústria.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">5. Seus Direitos</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Você tem direito a: acessar seus dados, solicitar correção, solicitar exclusão da sua conta e dados, e exportar suas informações. Para exercer esses direitos, entre em contato conosco.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">6. Cookies</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Utilizamos cookies essenciais para autenticação e preferências de tema. Não utilizamos cookies de rastreamento de terceiros.
                    </p>

                    <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">7. Contato</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Para dúvidas sobre privacidade, entre em contato pelo nosso formulário de contato ou envie um e-mail para a equipe do Effie.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
