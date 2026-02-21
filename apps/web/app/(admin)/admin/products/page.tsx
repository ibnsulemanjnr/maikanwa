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
  basePrice: number;
  variants: { price: number }[];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setProducts(data.data);
        } else {
          setError(data.error || "Failed to load products");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Database connection error. Please check your .env file and run migrations.");
        setLoading(false);
      });
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
        <Button onClick={() => router.push("/admin/products/new")}>Add Product</Button>
      </div>

      {error && (
        <Alert variant="error">
          <strong>Error:</strong> {error}
          <div className="mt-2 text-sm">
            Run:{" "}
            <code className="bg-black/10 px-2 py-1 rounded">
              npm run prisma:migrate && npm run prisma:seed
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
              render: (row) =>
                `₦${(row.variants[0]?.price || row.basePrice || 0).toLocaleString()}`,
            },
          ]}
          data={products}
        />
      </div>
    </div>
  );
}
