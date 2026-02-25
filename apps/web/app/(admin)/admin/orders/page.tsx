// apps/web/app/(admin)/admin/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Spinner, Alert } from "@/components/ui";

type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "REFUNDED";

type AdminOrder = {
  id: string;
  orderNumber: string; // e.g. BA9F327F (short code)
  status: OrderStatus;
  total: string; // "12345.00"
  currency: string; // "NGN"
  customerEmail?: string | null;
  customerName?: string | null;
  createdAt: string; // ISO
};

type OrdersResponse = { results: AdminOrder[]; count?: number } | AdminOrder[];

function normalizeOrdersPayload(payload: any): AdminOrder[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function formatMoney(currency: string, amount: string) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return `${currency} ${amount}`;
  return `${currency === "NGN" ? "₦" : currency} ${n.toLocaleString()}`;
}

function getOrderLinkId(o: AdminOrder): string {
  // Prefer real UUID for uniqueness; fall back to orderNumber.
  // Our detail API supports both UUID and 8-char code.
  return (o.id || "").trim() || (o.orderNumber || "").trim();
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  // Filters (UI-ready; API can implement later)
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status) sp.set("status", status);
    return sp.toString();
  }, [q, status]);

  async function loadOrders() {
    setError("");
    setLoading(true);

    try {
      const url = queryString ? `/api/admin/orders?${queryString}` : `/api/admin/orders`;
      const res = await fetch(url, { cache: "no-store", credentials: "include" });

      if (res.status === 404) {
        setOrders([]);
        setError("");
        return;
      }

      const data: OrdersResponse = await res.json().catch(() => [] as any);
      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load orders");
      }

      setOrders(normalizeOrdersPayload(data));
    } catch (e: any) {
      setError(e?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Orders</h1>
            <p className="mt-1 text-gray-600">
              Manage customer orders, statuses, and payment verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadOrders} disabled={loading}>
              Refresh
            </Button>

            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by order number / email (when enabled)"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">All</option>
              <option value="PENDING_PAYMENT">Pending payment</option>
              <option value="PAID">Paid</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mt-6">
            {error}
          </Alert>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">All Orders</h2>
          <div className="text-sm text-gray-500">{orders.length} orders</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-xl border bg-gray-50 p-5">
            <div className="font-medium text-[#111827]">No orders yet</div>
            <p className="mt-1 text-sm text-gray-600">
              Orders will appear here once checkout + order creation and payment confirmation are
              implemented.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/shop">
                <Button variant="outline">Go to Storefront</Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline">Manage Products</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Created</th>
                  <th className="py-3 pr-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const linkId = getOrderLinkId(o);

                  return (
                    <tr key={o.id || o.orderNumber} className="border-b">
                      <td className="py-3 pr-4 font-medium">{o.orderNumber}</td>
                      <td className="py-3 pr-4">
                        <div className="text-[#111827]">{o.customerName || "—"}</div>
                        <div className="text-gray-500">{o.customerEmail || "—"}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{formatMoney(o.currency, o.total)}</td>
                      <td className="py-3 pr-4">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="py-3 pr-2">
                        <Link href={`/admin/orders/${encodeURIComponent(linkId)}`}>
                          <Button variant="outline">View</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
