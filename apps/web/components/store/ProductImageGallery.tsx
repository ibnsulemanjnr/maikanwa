// apps/web/components/store/ProductImageGallery.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: { url: string; altText?: string | null }[];
}

const FALLBACK_IMG = "/images/placeholders/product.jpg";

function isGoogleHosted(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return (
      h === "drive.google.com" ||
      h === "lh3.googleusercontent.com" ||
      h === "drive.usercontent.google.com" ||
      h.endsWith(".googleusercontent.com")
    );
  } catch {
    return false;
  }
}

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.filter((i) => !!i?.url) : []),
    [images],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, true>>({});

  if (safeImages.length === 0) return null;

  const idx = Math.min(selectedIndex, safeImages.length - 1);
  const mainRaw = safeImages[idx]?.url || "";
  const mainSrc = failed[idx] || !mainRaw ? FALLBACK_IMG : mainRaw;
  const unoptimizedMain = isGoogleHosted(mainSrc);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#FAFAFA]">
        <Image
          src={mainSrc}
          alt={safeImages[idx]?.altText || `Product image ${idx + 1}`}
          fill
          className="object-cover"
          priority
          unoptimized={unoptimizedMain}
          onError={() => setFailed((p) => ({ ...p, [idx]: true }))}
        />
      </div>

      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {safeImages.map((img, i) => {
            const raw = img.url || "";
            const thumbSrc = failed[i] || !raw ? FALLBACK_IMG : raw;
            const unoptimizedThumb = isGoogleHosted(thumbSrc);

            return (
              <button
                key={`${raw}-${i}`}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                  idx === i ? "border-[#1E2A78]" : "border-[#E5E7EB]",
                )}
                aria-label={`Select image ${i + 1}`}
              >
                <Image
                  src={thumbSrc}
                  alt={img.altText || `Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={unoptimizedThumb}
                  onError={() => setFailed((p) => ({ ...p, [i]: true }))}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
