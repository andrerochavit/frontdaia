/**
 * effectuationApi.ts — Frontend client for the Effectuation AI Flask backend.
 *
 * In development the Vite proxy rewrites /api/* → http://localhost:8001/*.
 * In production set VITE_EFFECTUATION_API_URL to the real backend URL.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProfilePayload {
  disc?: string | null;
  who_i_am?: string;
  what_i_know?: string;
  who_i_know?: string;
  affordable_loss?: string;
}

export interface ChatRequest {
  sessionId: string;
  userId: string;
  message: string;
  profile?: ProfilePayload;
  maxHistory?: number;
}

export interface ChatResponse {
  ok: boolean;
  session_id: string;
  answer: string;
  tasks: Array<Record<string, unknown>>;
  mvp_versions: Array<Record<string, unknown>>;
  extraction?: Record<string, unknown>;
}

export interface StreamDonePayload {
  session_id: string;
  tasks_added: number;
  has_mvp: boolean;
}

export interface HealthResponse {
  ok: boolean;
  model: string;
}

export type NetworkSourceType = "pdf" | "docx" | "csv" | "json" | "text";

export interface NetworkAnalysisResult {
  skills: string[];
  contacts: string[];
  experience_summary: string;
  possible_value: string;
  insights?: string;
}

export interface NetworkAnalysisRequest {
  userId: string;
  context: string;
  sourceType?: NetworkSourceType;
  maxSkills?: number;
}

// ─── Base URL ────────────────────────────────────────────────────────────────

/**
 * In dev the Vite proxy on /api handles routing.
 * In prod set VITE_EFFECTUATION_API_URL (e.g. https://api.example.com).
 */
const API_BASE_URL = (() => {
  const env = import.meta.env.VITE_EFFECTUATION_API_URL?.replace(/\/$/, "");
  if (env) return env;
  // Fallback: use the Vite proxy prefix (works in dev)
  return "/api";
})();

// ─── Auth Header ─────────────────────────────────────────────────────────────

/**
 * Build auth headers.  Priority:
 *  1) Supabase access_token (if user is logged in)
 *  2) Static VITE_EFFECTUATION_API_TOKEN (fallback/dev)
 */
async function buildHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Try Supabase session first
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    // ignore — fall through to static token
  }

  // Fall back to the static developer token
  const staticToken = import.meta.env.VITE_EFFECTUATION_API_TOKEN || "";
  if (staticToken) {
    headers["Authorization"] = `Bearer ${staticToken}`;
  }

  return headers;
}

// ─── Chat (non-streaming) ────────────────────────────────────────────────────

export async function sendChatMessage({
  sessionId,
  userId,
  message,
  profile,
  maxHistory,
}: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      user_id: userId,
      message,
      profile,
      max_history: maxHistory,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Effectuation API error (${response.status}): ${errorText || response.statusText}`,
    );
  }

  const data = (await response.json()) as ChatResponse & { error?: string };
  if (!data.ok) {
    throw new Error(data.error || "Effectuation API returned an error");
  }

  return data;
}

// ─── Chat (streaming via SSE) ────────────────────────────────────────────────

export interface StreamCallbacks {
  onReady?: () => void;
  onDelta?: (text: string) => void;
  onDone?: (payload: StreamDonePayload) => void;
  onError?: (message: string) => void;
}

/**
 * Opens a streaming request to POST /chat/stream.
 * The backend emits Server-Sent Events: `ready`, `delta`, `done`, `error`.
 *
 * Returns a Promise that resolves with the full answer text once streaming
 * completes, and an AbortController to cancel early.
 */
export function sendChatMessageStream(
  req: ChatRequest,
  callbacks: StreamCallbacks,
): { promise: Promise<string>; abort: AbortController } {
  const controller = new AbortController();

  const promise = (async () => {
    const headers = await buildHeaders();
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session_id: req.sessionId,
        user_id: req.userId,
        message: req.message,
        profile: req.profile,
        max_history: req.maxHistory,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const msg = `Effectuation API error (${response.status}): ${errorText || response.statusText}`;
      callbacks.onError?.(msg);
      throw new Error(msg);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullAnswer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from the buffer
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventBlock of events) {
        let currentEvent = "";
        let data = "";

        const lines = eventBlock.split("\n");

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            data += line.slice(6);
          }
        }

        switch (currentEvent) {
          case "ready":
            callbacks.onReady?.();
            break;

          case "delta":
            fullAnswer += data;
            callbacks.onDelta?.(data);
            break;

          case "done":
            try {
              const payload = JSON.parse(data);
              callbacks.onDone?.(payload);
            } catch {
              callbacks.onDone?.({
                session_id: req.sessionId,
                tasks_added: 0,
                has_mvp: false,
              });
            }
            break;

          case "error":
            callbacks.onError?.(data);
            break;
        }
      }

    }

    return fullAnswer;
  })();

  return { promise, abort: controller };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function sendProfile(
  userId: string,
  sessionId: string,
  profile: ProfilePayload,
): Promise<{ ok: boolean; session_id: string; profile: Record<string, unknown> }> {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      ...profile,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Profile API error (${response.status}): ${errorText || response.statusText}`,
    );
  }

  return response.json();
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function markTaskDone(
  userId: string,
  sessionId: string,
  index: number,
): Promise<{ ok: boolean }> {
  const response = await fetch(`${API_BASE_URL}/tasks/done`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      index,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Tasks API error (${response.status}): ${errorText || response.statusText}`,
    );
  }

  return response.json();
}

// ─── MVP Export & Generate ──────────────────────────────────────────────────────────────

export async function generateMvp(userId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE_URL}/mvp/generate`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify({
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `MVP generate error (${response.status}): ${errorText || response.statusText}`,
    );
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || "Effectuation API returned an error");
  }

  return data.data;
}

/**
 * Downloads the latest MVP as a markdown file.
 */
export async function exportMvp(
  userId: string,
  sessionId: string,
): Promise<Blob> {
  const headers = await buildHeaders();
  const params = new URLSearchParams({ session_id: sessionId, user_id: userId });
  const response = await fetch(`${API_BASE_URL}/mvp/export?${params}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `MVP export error (${response.status}): ${errorText || response.statusText}`,
    );
  }

  return response.blob();
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: await buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }

  return response.json();
}

export async function analyzeNetworkContext({
  userId,
  context,
  sourceType = "text",
  maxSkills = 8,
}: NetworkAnalysisRequest): Promise<NetworkAnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/network/analyze`, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify({
      user_id: userId,
      context,
      source_type: sourceType,
      max_skills: maxSkills,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Network analysis error (${response.status}): ${errorText || response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    ok: boolean;
    result?: NetworkAnalysisResult;
    error?: string;
  };

  if (!data.ok || !data.result) {
    throw new Error(data.error || "Effectuation API retornou erro na análise de networking");
  }

  return data.result;
}
