import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Carousel({ items }: { items: React.ReactNode[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      {/* Área do carrossel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex-[0_0_80%] md:flex-[0_0_30%] drop-shadow-md"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Botões de navegação */}
      {canScrollPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute top-1/2 -left-4 -translate-y-1/2 bg-background p-2 rounded-full shadow-lg hover:bg-primary hover:text-white transition"
        >
          <ChevronLeft />
        </button>
      )}

      {canScrollNext && (
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="absolute top-1/2 -right-4 -translate-y-1/2 bg-background p-2 rounded-full shadow-lg hover:bg-primary hover:text-white transition"
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
