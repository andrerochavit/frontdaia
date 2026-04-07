import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatHeader from "./ChatHeader";
import WarningBanner from "./WarningBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MarkdownMessage from "@/components/MarkdownMessage";
import { sendChatMessageStream, type ProfilePayload } from "@/services/effectuationApi";
import {
  getMessages,
  deriveTitleFromMessage,
  renameSession,
  type ChatMessage,
} from "@/services/chatSessionService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Suggestion cards ─────────────────────────────────────────────────────────
const initialSuggestions = [
  { text: "Como validar minha ideia de negócio?", emoji: "💡" },
  { text: "Quais recursos eu já tenho para começar?", emoji: "🎯" },
  { text: "Como encontrar parceiros estratégicos?", emoji: "🤝" },
  { text: "Como transformar uma surpresa em oportunidade?", emoji: "🍋" },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface EffectuationChatbotProps {
  onToggleRightSidebar?: () => void;
  isRightSidebarOpen?: boolean;
  /** Active chat session id — drives persistence */
  sessionId?: string | null;
  /** Notify parent when session title changes (after first message) */
  onSessionTitleUpdate?: () => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DisplayMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  isStreaming?: boolean;
}

interface OnboardingData {
  what_you_know: string;
  what_you_want: string;
  who_you_know: string;
  what_you_invest: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const EffectuationChatbot = ({
  onToggleRightSidebar,
  isRightSidebarOpen,
  sessionId,
  onSessionTitleUpdate,
}: EffectuationChatbotProps = {}) => {
  const { user } = useAuth();

  // UI messages list (local render state)
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  // Raw DB messages (used for building LLM context)
  const [dbMessages, setDbMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [inputText, setInputText] = useState("");
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [discProfile, setDiscProfile] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleSetRef = useRef(false); // ensure we only auto-title once per session
  const streamAbortRef = useRef<AbortController | null>(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load DISC profile from localStorage ───────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const cached = localStorage.getItem(`disc_result_${user.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDiscProfile(parsed.dominant ?? null);
      } catch {
        // ignore
      }
    }
  }, [user]);

  // ── Fetch profile context ─────────────────────────────────────────────────
  useEffect(() => {
    async function fetchProfileData() {
      if (!user) return;
      try {
        const { data: profileData } = await supabase
          .from("effectuation_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setOnboardingData({
            what_you_know: profileData.o_que_sei,
            what_you_want: profileData.o_que_quero,
            who_you_know: (profileData.quem_conheco as string[])?.join(", ") || "",
            what_you_invest: profileData.o_que_invisto,
          });
          return;
        }

        const { data } = await supabase
          .from("onboarding_data")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) setOnboardingData(data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    }
    fetchProfileData();
  }, [user]);

  // ── Load session messages when sessionId changes ─────────────────────────
  const loadSession = useCallback(async (sid: string) => {
    setLoadingHistory(true);
    setMessages([]);
    setDbMessages([]);
    titleSetRef.current = false;
    try {
      const data = await getMessages(sid);
      setDbMessages(data);
      setMessages(
        data.map((m) => ({
          id: m.id,
          text: m.content,
          isBot: m.role === "assistant",
          timestamp: new Date(m.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
      // Mark title as already set if session has messages
      if (data.length > 0) titleSetRef.current = true;
    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      setMessages([]);
      setDbMessages([]);
    }
  }, [sessionId, loadSession]);

  // ── Build profile payload for backend ─────────────────────────────────────
  const buildProfile = (): ProfilePayload | undefined => {
    if (!onboardingData && !discProfile) return undefined;
    return {
      disc: discProfile ?? undefined,
      who_i_am: "",
      what_i_know: onboardingData?.what_you_know || "",
      who_i_know: onboardingData?.who_you_know || "",
      affordable_loss: onboardingData?.what_you_invest || "",
    };
  };

  // ── Send message (streaming via backend) ──────────────────────────────────
  const handleSendMessage = async (messageText: string) => {
    const trimmed = messageText.trim();

    // 1. Bloqueio imediato: se não tem texto ou já está carregando, sai fora.
    if (!trimmed || isLoading || !sessionId || !user) return;

    // 2. LIMPEZA IMEDIATA: Isso impede que o segundo disparo (Enter + Click) 
    // encontre texto no 'inputText' se a função rodar de novo em milissegundos.
    setInputText("");

    // 3. Reset do scroll e altura do textarea (opcional, mas bom para UX)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const timestamp = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 4. Interface Otimista (User)
    const tempUserMsg: DisplayMessage = {
      id: `temp-user-${Date.now()}-${Math.random()}`, // Adicionei um random para garantir ID único
      text: trimmed,
      isBot: false,
      timestamp,
    };

    // 5. Placeholder do Bot
    const tempBotId = `temp-bot-${Date.now()}-${Math.random()}`;
    const tempBotMsg: DisplayMessage = {
      id: tempBotId,
      text: "",
      isBot: true,
      timestamp,
      isStreaming: true,
    };

    // Trava o estado de carregamento ANTES de atualizar a lista de mensagens
    setIsLoading(true);
    setMessages((prev) => [...prev, tempUserMsg, tempBotMsg]);

    try {

      // Build a local-only record for the context window (backend persists to DB)
      const localUserMsg: ChatMessage = {
        id: tempUserMsg.id,
        session_id: sessionId,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setDbMessages((prev) => [...prev, localUserMsg]);

      // Auto-generate title from first message
      if (!titleSetRef.current) {
        titleSetRef.current = true;
        renameSession(sessionId, deriveTitleFromMessage(trimmed))
          .then(() => onSessionTitleUpdate?.())
          .catch(() => { });
      }

      // Stream AI response from the Flask backend
      const { promise, abort } = sendChatMessageStream(
        {
          sessionId,
          userId: user.id,
          message: trimmed,
          profile: buildProfile(),
        },
        {
          onDelta: (delta) => {
            // Progressively update the bot bubble
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempBotId ? { ...m, text: m.text + delta } : m
              )
            );
          },
          onError: (errMsg) => {
            console.error("[Stream] Error:", errMsg);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempBotId
                  ? { ...m, text: "Desculpe, tive um problema técnico. Tente novamente em instantes." }
                  : m
              )
            );
          },
        },
      );
      streamAbortRef.current = abort;

      const fullAnswer = await promise;

      // Mark streaming as done so MarkdownMessage renders full markdown
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempBotId ? { ...m, isStreaming: false } : m
        )
      );

      // Build a local-only record for the assistant (backend persists to DB)
      const localBotMsg: ChatMessage = {
        id: tempBotId,
        session_id: sessionId,
        role: "assistant",
        content: fullAnswer,
        created_at: new Date().toISOString(),
      };
      setDbMessages((prev) => [...prev, localBotMsg]);

      // No ID swap needed — temp IDs stay; real IDs are loaded on next session fetch
    } catch (error) {
      console.error("Error in message flow:", error);
      // Remove optimistic messages on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserMsg.id && m.id !== tempBotId)
      );
    } finally {
      setIsLoading(false);
      streamAbortRef.current = null;
    }
  };

  const isSendingRef = useRef(false);


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && inputText.trim()) {
        handleSendMessage(inputText); // continua igual
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // No session selected
  if (!sessionId) {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <ChatHeader
          onToggleRightSidebar={onToggleRightSidebar}
          isRightSidebarOpen={isRightSidebarOpen}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <MessageCircle className="h-8 w-8 text-primary/50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma conversa selecionada</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Crie uma nova conversa no painel esquerdo para começar a interagir com o Effie.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <ChatHeader
        onToggleRightSidebar={onToggleRightSidebar}
        isRightSidebarOpen={isRightSidebarOpen}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 sm:px-4 pt-4 pb-2">
        <div className="max-w-2xl mx-auto space-y-2.5">

          {/* Loading history skeleton */}
          {loadingHistory && (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 animate-pulse shrink-0" />
                  <div
                    className={`h-12 rounded-2xl bg-primary/5 animate-pulse ${i % 2 === 0 ? "w-48" : "w-64"
                      }`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Welcome / Suggestions */}
          {!loadingHistory && messages.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 btn-gradient rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  Olá! Sou o Effie 👋
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Seu mentor de empreendedorismo baseado na metodologia Effectuation. Como posso te
                  ajudar hoje?
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {initialSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => handleSendMessage(s.text)}
                    className="glass-card rounded-xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-0 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-xl">{s.emoji}</span>
                      <Sparkles className="h-3.5 w-3.5 text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">{s.text}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message bubbles */}
          {!loadingHistory && (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 sm:gap-2.5 ${!message.isBot ? "flex-row-reverse" : ""}`}
                >
                  {/* Only show avatar for bot */}
                  {message.isBot ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg btn-gradient flex items-center justify-center shadow-none ring-0 focus:ring-0 focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="ring-0 lucide lucide-bot w-4 h-4 sm:w-5 sm:h-5 text-white" data-lov-id="src/components/ChatHeader.tsx:18:10" data-lov-name="Bot" data-component-path="src/components/ChatHeader.tsx" data-component-line="18" data-component-file="ChatHeader.tsx" data-component-name="Bot" data-component-content="%7B%22className%22%3A%22w-4%20h-4%20sm%3Aw-5%20sm%3Ah-5%20text-white%22%7D"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
                    </div>
                  ) : (
                    <div className="w-7 sm:w-8 shrink-0" />
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${message.isBot ? "items-start" : "items-end"
                      }`}
                  >
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${message.isBot
                        ? "glass-card text-foreground rounded-tl-sm"
                        : "text-white rounded-tr-sm"
                        }`}
                      style={
                        !message.isBot
                          ? {
                            background:
                              "linear-gradient(135deg, hsl(217, 82%, 58%) 0%, hsl(230, 70%, 62%) 100%)",
                            boxShadow: "0 4px 14px hsl(217 82% 58% / 0.25)",
                          }
                          : {}
                      }
                    >
                      {message.isBot && !message.text ? (
                        <div className="flex items-center gap-1.5 h-6 px-1">
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      ) : (
                        <MarkdownMessage
                          content={message.text}
                          isStreaming={message.isStreaming}
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {message.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}


          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="glass-panel border-t border-white/40 px-3 sm:px-4 py-2">
        <div className="max-w-2xl mx-auto space-y-1">
          <div className="flex items-end gap-2 sm:gap-3">
            <Textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva sua mensagem…"
              disabled={isLoading || loadingHistory}
              rows={1}
              className="flex-1 resize-none glass-input rounded-xl border-0 text-sm min-h-[42px] max-h-[120px] py-2.5 px-3.5 leading-relaxed focus-visible:ring-1 focus-visible:ring-primary/50 overflow-y-auto"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <Button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading || loadingHistory}
              size="icon"
              className="btn-gradient h-[42px] w-[42px] rounded-xl shrink-0 shadow-md disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </Button>
          </div>
          <WarningBanner />
        </div>
      </div>
    </div>
  );
};

export default EffectuationChatbot;