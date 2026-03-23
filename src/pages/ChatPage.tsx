import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import EffectuationChatbot from "@/components/EffectuationChatbot";
import Whiteboard from "@/components/Whiteboard";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { type ChatSession } from "@/services/chatSessionService";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ClipboardList } from "lucide-react";

export default function ChatPage() {

  const isMobile = useIsMobile();

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const location = useLocation();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    (location.state as any)?.sessionId || null
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const { user } = useAuth();



  useEffect(() => {
    if ((location.state as any)?.sessionId) {
      setActiveSessionId((location.state as any).sessionId);
    }
  }, [location.state]);

  const handleSessionSelect = (sessionId: string) => {
    setActiveSessionId(sessionId || null);
  };

  const handleSessionsChange = useCallback((updated: ChatSession[]) => {
    setSessions(updated);
    if (!activeSessionId && updated.length > 0) {
      setActiveSessionId(updated[0].id);
    }
  }, [activeSessionId]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ChatSidebar
          activeSessionId={activeSessionId}
          onSessionSelect={handleSessionSelect}
          onSessionsChange={handleSessionsChange}
        />
        <main className="flex-1 flex flex-col md:flex-row h-[100dvh] overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <EffectuationChatbot
              onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              isRightSidebarOpen={isRightSidebarOpen}
              sessionId={activeSessionId}
              onSessionTitleUpdate={() => {
                setSessions((prev) => [...prev]);
              }}
            />
          </div>

          {isMobile ? (
            <Sheet open={isRightSidebarOpen} onOpenChange={setIsRightSidebarOpen}>
              <SheetContent side="right" className="p-0 border-l border-white/20 sm:max-w-md w-[85vw] bg-background/95">
                <SheetTitle className="sr-only">Quadro de Tarefas</SheetTitle>
                <SheetDescription className="sr-only">Visualize e gerencie suas tarefas empreendedoras</SheetDescription>
                {user && <Whiteboard />}
              </SheetContent>
            </Sheet>
          ) : (
            isRightSidebarOpen && (
              <div className="w-full h-[40vh] md:h-full md:w-1/3 lg:w-[400px] border-t md:border-t-0 md:border-l border-white/20 dark:border-white/10 flex flex-col bg-background/50 animate-in fade-in slide-in-from-right-4 duration-300">
                {user && <Whiteboard />}
              </div>
            )
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}