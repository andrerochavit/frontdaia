import { Info } from "lucide-react";

const WarningBanner = () => {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      <Info className="w-3 h-3 text-muted-foreground/60 shrink-0" />
      <p className="text-[10px] text-muted-foreground/70">
        Orientações gerais. Consulte especialistas para decisões importantes.
      </p>
    </div>
  );
};

export default WarningBanner;