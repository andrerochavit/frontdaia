import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthGuard from "@/components/AuthGuard";
import DiscGuard from "@/components/DiscGuard";
import LandingPage from "./pages/LandingPage";
import AuthForm from "./components/auth/AuthForm";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import NetworkPage from "./pages/NetworkPage";
import MvpPage from "./pages/MvpPage";
import DiscFormPage from "./pages/DiscFormPage";
import ProfilePage from "./pages/ProfilePage";
import DiscProfilePage from "./pages/DiscProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermosPage from "./pages/TermosPage";
import PrivacidadePage from "./pages/PrivacidadePage";
import ContatoPage from "./pages/ContatoPage";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const AuthRoute = () => {
  const navigate = useNavigate();
  return <AuthForm onAuthSuccess={() => navigate("/dashboard")} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="effectuation-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthRoute />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* /disc — requires auth but NOT DiscGuard (is the DISC page itself) */}
                <Route
                  path="/disc"
                  element={
                    <AuthGuard>
                      <DiscFormPage />
                    </AuthGuard>
                  }
                />

                {/* All other protected routes require auth + completed DISC */}
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard>
                      <DiscGuard>
                        <Dashboard />
                      </DiscGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <AuthGuard>
                      <DiscGuard>
                        <ChatPage />
                      </DiscGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/network"
                  element={
                    <AuthGuard>
                      <DiscGuard>
                        <NetworkPage />
                      </DiscGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/mvp"
                  element={
                    <AuthGuard>
                      <DiscGuard>
                        <MvpPage />
                      </DiscGuard>
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <ProfilePage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/disc-profile"
                  element={
                    <AuthGuard>
                      <DiscGuard>
                        <DiscProfilePage />
                      </DiscGuard>
                    </AuthGuard>
                  }
                />

                {/* Legal / public pages */}
                <Route path="/termos" element={<TermosPage />} />
                <Route path="/privacidade" element={<PrivacidadePage />} />
                <Route path="/contato" element={<ContatoPage />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
