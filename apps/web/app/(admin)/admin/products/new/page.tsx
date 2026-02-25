// apps/web/app/(admin)/admin/products/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Alert, Spinner } from "@/components/ui";

type Category = { id: string; name: string; slug: string };

type VariantForm = {
  title?: string;
  sku?: string;
  price: string;
  size?: string;
  color?: string;
  unit?: "METER" | "YARD" | "PIECE";
  minQty?: string;
  qtyStep?: string;
  inventoryQty?: string;
  lowStockAt?: string;
};

type ProductType = "FABRIC" | "READY_MADE" | "CAP" | "SHOE" | "SERVICE";
type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function extractDriveId(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (!u.hostname.includes("drive.google.com")) return null;
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m?.[1]) return m[1];
    return u.searchParams.get("id");
  } catch {
    return null;
  }
}

function normalizeImageUrl(input: string): string {
  const url = input.trim();
  if (!url) return url;

  try {
    const u = new URL(url);
    if (u.hostname.endsWith("googleusercontent.com")) return url;
  } catch {
    return url;
  }

  const id = extractDriveId(url);
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;

  return url;
}

function isValidUrl(u: string) {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

function toNumber(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toInt(v: string | undefined): number | undefined {
  const n = toNumber(v);
  if (n === undefined) return undefined;
  return Math.max(0, Math.trunc(n));
}

const FALLBACK_PREVIEW = "/images/placeholders/product.jpg";

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  const effective = !errored && src ? src : FALLBACK_PREVIEW;

  return (
    <img
      src={effective}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setErrored(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [catsLoading, setCatsLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<ProductType>("FABRIC");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [variants, setVariants] = useState<VariantForm[]>([
    { price: "0", unit: "YARD", minQty: "1", qtyStep: "1", inventoryQty: "0", lowStockAt: "5" },
  ]);

  const isFabric = useMemo(() => type === "FABRIC", [type]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCatsLoading(true);
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const data = await res.json().catch(() => [] as unknown);
        const list = Array.isArray(data)
          ? (data as Category[])
          : Array.isArray((data as { results?: unknown[] }).results)
            ? ((data as { results: unknown[] }).results as Category[])
            : (((data as { data?: unknown[] }).data || []) as Category[]);
        if (mounted) setCategories(list);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!slug.trim() && title.trim()) setSlug(slugify(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addImageUrl() {
    setError("");
    const raw = imageUrlInput.trim();
    if (!raw) return;

    const normalized = normalizeImageUrl(raw);
    if (!isValidUrl(normalized)) {
      setError("Invalid image URL");
      return;
    }

    setImageUrls((prev) => {
      const next = [...prev, normalized];
      const seen = new Set<string>();
      return next.filter((u) => {
        const k = u.trim();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    });

    setImageUrlInput("");
  }

  function removeImageUrl(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setImageUrls((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      isFabric
        ? {
            price: "0",
            unit: "YARD",
            minQty: "1",
            qtyStep: "1",
            inventoryQty: "0",
            lowStockAt: "5",
          }
        : { price: "0", inventoryQty: "0", lowStockAt: "5" },
    ]);
  }

  function removeVariant(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateVariant(i: number, patch: Partial<VariantForm>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  async function submit() {
    setError("");
    setLoading(true);

    try {
      if (!title.trim()) throw new Error("Title is required");
      if (!variants.length) throw new Error("At least one variant is required");

      if (isFabric) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (!v.unit) throw new Error(`Variant ${i + 1}: Unit is required for fabric`);
          if (!v.minQty || Number(v.minQty) <= 0)
            throw new Error(`Variant ${i + 1}: Min qty must be > 0`);
          if (!v.qtyStep || Number(v.qtyStep) <= 0)
            throw new Error(`Variant ${i + 1}: Qty step must be > 0`);
        }
      }

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.price || Number(v.price) < 0)
          throw new Error(`Variant ${i + 1}: Price must be 0 or greater`);
      }

      const normalizedImageUrls = imageUrls.map((u) => normalizeImageUrl(u)).filter(Boolean);

      const images = normalizedImageUrls.map((url, idx) => ({
        url,
        altText: title.trim() || undefined,
        sortOrder: idx,
        isPrimary: idx === 0,
      }));

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        type,
        status,
        currency: "NGN",
        basePrice: basePrice.trim() ? Number(basePrice) : undefined,
        categoryIds: selectedCategoryIds,
        imageUrls: normalizedImageUrls,
        images, // option B compatibility
        variants: variants.map((v) => ({
          title: v.title?.trim() || undefined,
          sku: v.sku?.trim() || undefined,
          price: Number(v.price || 0),
          size: v.size?.trim() || undefined,
          color: v.color?.trim() || undefined,
          unit: v.unit,
          minQty: v.minQty ? Number(v.minQty) : undefined,
          qtyStep: v.qtyStep ? Number(v.qtyStep) : undefined,
          inventoryQty: toInt(v.inventoryQty),
          lowStockAt: toInt(v.lowStockAt),
        })),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to create product");

      router.replace("/admin/products");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Add Product</h1>
            <p className="mt-1 text-gray-600">
              Create a new product with variants and inventory. (Google Drive image links supported)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Back
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
        {/* Basic */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Title</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Slug</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">Auto-generated; you can edit.</p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Type</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
            >
              <option value="FABRIC">FABRIC</option>
              <option value="READY_MADE">READY_MADE</option>
              <option value="CAP">CAP</option>
              <option value="SHOE">SHOE</option>
              <option value="SERVICE">SERVICE</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Base Price (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="e.g. 25000"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">Description</label>
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Categories</label>
            {catsLoading && (
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Spinner /> Loading...
              </div>
            )}
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-xl border px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                />
                <span className="text-sm">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="text-sm text-gray-600">Images (URLs for now)</label>
          <p className="mt-1 text-xs text-gray-500">
            Tip: Paste a Google Drive share link — we convert it to a renderable thumbnail URL
            automatically.
          </p>

          <div className="mt-2 flex gap-2">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/... or https://..."
            />
            <Button variant="outline" onClick={addImageUrl}>
              Add
            </Button>
          </div>

          {imageUrls.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {imageUrls.map((u, idx) => (
                <div key={u + idx} className="rounded-2xl border p-3">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50">
                    <PreviewImage key={u} src={u} alt={title || `Product image ${idx + 1}`} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-600 truncate">
                      {idx === 0 ? "Primary" : `Image #${idx + 1}`}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === imageUrls.length - 1}
                      >
                        ↓
                      </Button>
                      <Button variant="outline" onClick={() => removeImageUrl(idx)}>
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 break-all">{u}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Variants</label>
            <Button variant="outline" onClick={addVariant}>
              + Add Variant
            </Button>
          </div>

          <div className="mt-3 space-y-4">
            {variants.map((v, idx) => (
              <div key={idx} className="rounded-2xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Variant #{idx + 1}</div>
                  {variants.length > 1 && (
                    <Button variant="outline" onClick={() => removeVariant(idx)}>
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <label className="text-xs text-gray-600">SKU</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      value={v.sku || ""}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Price (₦)</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      value={v.price}
                      onChange={(e) => updateVariant(idx, { price: e.target.value })}
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Inventory Qty</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      value={v.inventoryQty || ""}
                      onChange={(e) => updateVariant(idx, { inventoryQty: e.target.value })}
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Low Stock At</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      value={v.lowStockAt || ""}
                      onChange={(e) => updateVariant(idx, { lowStockAt: e.target.value })}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {isFabric ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs text-gray-600">Unit</label>
                      <select
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={v.unit || "YARD"}
                        onChange={(e) => updateVariant(idx, { unit: e.target.value as any })}
                      >
                        <option value="METER">METER</option>
                        <option value="YARD">YARD</option>
                        <option value="PIECE">PIECE</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Min Qty</label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={v.minQty || ""}
                        onChange={(e) => updateVariant(idx, { minQty: e.target.value })}
                        inputMode="decimal"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Qty Step</label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={v.qtyStep || ""}
                        onChange={(e) => updateVariant(idx, { qtyStep: e.target.value })}
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs text-gray-600">Size</label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={v.size || ""}
                        onChange={(e) => updateVariant(idx, { size: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Color</label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={v.color || ""}
                        onChange={(e) => updateVariant(idx, { color: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
