// Network File Analysis Service — AI-powered CV/document analysis
// Extracts skills, experience, and potential value from uploaded documents

import { supabase } from "@/integrations/supabase/client";

const NETWORK_FILE_ANALYSIS_PROMPT = `Você é um analisador de currículos e documentos profissionais.

Analise o currículo ou documento profissional abaixo e extraia informações sobre a pessoa.

REGRAS:
- Extraia APENAS informações presentes no documento.
- NÃO invente informações.
- Para "possible_value_to_entrepreneur", pense em como essa pessoa poderia agregar valor a um empreendedor.
- Sempre responda em português brasileiro.

Categorias válidas para "role": "mentor", "fornecedor", "tecnico", "parceiro", "investidor", "cliente", "outro". (Escolha a que mais se aproxima, caso nenhuma se encaixe, use "outro").

Retorne APENAS um JSON válido (sem markdown, sem code blocks):
{
  "name": "nome da pessoa (se encontrado no documento)",
  "role": "classificação da pessoa (use uma das categorias válidas)",
  "skills": ["habilidade 1", "habilidade 2"],
  "experience": "resumo da experiência profissional",
  "possible_value_to_entrepreneur": "como essa pessoa pode agregar valor como contato estratégico"
}`;

export interface AnalyzedContact {
    name: string;
    role?: string;
    skills: string[];
    experience: string;
    possible_value_to_entrepreneur: string;
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

        const extractedText = text.join(" ").trim();

        // If PDF text extraction failed, try reading as text
        if (extractedText.length < 20) {
            const textContent = await file.text();
            // Clean up binary content
            const cleaned = textContent.replace(/[^\x20-\x7E\xC0-\xFF\u0100-\u017F\n\r\t]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            return cleaned.length > 20 ? cleaned : `[Conteúdo do arquivo: ${file.name}]`;
        }

        return extractedText;
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
        const cleaned = text
            .replace(/<[^>]+>/g, " ")
            .replace(/[^\x20-\x7E\xC0-\xFF\u0100-\u017F\n\r\t]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        return cleaned.length > 20 ? cleaned : `[Conteúdo do arquivo: ${file.name}]`;
    } catch {
        return `[Arquivo DOCX: ${file.name}]`;
    }
}

/**
 * Analyze document content using AI.
 */
export async function analyzeDocumentWithAI(
    documentText: string,
    apiKey: string,
    model: string = "gemini-2.0-flash"
): Promise<AnalyzedContact | null> {
    try {
        const contents = [
            {
                parts: [{ text: `${NETWORK_FILE_ANALYSIS_PROMPT}\n\n--- DOCUMENTO ---\n${documentText.slice(0, 4000)}` }],
                role: "user",
            },
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1000,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!response.ok) {
            console.warn("[NetworkAnalysis] API error:", response.statusText);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) return null;

        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleanedText) as AnalyzedContact;

        return {
            name: parsed.name || "",
            role: parsed.role || "",
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            experience: parsed.experience || "",
            possible_value_to_entrepreneur: parsed.possible_value_to_entrepreneur || "",
        };
    } catch (error) {
        console.error("[NetworkAnalysis] Error:", error);
        return null;
    }
}

/**
 * Upload file to Supabase storage (network_docs bucket).
 */
export async function uploadNetworkFile(
    userId: string,
    file: File
): Promise<{ url: string; fileName: string } | null> {
    try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}_${file.name}`;

        const { error } = await supabase.storage
            .from("network_docs")
            .upload(fileName, file);

        if (error) {
            console.error("[NetworkUpload] Upload error:", error);
            // Even if storage upload fails, we continue with the analysis
            return { url: "", fileName: file.name };
        }

        const { data: urlData } = supabase.storage
            .from("network_docs")
            .getPublicUrl(fileName);

        return { url: urlData.publicUrl, fileName: file.name };
    } catch {
        return { url: "", fileName: file.name };
    }
}

/**
 * Full flow: upload file, analyze with AI, save contact, sync profile.
 */
export async function processNetworkContact(
    userId: string,
    name: string,
    role: string,
    file: File | null,
    apiKey: string,
    model?: string
): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
        let fileUrl = "";
        let fileName = "";
        let skills: string[] = [];
        let experience = "";
        let possibleValue = "";

        // Upload file and analyze if provided
        if (file) {
            const uploadResult = await uploadNetworkFile(userId, file);
            if (uploadResult) {
                fileUrl = uploadResult.url;
                fileName = uploadResult.fileName;
            }

            // Extract text and analyze
            const documentText = await extractTextFromFile(file);
            const analysis = await analyzeDocumentWithAI(documentText, apiKey, model);

            if (analysis) {
                skills = analysis.skills;
                experience = analysis.experience;
                possibleValue = analysis.possible_value_to_entrepreneur;
                // Use extracted name if the user didn't provide one
                if (!name && analysis.name) {
                    name = analysis.name;
                }
                if (!role && analysis.role) {
                    role = analysis.role;
                }
            }
        }

        // Save contact
        const { data: contact, error } = await supabase
            .from("network_contacts")
            .insert({
                user_id: userId,
                name,
                role,
                file_url: fileUrl || null,
                file_name: fileName || null,
                extracted_skills: skills,
                extracted_experience: experience,
                possible_value: possibleValue,
            })
            .select()
            .single();

        if (error) {
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
