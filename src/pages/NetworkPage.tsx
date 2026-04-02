import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Plus,
    Upload,
    X,
    Users,
    Briefcase,
    Star,
    FileText,
    Loader2,
    UserCircle,
    Trash2,
    Sparkles,
    FileUp,
    User,
    GraduationCap,
    Landmark,
    HardHat,
    Stethoscope,
    Palette,
    Microscope,
    Code2,
    Headphones,
    UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { processNetworkContact, processResumeProfile, uploadCsvFileToBucket } from "@/services/networkAnalysisService";
import type { Tables } from "@/integrations/supabase/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "@/components/ThemeToggle";
import NavMenuButton from "@/components/NavMenuButton";

type ResumeProfile = Tables<"resume_profiles">;

interface ContactData {
    id: string;
    name: string;
    role: string;
    file_url: string | null;
    file_name: string | null;
    file_json: Record<string, unknown> | null;
    extracted_skills: string[];
    extracted_experience: string;
    possible_value: string;
    created_at: string;
}

const roleOptions = [
    { value: "mentor", label: "Mentor" },
    { value: "fornecedor", label: "Fornecedor" },
    { value: "tecnico", label: "Técnico" },
    { value: "parceiro", label: "Parceiro" },
    { value: "investidor", label: "Investidor" },
    { value: "cliente", label: "Cliente Potencial" },
    { value: "outro", label: "Outro" },
];

const roleColors: Record<string, string> = {
    mentor: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    fornecedor: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
    tecnico: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    parceiro: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    investidor: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    cliente: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
    outro: "bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300",
};

const roleEmojis: Record<string, string> = {
    mentor: "🎓",
    fornecedor: "📦",
    tecnico: "🔧",
    parceiro: "🤝",
    investidor: "💰",
    cliente: "🎯",
    outro: "👤",
};

const roleAvatars: Record<string, string> = {
    mentor: "bg-blue-200 dark:bg-blue-800/80",
    fornecedor: "bg-orange-200 dark:bg-orange-800/80",
    tecnico: "bg-purple-200 dark:bg-purple-800/80",
    parceiro: "bg-emerald-200 dark:bg-emerald-800/80",
    investidor: "bg-amber-200 dark:bg-amber-800/80",
    cliente: "bg-cyan-200 dark:bg-cyan-800/80",
    outro: "bg-gray-200 dark:bg-gray-800/80",
};

const CONTACT_ICONS = [
    { id: "user", icon: User },
    { id: "user-round", icon: UserRound },
    { id: "grad", icon: GraduationCap },
    { id: "brief", icon: Briefcase },
    { id: "hardhat", icon: HardHat },
    { id: "steth", icon: Stethoscope },
    { id: "palette", icon: Palette },
    { id: "micro", icon: Microscope },
    { id: "code", icon: Code2 },
    { id: "phone", icon: Headphones },
];

const SUPPORTED_CONTEXT_EXTENSIONS = ["pdf", "docx", "json", "csv"];
const ICON_IDS = CONTACT_ICONS.map((item) => item.id);
const isSupportedContextFile = (ext?: string | null) => {
    if (!ext) return false;
    return SUPPORTED_CONTEXT_EXTENSIONS.includes(ext);
};

const sanitizeCsvCell = (value?: string) => {
    if (!value) return "";
    let output = value.replace(/\r/g, "").replace(/^\ufeff/, "").trim();
    if (output.startsWith('"') && output.endsWith('"')) {
        output = output.slice(1, -1);
    }
    return output.replace(/""/g, '"').trim();
};

const normalizeCsvHeader = (value: string) =>
    sanitizeCsvCell(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const parseCsvRow = (line: string, separator: string) => {
    const cleanLine = line.replace(/\r/g, "");
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < cleanLine.length; i++) {
        const char = cleanLine[i];
        if (char === '"') {
            if (insideQuotes && cleanLine[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === separator && !insideQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
};

const CSV_SEPARATORS: ReadonlyArray<string> = [",", ";"];

const detectCsvSeparator = (rows: string[]) => {
    let bestSeparator = ",";
    let bestScore = -Infinity;

    for (const sep of CSV_SEPARATORS) {
        let score = 0;
        for (const row of rows.slice(0, 20)) {
            if (!row.trim()) continue;
            const columns = parseCsvRow(row, sep);
            if (columns.length > 1) {
                score += columns.length;
            }
        }

        if (score > bestScore) {
            bestSeparator = sep;
            bestScore = score;
        }
    }

    return bestSeparator;
};

const matchesFirstNameHeader = (header: string) => (
    header.includes("first name") ||
    header.includes("firstname") ||
    header.includes("given name") ||
    header.includes("givennames") ||
    header.includes("primeiro nome") ||
    header.includes("nome proprio")
);

const matchesLastNameHeader = (header: string) => (
    header.includes("last name") ||
    header.includes("lastname") ||
    header.includes("surname") ||
    header.includes("family name") ||
    header.includes("sobrenome") ||
    header.includes("ultimo nome")
);

const matchesGeneralNameHeader = (header: string) => {
    if (matchesFirstNameHeader(header) || matchesLastNameHeader(header)) return false;
    return (
        header === "name" ||
        header === "nome" ||
        header === "contact name" ||
        header === "nome do contato" ||
        header.includes("full name") ||
        header.includes("nome completo")
    );
};

const matchesCompanyHeader = (header: string) => (
    header.includes("company") ||
    header.includes("empresa") ||
    header.includes("organization") ||
    header.includes("organisation") ||
    header.includes("companhia") ||
    header.includes("business") ||
    header.includes("org name")
);

const matchesRoleHeader = (header: string) => (
    header.includes("cargo") ||
    header.includes("role") ||
    header.includes("title") ||
    header.includes("position") ||
    header.includes("posicao") ||
    header.includes("ocupacao") ||
    header.includes("funcao") ||
    header.includes("job") ||
    header.includes("headline")
);

const findHeaderInfo = (rows: string[], separator: string) => {
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (!row.trim()) continue;
        const normalizedHeaders = parseCsvRow(row, separator).map(normalizeCsvHeader);
        const hasNameColumn =
            normalizedHeaders.some(matchesGeneralNameHeader) || normalizedHeaders.some(matchesFirstNameHeader);
        if (hasNameColumn) {
            return { index, normalizedHeaders };
        }
    }
    return null;
};

export default function NetworkPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contacts, setContacts] = useState<ContactData[]>([]);
    const [resumeProfiles, setResumeProfiles] = useState<ResumeProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [resumesLoading, setResumesLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [importLoading, setImportLoading] = useState(false);

    const csvInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formRole, setFormRole] = useState("");
    const [formFile, setFormFile] = useState<File | null>(null);

    useEffect(() => {
        fetchContacts();
        fetchResumeProfiles();
    }, [user]);

    async function fetchContacts() {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("network_contacts")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching contacts:", error);
            } else {
                setContacts((data as unknown as ContactData[]) || []);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchResumeProfiles() {
        if (!user) return;
        setResumesLoading(true);
        try {
            const { data, error } = await supabase
                .from("resume_profiles")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching resumes:", error);
            } else {
                setResumeProfiles((data as ResumeProfile[]) || []);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setResumesLoading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!isSupportedContextFile(ext)) {
            toast({
                title: "Formato não suportado",
                description: "Envie PDF, DOCX, CSV ou JSON",
                variant: "destructive",
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "Arquivo muito grande",
                description: "Tamanho máximo: 10MB",
                variant: "destructive",
            });
            return;
        }

        setFormFile(file);
    }

    const handleContextUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!isSupportedContextFile(ext)) {
            toast({ title: "Formato inválido", description: "Envie PDF, DOCX, CSV ou JSON", variant: "destructive" });
            return;
        }

        setImportLoading(true);
        toast({ title: "Processando currículo...", description: "Extraindo habilidades, experiências e rede." });
        try {
            const baseTitle = file.name.replace(/\.[^/.]+$/, "") || "Currículo";
            const result = await processResumeProfile(user.id, baseTitle, file);

            if (result.success) {
                toast({ title: "Currículo indexado! 🎉", description: "Agora o Effie conhece suas habilidades reais." });
                await fetchResumeProfiles();
            } else {
                toast({ title: "Erro ao processar currículo", description: result.error, variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Erro inesperado", variant: "destructive" });
        } finally {
            setImportLoading(false);
            if (pdfInputRef.current) pdfInputRef.current.value = "";
        }
    };

    const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setImportLoading(true);
        try {
            const uploadResult = await uploadCsvFileToBucket(user.id, file);
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || "Falha ao enviar o CSV para o Supabase");
            }

            const rawText = await file.text();
            const cleanedLines = rawText
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .split('\n')
                .map((line) => line.trim());

            const trimmedLines = cleanedLines.filter((line) => line);
            if (trimmedLines.length === 0) throw new Error("CSV vazio ou sem conteúdo válido");

            const separator = detectCsvSeparator(trimmedLines);
            const headerInfo = findHeaderInfo(trimmedLines, separator);

            if (!headerInfo) {
                throw new Error("Não foi possível identificar colunas de nome no CSV. Use o padrão do LinkedIn.");
            }

            const { index: headerIndex, normalizedHeaders } = headerInfo;

            const firstNameIdx = normalizedHeaders.findIndex(matchesFirstNameHeader);
            const lastNameIdx = normalizedHeaders.findIndex(matchesLastNameHeader);
            let nameIdx = normalizedHeaders.findIndex(matchesGeneralNameHeader);

            if (nameIdx === -1 && firstNameIdx === -1 && lastNameIdx === -1) {
                throw new Error("Colunas de nome não foram identificadas. Inclua 'First Name' / 'Last Name' ou 'Name'.");
            }

            if (nameIdx === -1) {
                // We'll synthesize a name from first/last later
                nameIdx = -1;
            }

            const companyIdx = normalizedHeaders.findIndex(matchesCompanyHeader);
            const roleIdx = normalizedHeaders.findIndex(matchesRoleHeader);

            const newContacts = [];

            for (let i = headerIndex + 1; i < trimmedLines.length; i++) {
                const rowText = trimmedLines[i];
                if (!rowText) continue;

                const cols = parseCsvRow(rowText, separator);
                const firstName = firstNameIdx !== -1 ? sanitizeCsvCell(cols[firstNameIdx]) : "";
                const lastName = lastNameIdx !== -1 ? sanitizeCsvCell(cols[lastNameIdx]) : "";
                const fullName = nameIdx !== -1 ? sanitizeCsvCell(cols[nameIdx]) : [firstName, lastName].filter(Boolean).join(" ").trim();
                const company = companyIdx !== -1 ? sanitizeCsvCell(cols[companyIdx]) : "";
                const jobRole = roleIdx !== -1 ? sanitizeCsvCell(cols[roleIdx]) : "";

                if (!fullName) continue;

                const extractedExpParts = [];
                if (jobRole) extractedExpParts.push(jobRole);
                if (company) extractedExpParts.push(company);

                newContacts.push({
                    user_id: user.id,
                    name: fullName,
                    role: jobRole || "outro",
                    extracted_experience: extractedExpParts.join(" na "),
                    possible_value: "",
                });
            }

            if (newContacts.length > 0) {
                const { error } = await supabase.from('network_contacts').insert(newContacts);
                if (error) throw error;

                toast({ title: `${newContacts.length} contatos importados! 🎉` });
                fetchContacts();
            } else {
                toast({ title: "Nenhum contato válido no CSV", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "Falha ao importar", description: err.message, variant: "destructive" });
        } finally {
            setImportLoading(false);
            if (csvInputRef.current) csvInputRef.current.value = "";
        }
    };

    async function handleSubmit() {
        if (!user || !formName.trim()) {
            toast({
                title: "Nome obrigatório",
                description: "Informe o nome do contato.",
                variant: "destructive",
            });
            return;
        }

        if (!formRole) {
            toast({
                title: "Tipo obrigatório",
                description: "Selecione o tipo de contato.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);

        try {
            const result = await processNetworkContact(
                user.id,
                formName.trim(),
                formRole,
                formFile
            );

            if (result.success) {
                toast({
                    title: "Contato adicionado!",
                    description: formFile
                        ? "Texto do documento armazenado no seu banco."
                        : "Contato salvo na sua rede.",
                });
                if (result.warning) {
                    toast({
                        title: "Migração pendente",
                        description: result.warning,
                        variant: "destructive",
                    });
                }
                resetForm();
                setShowModal(false);
                fetchContacts();
            } else {
                toast({
                    title: "Erro ao salvar",
                    description: result.error || "Tente novamente.",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Erro inesperado",
                description: "Algo deu errado. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(contactId: string) {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("network_contacts")
                .delete()
                .eq("id", contactId)
                .eq("user_id", user.id);

            if (error) {
                toast({
                    title: "Erro ao remover",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                setContacts((prev) => prev.filter((c) => c.id !== contactId));
                toast({ title: "Contato removido" });
            }
        } catch {
            toast({
                title: "Erro inesperado",
                variant: "destructive",
            });
        }
    }

    async function handleDeleteResume(profileId: string) {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("resume_profiles")
                .delete()
                .eq("id", profileId)
                .eq("user_id", user.id);

            if (error) {
                toast({
                    title: "Erro ao remover currículo",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                setResumeProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
                toast({ title: "Currículo removido" });
            }
        } catch (error) {
            console.error("Error deleting resume:", error);
            toast({
                title: "Erro inesperado ao remover currículo",
                variant: "destructive",
            });
        }
    }

    async function handleUpdateAvatar(contactId: string, iconId: string) {
        if (!user) return;
        try {
            const target = contacts.find((c) => c.id === contactId);
            const updatedFileJson = {
                ...(target?.file_json || {}),
                icon_id: iconId,
            };

            const { error } = await supabase
                .from("network_contacts")
                .update({ file_json: updatedFileJson })
                .eq("id", contactId);

            if (error) throw error;
            setContacts(prev =>
                prev.map(c =>
                    c.id === contactId ? { ...c, file_json: updatedFileJson } : c
                )
            );
        } catch (err) {
            console.error("Error updating avatar:", err);
        }
    }

    function resetForm() {
        setFormName("");
        setFormRole("");
        setFormFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const getRoleLabel = (value: string) => {
        const option = roleOptions.find((r) => r.value === value);
        if (option) return option.label;
        // If it's a dynamic role (from CSV), capitalize it
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const getContactIcon = (iconId: string) => {
        return CONTACT_ICONS.find(i => i.id === iconId)?.icon || User;
    };

    const resolveContactIconId = (contact: ContactData) => {
        const storedIcon = contact.file_json?.icon_id;
        if (storedIcon && ICON_IDS.includes(storedIcon)) return storedIcon;
        if (ICON_IDS.includes(contact.possible_value)) return contact.possible_value;
        return "user";
    };

    const hasTextualPossibleValue = (value?: string | null) => {
        if (!value) return false;
        return !ICON_IDS.includes(value);
    };

    return (
        <div className="min-h-screen page-gradient relative overflow-hidden">
            {/* Decorative orbs */}
            <div className="glow-orb w-96 h-96 bg-emerald-300 dark:bg-emerald-800 -top-32 -right-16" />
            <div className="glow-orb w-72 h-72 bg-teal-300 dark:bg-teal-800 bottom-0 -left-16" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <NavMenuButton />

                        <div className="w-full">
                            <div className="flex items-center justify-between">

                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shrink-0">
                                        <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                    </div>
                                    Perfil
                                </h1>

                                {/* Mobile only */}
                                <div className="sm:hidden">
                                    <ThemeToggle />
                                </div>

                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">   <span className="hidden sm:inline sm:ml-[52px]">Indexe currículos e contatos para o assistente</span>
                                <span className="sm:hidden text-white text-sm mt-0.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">Indexe planilhas e currículos</span>
                            </p>


                        </div>

                    </div>


                </motion.div>

                {/* Import Action Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col sm:flex-row gap-3 mb-8 w-full"
                >
                    <input type="file" accept=".csv" className="hidden" ref={csvInputRef} onChange={handleCsvImport} disabled={importLoading} />
                    <input type="file" accept=".pdf,.docx,.json,.csv" className="hidden" ref={pdfInputRef} onChange={handleContextUpload} disabled={importLoading} />

                    <Button
                        onClick={() => csvInputRef.current?.click()}
                        disabled={importLoading}
                        className="flex-1 glass-card border flex items-center justify-center gap-2 py-6 text-sm hover:bg-white/40 dark:hover:bg-white/5 transition-all text-foreground"
                        variant={"outline"}
                    >
                        {importLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5 text-emerald-500" />}
                        Importar CSV
                    </Button>

                    <Button
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={importLoading}
                        className="flex-1 glass-card border flex items-center justify-center gap-2 py-6 text-sm hover:bg-white/40 dark:hover:bg-white/5 transition-all text-foreground"
                        variant={"outline"}
                    >
                        {importLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-emerald-500" />}
                        Upload Currículo
                    </Button>

                    <Button
                        onClick={() => setShowModal(true)}
                        disabled={importLoading}
                        variant="ghost"
                        className="flex-1 glass-card border flex items-center justify-center gap-2 py-6 text-sm hover:bg-white/40 dark:hover:bg-white/5 transition-all text-foreground"
                    >
                        <Plus className="h-4 w-4" /> Adicionar Manual
                    </Button>
                </motion.div>

                <div className="space-y-10">
                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Currículos indexados</h2>
                                <p className="text-sm text-muted-foreground">
                                    Esses arquivos alimentam o Effie com suas habilidades reais.
                                </p>
                            </div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                {resumeProfiles.length} arquivo(s)
                            </span>
                        </div>

                        {resumesLoading ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                                        <div className="h-5 bg-primary/10 rounded w-2/3 mb-2" />
                                        <div className="h-4 bg-primary/5 rounded w-full mb-1" />
                                        <div className="h-4 bg-primary/5 rounded w-3/4" />
                                    </div>
                                ))}
                            </div>
                        ) : resumeProfiles.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card rounded-2xl p-8 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <FileText className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Nenhum currículo indexado
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                                    Suba um PDF, DOCX, CSV ou JSON para que o Effie entenda seu histórico profissional.
                                </p>
                                <Button
                                    onClick={() => pdfInputRef.current?.click()}
                                    disabled={importLoading}
                                    className="btn-gradient rounded-xl font-semibold px-6 py-3"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Enviar currículo
                                </Button>
                            </motion.div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {resumeProfiles.map((profile, index) => (
                                        <motion.div
                                            key={profile.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="glass-card rounded-2xl p-5 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-foreground text-sm leading-tight">
                                                        {profile.title}
                                                    </h3>
                                                    {profile.experience_summary && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                            {profile.experience_summary}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteResume(profile.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                                    title="Remover currículo"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {profile.extracted_skills?.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Star className="h-3 w-3 text-amber-500" />
                                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                            Skills principais
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {profile.extracted_skills.slice(0, 6).map((skill, i) => (
                                                            <span
                                                                key={`${profile.id}-skill-${i}`}
                                                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {profile.value_proposition && (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Sparkles className="h-3 w-3 text-primary" />
                                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                            Como você pode gerar valor
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        {profile.value_proposition}
                                                    </p>
                                                </div>
                                            )}

                                            {profile.stakeholders?.length ? (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <Users className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                            Contatos citados
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {profile.stakeholders.slice(0, 6).map((stakeholder, idx) => (
                                                            <span
                                                                key={`${profile.id}-stakeholder-${idx}`}
                                                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                                                            >
                                                                {stakeholder}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {profile.file_name && (
                                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
                                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground truncate">
                                                        {profile.file_name}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Contatos estratégicos</h2>
                                <p className="text-sm text-muted-foreground">
                                    Construídos a partir de CSVs ou adicionados manualmente.
                                </p>
                            </div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                {contacts.length} contato(s)
                            </span>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                        >
                            <div className="glass-card rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{contacts.length}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                            {["mentor", "parceiro", "tecnico"].map((role) => (
                                <div key={role} className="glass-card rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-foreground">
                                        {contacts.filter((c) => c.role === role).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{getRoleLabel(role)}s</div>
                                </div>
                            ))}
                        </motion.div>

                        {loading ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                                        <div className="h-6 bg-primary/10 rounded w-1/3 mb-3" />
                                        <div className="h-4 bg-primary/5 rounded w-2/3 mb-2" />
                                        <div className="h-4 bg-primary/5 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : contacts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card rounded-2xl p-12 text-center"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
                                    <Users className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    Nenhum contato cadastrado.
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                                    Importe um CSV ou use o formulário para cadastrar contatos estratégicos.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
                                    <Button
                                        onClick={() => csvInputRef.current?.click()}
                                        disabled={importLoading}
                                        className="btn-gradient rounded-xl font-semibold px-6 py-5 flex-1 h-auto flex-col gap-1 items-center justify-center"
                                    >
                                        <span className="flex items-center gap-2"><FileUp className="h-4 w-4 text-emerald-500" /> Importar CSV</span>
                                        <span className="text-[10px] font-normal opacity-80">Do LinkedIn ou planilhas</span>
                                    </Button>
                                    <Button
                                        onClick={() => setShowModal(true)}
                                        disabled={importLoading}
                                        className="btn-gradient rounded-xl font-semibold px-6 py-5 flex-1 h-auto flex-col gap-1 items-center justify-center"
                                    >
                                        <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Adicionar manual</span>
                                        <span className="text-[10px] font-normal opacity-80">Registre um contato único</span>
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {contacts.map((contact, index) => (
                                        <motion.div
                                            key={contact.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="glass-card rounded-2xl p-5 hover:shadow-md transition-all duration-200 group"
                                        >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                        <button
                                                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0 transition-transform active:scale-95 hover:scale-105 ${roleAvatars[contact.role] || roleAvatars.outro}`}
                                                          title="Mudar ícone"
                                                      >
                                                          {(() => {
                                                            const iconId = resolveContactIconId(contact);
                                                            const IconComp = getContactIcon(iconId);
                                                              return <IconComp className="h-5 w-5 opacity-80" />;
                                                          })()}
                                                      </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-48 p-2 glass-card border-white/20">
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {CONTACT_ICONS.map((item) => (
                                                              <button
                                                                  key={item.id}
                                                                  onClick={() => handleUpdateAvatar(contact.id, item.id)}
                                                                  className={`p-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center ${resolveContactIconId(contact) === item.id ? 'bg-primary/20' : ''}`}
                                                              >
                                                                  <item.icon className="h-4 w-4" />
                                                              </button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <div>
                                                <h3 className="font-semibold text-foreground text-sm leading-tight">
                                                    {contact.name}
                                                </h3>
                                                {contact.extracted_experience && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {contact.extracted_experience}
                                                    </p>
                                                )}
                                                <span
                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold mt-1.5 ${roleColors[contact.role] || roleColors.outro
                                                        }`}
                                                >
                                                    {getRoleLabel(contact.role)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(contact.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                            title="Remover contato"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Skills */}
                                    {contact.extracted_skills?.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Star className="h-3 w-3 text-amber-500" />
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                    Skills
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {contact.extracted_skills.slice(0, 5).map((skill: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                                {contact.extracted_skills.length > 5 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/5 text-muted-foreground">
                                                        +{contact.extracted_skills.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {hasTextualPossibleValue(contact.possible_value) && (
                                        <div className="mb-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Sparkles className="h-3 w-3 text-primary" />
                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                                    Como esse contato pode ajudar
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {contact.possible_value}
                                            </p>
                                        </div>
                                    )}

                                    {/* File badge */}
                                    {contact.file_name && (
                                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                {contact.file_name}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                </section>
            </div>

            {/* Add Contact Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => {
                                if (!submitting) {
                                    setShowModal(false);
                                    resetForm();
                                }
                            }}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => {
                                    if (!submitting) {
                                        setShowModal(false);
                                        resetForm();
                                    }
                                }}
                                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                                    <Plus className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        Novo Contato Estratégico
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Adicione à sua rede profissional
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <Label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                                        Nome
                                    </Label>
                                    <Input
                                        id="contact-name"
                                        placeholder="Nome do contato"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="glass-input rounded-xl mt-1.5"
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <Label className="text-sm font-medium text-foreground">
                                        Tipo de Contato
                                    </Label>
                                    <Select value={formRole} onValueChange={setFormRole} disabled={submitting}>
                                        <SelectTrigger className="glass-input rounded-xl mt-1.5">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <Label className="text-sm font-medium text-foreground">
                                        Currículo / Documento{" "}
                                        <span className="text-muted-foreground font-normal">(opcional)</span>
                                    </Label>
                                    <div className="mt-1.5">
                                        {formFile ? (
                                            <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-3">
                                                <FileText className="h-4 w-4 text-primary shrink-0" />
                                                <span className="text-sm text-foreground truncate flex-1">
                                                    {formFile.name}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setFormFile(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = "";
                                                    }}
                                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                    disabled={submitting}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full glass-card rounded-xl px-4 py-6 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors text-center cursor-pointer"
                                                disabled={submitting}
                                            >
                                                <Upload className="h-6 w-6 text-primary/40 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    Clique para enviar PDF ou DOCX
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                    O texto do documento será salvo automaticamente
                                                </p>
                                            </button>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.docx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    disabled={submitting}
                                    className="flex-1 glass-card border-0 hover:bg-white/70 dark:hover:bg-white/10 rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 btn-gradient rounded-xl font-semibold"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <Briefcase className="h-4 w-4 mr-2" />
                                            Adicionar
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
}
