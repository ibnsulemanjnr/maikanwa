"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Spinner, Alert, Badge } from "@/components/ui";

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  totalKobo: number;
  currency: string;
  createdAt: string;
  items: { id: string; title: string; quantity: string; lineTotalKobo: number }[];
};

function formatNgn(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusColor(status: string) {
  const map: Record<string, "info" | "warning" | "success" | "error"> = {
    PENDING_PAYMENT: "warning",
    PAID: "info",
    PROCESSING: "info",
    SHIPPED: "info",
    DELIVERED: "success",
    CANCELLED: "error",
  };
  return map[status] || "info";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  async function loadOrders() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/auth/login?next=/orders";
          return;
        }
        throw new Error("Failed to load orders");
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "pending") return o.status === "PENDING_PAYMENT" || o.status === "PROCESSING";
    if (filter === "completed") return o.status === "DELIVERED";
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">My Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage your orders</p>
        </div>
        <Link href="/account">
          <Button variant="outline">Back to Account</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="error">
          {error}
          <Button onClick={loadOrders} className="mt-2">
            Retry
          </Button>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All ({orders.length})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
        >
          Pending (
          {orders.filter((o) => o.status === "PENDING_PAYMENT" || o.status === "PROCESSING").length}
          )
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
        >
          Completed ({orders.filter((o) => o.status === "DELIVERED").length})
        </Button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-2xl">📦</span>
          </div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">No orders found</h2>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <Link href="/shop">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-[#111827]">Order #{order.id.slice(0, 8)}</h3>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-[#111827]">{formatNgn(order.totalKobo)}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="font-medium text-[#111827]">
                      {formatNgn(item.lineTotalKobo)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 pt-4 mt-4 flex gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {order.status === "PENDING_PAYMENT" && <Button size="sm">Pay Now</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
