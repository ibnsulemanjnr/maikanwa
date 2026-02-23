"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Spinner, Alert } from "@/components/ui";

type TailoringStatus =
  | "MEASUREMENT_PENDING"
  | "CUTTING"
  | "SEWING"
  | "QA"
  | "READY"
  | "DELIVERED"
  | "CANCELED";

type TailoringServiceType = "SEW_FROM_FABRIC" | "ALTERATION" | "CUSTOM_REQUEST";

type AdminTailoringJob = {
  id: string;
  status: TailoringStatus;
  serviceType: TailoringServiceType;
  orderId: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type JobsResponse = { results: AdminTailoringJob[] } | AdminTailoringJob[];

function normalizeJobs(payload: any): AdminTailoringJob[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function statusLabel(s: TailoringStatus) {
  return s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function AdminTailoringPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<AdminTailoringJob[]>([]);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status) sp.set("status", status);
    return sp.toString();
  }, [q, status]);

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {
      MEASUREMENT_PENDING: 0,
      CUTTING: 0,
      SEWING: 0,
      QA: 0,
      READY: 0,
      DELIVERED: 0,
      CANCELED: 0,
    };
    for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;
    return counts;
  }, [jobs]);

  async function load() {
    setError("");
    setLoading(true);

    try {
      const url = qs ? `/api/admin/tailoring/jobs?${qs}` : `/api/admin/tailoring/jobs`;
      const res = await fetch(url, { cache: "no-store", credentials: "include" });

      // endpoint may not exist yet
      if (res.status === 404) {
        setJobs([]);
        return;
      }

      const data: JobsResponse = await res.json().catch(() => [] as any);
      if (!res.ok) throw new Error((data as any)?.message || "Failed to load tailoring jobs");

      setJobs(normalizeJobs(data));
    } catch (e: any) {
      setError(e?.message || "Failed to load tailoring jobs");
      setJobs([]);
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
            <h1 className="text-xl font-semibold">Tailoring</h1>
            <p className="mt-1 text-gray-600">Track tailoring jobs from measurement to delivery.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by order number / customer email (when enabled)"
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
              <option value="MEASUREMENT_PENDING">Measurement Pending</option>
              <option value="CUTTING">Cutting</option>
              <option value="SEWING">Sewing</option>
              <option value="QA">QA</option>
              <option value="READY">Ready</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mt-6">
            {error}
          </Alert>
        )}
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {(
          [
            "MEASUREMENT_PENDING",
            "CUTTING",
            "SEWING",
            "QA",
            "READY",
            "DELIVERED",
            "CANCELED",
          ] as TailoringStatus[]
        ).map((s) => (
          <div key={s} className="rounded-2xl bg-white p-4 shadow-sm border">
            <div className="text-xs text-gray-600">{statusLabel(s)}</div>
            <div className="mt-2 text-2xl font-bold text-[#111827]">{pipeline[s] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">Jobs</h2>
          <div className="text-sm text-gray-500">{jobs.length} jobs</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-6 rounded-xl border bg-gray-50 p-5">
            <div className="font-medium text-[#111827]">No tailoring jobs yet</div>
            <p className="mt-1 text-sm text-gray-600">
              Jobs will appear here after EPIC 5 (tailoring services) is connected to orders.
            </p>
            <div className="mt-4 text-sm text-gray-600">
              Next API:{" "}
              <code className="bg-black/10 px-2 py-1 rounded">GET /api/admin/tailoring/jobs</code>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Service</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b">
                    <td className="py-3 pr-4 font-medium">
                      {j.orderNumber || j.orderId.slice(0, 8)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-[#111827]">{j.customerName || "—"}</div>
                      <div className="text-gray-500">{j.customerEmail || "—"}</div>
                    </td>
                    <td className="py-3 pr-4">{j.serviceType}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2">{new Date(j.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
