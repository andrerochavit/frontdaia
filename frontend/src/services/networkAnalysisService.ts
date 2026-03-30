// Network File Analysis Service — AI-powered CV/document analysis
// Extracts skills, experience, and potential value from uploaded documents

import { supabase } from "@/integrations/supabase/client";
import {
    analyzeNetworkContext,
    type NetworkAnalysisResult,
    type NetworkSourceType,
} from "@/services/effectuationApi";
import { getDocument, GlobalWorkerOptions, type TextContentItem } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker?url";

const STORAGE_BUCKET = "csvandcv";

const MAX_EXTRACTED_TEXT_LENGTH = 20000;
const MAX_ANALYSIS_CONTEXT_CHARS = 8000;

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const getItemText = (item: TextContentItem): string => {
    if ("str" in item && typeof (item as { str?: unknown }).str === "string") {
        return (item as { str: string }).str;
    }
    return "";
};

export interface StoredResumeJson {
    user_id: string;
    original_file_name: string;
    processed_at: string;
    mime_type: string;
    size_bytes: number;
    plain_text: string;
    source_type?: NetworkSourceType;
    file_url?: string | null;
    analysis?: NetworkAnalysisResult;
    icon_id?: string;
}

function sanitizeFileName(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9-_.]/gi, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "") || "arquivo";
}

function toTextFileLabel(originalName: string): string {
    const base = originalName.replace(/\.[^/.]+$/, "") || originalName || "documento";
    return `${base}.txt`;
}

function sanitizePlainText(text: string): string {
    if (!text) return "";
    const chars: string[] = [];

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);

        // High surrogate
        if (code >= 0xd800 && code <= 0xdbff) {
            const nextCode = text.charCodeAt(i + 1);
            if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
                chars.push(text.slice(i, i + 2));
                i++;
            } else {
                chars.push(" ");
            }
            continue;
        }

        // Low surrogate without preceding high surrogate
        if (code >= 0xdc00 && code <= 0xdfff) {
            chars.push(" ");
            continue;
        }

        const isControl =
            (code >= 0x0000 && code <= 0x0008) ||
            code === 0x000b ||
            code === 0x000c ||
            (code >= 0x000e && code <= 0x001f);

        if (isControl) {
            chars.push(" ");
        } else {
            chars.push(text[i]);
        }
    }

    return chars.join("").replace(/\s+/g, " ").trim();
}

/**
 * Extract text content from a File object (PDF or DOCX).
 * Uses a simple text extraction approach for browser-side processing.
 */
export async function extractTextFromFile(file: File): Promise<string> {
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "pdf") {
        return extractTextFromPDF(file);
    } else if (fileType === "docx") {
        return extractTextFromDOCX(file);
    } else if (fileType === "json") {
        const text = await file.text();
        try {
            const parsed = JSON.parse(text);
            return sanitizePlainText(JSON.stringify(parsed, null, 2));
        } catch {
            return sanitizePlainText(text);
        }
    } else if (fileType === "csv") {
        const text = await file.text();
        return sanitizePlainText(text);
    } else {
        // Fallback: try as plain text
        return await file.text();
    }
}

/**
 * PDF text extraction using pdf.js for higher fidelity.
 */
async function extractTextFromPDF(file: File): Promise<string> {
    try {
        const data = new Uint8Array(await file.arrayBuffer());
        const loadingTask = getDocument({ data });
        const pdf = await loadingTask.promise;

        const pageChunks: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const strings = content.items
                .map((item) => getItemText(item))
                .filter((chunk) => chunk && chunk.trim().length > 0);
            if (strings.length > 0) {
                pageChunks.push(strings.join(" "));
            }
        }

        const extractedText = pageChunks.join("\n\n");
        const sanitized = sanitizePlainText(extractedText);

        if (sanitized.length >= 20) {
            return sanitized;
        }

        // Fallback: attempt to read as UTF-8 text directly (useful for text-only PDFs)
        const fallbackContent = sanitizePlainText(await file.text());
        if (fallbackContent.length >= 20) {
            return fallbackContent;
        }

        return `[Conteúdo do arquivo: ${file.name}]`;
    } catch (error) {
        console.error("[PDFExtraction] Failed to read PDF", error);
        return `[Arquivo PDF: ${file.name}]`;
    }
}

/**
 * Simple DOCX text extraction.
 * DOCX files are ZIP archives containing XML.
 */
async function extractTextFromDOCX(file: File): Promise<string> {
    try {
        const text = await file.text();
        // Extract text from XML tags
        const cleaned = sanitizePlainText(
            text
                .replace(/<[^>]+>/g, " ")
        );
        return cleaned.length > 20 ? cleaned : `[Conteúdo do arquivo: ${file.name}]`;
    } catch {
        return `[Arquivo DOCX: ${file.name}]`;
    }
}

function buildResumeJson(userId: string, file: File, plainText: string): StoredResumeJson {
    const sanitized = sanitizePlainText(plainText);
    const trimmedText =
        sanitized.length > MAX_EXTRACTED_TEXT_LENGTH
            ? `${sanitized.slice(0, MAX_EXTRACTED_TEXT_LENGTH)}...`
            : sanitized;

    return {
        user_id: userId,
        original_file_name: file.name,
        processed_at: new Date().toISOString(),
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        plain_text: trimmedText,
    };
}

export async function uploadCsvFileToBucket(
    userId: string,
    file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const baseName = file.name.replace(/\.[^/.]+$/, "") || "contatos";
        const extension = file.name.split(".").pop() || "csv";
        const sanitizedBase = sanitizeFileName(baseName);
        const objectName = `${userId}/${Date.now()}_${sanitizedBase}.${extension}`;

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(objectName, file, { contentType: file.type || "text/csv" });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectName);
        return { success: true, url: urlData.publicUrl };
    } catch (error: any) {
        console.error("[NetworkUpload] CSV upload error:", error);
        return { success: false, error: error.message || "Falha ao enviar CSV para o bucket" };
    }
}

export async function uploadResumeFileToBucket(
    userId: string,
    originalFileName: string,
    plainTextContent: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const baseName = originalFileName.replace(/\.[^/.]+$/, "") || "curriculo";
        const sanitizedBase = sanitizeFileName(baseName);
        const objectName = `${userId}/resumes/${Date.now()}_${sanitizedBase}.txt`;

        const blob = new Blob([plainTextContent], {
            type: "text/plain; charset=utf-8",
        });

        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(objectName, blob, {
                contentType: "text/plain; charset=utf-8",
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectName);
        return { success: true, url: urlData.publicUrl };
    } catch (error: any) {
        console.error("[NetworkUpload] Resume upload error:", error);
        return { success: false, error: error.message || "Falha ao enviar o currículo para o bucket" };
    }
}

/**
 * Full flow: process file, generate JSON artifact, save contact, sync profile.
 */
interface ProcessResult {
    success: boolean;
    contactId?: string;
    error?: string;
    warning?: string;
}

interface ResumeProcessResult {
    success: boolean;
    profileId?: string;
    error?: string;
}

function trimPlainText(text: string): string {
    return text.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

export async function processNetworkContact(
    userId: string,
    name: string,
    role: string,
    file: File | null
): Promise<ProcessResult> {
    try {
        let fileName = "";
        let fileUrl: string | null = null;
        let experience = "";
        let resumeJson: StoredResumeJson | null = null;

        // Build JSON when a file is provided
        if (file) {
            const documentText = await extractTextFromFile(file);
            const sanitizedText = sanitizePlainText(documentText);
            resumeJson = buildResumeJson(userId, file, sanitizedText);
            experience = sanitizedText.slice(0, 800);
            fileName = toTextFileLabel(file.name);
            resumeJson.source_type = detectSourceType(file);

            const uploadResult = await uploadResumeFileToBucket(
                userId,
                file.name,
                resumeJson.plain_text || sanitizedText
            );
            if (!uploadResult.success) {
                return { success: false, error: uploadResult.error || "Falha ao subir o arquivo para o Supabase" };
            }
            fileUrl = uploadResult.url || null;
            resumeJson.file_url = fileUrl;

            const context = sanitizedText.slice(0, MAX_ANALYSIS_CONTEXT_CHARS);
            if (context.length >= 40) {
                try {
                    const analysis = await analyzeNetworkContext({
                        userId,
                        context,
                        sourceType: resumeJson.source_type ?? "text",
                        maxSkills: 12,
                    });
                    resumeJson.analysis = analysis;
                    if (analysis.experience_summary) {
                        experience = analysis.experience_summary;
                    }
                } catch (error: any) {
                    console.error("[NetworkAnalysis] LLM analysis failed:", error);
                }
            }
        }

        const resumeSkills = resumeJson?.analysis?.skills ?? [];
        const resumePossibleValue = resumeJson?.analysis?.possible_value ?? "";

        // Save contact
        const contactPayload: Record<string, unknown> = {
            user_id: userId,
            name,
            role,
            file_url: fileUrl,
            file_name: fileName || null,
            extracted_skills: resumeSkills,
            extracted_experience: experience,
            possible_value: resumePossibleValue,
            file_json: resumeJson,
        };

        let { data: contact, error } = await supabase
            .from("network_contacts")
            .insert(contactPayload)
            .select()
            .single();

        if (error) {
            const missingColumn =
                resumeJson &&
                typeof error.message === "string" &&
                error.message.toLowerCase().includes("file_json");

            if (missingColumn) {
                console.warn("[NetworkContacts] file_json column missing. Falling back without JSON payload.");
                const fallbackPayload = { ...contactPayload };
                delete fallbackPayload.file_json;

                const fallback = await supabase
                    .from("network_contacts")
                    .insert(fallbackPayload)
                    .select()
                    .single();

                if (fallback.error) {
                    return { success: false, error: fallback.error.message };
                }

                contact = fallback.data;

                await syncContactWithProfile(userId, role);

                return {
                    success: true,
                    contactId: contact.id,
                    warning: "Execute a migração do Supabase para criar a coluna file_json e salvar o texto completo dos currículos.",
                };
            }

            return { success: false, error: error.message };
        }

        // Sync with effectuation profile — add role to quem_conheco
        await syncContactWithProfile(userId, role);

        return { success: true, contactId: contact.id };
    } catch (error: any) {
        return { success: false, error: error.message || "Erro inesperado" };
    }
}

export async function processResumeProfile(
    userId: string,
    title: string,
    file: File
): Promise<ResumeProcessResult> {
    try {
        const sanitizedText = sanitizePlainText(await extractTextFromFile(file));
        const trimmedPlain = trimPlainText(sanitizedText);
        const context = sanitizedText.slice(0, MAX_ANALYSIS_CONTEXT_CHARS);
        if (context.length < 40) {
            return { success: false, error: "Conteúdo insuficiente para análise. O arquivo precisa conter mais informações." };
        }

        let analysis: NetworkAnalysisResult | null = null;
        try {
            analysis = await analyzeNetworkContext({
                userId,
                context,
                sourceType: detectSourceType(file),
                maxSkills: 12,
            });
        } catch (error: any) {
            console.error("[ResumeAnalysis] LLM analysis failed:", error);
        }

        const uploadResult = await uploadResumeFileToBucket(userId, file.name, trimmedPlain);
        if (!uploadResult.success) {
            return { success: false, error: uploadResult.error || "Falha ao subir o arquivo para o Supabase" };
        }

        const storedFileName = toTextFileLabel(file.name);

        const payload = {
            user_id: userId,
            title: title || file.name,
            file_url: uploadResult.url,
            file_name: storedFileName,
            source_type: detectSourceType(file),
            extracted_skills: analysis?.skills || [],
            experience_summary: analysis?.experience_summary || sanitizedText.slice(0, 800),
            value_proposition: analysis?.possible_value || "",
            stakeholders: analysis?.contacts || [],
            plain_text: trimmedPlain,
            analysis,
        };

        const { data, error } = await supabase
            .from("resume_profiles")
            .insert(payload)
            .select("id")
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, profileId: data?.id };
    } catch (error: any) {
        return { success: false, error: error.message || "Erro inesperado ao processar currículo" };
    }
}

/**
 * Sync a new contact's role with the effectuation profile's quem_conheco field.
 */
async function syncContactWithProfile(userId: string, role: string): Promise<void> {
    try {
        if (!role) return;

        const { data: profile } = await supabase
            .from("effectuation_profiles")
            .select("quem_conheco")
            .eq("user_id", userId)
            .maybeSingle();

        const currentKnown = (profile?.quem_conheco as string[]) || [];

        if (!currentKnown.includes(role)) {
            const updated = [...currentKnown, role];

            await supabase.from("effectuation_profiles").upsert(
                {
                    user_id: userId,
                    quem_conheco: updated,
                },
                { onConflict: "user_id" }
            );
        }
    } catch (error) {
        console.error("[NetworkSync] Sync error:", error);
    }
}

function detectSourceType(file: File | null): NetworkSourceType {
    const ext = file?.name.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "pdf":
            return "pdf";
        case "docx":
            return "docx";
        case "csv":
            return "csv";
        case "json":
            return "json";
        default:
            return "text";
    }
}
