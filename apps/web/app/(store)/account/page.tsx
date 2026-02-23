"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Alert, Spinner, Badge } from "@/components/ui";

type User = {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  fullName: string | null;
  phone: string | null;
};

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [error, setError] = useState("");

  async function loadData() {
    setError("");
    setLoading(true);
    try {
      const [meRes, ordersRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store", credentials: "include" }),
        fetch("/api/orders", { cache: "no-store", credentials: "include" }),
      ]);

      const meData = await meRes.json();
      if (!meData.user) {
        router.replace("/auth/login?next=/account");
        return;
      }
      setUser(meData.user);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const orders = ordersData.orders || [];
        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter(
            (o: { status: string }) => o.status === "PENDING_PAYMENT" || o.status === "PROCESSING",
          ).length,
          completedOrders: orders.filter((o: { status: string }) => o.status === "DELIVERED")
            .length,
        });
      }
    } catch (err) {
      setError((err as Error)?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.replace("/auth/login");
      router.refresh();
    } catch (err) {
      setError((err as Error)?.message || "Logout failed");
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">My Account</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.fullName || user.email}</p>
        </div>
        <Button onClick={logout} variant="outline">
          Logout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/orders"
          className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-[#111827] mt-1">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xl">📦</span>
            </div>
          </div>
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-[#111827] mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-amber-600 text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-[#111827] mt-1">{stats.completedOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-600 text-xl">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-[#111827] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/orders">
            <Button variant="outline" fullWidth>
              View Orders
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" fullWidth>
              Browse Products
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" fullWidth>
              View Cart
            </Button>
          </Link>
          <Link href="/tailoring">
            <Button variant="outline" fullWidth>
              Tailoring Services
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Details */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#111827]">Account Details</h2>
          {user.role === "ADMIN" && <Badge variant="info">Admin</Badge>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Full Name</div>
            <div className="mt-1 font-medium text-[#111827]">{user.fullName || "—"}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Email</div>
            <div className="mt-1 font-medium text-[#111827]">{user.email}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Phone</div>
            <div className="mt-1 font-medium text-[#111827]">{user.phone || "—"}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Account Type</div>
            <div className="mt-1 font-medium text-[#111827]">{user.role}</div>
          </div>
        </div>
      </div>

      {user.role === "ADMIN" && (
        <div className="rounded-2xl bg-gradient-to-br from-[#1E2A78] to-[#2A3A88] p-6 shadow-sm text-white">
          <h2 className="text-xl font-semibold mb-2">Admin Access</h2>
          <p className="text-white/80 mb-4">Manage products, orders, and view reports</p>
          <Link href="/admin">
            <Button variant="outline" className="bg-white text-[#1E2A78] hover:bg-gray-100">
              Go to Admin Dashboard
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
