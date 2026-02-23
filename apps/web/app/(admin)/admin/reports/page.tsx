"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Spinner, Alert } from "@/components/ui";

type Summary = {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  ordersCount: number;
  paidOrdersCount: number;
  revenue: number; // in NGN
  averageOrderValue: number; // in NGN
  lowStockCount: number;
  topProducts: Array<{ id: string; title: string; quantity: number; revenue: number }>;
};

function formatNaira(n: number) {
  if (!Number.isFinite(n)) return "₦0";
  return `₦${Math.round(n).toLocaleString()}`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReportsPage() {
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("from", from);
    sp.set("to", to);
    return sp.toString();
  }, [from, to]);

  async function load() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/reports/summary?${qs}`, {
        cache: "no-store",
        credentials: "include",
      });

      // Endpoint may not exist yet → show placeholder analytics
      if (res.status === 404) {
        setSummary(null);
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load reports");

      setSummary(data as Summary);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Reports</h1>
            <p className="mt-1 text-gray-600">
              Sales performance, order metrics, and inventory alerts.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>

            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mt-6">
            {error}
          </Alert>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="text-sm text-gray-600">Orders</div>
              <div className="mt-2 text-2xl font-bold">{summary.ordersCount}</div>
              <div className="mt-1 text-xs text-gray-500">Paid: {summary.paidOrdersCount}</div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="text-sm text-gray-600">Revenue</div>
              <div className="mt-2 text-2xl font-bold">{formatNaira(summary.revenue)}</div>
              <div className="mt-1 text-xs text-gray-500">NGN (paid orders)</div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="text-sm text-gray-600">Avg. Order Value</div>
              <div className="mt-2 text-2xl font-bold">
                {formatNaira(summary.averageOrderValue)}
              </div>
              <div className="mt-1 text-xs text-gray-500">AOV</div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="text-sm text-gray-600">Low Stock Items</div>
              <div className="mt-2 text-2xl font-bold">{summary.lowStockCount}</div>
              <div className="mt-1 text-xs text-gray-500">Below threshold</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111827]">Top Products</h2>
            <p className="mt-1 text-sm text-gray-600">By revenue in selected range.</p>

            {summary.topProducts.length === 0 ? (
              <div className="mt-6 rounded-xl border bg-gray-50 p-5 text-sm text-gray-600">
                No product sales in this range.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-600">
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Qty</th>
                      <th className="py-3 pr-4">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topProducts.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-3 pr-4 font-medium">{p.title}</td>
                        <td className="py-3 pr-4">{p.quantity}</td>
                        <td className="py-3 pr-4">{formatNaira(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#111827]">Reports not connected yet</h2>
          <p className="mt-2 text-gray-600">
            This page becomes live after EPIC 3 (orders), EPIC 4 (payments), and EPIC 6 (admin ops)
            are implemented.
          </p>

          <div className="mt-6 rounded-xl border bg-gray-50 p-5">
            <div className="font-medium text-[#111827]">What will appear here</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Paid orders count + revenue in date range</li>
              <li>Average order value (AOV)</li>
              <li>Top products by quantity/revenue</li>
              <li>Low stock alerts (inventory thresholds)</li>
            </ul>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            Next step: add{" "}
            <code className="bg-black/10 px-2 py-1 rounded">GET /api/admin/reports/summary</code>
            after orders exist.
          </div>
        </div>
      )}
    </div>
  );
}
