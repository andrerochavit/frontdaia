import { useState, useEffect, useCallback } from "react";
import {
  Home, LogOut, MessageSquare, Plus, Trash2, Pencil,
  Check, X, MoreHorizontal, MessageCircle, UserCircle,
  Network, Rocket, ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  getSessions,
  createSession,
  renameSession,
  deleteSession,
  MAX_SESSIONS,
  type ChatSession,
} from "@/services/chatSessionService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface EffectuationPrinciple {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  context: string;
}

interface ChatSidebarProps {
  activeSessionId?: string | null;
  onSessionSelect?: (sessionId: string) => void;
  onSessionsChange?: (sessions: ChatSession[]) => void;
  isOffcanvas?: boolean;
}

export function ChatSidebar({
  activeSessionId,
  onSessionSelect,
  onSessionsChange,
  isOffcanvas,
}: ChatSidebarProps = {}) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) setOpenMobile(false);
  };

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);

  // Get user display info
  const userMeta = user?.user_metadata;
  const displayName = userMeta?.display_name || userMeta?.full_name || user?.email?.split("@")[0] || "";
  const avatarEmoji = userMeta?.avatar_emoji || "😊";
  const avatarUrl = userMeta?.avatar_url;

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSessions(user.id);
      setSessions(data);
      onSessionsChange?.(data);
    } catch {
      /* silently fail */
    } finally {
      setLoadingSessions(false);
    }
  }, [user, onSessionsChange]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewSession = async () => {
    if (!user || sessions.length >= MAX_SESSIONS || creatingNew) return;
    setCreatingNew(true);
    try {
      const session = await createSession(user.id);
      const updated = [session, ...sessions];
      setSessions(updated);
      onSessionsChange?.(updated);
      if (onSessionSelect) {
        onSessionSelect(session.id);
      } else {
        navigate('/chat', { state: { sessionId: session.id } });
      }
      if (isMobile) setOpenMobile(false);
      toast({ title: "Nova conversa criada! 💬" });
    } catch {
      toast({ title: "Erro ao criar conversa", variant: "destructive" });
    } finally {
      setCreatingNew(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      onSessionsChange?.(updated);
      if (activeSessionId === sessionId) {
        onSessionSelect?.(updated[0]?.id ?? "");
      }
      toast({ title: "Conversa removida" });
    } catch {
      toast({ title: "Erro ao remover conversa", variant: "destructive" });
    }
  };

  const startEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const commitEdit = async () => {
    if (!editingId || !editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await renameSession(editingId, editTitle.trim());
      setSessions((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, title: editTitle.trim() } : s))
      );
    } catch {
      toast({ title: "Erro ao renomear", variant: "destructive" });
    } finally {
      setEditingId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch {
      toast({ title: "Erro ao sair", description: "Tente novamente", variant: "destructive" });
    }
  };

  const atLimit = sessions.length >= MAX_SESSIONS;

  return (
    <Sidebar className={`border-r-0 ${isOffcanvas ? "w-full" : ""}`} collapsible={isOffcanvas ? "none" : "offcanvas"}>
      {/* Header */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-sidebar-foreground truncate">Effie</h2>
            <p className="text-[10px] text-sidebar-foreground/55">Mentor de empreendedorismo</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Chat Sessions */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 mb-2">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 p-0">
              Conversas ({sessions.length}/{MAX_SESSIONS})
            </SidebarGroupLabel>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleNewSession}
              disabled={atLimit || creatingNew}
              title={atLimit ? `Limite de ${MAX_SESSIONS} conversas atingido` : "Nova conversa"}
              className="h-6 w-6 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground disabled:opacity-30 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <SidebarGroupContent>
            {loadingSessions ? (
              <div className="space-y-2 px-1">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-sidebar-accent/40 animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 px-2">
                <MessageCircle className="h-8 w-8 text-sidebar-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-sidebar-foreground/40 mb-3">Nenhuma conversa ainda</p>
                <Button
                  size="sm"
                  onClick={handleNewSession}
                  className="btn-gradient rounded-xl text-xs h-8 w-full"
                >
                  <Plus className="h-3 w-3 mr-1" /> Iniciar conversa
                </Button>
              </div>
            ) : (
              <SidebarMenu className="space-y-1">
                {sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    {editingId === session.id ? (
                      <div className="flex items-center gap-1 px-1">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-8 text-xs rounded-lg glass-input border-0 flex-1"
                          autoFocus
                        />
                        <button
                          onClick={commitEdit}
                          className="p-1.5 rounded-md hover:bg-primary/10 text-primary"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`group flex items-center gap-2 w-full rounded-xl px-3 py-2 cursor-pointer transition-all text-sm ${activeSessionId === session.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-sidebar-accent text-sidebar-foreground"
                          }`}
                        onClick={() => {
                          if (onSessionSelect) {
                            onSessionSelect(session.id);
                          } else {
                            navigate('/chat', { state: { sessionId: session.id } });
                          }
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <MessageCircle
                          className={`h-3.5 w-3.5 shrink-0 ${activeSessionId === session.id
                            ? "text-primary"
                            : "text-sidebar-foreground/40"
                            }`}
                        />
                        <span className="text-xs font-medium truncate flex-1 min-w-0">
                          {session.title}
                        </span>

                        {/* Actions menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-opacity shrink-0"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 text-xs">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(session);
                              }}
                              className="gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(session.id);
                              }}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}

            {atLimit && (
              <p className="text-[10px] text-sidebar-foreground/40 text-center mt-2 px-2">
                Limite de {MAX_SESSIONS} conversas. Exclua uma para criar outra.
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 px-2 mb-1">
            Navegar
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="gap-2.5 py-2 px-3 text-sm rounded-xl hover:bg-sidebar-accent"
                  onClick={() => handleNav("/dashboard")}
                >
                  <Home className="h-4 w-4 text-primary" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="gap-2.5 py-2 px-3 text-sm rounded-xl hover:bg-sidebar-accent"
                  onClick={() => handleNav("/network")}
                >
                  <UserCircle className="h-4 w-4 text-emerald-500" />
                  <span>Perfil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="gap-2.5 py-2 px-3 text-sm rounded-xl hover:bg-sidebar-accent"
                  onClick={() => handleNav("/mvp")}
                >
                  <Rocket className="h-4 w-4 text-purple-500" />
                  <span>Meu MVP</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="gap-2.5 py-2 px-3 text-sm rounded-xl hover:bg-sidebar-accent"
                  onClick={() => handleNav("/disc")}
                >
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  <span>Perfil DISC</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border/50">
        <button
          onClick={() => handleNav("/profile")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sidebar-accent transition-all mb-1 group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-sm">{avatarEmoji}</span>
            )}
          </div>
          <span className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</span>
        </button>


      </SidebarFooter>
    </Sidebar>
  );
}
