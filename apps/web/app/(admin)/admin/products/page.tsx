"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner, Alert } from "@/components/ui";
import { DataTable } from "@/components/admin";

interface Product {
  id: string;
  title: string;
  type: string;
  status: string;
  basePriceKobo?: number | null;
  variants?: { priceKobo: number }[];
}

type ProductsResponse = { results: Product[] } | { data: Product[] } | Product[];

function normalizeProductsPayload(payload: unknown): Product[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/products", { cache: "no-store", credentials: "include" });

      // If unauthorized (shouldn't happen due to admin layout guard), handle gracefully
      if (res.status === 401 || res.status === 403) {
        setError("Unauthorized. Please login as admin.");
        setProducts([]);
        return;
      }

      const data: ProductsResponse = await res.json().catch(() => [] as unknown);
      if (!res.ok) {
        throw new Error((data as { message?: string })?.message || "Failed to load products");
      }

      setProducts(normalizeProductsPayload(data));
    } catch (err) {
      setError(
        (err as Error)?.message ||
          "Database connection error. Please check your .env file and run migrations.",
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadProducts}>
            Refresh
          </Button>
          <Button onClick={() => router.push("/admin/products/new")}>Add Product</Button>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          <strong>Error:</strong> {error}
          <div className="mt-2 text-sm">
            Run:{" "}
            <code className="bg-black/10 px-2 py-1 rounded">
              npm run db:migrate && npm run db:seed
            </code>
          </div>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={[
            { key: "title", label: "Product Name" },
            { key: "type", label: "Type" },
            { key: "status", label: "Status" },
            {
              key: "price",
              label: "Price",
              render: (row: Product) => {
                const vPriceKobo = row.variants?.[0]?.priceKobo;
                const baseKobo = row.basePriceKobo ?? 0;
                const priceKobo =
                  typeof vPriceKobo === "number" ? vPriceKobo : Number(baseKobo) || 0;
                const price = priceKobo / 100;
                return `₦${price.toLocaleString()}`;
              },
            },
          ]}
          data={products}
        />
      </div>
    </div>
  );
}
