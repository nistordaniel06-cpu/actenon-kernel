"use client";

import Image from "next/image";
import { useState } from "react";

import { BackButton } from "@/components/client/back-button";
import { cn } from "@/lib/utils";

export function SalonGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <div
        className="no-scrollbar flex h-72 snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          setActive(idx);
        }}
      >
        {images.map((src, i) => (
          <div key={src + i} className="relative h-72 w-full shrink-0 snap-center">
            <Image src={src} alt={`${name} photo ${i + 1}`} fill sizes="480px" className="object-cover" priority={i === 0} />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <BackButton />
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full bg-white/70 transition-all",
              i === active ? "w-4 bg-white" : "w-1.5",
            )}
          />
        ))}
      </div>
    </div>
  );
}
