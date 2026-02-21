"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export default function ApiTestPage() {
  const [results, setResults] = useState<
    Record<string, { status?: number; data?: unknown; error?: string }>
  >({});
  const [loading, setLoading] = useState<string | null>(null);

  const testEndpoint = async (name: string, url: string) => {
    setLoading(name);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setResults((prev) => ({ ...prev, [name]: { status: res.status, data } }));
    } catch (error) {
      setResults((prev) => ({ ...prev, [name]: { error: String(error) } }));
    }
    setLoading(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API Test Page</h1>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={() => testEndpoint("products", "/api/products")}
            disabled={loading === "products"}
          >
            Test GET /api/products
          </Button>

          <Button
            onClick={() => testEndpoint("categories", "/api/categories")}
            disabled={loading === "categories"}
          >
            Test GET /api/categories
          </Button>

          <Button
            onClick={() => testEndpoint("product-detail", "/api/products/ankara-premium")}
            disabled={loading === "product-detail"}
          >
            Test GET /api/products/[slug]
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          {Object.entries(results).map(([name, result]) => (
            <div key={name} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-lg mb-2">{name}</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
