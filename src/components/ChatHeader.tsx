import { Bot, PanelRightClose, PanelRightOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onToggleRightSidebar?: () => void;
  isRightSidebarOpen?: boolean;
}

const ChatHeader = ({ onToggleRightSidebar, isRightSidebarOpen }: ChatHeaderProps = {}) => {
  return (
    <div className="flex items-center justify-between px-5 py-3 glass-panel border-b border-white/40">
      <div className="flex items-center gap-2 sm:gap-3">
        <SidebarTrigger className="text-foreground/70 hover:text-foreground h-8 w-8 hover:bg-black/5 dark:hover:bg-white/10 rounded-md" />

        <div className="w-8 h-8 sm:w-9 sm:h-9 btn-gradient rounded-xl flex items-center justify-center shadow-md shrink-0">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-foreground">Effie</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Assistente de Empreendedorismo</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {onToggleRightSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRightSidebar}
            className="flex h-8 w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-foreground/70 hover:text-foreground transition-colors"
            title={isRightSidebarOpen ? "Ocultar Tarefas" : "Mostrar Tarefas"}
          >
            {isRightSidebarOpen ? <PanelRightClose className="h-4 w-4 sm:h-5 sm:w-5" /> : <PanelRightOpen className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default ChatHeader;