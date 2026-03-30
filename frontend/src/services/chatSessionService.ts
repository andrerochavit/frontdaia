import { supabase } from "@/integrations/supabase/client";

export interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export const MAX_SESSIONS = 3;
/** Messages sent to the LLM API — kept small to control cost */
export const CONTEXT_WINDOW = 6;

// ─── Sessions CRUD ───────────────────────────────────────────────────────────

export async function getSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

    if (error) throw error;
    return (data as ChatSession[]) || [];
}

export async function createSession(userId: string, title = "Nova Conversa"): Promise<ChatSession> {
    const { data, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: userId, title })
        .select()
        .single();

    if (error) throw error;
    return data as ChatSession;
}

export async function renameSession(sessionId: string, title: string): Promise<void> {
    const { error } = await supabase
        .from("chat_sessions")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    if (error) throw error;
}

export async function deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);
    if (error) throw error;
}

/** Touch updated_at so session floats to the top of the list */
async function touchSession(sessionId: string) {
    await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from("chat_messages")
        .select("id, session_id, role, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as ChatMessage[]) || [];
}

export async function saveMessage(
    userId: string,
    sessionId: string,
    role: "user" | "assistant",
    content: string
): Promise<ChatMessage> {
    const { data, error } = await supabase
        .from("chat_messages")
        .insert({ user_id: userId, session_id: sessionId, role, content })
        .select()
        .single();

    if (error) throw error;
    await touchSession(sessionId);
    return data as ChatMessage;
}

// ─── Auto-title ───────────────────────────────────────────────────────────────

/** Generate a short title from the first user message */
export function deriveTitleFromMessage(content: string): string {
    const clean = content.replace(/\n/g, " ").trim();
    return clean.length > 60 ? clean.slice(0, 57) + "…" : clean;
}

// ─── Context window ───────────────────────────────────────────────────────────

/**
 * Returns the last N messages formatted for the LLM.
 * This keeps token cost minimal while preserving recent context.
 */
export function buildContextWindow(
    messages: ChatMessage[]
): Array<{ role: "user" | "assistant"; content: string }> {
    return messages
        .slice(-CONTEXT_WINDOW)
        .map((m) => ({ role: m.role, content: m.content }));
}
