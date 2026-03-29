// Network File Analysis Service — AI-powered CV/document analysis
// Extracts skills, experience, and potential value from uploaded documents

import { supabase } from "@/integrations/supabase/client";

const STORAGE_BUCKET = "csvandcv";

const MAX_EXTRACTED_TEXT_LENGTH = 20000;

export interface StoredResumeJson {
    user_id: string;
    original_file_name: string;
    processed_at: string;
    mime_type: string;
    size_bytes: number;
    plain_text: string;
}

function sanitizeFileName(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9-_.]/gi, "_")
        .replace(/_{2,}/g, "_")
        .replace(/^_+|_+$/g, "") || "arquivo";
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
    } else {
        // Fallback: try as plain text
        return await file.text();
    }
}

/**
 * Simple PDF text extraction using the file's text content.
 * For production, consider using pdf.js or a server-side solution.
 */
async function extractTextFromPDF(file: File): Promise<string> {
    try {
        // Read as ArrayBuffer and convert to text representation
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        // Simple PDF text extraction: find text between parentheses in PDF stream
        const text: string[] = [];
        let inText = false;
        let currentText = "";

        for (let i = 0; i < uint8Array.length; i++) {
            const char = String.fromCharCode(uint8Array[i]);

            if (char === "(" && !inText) {
                inText = true;
                currentText = "";
            } else if (char === ")" && inText) {
                inText = false;
                if (currentText.trim()) {
                    text.push(currentText);
                }
            } else if (inText) {
                currentText += char;
            }
        }

        const extractedText = text.join(" ");
        const sanitized = sanitizePlainText(extractedText);

        // If PDF text extraction failed, try reading as text
        if (sanitized.length < 20) {
            const textContent = await file.text();
            const cleaned = sanitizePlainText(textContent);
            return cleaned.length > 20 ? cleaned : `[Conteúdo do arquivo: ${file.name}]`;
        }

        return sanitized;
    } catch {
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

/**
 * Full flow: process file, generate JSON artifact, save contact, sync profile.
 */
interface ProcessResult {
    success: boolean;
    contactId?: string;
    error?: string;
    warning?: string;
}

export async function processNetworkContact(
    userId: string,
    name: string,
    role: string,
    file: File | null
): Promise<ProcessResult> {
    try {
        let fileName = "";
        let experience = "";
        let resumeJson: StoredResumeJson | null = null;

        // Build JSON when a file is provided
        if (file) {
            const documentText = await extractTextFromFile(file);
            const sanitizedText = sanitizePlainText(documentText);
            resumeJson = buildResumeJson(userId, file, sanitizedText);
            experience = sanitizedText.slice(0, 800);
            fileName = file.name;
        }

        // Save contact
        const contactPayload: Record<string, unknown> = {
            user_id: userId,
            name,
            role,
            file_url: null,
            file_name: fileName || null,
            extracted_skills: [],
            extracted_experience: experience,
            possible_value: "",
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
