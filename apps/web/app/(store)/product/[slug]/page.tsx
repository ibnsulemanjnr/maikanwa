"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Spinner, Badge } from "@/components/ui";
import { ProductImageGallery, QuantitySelector } from "@/components/store";

interface Product {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  type: string;
  images: { url: string; altText?: string }[];
  variants: { id: string; title?: string; price: number; size?: string; color?: string }[];
  categories: { name: string }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetch(`/api/products/${params.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setProduct(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  if (!product) return <div className="text-center py-12">Product not found</div>;

  const price = product.variants[0]?.price || product.basePrice || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {product.images.length > 0 ? (
            <ProductImageGallery images={product.images} />
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
          <h1 className="text-3xl font-bold text-[#111827] mb-4">{product.title}</h1>
          <p className="text-2xl font-bold text-[#1E2A78] mb-6">₦{price.toLocaleString()}</p>

          {product.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-[#111827] mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#111827] mb-2">Quantity</label>
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>

          <div className="flex gap-4">
            <Button className="flex-1">Add to Cart</Button>
            <Button variant="outline">Buy Now</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
