// apps/web/app/(store)/shop/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/store";
import { Spinner, Button, Input } from "@/components/ui";

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

function getPriceKobo(p: Product): number {
  return p.variants?.[0]?.priceKobo ?? p.basePriceKobo ?? 0;
}

/**
 * Convert Drive share/view links to renderable image URLs.
 * - drive.google.com/file/d/<id>/view  -> drive.google.com/thumbnail?id=<id>&sz=w2000
 * - drive.google.com/open?id=<id>      -> thumbnail...
 * - drive.google.com/uc?id=<id>        -> thumbnail...
 * - *.googleusercontent.com            -> leave as-is
 */
function normalizeDriveToThumbnail(input: string): string {
  const url = (input || "").trim();
  if (!url) return url;

  try {
    const u = new URL(url);

    // already direct
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

export default function ShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize from URL params (shareable filters)
  const [search, setSearch] = useState(() => sp.get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">(
    () => (sp.get("type") as ProductType | "all") || "all",
  );
  const [sort, setSort] = useState<SortKey>(() => (sp.get("sort") as SortKey) || "new");

  function updateUrl(next: Partial<{ q: string; type: string; sort: string }>) {
    const params = new URLSearchParams(sp.toString());

    if (next.q !== undefined) {
      const v = next.q.trim();
      if (v) params.set("q", v);
      else params.delete("q");
    }
    if (next.type !== undefined) {
      if (next.type && next.type !== "all") params.set("type", next.type);
      else params.delete("type");
    }
    if (next.sort !== undefined) {
      if (next.sort && next.sort !== "new") params.set("sort", next.sort);
      else params.delete("sort");
    }

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const ac = new AbortController();

    setLoading(true);
    setLoadError(null);

    fetch("/api/products", { cache: "no-store", signal: ac.signal })
      .then((res) => res.json())
      .then((json: ApiResponse<Product[]>) => {
        if (ac.signal.aborted) return;

        if (json.ok) {
          setProducts(json.data);
          setLoadError(null);
        } else {
          setProducts([]);
          setLoadError(json.error || "Failed to load products");
        }
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setProducts([]);
        setLoadError(e?.message || "Failed to load products");
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => ac.abort();
  }, []);

  // Sync URL when user changes filters
  useEffect(() => {
    updateUrl({ q: search, type: typeFilter, sort });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, sort]);

  const filtered = useMemo(() => {
    const q = safeLower(search);

    const base = products.filter((p) => {
      const matchType = typeFilter === "all" || p.type === typeFilter;

      if (!q) return matchType;

      const inTitle = safeLower(p.title).includes(q);
      const inCategory = safeLower(p.categories?.[0]?.name || "").includes(q);
      const inType = safeLower(p.type).includes(q);

      return matchType && (inTitle || inCategory || inType);
    });

    const sorted = [...base];

    if (sort === "price_asc") sorted.sort((a, b) => getPriceKobo(a) - getPriceKobo(b));
    else if (sort === "price_desc") sorted.sort((a, b) => getPriceKobo(b) - getPriceKobo(a));

    return sorted;
  }, [products, search, typeFilter, sort]);

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
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Shop All Products</h1>
          <p className="text-gray-600">
            Discover fabrics, ready-made clothing, caps, shoes, and tailoring services.
          </p>
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

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              onClick={() => setTypeFilter("all")}
              size="sm"
            >
              All
            </Button>

            <Button
              variant={typeFilter === "FABRIC" ? "default" : "outline"}
              onClick={() => setTypeFilter("FABRIC")}
              size="sm"
            >
              Fabrics
            </Button>

            <Button
              variant={typeFilter === "READY_MADE" ? "default" : "outline"}
              onClick={() => setTypeFilter("READY_MADE")}
              size="sm"
            >
              Ready Made
            </Button>

            <Button
              variant={typeFilter === "CAP" ? "default" : "outline"}
              onClick={() => setTypeFilter("CAP")}
              size="sm"
            >
              Caps
            </Button>

            <Button
              variant={typeFilter === "SHOE" ? "default" : "outline"}
              onClick={() => setTypeFilter("SHOE")}
              size="sm"
            >
              Shoes
            </Button>

            <Button
              variant={typeFilter === "SERVICE" ? "default" : "outline"}
              onClick={() => setTypeFilter("SERVICE")}
              size="sm"
            >
              Tailoring Services
            </Button>

            {(search.trim() || typeFilter !== "all" || sort !== "new") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setSort("new");
                }}
              >
                Clear
              </Button>
            )}
          </div>

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
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">🔍</span>
          </div>
          <p className="text-gray-600">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product, idx) => {
            const priceKobo = getPriceKobo(product);
            const image = getPrimaryImageUrl(product);
            const category = product.categories?.[0]?.name;

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.title}
                slug={product.slug}
                priceKobo={priceKobo}
                image={image}
                category={category}
                inStock={product.inStock ?? true}
                priority={idx < 4}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
