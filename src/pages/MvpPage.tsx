import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { generateMvp } from "@/services/effectuationApi";
import jsPDF from "jspdf";
import {
    Rocket,
    Users,
    Lightbulb,
    DollarSign,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Download,
    RefreshCw,
    Star,
    Handshake,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import NavMenuButton from "@/components/NavMenuButton";

interface MvpData {
    pitch: string;
    problem: string;
    mvp: string;
    target_audience: string;
    differential: string;
    limit: string;
    network: string[];
    key_features: string[];
    next_steps: string[];
    // legacy fields for backward compat
    solution?: string;
    value_proposition?: string;
    revenue_model?: string;
    generated_at?: string;
    conversations_count?: number;
}

export default function MvpPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [mvpData, setMvpData] = useState<MvpData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const mvpRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMvpData();
    }, [user]);

    const fetchMvpData = async () => {
        if (!user) return;
        try {
            const stored = localStorage.getItem(`mvp_data_${user.id}`);
            if (stored) {
                const parsed = JSON.parse(stored) as MvpData;
                // Normalize legacy data
                setMvpData(normalizeMvpData(parsed));
                setLoading(false);
                return;
            }
            await generateMvpFromChat();
        } catch {
            setLoading(false);
        }
    };

    const normalizeMvpData = (raw: MvpData): MvpData => ({
        pitch: raw.pitch || raw.value_proposition || "",
        problem: raw.problem || "",
        mvp: raw.mvp || raw.solution || "",
        target_audience: raw.target_audience || "",
        differential: raw.differential || "",
        limit: raw.limit || raw.revenue_model || "",
        network: Array.isArray(raw.network)
            ? raw.network
            : typeof (raw as unknown as Record<string, unknown>).network === "string"
                ? [(raw as unknown as Record<string, string>).network]
                : [],
        key_features: raw.key_features || [],
        next_steps: raw.next_steps || [],
        generated_at: raw.generated_at,
        conversations_count: raw.conversations_count,
    });

    const generateMvpFromChat = async () => {
        if (!user) return;
        setGenerating(true);

        try {
            const data = await generateMvp(user.id);
            const raw = data as unknown as MvpData;
            const parsed = normalizeMvpData(raw);

            if (!parsed.problem && !parsed.mvp && !parsed.target_audience) {
                toast({
                    title: "Dados insuficientes",
                    description: "Converse mais com o Effie para gerar seu MVP.",
                    variant: "destructive",
                });
                return;
            }

            setMvpData(parsed);
            localStorage.setItem(`mvp_data_${user.id}`, JSON.stringify(parsed));
            toast({ title: "MVP atualizado!", description: "Sua visão de MVP foi reconstruída com sucesso." });
        } catch (error) {
            console.error("MVP generation error:", error);
            toast({
                title: "Erro ao gerar MVP",
                description: "Certifique-se de que conversou o suficiente com o Effie.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    const hasContent = (val: string | string[] | undefined) => {
        if (Array.isArray(val)) return val.filter(Boolean).length > 0;
        return !!val && val.trim().length > 0;
    };

    const handleDownloadPDF = () => {
        if (!mvpData) return;
        setDownloading(true);

        try {
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            const PAGE_W = 210;
            const PAGE_H = 297;
            const MARGIN = 20;
            const CONTENT_W = PAGE_W - MARGIN * 2;
            const FOOTER_H = 18;
            const BODY_BOTTOM = PAGE_H - FOOTER_H - 6;

            let y = MARGIN;

            // ── helpers ──────────────────────────────────────────────────
            const checkPage = (needed = 10) => {
                if (y + needed > BODY_BOTTOM) {
                    drawFooter();
                    pdf.addPage();
                    y = MARGIN;
                }
            };

            const wrap = (text: string, maxW: number, fontSize: number): string[] => {
                pdf.setFontSize(fontSize);
                return pdf.splitTextToSize(text || "", maxW);
            };

            const drawFooter = () => {
                const pageNum = pdf.getNumberOfPages();
                pdf.setDrawColor(200, 200, 200);
                pdf.setLineWidth(0.3);
                pdf.line(MARGIN, PAGE_H - FOOTER_H, PAGE_W - MARGIN, PAGE_H - FOOTER_H);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(130, 130, 130);
                pdf.text("Gerado por: Effie · Assistente de Empreendedorismo via Effectuation", MARGIN, PAGE_H - FOOTER_H + 5);
                if (user?.email) {
                    pdf.text(`Contato: ${user.email}`, MARGIN, PAGE_H - FOOTER_H + 10);
                }
                pdf.text(`Página ${pageNum}`, PAGE_W - MARGIN, PAGE_H - FOOTER_H + 5, { align: "right" });
            };

            const sectionTitle = (label: string) => {
                checkPage(14);
                // accent line
                pdf.setFillColor(30, 30, 30);
                pdf.rect(MARGIN, y, CONTENT_W, 0.5, "F");
                y += 4;
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(11);
                pdf.setTextColor(20, 20, 20);
                pdf.text(label.toUpperCase(), MARGIN, y);
                y += 6;
            };

            const subLabel = (label: string) => {
                checkPage(7);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(9);
                pdf.setTextColor(60, 60, 60);
                pdf.text(label, MARGIN, y);
                y += 4.5;
            };

            const bodyText = (text: string, indent = 0) => {
                if (!text?.trim()) return;
                const lines = wrap(text, CONTENT_W - indent, 9.5);
                lines.forEach((line) => {
                    checkPage(6);
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(9.5);
                    pdf.setTextColor(50, 50, 50);
                    pdf.text(line, MARGIN + indent, y);
                    y += 5;
                });
            };

            const bulletList = (items: string[], indent = 4) => {
                items.filter(Boolean).forEach((item) => {
                    checkPage(6);
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(9.5);
                    pdf.setTextColor(50, 50, 50);
                    const lines = wrap(`• ${item}`, CONTENT_W - indent, 9.5);
                    lines.forEach((line, i) => {
                        pdf.text(line, MARGIN + (i === 0 ? indent : indent + 3), y);
                        y += 5;
                    });
                });
            };

            const gap = (mm = 5) => { y += mm; };

            // ── HEADER ───────────────────────────────────────────────────
            // Title bar background
            pdf.setFillColor(20, 20, 20);
            pdf.rect(0, 0, PAGE_W, 28, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(18);
            pdf.setTextColor(255, 255, 255);
            const titleText = mvpData.pitch
                ? mvpData.pitch.split(/[.,!?]/)[0].trim()
                : "Meu MVP";
            pdf.text(titleText || "Meu MVP", MARGIN, 13);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(200, 200, 200);
            const dateStr = new Date().toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric",
            });
            pdf.text(`Data: ${dateStr}`, MARGIN, 20);

            y = 36;

            // ── PITCH ────────────────────────────────────────────────────
            if (mvpData.pitch) {
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(10.5);
                pdf.setTextColor(40, 40, 40);
                const pitchLines = wrap(mvpData.pitch, CONTENT_W, 10.5);
                pitchLines.forEach((line) => {
                    pdf.text(line, MARGIN, y);
                    y += 5.5;
                });
                gap(4);
            }

            // ── PROBLEMA ─────────────────────────────────────────────────
            sectionTitle("Problema");
            bodyText(mvpData.problem);
            if (mvpData.target_audience) {
                gap(2);
                subLabel("Quem sofre com isso:");
                bodyText(mvpData.target_audience);
            }
            gap(6);

            // ── PÚBLICO-ALVO ─────────────────────────────────────────────
            sectionTitle("Público-Alvo");
            bodyText(mvpData.target_audience);
            gap(6);

            // ── MVP ──────────────────────────────────────────────────────
            sectionTitle("MVP (Produto Mínimo Viável)");
            bodyText(mvpData.mvp);
            if (mvpData.key_features?.filter(Boolean).length > 0) {
                gap(2);
                subLabel("Funcionalidades principais:");
                bulletList(mvpData.key_features);
            }
            gap(6);

            // ── DIFERENCIAL ──────────────────────────────────────────────
            sectionTitle("Diferencial");
            subLabel("Por que você?");
            if (mvpData.differential) {
                // Try to render as bullet list if it has line breaks or commas
                const parts = mvpData.differential.split(/\n|;/).map(s => s.trim()).filter(Boolean);
                if (parts.length > 1) {
                    bulletList(parts);
                } else {
                    bodyText(mvpData.differential);
                }
            }
            gap(6);

            // ── MEU LIMITE ───────────────────────────────────────────────
            sectionTitle("Meu Limite");
            bodyText(mvpData.limit);
            gap(6);

            // ── REDE INICIAL ─────────────────────────────────────────────
            if (mvpData.network?.filter(Boolean).length > 0) {
                sectionTitle("Rede Inicial");
                bulletList(mvpData.network);
                gap(6);
            }

            // ── PRÓXIMOS PASSOS ──────────────────────────────────────────
            if (mvpData.next_steps?.filter(Boolean).length > 0) {
                sectionTitle("Próximos Passos");
                mvpData.next_steps.filter(Boolean).forEach((step, i) => {
                    checkPage(6);
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(9.5);
                    pdf.setTextColor(50, 50, 50);
                    const lines = wrap(`${i + 1}. ${step}`, CONTENT_W - 4, 9.5);
                    lines.forEach((line, li) => {
                        pdf.text(line, MARGIN + (li > 0 ? 7 : 4), y);
                        y += 5;
                    });
                });
                gap(6);
            }

            // ── FOOTER on last page ──────────────────────────────────────
            drawFooter();

            pdf.save("Meu_MVP_Effectuation.pdf");
            toast({ title: "PDF baixado!", description: "Documento profissional salvo com sucesso." });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({
                title: "Erro ao exportar",
                description: "Ocorreu um problema ao gerar o PDF.",
                variant: "destructive",
            });
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen page-gradient">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <Skeleton className="h-10 w-48 glass-card mb-2" />
                    <Skeleton className="h-5 w-96 glass-card mb-8" />
                    <div className="grid md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-36 glass-card rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    /* ── Grid pairs matching the design ── */
    const pairs: Array<{
        title: string;
        content?: string;
        listContent?: string[];
        icon: React.ReactNode;
        accentClass: string;
        iconBgClass: string;
    }> = mvpData
            ? [
                // Row 1
                {
                    title: "Problema",
                    content: mvpData.problem,
                    icon: <AlertCircle className="h-5 w-5" />,
                    accentClass:
                        "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/50 dark:to-red-700/30 border border-red-200 dark:border-red-500/20",
                    iconBgClass: "bg-white dark:bg-red-500/20 text-red-600 dark:text-red-400",
                },
                {
                    title: "MVP",
                    content: mvpData.mvp,
                    icon: <Lightbulb className="h-5 w-5" />,
                    accentClass:
                        "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-green-900/50 dark:to-emerald-700/30 border border-emerald-200 dark:border-green-500/20",
                    iconBgClass: "bg-white dark:bg-green-500/20 text-emerald-600 dark:text-green-400",
                },
                // Row 2
                {
                    title: "Público-Alvo",
                    content: mvpData.target_audience,
                    icon: <Users className="h-5 w-5" />,
                    accentClass:
                        "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-700/30 border border-blue-200 dark:border-blue-500/20",
                    iconBgClass: "bg-white dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
                },
                {
                    title: "Meu diferencial",
                    content: mvpData.differential,
                    icon: <Star className="h-5 w-5" />,
                    accentClass:
                        "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/50 dark:to-violet-700/30 border border-purple-200 dark:border-purple-500/20",
                    iconBgClass: "bg-white dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
                },
                // Row 3
                {
                    title: "Meu limite",
                    content: mvpData.limit,
                    icon: <DollarSign className="h-5 w-5" />,
                    accentClass:
                        "bg-gradient-to-br from-slate-100 to-slate-200/50 dark:from-slate-800/70 dark:to-slate-700/40 border border-slate-300 dark:border-slate-500/20",
                    iconBgClass: "bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                },
                {
                    title: "Quem já está comigo",
                    listContent: mvpData.network,
                    icon: <Handshake className="h-5 w-5" />,
                    accentClass:
                        "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/50 dark:to-purple-700/30 border border-indigo-200 dark:border-indigo-500/20",
                    iconBgClass: "bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
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
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
                >
                    <div className="flex items-center gap-3">
                        <NavMenuButton />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                                Ideia
                            </h1>
                            {mvpData?.pitch && (
                                <p className="text-foreground/80 text-sm mt-0.5 max-w-xl leading-snug">
                                    {mvpData.pitch}
                                </p>
                            )}
                            {(mvpData?.generated_at || mvpData?.conversations_count) && (
                                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-2">
                                    {mvpData.conversations_count !== undefined && (
                                        <span>Gerado a partir de {mvpData.conversations_count} conversa{mvpData.conversations_count !== 1 ? "s" : ""}</span>
                                    )}
                                    {mvpData.generated_at && (
                                        <>
                                            <span>|</span>
                                            <span>
                                                Última atualização{" "}
                                                {new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
                                                    Math.round(
                                                        (new Date(mvpData.generated_at).getTime() - Date.now()) / 60000
                                                    ),
                                                    "minutes"
                                                )}
                                            </span>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            onClick={generateMvpFromChat}
                            disabled={generating || downloading}
                            className="btn-gradient rounded-xl font-semibold px-4"
                        >
                            <RefreshCw className={`h-4 w-4 mr-1.5 ${generating ? "animate-spin" : ""}`} />
                            {generating ? "Gerando..." : "Atualizar"}
                        </Button>
                        {mvpData && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadPDF}
                                disabled={downloading || generating}
                                className="btn-gradient rounded-xl font-semibold px-4"
                            >
                                <Download className="h-4 w-4 mr-1.5" />
                                {downloading ? "Gerando PDF..." : "Baixar PDF"}
                            </Button>
                        )}
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
                            Converse mais com o Effie sobre sua ideia de negócio. A IA vai extrair automaticamente os
                            elementos do seu MVP a partir da conversa.
                        </p>
                        <Button
                            onClick={() => navigate("/chat")}
                            className="btn-gradient rounded-xl font-semibold px-8"
                        >
                            Ir para o Chat
                        </Button>
                    </motion.div>
                ) : (
                    <div className="space-y-4" ref={mvpRef}>
                        {/* 3×2 grid of pairs */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {pairs.map((card, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                    className={`rounded-2xl p-5 ${card.accentClass}`}
                                >
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBgClass}`}
                                        >
                                            {card.icon}
                                        </div>
                                        <h3 className="font-semibold text-sm text-foreground">{card.title}</h3>
                                    </div>

                                    {/* Text content */}
                                    {card.content !== undefined && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {hasContent(card.content) ? (
                                                card.content
                                            ) : (
                                                <span className="italic opacity-60">
                                                    Converse no chat para descobrir...
                                                </span>
                                            )}
                                        </p>
                                    )}

                                    {/* List content (network) */}
                                    {card.listContent !== undefined && (
                                        hasContent(card.listContent) ? (
                                            <ul className="space-y-1.5">
                                                {card.listContent.filter(Boolean).map((item, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-sm text-muted-foreground flex items-center gap-2"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shrink-0" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic opacity-60">
                                                Converse no chat para descobrir...
                                            </p>
                                        )
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Funcionalidades-Chave — full width */}
                        {hasContent(mvpData.key_features) && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/40 dark:to-purple-800/30 border border-violet-200 dark:border-violet-500/20"
                            >
                                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Funcionalidades-Chave
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {mvpData.key_features.filter(Boolean).map((f, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20"
                                        >
                                            <CheckCircle className="h-3 w-3" /> {f}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Próximos Passos */}
                        {hasContent(mvpData.next_steps) && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.46 }}
                                className="rounded-2xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-800/30 border border-emerald-200 dark:border-emerald-500/20"
                            >
                                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                                    <Rocket className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Próximos Passos
                                </h3>
                                <div className="space-y-2">
                                    {mvpData.next_steps.filter(Boolean).map((step, i) => (
                                        <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                            <span className="w-6 h-6 rounded-full bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-emerald-200 dark:border-transparent">
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
