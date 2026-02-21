"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/admin";
import { Spinner, Button } from "@/components/ui";

export default function AdminHome() {
  const [stats, setStats] = useState({ products: 0, categories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([products, categories]) => {
        setStats({
          products: products.ok ? products.data.length : 0,
          categories: categories.ok ? categories.data.length : 0,
        });
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
        <StatsCard title="Orders" value={0} icon="🛒" />
        <StatsCard title="Revenue" value="₦0" icon="💰" />
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
