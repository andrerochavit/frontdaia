import { Link } from "react-router-dom";
import { Bot } from "lucide-react";

interface FooterProps {
    className?: string;
}

export function Footer({ className = "" }: FooterProps) {
    return (
        <footer className={`glass-panel border-t border-white/30 dark:border-white/10 py-12 mt-auto ${className}`}>
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                    {/* Brand */}
                    <div className="col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 btn-gradient rounded-lg flex items-center justify-center shadow-sm">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg text-foreground">Effie</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                            Seu companheiro de empreendedorismo alimentado por IA e pelo método Effectuation.
                        </p>
                    </div>

                    {/* Produto */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">Produto</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#product-showcase" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Como funciona
                                </a>
                            </li>
                            <li>
                                <a href="#effectuation-method" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Método Effectuation
                                </a>
                            </li>
                            <li>
                                <Link to="/contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Contato
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Termos de Uso
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Privacidade
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/20 dark:border-white/5 pt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Effie. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
