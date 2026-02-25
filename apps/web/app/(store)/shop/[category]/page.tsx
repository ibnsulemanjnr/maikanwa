// apps/web/app/(store)/shop/[category]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/store";
import { Spinner, Input } from "@/components/ui";

type ProductType = "FABRIC" | "READY_MADE" | "CAP" | "SHOE" | "SERVICE";

interface Product {
  id: string;
  title: string;
  slug: string;
  type: ProductType;
  basePriceKobo: number | null;
  images: { url: string }[];
  categories: { name: string; slug?: string }[];
  variants: { priceKobo: number }[];
  inStock?: boolean;
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error?: string };
type SortKey = "new" | "price_asc" | "price_desc";

const FALLBACK_IMG = "/images/placeholders/product.jpg";

function safeLower(v: string) {
  return (v || "").toLowerCase();
}

function humanizeSlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPriceKobo(p: Product): number {
  return p.variants?.[0]?.priceKobo ?? p.basePriceKobo ?? 0;
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

function getPrimaryImageUrl(p: Product): string {
  const raw = p.images?.[0]?.url?.trim() || "";
  const normalized = normalizeDriveToThumbnail(raw);
  return normalized || FALLBACK_IMG;
}

export default function ShopCategoryPage() {
  const params = useParams<{ category: string }>();
  const categorySlug = (params?.category || "").toString();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("new");

  async function loadProducts(slug: string, signal: AbortSignal) {
    setLoading(true);

    const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal,
    });
    const json = (await res.json()) as ApiResponse<Product[]>;

    if (!json.ok) {
      setProducts([]);
      setLoadError(json.error || "Failed to load products");
      setLoading(false);
      return;
    }

    setProducts(json.data);
    setLoadError(null);
    setLoading(false);
  }

  useEffect(() => {
    if (!categorySlug) return;

    const ac = new AbortController();
    loadProducts(categorySlug, ac.signal).catch((e) => {
      if (!ac.signal.aborted) {
        setProducts([]);
        setLoadError(e?.message || "Failed to load products");
        setLoading(false);
      }
    });

    return () => ac.abort();
  }, [categorySlug]);

  const filtered = useMemo(() => {
    const q = safeLower(search);

    const base = products.filter((p) => {
      if (!q) return true;
      return safeLower(p.title).includes(q) || safeLower(p.type).includes(q);
    });

    const sorted = [...base];
    if (sort === "price_asc") sorted.sort((a, b) => getPriceKobo(a) - getPriceKobo(b));
    else if (sort === "price_desc") sorted.sort((a, b) => getPriceKobo(b) - getPriceKobo(a));

    return sorted;
  }, [products, search, sort]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">{humanizeSlug(categorySlug)}</h1>
          <p className="text-gray-600">Browse products in this category.</p>
        </div>

        <div className="text-sm text-gray-600">
          {filtered.length} item{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-2xl bg-white border border-red-200 p-4 text-red-700">
          {loadError}
        </div>
      )}

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder="Search in this category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
          >
            <option value="new">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border border-gray-100">
          <p className="text-gray-600">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product, idx) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.title}
              slug={product.slug}
              priceKobo={getPriceKobo(product)}
              image={getPrimaryImageUrl(product)}
              category={product.categories?.[0]?.name}
              inStock={product.inStock ?? true}
              priority={idx < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
