// apps/web/app/(admin)/admin/orders/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Badge } from "@/components/ui";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error?: string };

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalKobo: number;
  shippingKobo: number;
  totalKobo: number;
  createdAt: string;
  user?: { fullName?: string | null; email: string; phone?: string | null } | null;
  items: Array<{
    id: string;
    title: string;
    sku?: string | null;
    quantity: string;
    unitPriceKobo: number;
    lineTotalKobo: number;
    variant?: { size?: string | null; color?: string | null } | null;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    status: string;
    reference: string;
    amountKobo: number;
    currency: string;
    createdAt: string;
  }>;
  addressSnapshot?: any;
};

function ngn(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format((kobo || 0) / 100);
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = (params?.id || "").toString();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  async function loadOrder(orderId: string, signal: AbortSignal) {
    setLoading(true);

    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      cache: "no-store",
      signal,
      credentials: "include",
    });
    const json = (await res.json()) as ApiResponse<OrderDetail>;

    if (!json.ok) {
      setOrder(null);
      setError(json.error || "Failed to load order");
      setLoading(false);
      return;
    }

    setOrder(json.data);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    if (!id) return;

    const ac = new AbortController();
    loadOrder(id, ac.signal).catch((e) => {
      if (!ac.signal.aborted) {
        setOrder(null);
        setError(e?.message || "Failed to load order");
        setLoading(false);
      }
    });

    return () => ac.abort();
  }, [id]);

  const customerName = useMemo(() => order?.user?.fullName || "Customer", [order]);
  const customerEmail = useMemo(() => order?.user?.email || "—", [order]);
  const customerPhone = useMemo(() => order?.user?.phone || "—", [order]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
        <div className="rounded-2xl bg-white border border-red-200 p-4 text-red-700">
          {error || "Order not found"}
        </div>
      </div>
    );
  }

  const latestPayment = order.payments?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">
            Order <span className="font-mono">{order.orderNumber}</span>
          </h1>
          <p className="text-sm text-gray-600">
            Created: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={() => router.refresh()}>Refresh</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{order.status}</Badge>
        <Badge variant="warning">{order.paymentStatus}</Badge>
        <Badge variant="default">{order.paymentMethod}</Badge>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-3">Customer</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="font-medium">{customerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium">{customerEmail}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="font-medium">{customerPhone}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-3">Totals</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Subtotal</p>
            <p className="font-semibold">{ngn(order.subtotalKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Shipping</p>
            <p className="font-semibold">{ngn(order.shippingKobo)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-semibold">{ngn(order.totalKobo)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-3">Payment</h2>
        {latestPayment ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Provider</p>
              <p className="font-medium">{latestPayment.provider}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="font-medium">{latestPayment.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reference</p>
              <p className="font-mono text-sm">{latestPayment.reference}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No payment records yet.</p>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr className="border-b">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Variant</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4">
                    <div className="font-medium">{it.title}</div>
                    {it.sku ? <div className="text-xs text-gray-500">SKU: {it.sku}</div> : null}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="text-gray-700">
                      {it.variant?.size ? `Size: ${it.variant.size}` : ""}
                      {it.variant?.color ? ` • Color: ${it.variant.color}` : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-4">{it.quantity}</td>
                  <td className="py-2 pr-4">{ngn(it.unitPriceKobo)}</td>
                  <td className="py-2 pr-4 font-semibold">{ngn(it.lineTotalKobo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {order.addressSnapshot && (
        <div className="rounded-2xl bg-white border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-3">Shipping Address (Snapshot)</h2>
          <pre className="text-xs bg-gray-50 rounded-xl p-3 overflow-auto">
            {JSON.stringify(order.addressSnapshot, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
