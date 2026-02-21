"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: { url: string; altText?: string }[];
}

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#FAFAFA]">
        <Image
          src={images[selectedIndex].url}
          alt={images[selectedIndex].altText || `Product image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                selectedIndex === index ? "border-[#1E2A78]" : "border-[#E5E7EB]",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
