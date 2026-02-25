// apps/web/components/store/ProductCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  /** Stored in KOBO (minor units). Example: ₦5,000.00 => 500000 */
  priceKobo: number;
  /** Remote URL (Drive/R2/S3/etc) or local /public path */
  image: string;
  category?: string;
  inStock?: boolean;
  isNew?: boolean;
  priority?: boolean;
}

const FALLBACK_IMG = "/images/placeholders/product.jpg";

function formatNgnFromKobo(kobo: number) {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

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

function CardImage({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
  const [errored, setErrored] = useState(false);
  const effectiveSrc = !errored && src ? src : FALLBACK_IMG;
  const unoptimized = isGoogleHosted(effectiveSrc);

  return (
    <Image
      src={effectiveSrc}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      priority={priority}
      unoptimized={unoptimized}
      className="object-cover transition-transform hover:scale-105"
      onError={() => setErrored(true)}
    />
  );
}

export default function ProductCard({
  name,
  slug,
  priceKobo,
  image,
  category,
  inStock = true,
  isNew,
  priority = false,
}: ProductCardProps) {
  const priceText = useMemo(() => {
    if (!priceKobo) return "Contact for price";
    return formatNgnFromKobo(priceKobo);
  }, [priceKobo]);

  const src = image || FALLBACK_IMG;

  return (
    <Link
      href={`/product/${slug}`}
      aria-label={`View ${name}`}
      aria-disabled={!inStock}
      className={!inStock ? "cursor-not-allowed" : ""}
      onClick={(e) => {
        if (!inStock) e.preventDefault();
      }}
    >
      <Card hover className={`h-full ${!inStock ? "opacity-90" : ""}`}>
        <div className="relative aspect-square overflow-hidden">
          {/* key resets internal error state when src changes */}
          <CardImage key={src} src={src} alt={name} priority={priority} />

          {isNew && (
            <div className="absolute top-2 left-2">
              <Badge variant="warning">New</Badge>
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
              <Badge variant="error">Out of Stock</Badge>
            </div>
          )}
        </div>

        <CardBody>
          {category && <p className="text-xs text-gray-500 uppercase mb-1">{category}</p>}
          <h3 className="font-semibold text-[#111827] mb-2 line-clamp-2">{name}</h3>
          <p className="text-lg font-bold text-[#1E2A78]">{priceText}</p>
        </CardBody>
      </Card>
    </Link>
  );
}
