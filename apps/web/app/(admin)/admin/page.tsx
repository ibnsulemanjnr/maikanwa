// apps/web/app/(admin)/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/admin";
import { Spinner, Button } from "@/components/ui";

function countFromResponse(res: unknown): number {
  if (!res) return 0;
  if (Array.isArray(res)) return res.length;
  if (Array.isArray(res.results)) return res.results.length;
  if (Array.isArray(res.data)) return res.data.length;
  return 0;
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
          fetch("/api/products", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/admin/orders", { cache: "no-store" }).then((r) => r.json()),
        ]);

        if (!mounted) return;

        const orders = ordersRes?.results || [];
        const totalRevenue = orders.reduce(
          (sum: number, o: { total?: string | number }) =>
            sum + (parseFloat(String(o.total || 0)) || 0),
          0,
        );

        setStats((s) => ({
          ...s,
          products: countFromResponse(productsRes),
          categories: countFromResponse(categoriesRes),
          orders: orders.length,
          revenue: `₦${totalRevenue.toLocaleString()}`,
        }));
      } catch {
        // keep default zeros
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
