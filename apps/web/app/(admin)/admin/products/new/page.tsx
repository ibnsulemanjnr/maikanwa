"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Alert, Spinner } from "@/components/ui";

type Category = { id: string; name: string; slug: string };

type VariantForm = {
  title?: string;
  sku?: string;
  price: string;

  // ready-made/cap/shoe
  size?: string;
  color?: string;

  // fabric
  unit?: "METER" | "YARD" | "PIECE";
  minQty?: string;
  qtyStep?: string;

  // inventory
  inventoryQty?: string;
  lowStockAt?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
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
  const [type, setType] = useState<"FABRIC" | "READY_MADE" | "CAP" | "SHOE" | "SERVICE">("FABRIC");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");

  // URL-based images for now (file upload comes later)
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [variants, setVariants] = useState<VariantForm[]>([
    { price: "0", unit: "YARD", minQty: "1", qtyStep: "1", inventoryQty: "0", lowStockAt: "5" },
  ]);

  // Load categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      setCatsLoading(true);
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const data = await res.json().catch(() => [] as unknown);
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as { results?: unknown[] }).results)
            ? (data as { results: unknown[] }).results
            : (data as { data?: unknown[] }).data || [];
        if (mounted) setCategories(list);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-slug from title (unless user edited slug manually)
  useEffect(() => {
    if (!slug.trim() && title.trim()) setSlug(slugify(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const isFabric = useMemo(() => type === "FABRIC", [type]);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function addImageUrl() {
    const u = imageUrlInput.trim();
    if (!u) return;
    try {
      new URL(u);
      setImageUrls((prev) => [...prev, u]);
      setImageUrlInput("");
    } catch {
      setError("Invalid image URL");
    }
  }

  function removeImageUrl(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
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

      // Validate fabric-specific fields
      if (isFabric) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          if (!v.unit) throw new Error(`Variant ${i + 1}: Unit is required for fabric`);
          if (!v.minQty || Number(v.minQty) <= 0)
            throw new Error(`Variant ${i + 1}: Min quantity must be greater than 0`);
          if (!v.qtyStep || Number(v.qtyStep) <= 0)
            throw new Error(`Variant ${i + 1}: Quantity step must be greater than 0`);
        }
      }

      // Validate prices
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.price || Number(v.price) < 0)
          throw new Error(`Variant ${i + 1}: Price must be 0 or greater`);
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        type,
        status,
        currency: "NGN",
        basePrice: basePrice.trim() ? Number(basePrice) : undefined,
        categoryIds: selectedCategoryIds,
        imageUrls,

        variants: variants.map((v) => ({
          title: v.title?.trim() || undefined,
          sku: v.sku?.trim() || undefined,
          price: Number(v.price || 0),

          size: v.size?.trim() || undefined,
          color: v.color?.trim() || undefined,

          unit: v.unit,
          minQty: v.minQty ? Number(v.minQty) : undefined,
          qtyStep: v.qtyStep ? Number(v.qtyStep) : undefined,

          inventoryQty: v.inventoryQty ? Number(v.inventoryQty) : undefined,
          lowStockAt: v.lowStockAt ? Number(v.lowStockAt) : undefined,
        })),
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data?.message || "Failed to create product";
        throw new Error(errorMsg);
      }

      router.replace("/admin/products");
      router.refresh();
    } catch (e) {
      setError((e as Error)?.message || "Failed to create product");
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
            <p className="mt-1 text-gray-600">Create a new product with variants and inventory.</p>
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
              onChange={(e) =>
                setType(e.target.value as "FABRIC" | "READY_MADE" | "CAP" | "SHOE" | "SERVICE")
              }
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
              onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}
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
          <div className="mt-2 flex gap-2">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://..."
            />
            <Button variant="outline" onClick={addImageUrl}>
              Add
            </Button>
          </div>

          {imageUrls.length > 0 && (
            <div className="mt-3 space-y-2">
              {imageUrls.map((u, idx) => (
                <div
                  key={u + idx}
                  className="flex items-center justify-between rounded-xl border px-3 py-2"
                >
                  <span className="truncate text-sm text-gray-700">{u}</span>
                  <Button variant="outline" onClick={() => removeImageUrl(idx)}>
                    Remove
                  </Button>
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
                    <label className="text-xs text-gray-600">Price</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      value={v.price}
                      onChange={(e) => updateVariant(idx, { price: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Inventory Qty</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      value={v.inventoryQty || ""}
                      onChange={(e) => updateVariant(idx, { inventoryQty: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Low Stock At</label>
                    <input
                      className="mt-1 w-full rounded-xl border px-3 py-2"
                      value={v.lowStockAt || ""}
                      onChange={(e) => updateVariant(idx, { lowStockAt: e.target.value })}
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
                        onChange={(e) =>
                          updateVariant(idx, { unit: e.target.value as "METER" | "YARD" | "PIECE" })
                        }
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
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Qty Step</label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        value={v.qtyStep || ""}
                        onChange={(e) => updateVariant(idx, { qtyStep: e.target.value })}
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
