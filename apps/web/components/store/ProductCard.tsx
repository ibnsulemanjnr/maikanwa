"use client";

// apps/web/components/store/ProductCard.tsx
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;

  /**
   * Stored/transported in KOBO (minor units).
   * Example: ₦5,000.00 => 500000
   */
  priceKobo: number;

  /**
   * Can be a remote URL (R2/S3/placeholder) or a local /public path.
   */
  image: string;

  category?: string;
  inStock?: boolean;
  isNew?: boolean;
  priority?: boolean;
}

const FALLBACK_IMG = "/images/placeholders/product.jpg"; // ensure this exists in apps/web/public

function formatNgnFromKobo(kobo: number) {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
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
  const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMG);

  const priceText = useMemo(() => formatNgnFromKobo(priceKobo), [priceKobo]);

  return (
    <Link href={`/product/${slug}`} aria-label={`View ${name}`}>
      <Card hover className="h-full">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imgSrc}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            className="object-cover transition-transform hover:scale-105"
            onError={() => setImgSrc(FALLBACK_IMG)}
          />

          {isNew && (
            <div className="absolute top-2 left-2">
              <Badge variant="warning">New</Badge>
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
