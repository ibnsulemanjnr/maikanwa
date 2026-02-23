// apps/web/app/(store)/product/[slug]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Badge } from "@/components/ui";
import { ProductImageGallery, QuantitySelector } from "@/components/store";

type Inventory = {
  quantity: string; // Prisma Decimal serialized as string
  reserved: string; // Prisma Decimal serialized as string
};

type Variant = {
  id: string;
  title?: string | null;
  priceKobo: number;
  size?: string | null;
  color?: string | null;
  unit?: "METER" | "YARD" | "PIECE" | null;
  minQty?: string | null; // Decimal
  qtyStep?: string | null; // Decimal
  inventory?: Inventory | null;
};

type Product = {
  id: string;
  title: string;
  description: string | null;
  basePriceKobo: number | null;
  type: "FABRIC" | "READY_MADE" | "CAP" | "SHOE" | "SERVICE";
  images: { url: string; altText?: string | null }[];
  variants: Variant[];
  categories: { name: string; slug: string }[];
};

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error?: string };

function formatNgnFromKobo(kobo: number) {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

function toNumberSafe(v: string | null | undefined, fallback = 0) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    const slug = params?.slug;
    if (!slug) return;

    let cancelled = false;

    // ✅ avoid "setState synchronously in effect" lint error
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    fetch(`/api/products/${slug}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json: ApiResponse<Product>) => {
        if (cancelled) return;

        if (json.ok) {
          setProduct(json.data);
          const first = json.data.variants?.[0];
          setSelectedVariantId(first?.id ?? null);
        } else {
          setProduct(null);
        }
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params?.slug]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  }, [product, selectedVariantId]);

  const availableStock = useMemo(() => {
    if (!selectedVariant?.inventory) return null;
    const q = toNumberSafe(selectedVariant.inventory.quantity, 0);
    const r = toNumberSafe(selectedVariant.inventory.reserved, 0);
    return Math.max(0, q - r);
  }, [selectedVariant]);

  const inStock = useMemo(() => {
    if (availableStock === null) return true; // services etc.
    return availableStock > 0;
  }, [availableStock]);

  const unitLabel = useMemo(() => {
    const u = selectedVariant?.unit;
    if (!u) return "";
    if (u === "METER") return "per meter";
    if (u === "YARD") return "per yard";
    if (u === "PIECE") return "per piece";
    return "";
  }, [selectedVariant]);

  const priceKobo = useMemo(() => {
    return selectedVariant?.priceKobo ?? product?.basePriceKobo ?? 0;
  }, [selectedVariant, product]);

  const priceText = useMemo(() => formatNgnFromKobo(priceKobo), [priceKobo]);

  const variantOptions = useMemo(() => {
    if (!product?.variants?.length) return [];
    return product.variants.map((v) => {
      const parts = [
        v.title,
        v.size ? `Size: ${v.size}` : null,
        v.color ? `Color: ${v.color}` : null,
      ].filter(Boolean);
      return { id: v.id, label: parts.length ? parts.join(" • ") : "Default" };
    });
  }, [product]);

  // ✅ normalize null altText -> undefined to match ProductImageGallery props
  const galleryImages = useMemo(() => {
    const imgs = product?.images ?? [];
    return imgs.map((img) => ({
      url: img.url,
      altText: img.altText ?? undefined,
    }));
  }, [product]);

  async function addToCart(navigateTo: "cart" | "none" = "cart") {
    if (!product || !selectedVariant) return;

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity,
        }),
      });

      const json = await res.json();
      if (json?.ok) {
        if (navigateTo === "cart") {
          router.push("/cart");
        }
        router.refresh();
      }
    } catch {
      // keep silent; add toast later if needed
    }
  }

  async function buyNow() {
    await addToCart("none");
    router.push("/checkout");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!product) return <div className="text-center py-12">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {galleryImages.length > 0 ? (
            <ProductImageGallery images={galleryImages} />
          ) : (
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        <div>
          <div className="mb-4">
            {product.categories[0] && <Badge variant="info">{product.categories[0].name}</Badge>}
          </div>

          <h1 className="text-3xl font-bold text-[#111827] mb-3">{product.title}</h1>

          <div className="flex items-end gap-3 mb-6">
            <p className="text-2xl font-bold text-[#1E2A78]">{priceText}</p>
            {unitLabel && <p className="text-sm text-gray-500 pb-1">{unitLabel}</p>}
          </div>

          {!inStock && (
            <div className="mb-4">
              <Badge variant="error">Out of Stock</Badge>
            </div>
          )}

          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-[#111827] mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          {variantOptions.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#111827] mb-2">Choose option</label>
              <select
                value={selectedVariant?.id ?? ""}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1E2A78]/30"
              >
                {variantOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>

              {availableStock !== null && (
                <p className="text-xs text-gray-500 mt-2">Available: {availableStock}</p>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#111827] mb-2">Quantity</label>
            <QuantitySelector value={quantity} onChange={setQuantity} />
            {selectedVariant?.minQty && (
              <p className="text-xs text-gray-500 mt-2">
                Min: {selectedVariant.minQty}
                {selectedVariant.qtyStep ? ` • Step: ${selectedVariant.qtyStep}` : ""}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <Button className="flex-1" onClick={() => addToCart("cart")} disabled={!inStock}>
              Add to Cart
            </Button>
            <Button variant="outline" onClick={buyNow} disabled={!inStock}>
              Buy Now
            </Button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <span className="font-medium text-[#111827]">Trust option:</span> Pay on Delivery
            available in selected cities.
          </div>
        </div>
      </div>
    </div>
  );
}
