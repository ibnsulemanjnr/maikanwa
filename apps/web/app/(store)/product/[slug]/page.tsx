// apps/web/app/(store)/product/[slug]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Badge } from "@/components/ui";
import { ProductImageGallery } from "@/components/store";

type Inventory = { quantity: string; reserved: string };

type Variant = {
  id: string;
  title?: string | null;
  priceKobo: number;
  size?: string | null;
  color?: string | null;
  unit?: "METER" | "YARD" | "PIECE" | null;
  minQty?: string | null;
  qtyStep?: string | null;
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
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format((kobo || 0) / 100);
}

function toNumberSafe(v: string | null | undefined, fallback = 0) {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isValidDecimalString(v: string) {
  return /^\d+(\.\d+)?$/.test(v.trim());
}

function roundToStep(value: number, min: number, step: number) {
  if (step <= 0) return value;
  const offset = Math.max(0, value - min);
  const steps = Math.round(offset / step);
  return min + steps * step;
}

function normalizeDriveToThumbnail(input: string): string {
  const url = (input || "").trim();
  if (!url) return url;

  try {
    const u = new URL(url);
    if (u.hostname.endsWith("googleusercontent.com")) return url;

    if (!u.hostname.includes("drive.google.com")) return url;

    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = m?.[1] ?? u.searchParams.get("id");
    if (!id) return url;

    return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
  } catch {
    return url;
  }
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState<string>("1");
  const [qtyError, setQtyError] = useState<string>("");

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  async function loadProduct(slug: string, signal: AbortSignal) {
    setLoading(true);

    const res = await fetch(`/api/products/${slug}`, { cache: "no-store", signal });
    const json = (await res.json()) as ApiResponse<Product>;

    if (!json.ok) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setProduct(json.data);

    const first = json.data.variants?.[0];
    setSelectedVariantId(first?.id ?? null);

    const minQty = first?.minQty ? first.minQty : "1";
    setQty(minQty || "1");
    setQtyError("");

    setLoading(false);
  }

  useEffect(() => {
    const slug = params?.slug;
    if (!slug) return;

    const ac = new AbortController();
    loadProduct(String(slug), ac.signal).catch(() => {
      if (!ac.signal.aborted) {
        setProduct(null);
        setLoading(false);
      }
    });

    return () => ac.abort();
  }, [params?.slug]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  }, [product, selectedVariantId]);

  function selectVariant(nextId: string) {
    setSelectedVariantId(nextId);

    const v = product?.variants?.find((x) => x.id === nextId) ?? null;
    const min = v?.minQty ? v.minQty : "1";
    setQty(min || "1");
    setQtyError("");
  }

  const galleryImages = useMemo(() => {
    const imgs = product?.images ?? [];
    return imgs
      .filter((img) => !!img?.url)
      .map((img) => ({
        url: normalizeDriveToThumbnail(img.url),
        altText: img.altText ?? undefined,
      }));
  }, [product]);

  const availableStock = useMemo(() => {
    if (!selectedVariant?.inventory) return null;
    const q = toNumberSafe(selectedVariant.inventory.quantity, 0);
    const r = toNumberSafe(selectedVariant.inventory.reserved, 0);
    return Math.max(0, q - r);
  }, [selectedVariant]);

  const inStock = useMemo(() => {
    if (availableStock === null) return true;
    return availableStock > 0;
  }, [availableStock]);

  const unitLabel = useMemo(() => {
    const u = selectedVariant?.unit;
    if (!u) return "";
    if (u === "METER") return "meter";
    if (u === "YARD") return "yard";
    if (u === "PIECE") return "piece";
    return "";
  }, [selectedVariant]);

  const priceKobo = useMemo(
    () => selectedVariant?.priceKobo ?? product?.basePriceKobo ?? 0,
    [selectedVariant, product],
  );
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

  const qtyRules = useMemo(() => {
    const min = toNumberSafe(selectedVariant?.minQty ?? null, 1);
    const step = toNumberSafe(
      selectedVariant?.qtyStep ?? null,
      product?.type === "FABRIC" ? 0.5 : 1,
    );
    const isFabric = product?.type === "FABRIC";
    return { min, step, isFabric };
  }, [selectedVariant, product]);

  function validateQty(next: string): string {
    const v = next.trim();
    if (!v) return "Quantity is required";
    if (!isValidDecimalString(v)) return "Invalid quantity format";

    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "Quantity must be greater than 0";
    if (!qtyRules.isFabric && !Number.isInteger(n)) return "Quantity must be a whole number";
    if (n < qtyRules.min) return `Minimum quantity is ${qtyRules.min}`;

    if (qtyRules.isFabric && qtyRules.step > 0) {
      const diff = n - qtyRules.min;
      const steps = diff / qtyRules.step;
      const isWhole = Math.abs(steps - Math.round(steps)) < 1e-9;
      if (!isWhole && diff !== 0)
        return `Quantity must follow step: ${qtyRules.step} (min: ${qtyRules.min})`;
    }

    if (availableStock !== null && n > availableStock)
      return "Requested quantity exceeds available stock";
    return "";
  }

  function onQtyChange(next: string) {
    setQty(next);
    setQtyError(validateQty(next));
  }

  function bumpQty(dir: -1 | 1) {
    const current = Number(qty);
    const base = Number.isFinite(current) ? current : qtyRules.min;
    const next = qtyRules.isFabric ? base + dir * qtyRules.step : base + dir * 1;

    const clamped = Math.max(qtyRules.min, next);
    const snapped = qtyRules.isFabric
      ? roundToStep(clamped, qtyRules.min, qtyRules.step)
      : Math.round(clamped);

    const nextStr = qtyRules.isFabric ? snapped.toFixed(2).replace(/\.00$/, "") : String(snapped);
    onQtyChange(nextStr);
  }

  async function addToCart(navigateTo: "cart" | "none" = "cart") {
    if (!product || !selectedVariant) return;

    const err = validateQty(qty);
    if (err) {
      setQtyError(err);
      return;
    }

    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variantId: selectedVariant.id, quantity: qty }),
      });

      const json = await res.json();
      if (json?.ok) {
        if (navigateTo === "cart") router.push("/cart");
        router.refresh();
      }
    } catch {
      // optional toast later
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
            {unitLabel && <p className="text-sm text-gray-500 pb-1">per {unitLabel}</p>}
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
                onChange={(e) => selectVariant(e.target.value)}
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

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#111827] mb-2">Quantity</label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-10 w-10 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => bumpQty(-1)}
                disabled={!inStock}
              >
                −
              </button>

              <input
                value={qty}
                onChange={(e) => onQtyChange(e.target.value)}
                inputMode={qtyRules.isFabric ? "decimal" : "numeric"}
                className="h-10 w-32 rounded-lg border border-gray-200 px-3 text-center"
                disabled={!inStock}
              />

              <button
                type="button"
                className="h-10 w-10 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={() => bumpQty(1)}
                disabled={!inStock}
              >
                +
              </button>

              {unitLabel && <span className="text-sm text-gray-600">{unitLabel}</span>}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Min: {qtyRules.min}
              {qtyRules.isFabric && qtyRules.step ? ` • Step: ${qtyRules.step}` : ""}
            </p>

            {qtyError && <p className="mt-2 text-xs text-red-600">{qtyError}</p>}
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
