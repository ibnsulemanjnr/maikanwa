"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/store";
import { Spinner } from "@/components/ui";

interface Product {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  images: { url: string }[];
  categories: { name: string }[];
  variants: { price: number }[];
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setProducts(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#111827] mb-8">Shop All Products</h1>
      {products.length === 0 ? (
        <p className="text-gray-600 text-center py-12">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.title}
              slug={product.slug}
              price={product.variants[0]?.price || product.basePrice || 0}
              image={product.images[0]?.url || "/placeholder.jpg"}
              category={product.categories[0]?.name}
              inStock={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
