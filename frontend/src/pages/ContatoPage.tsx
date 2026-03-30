import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Send, MapPin, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";

export default function ContatoPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) {
            toast({ title: "Preencha todos os campos", variant: "destructive" });
            return;
        }
        setSending(true);
        // Simulate send
        setTimeout(() => {
            toast({ title: "Mensagem enviada! 📩", description: "Responderemos em breve." });
            setName("");
            setEmail("");
            setMessage("");
            setSending(false);
        }, 1200);
    };

    return (
        <div className="min-h-screen page-gradient relative overflow-hidden flex flex-col">
            <div className="glow-orb w-80 h-80 bg-emerald-200/30 -top-24 -left-20" />
            <div className="glow-orb w-60 h-60 bg-blue-200/30 bottom-0 -right-16" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl flex-1">
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="glass-card border-0 hover:bg-white/80 h-9 w-9 rounded-xl">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground">Contato</h1>
                </motion.div>

                <div className="grid sm:grid-cols-2 gap-6">
                    {/* Info */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
                        <div className="w-14 h-14 rounded-2xl btn-gradient flex items-center justify-center shadow-lg mb-5">
                            <Bot className="h-7 w-7 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground mb-2">Fale com a gente</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            Tem dúvidas, sugestões ou quer saber mais sobre o Effie? Envie sua mensagem e responderemos o mais rápido possível.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 text-primary shrink-0" />
                                <span>contato@effie.app</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary shrink-0" />
                                <span>Brasil</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="contact-name" className="text-sm font-medium">Nome</Label>
                                <Input
                                    id="contact-name"
                                    placeholder="Seu nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="glass-input rounded-xl"
                                    disabled={sending}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="contact-email" className="text-sm font-medium">E-mail</Label>
                                <Input
                                    id="contact-email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="glass-input rounded-xl"
                                    disabled={sending}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="contact-message" className="text-sm font-medium">Mensagem</Label>
                                <Textarea
                                    id="contact-message"
                                    placeholder="Como podemos ajudar?"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="glass-input rounded-xl min-h-[100px] resize-none"
                                    disabled={sending}
                                />
                            </div>
                            <Button type="submit" disabled={sending} className="w-full btn-gradient rounded-xl font-semibold h-11">
                                <Send className="h-4 w-4 mr-2" />
                                {sending ? "Enviando..." : "Enviar Mensagem"}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
