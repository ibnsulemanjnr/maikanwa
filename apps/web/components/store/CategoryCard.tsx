// apps/web/components/store/CategoryCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Card } from "@/components/ui/Card";

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
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

function CategoryImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const effectiveSrc = !errored && src ? src : FALLBACK_IMG;
  const unoptimized = isGoogleHosted(effectiveSrc);

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      fill
      unoptimized={unoptimized}
      className="object-cover transition-transform hover:scale-105"
      onError={() => setErrored(true)}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    />
  );
}

export default function CategoryCard({ name, slug, image, productCount }: CategoryCardProps) {
  const src = image || FALLBACK_IMG;

  return (
    <Link href={`/shop/${slug}`} aria-label={`Shop ${name}`}>
      <Card hover className="overflow-hidden">
        <div className="relative aspect-[4/3]">
          <CategoryImage key={src} src={src} alt={name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-bold text-lg mb-1">{name}</h3>
            {productCount !== undefined && (
              <p className="text-sm text-white/90">{productCount} products</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
