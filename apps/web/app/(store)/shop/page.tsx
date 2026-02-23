"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/store";
import { Spinner, Button, Input } from "@/components/ui";

interface Product {
  id: string;
  title: string;
  slug: string;
  type: string;
  basePriceKobo: number | null;
  images: { url: string }[];
  categories: { name: string }[];
  variants: { priceKobo: number }[];
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        if (json.ok) setProducts(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Shop All Products</h1>
        <p className="text-gray-600">
          Discover our collection of fabrics, ready-made clothing, and more
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
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
            const priceKobo = product.variants?.[0]?.priceKobo ?? product.basePriceKobo ?? 0;
            const image = product.images?.[0]?.url || "/images/placeholders/product.jpg";
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
                inStock={true}
                priority={idx < 4}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
