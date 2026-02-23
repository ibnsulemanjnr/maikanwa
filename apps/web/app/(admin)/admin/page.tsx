"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/admin";
import { Spinner, Button } from "@/components/ui";

type ApiListPayload = unknown;

function countFromResponse(res: ApiListPayload): number {
  if (!res) return 0;

  if (Array.isArray(res)) return res.length;

  if (typeof res === "object" && res !== null) {
    const obj = res as Record<string, unknown>;
    const results = obj["results"];
    const data = obj["data"];

    if (Array.isArray(results)) return results.length;
    if (Array.isArray(data)) return data.length;
  }

  return 0;
}

type AdminOrder = { total?: string | number };

function extractOrders(res: unknown): AdminOrder[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as AdminOrder[];
  if (typeof res === "object" && res !== null) {
    const obj = res as Record<string, unknown>;
    const results = obj["results"];
    if (Array.isArray(results)) return results as AdminOrder[];
  }
  return [];
}

function formatNaira(n: number) {
  if (!Number.isFinite(n)) return "₦0";
  return `₦${Math.round(n).toLocaleString()}`;
}

export default function AdminHome() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    revenue: "₦0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const [productsRes, categoriesRes, ordersRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }).then(
            (r) => r.json() as Promise<ApiListPayload>,
          ),
          fetch("/api/categories", { cache: "no-store" }).then(
            (r) => r.json() as Promise<ApiListPayload>,
          ),
          // This endpoint may not exist yet — handle safely
          fetch("/api/admin/orders", { cache: "no-store", credentials: "include" })
            .then(async (r) => {
              if (!r.ok) return null; // 401/403/404 -> treat as empty
              return (await r.json()) as unknown;
            })
            .catch(() => null),
        ]);

        if (!mounted) return;

        const orders = extractOrders(ordersRes);
        const totalRevenue = orders.reduce((sum, o) => {
          const n = parseFloat(String(o.total ?? 0));
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);

        setStats({
          products: countFromResponse(productsRes),
          categories: countFromResponse(categoriesRes),
          orders: orders.length,
          revenue: formatNaira(totalRevenue),
        });
      } catch {
        // keep defaults
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Products" value={stats.products} icon="📦" />
        <StatsCard title="Categories" value={stats.categories} icon="📁" />
        <StatsCard title="Orders" value={stats.orders} icon="🛒" />
        <StatsCard title="Revenue" value={stats.revenue} icon="💰" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/admin/products">
              <Button className="w-full justify-start" variant="outline">
                📦 Manage Products
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button className="w-full justify-start" variant="outline">
                🛒 View Orders
              </Button>
            </Link>
            <Link href="/admin/tailoring">
              <Button className="w-full justify-start" variant="outline">
                ✂️ Tailoring Jobs
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button className="w-full justify-start" variant="outline">
                📈 Reports
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Recent Activity</h3>
          <p className="text-gray-500 text-sm">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}
