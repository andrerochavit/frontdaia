import { Menu } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

/**
 * A compact menu button that triggers the global Sidebar (ChatSidebar).
 * Designed to be striking on mobile.
 */
export default function NavMenuButton() {
    const { isMobile } = useSidebar();

    return (
        <SidebarTrigger
            className={`
    shrink-0 rounded-xl transition-all border-0
    /* Efeito de vidro que se adapta ao fundo verde, roxo ou amarelo */
    bg-white/20 dark:bg-black/20 backdrop-blur-md 
    /* Cor do ícone sempre legível */
    text-foreground shadow-sm hover:scale-105 active:scale-95
    h-10 w-10 md:h-12 md:w-12
`}
            aria-label="Menu de navegação"
        >
            <Menu className="h-5 w-5" />
        </SidebarTrigger>
    );
}
