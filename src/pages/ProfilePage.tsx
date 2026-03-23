import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import NavMenuButton from "@/components/NavMenuButton";

const EMOJI_OPTIONS = ["😊", "🚀", "💡", "🎯", "🔥", "✨", "🌟", "💪", "🧠", "🎨", "🌱", "⚡", "🦁", "🐱", "🐶", "🦊"];

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [avatarEmoji, setAvatarEmoji] = useState("😊");
    const [interests, setInterests] = useState("");
    const [loading, setLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        if (!user) return;
        const meta = user.user_metadata;
        setDisplayName(meta?.display_name || meta?.full_name || "");
        setAvatarEmoji(meta?.avatar_emoji || "😊");
        setInterests((meta?.interests as string[])?.join(", ") || "");
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const interestsArray = interests
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

            const { error } = await supabase.auth.updateUser({
                data: {
                    display_name: displayName.trim(),
                    avatar_emoji: avatarEmoji,
                    interests: interestsArray,
                },
            });

            if (error) {
                toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas." });
            }
        } catch {
            toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen page-gradient relative overflow-hidden">
            <div className="glow-orb w-96 h-96 bg-blue-300 -top-32 -right-16" />
            <div className="glow-orb w-72 h-72 bg-indigo-300 bottom-0 -left-16" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
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
                            onClick={() => navigate(-1)}
                            className="glass-card border-0 hover:bg-white/80"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
                        </Button>
                    </div>
                    <ThemeToggle />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="glass-card rounded-2xl p-8">
                        {/* Avatar Section */}
                        <div className="text-center mb-8">
                            <div className="relative inline-block">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-primary/20 hover:border-primary/40 transition-colors mx-auto cursor-pointer"
                                >
                                    <span className="text-5xl">{avatarEmoji}</span>
                                </button>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                            </div>

                            {/* Emoji Picker */}
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 glass-card rounded-xl p-3 inline-block"
                                >
                                    <div className="grid grid-cols-8 gap-1">
                                        {EMOJI_OPTIONS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => {
                                                    setAvatarEmoji(emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-primary/10 transition-colors ${avatarEmoji === emoji ? "bg-primary/20 ring-2 ring-primary/40" : ""
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <h1 className="text-2xl font-bold text-foreground mt-4">Meu Perfil</h1>
                            <p className="text-sm text-muted-foreground">Personalize sua experiência</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="display-name" className="text-sm font-medium">
                                    Nome
                                </Label>
                                <Input
                                    id="display-name"
                                    type="text"
                                    placeholder="Como quer ser chamado?"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="glass-input h-11 rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email-display" className="text-sm font-medium">
                                    Email
                                </Label>
                                <Input
                                    id="email-display"
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="glass-input h-11 rounded-xl opacity-60"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl btn-gradient font-semibold mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Salvar Perfil
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
