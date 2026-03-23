import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const isChat = location.pathname.startsWith("/chat");

    // Internal pages that should have the sidebar frame
    const isInternalPage = ["/network", "/mvp", "/profile", "/disc", "/contato"].some(path => location.pathname.startsWith(path));

    // For chat we have our own SidebarProvider inside ChatPage to give it full layout ownership
    if (isInternalPage && !isChat) {
        return (
            <SidebarProvider defaultOpen>
                <div className="flex w-full min-h-screen">
                    <ChatSidebar />
                    <div className="flex-1 flex flex-col min-w-0 relative h-screen overflow-y-auto overflow-x-hidden scroll-smooth">
                        <main className="flex-1 flex flex-col relative z-0">
                            {children}
                        </main>
                        <Footer />
                    </div>
                </div>
            </SidebarProvider>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 flex flex-col relative z-0">
                {children}
            </main>
            <div className="relative z-10 bg-background/50">
                {!isChat && <Footer />}
            </div>
        </div>
    );
}
