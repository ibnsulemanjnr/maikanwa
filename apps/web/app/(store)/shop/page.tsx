// apps/web/app/(store)/shop/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/store";
import { Spinner } from "@/components/ui";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error?: string };

interface Product {
  id: string;
  title: string;
  slug: string;

  // ✅ new money field
  basePriceKobo: number | null;

  images: { url: string }[];

  categories: { name: string }[];

  // ✅ new money field
  variants: { priceKobo: number }[];
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: ApiResponse<Product[]>) => {
        if (!mounted) return;
        if (json.ok) setProducts(json.data);
      })
      .catch(() => {
        // noop (keep UI stable)
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#111827] mb-8">Shop All Products</h1>

      {products.length === 0 ? (
        <p className="text-gray-600 text-center py-12">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, idx) => {
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
                // make first row load faster (optional)
                priority={idx < 4}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
