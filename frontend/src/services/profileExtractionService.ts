// Profile Extraction Service — AI-inferred Effectuation Profile
// After each chat response, this service extracts profile data from the conversation

import { supabase } from "@/integrations/supabase/client";

const PROFILE_EXTRACTION_PROMPT = `Analise a conversa e extraia o perfil Effectuation do empreendedor.
Retorne SOMENTE JSON válido (sem markdown):
{"quem_sou":"identidade/background","o_que_sei":"habilidades","o_que_quero":"objetivos","o_que_invisto":"recursos/tempo","quem_conheco":["contato1"]}
Regras: só extraia o que foi explicitamente dito; campos sem info ficam vazios; responda em português.`;

export interface ExtractedProfile {
    quem_sou: string;
    o_que_sei: string;
    o_que_quero: string;
    o_que_invisto: string;
    quem_conheco: string[];
}

export async function extractProfileFromConversation(
    conversationHistory: Array<{ role: string; content: string }>,
    apiKey: string = import.meta.env.VITE_GEMINI_API_KEY,
    model: string = "gemini-2.0-flash"
): Promise<ExtractedProfile | null> {
    try {
        // Build conversation text — limit to last 8 messages to save tokens
        const fullConversationText = conversationHistory
            .slice(-8)
            .map((msg) => `${msg.role === "assistant" ? "IA" : "User"}: ${msg.content.slice(0, 400)}`)
            .join("\n");

        if (fullConversationText.trim().length < 50) {
            return null; // Not enough conversation to extract from
        }

        const contents = [
            {
                parts: [{ text: `${PROFILE_EXTRACTION_PROMPT}\n\n--- CONVERSA ---\n${fullConversationText}` }],
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
                        temperature: 0.1,
                        maxOutputTokens: 400,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        // Handle Rate Limit (429)
        if (response.status === 429) {
            const retryAfter = Number(response.headers.get('Retry-After')) || 15;
            console.warn(`[ProfileExtraction] Gemini rate-limit, suggested retry in ${retryAfter}s`);
            return null;
        }

        if (!response.ok) {
            console.warn("[ProfileExtraction] API error:", response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.warn("[ProfileExtraction] No content in response");
            return null;
        }

        // Parse the JSON response (clean markdown code blocks if present)
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleanedText) as ExtractedProfile;

        return {
            quem_sou: parsed.quem_sou || "",
            o_que_sei: parsed.o_que_sei || "",
            o_que_quero: parsed.o_que_quero || "",
            o_que_invisto: parsed.o_que_invisto || "",
            quem_conheco: Array.isArray(parsed.quem_conheco) ? parsed.quem_conheco : [],
        };
    } catch (error) {
        console.error("[ProfileExtraction] Error:", error);
        return null;
    }
}

/**
 * Merges new extracted profile data with existing profile.
 */
function mergeProfiles(
    existing: ExtractedProfile | null,
    newData: ExtractedProfile
): ExtractedProfile {
    if (!existing) return newData;

    return {
        quem_sou: newData.quem_sou || existing.quem_sou,
        o_que_sei: newData.o_que_sei || existing.o_que_sei,
        o_que_quero: newData.o_que_quero || existing.o_que_quero,
        o_que_invisto: newData.o_que_invisto || existing.o_que_invisto,
        quem_conheco: [
            ...new Set([
                ...(existing.quem_conheco || []),
                ...(newData.quem_conheco || []),
            ]),
        ].filter(Boolean),
    };
}

/**
 * Extracts profile from conversation and saves to Supabase.
 */
export async function extractAndSaveProfile(
    userId: string,
    conversationHistory: Array<{ role: string; content: string }>,
    apiKey: string = import.meta.env.VITE_GEMINI_API_KEY,
    model?: string
): Promise<void> {
    try {
        const extracted = await extractProfileFromConversation(
            conversationHistory,
            apiKey,
            model
        );

        if (!extracted) return;

        // Fetch the existing profile
        const { data: existingProfile } = await supabase
            .from("effectuation_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

        const merged = mergeProfiles(
            existingProfile
                ? {
                    quem_sou: existingProfile.quem_sou,
                    o_que_sei: existingProfile.o_que_sei,
                    o_que_quero: existingProfile.o_que_quero,
                    o_que_invisto: existingProfile.o_que_invisto,
                    quem_conheco: existingProfile.quem_conheco as string[],
                }
                : null,
            extracted
        );

        // Upsert the profile
        const { error } = await supabase.from("effectuation_profiles").upsert(
            {
                user_id: userId,
                quem_sou: merged.quem_sou,
                o_que_sei: merged.o_que_sei,
                o_que_quero: merged.o_que_quero,
                o_que_invisto: merged.o_que_invisto,
                quem_conheco: merged.quem_conheco,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

        if (error) throw error;

        console.log("[ProfileExtraction] Profile updated successfully");
    } catch (error) {
        console.error("[ProfileExtraction] Save error:", error);
    }
}