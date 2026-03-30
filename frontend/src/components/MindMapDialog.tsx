import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AIMindMap } from "./AIMindMap";
import { Brain } from "lucide-react";

export function MindMapDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="px-8 py-6 text-lg h-auto flex flex-col items-center justify-center space-y-2"
        >
          <Brain className="h-8 w-8" />
          <span>Abrir Mapa Mental</span>
          <span className="text-sm opacity-80">Organize suas ideias pelos princípios</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0">
        <DialogTitle className="sr-only">Mapa Mental IA Effectuation</DialogTitle>
        <DialogDescription className="sr-only">
          Crie mapas mentais interativos com sugestões de IA
        </DialogDescription>
        <AIMindMap onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}