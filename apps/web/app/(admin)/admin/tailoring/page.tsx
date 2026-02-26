"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Spinner, Alert } from "@/components/ui";
import TailoringStatusBadge from "@/components/store/TailoringStatusBadge";
import Modal from "@/components/ui/Modal";

type TailoringStatus =
  | "MEASUREMENT_PENDING"
  | "CUTTING"
  | "SEWING"
  | "QA"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

type TailoringServiceType = "SEW_FROM_FABRIC" | "ALTERATION" | "CUSTOM_REQUEST";

type AdminTailoringJob = {
  id: string;
  status: TailoringStatus;
  serviceType: TailoringServiceType;
  orderId: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  measurements?: any;
  eventDate?: string | null;
  fitPreference?: string | null;
  lockedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const ALLOWED_NEXT: Record<TailoringStatus, TailoringStatus[]> = {
  MEASUREMENT_PENDING: ["CUTTING", "CANCELLED"],
  CUTTING: ["SEWING", "CANCELLED"],
  SEWING: ["QA", "CANCELLED"],
  QA: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

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
  const [selectedJob, setSelectedJob] = useState<AdminTailoringJob | null>(null);
  const [status, setStatus] = useState<string>("");

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {
      MEASUREMENT_PENDING: 0,
      CUTTING: 0,
      SEWING: 0,
      QA: 0,
      READY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (!status) return jobs;
    return jobs.filter((j) => j.status === status);
  }, [jobs, status]);

  async function load() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/tailoring/jobs", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load tailoring jobs");

      const data = await res.json();
      setJobs(data.results || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load tailoring jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(jobId: string, newStatus: TailoringStatus, note?: string) {
    try {
      const res = await fetch(`/api/tailoring/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, note }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      await load();
      setSelectedJob(null);
    } catch (err) {
      alert((err as Error)?.message || "Failed to update status");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Tailoring Management</h1>
            <p className="mt-1 text-gray-600">Track and manage tailoring jobs</p>
          </div>

          <Button variant="outline" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>

        <div className="mt-6">
          <label className="text-sm text-gray-600">Filter by Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full md:w-64 rounded-xl border px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="MEASUREMENT_PENDING">Measurement Pending</option>
            <option value="CUTTING">Cutting</option>
            <option value="SEWING">Sewing</option>
            <option value="QA">QA</option>
            <option value="READY">Ready</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
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
            "CANCELLED",
          ] as TailoringStatus[]
        ).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? "" : s)}
            className={`rounded-2xl bg-white p-4 shadow-sm border transition-all hover:shadow-md ${
              status === s ? "ring-2 ring-[#1E2A78]" : ""
            }`}
          >
            <div className="text-xs text-gray-600">{statusLabel(s)}</div>
            <div className="mt-2 text-2xl font-bold text-[#111827]">{pipeline[s] ?? 0}</div>
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111827]">Jobs</h2>
          <div className="text-sm text-gray-500">{filteredJobs.length} jobs</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="mt-6 rounded-xl border bg-gray-50 p-8 text-center">
            <div className="text-4xl mb-3">✂️</div>
            <div className="font-medium text-[#111827]">No tailoring jobs found</div>
            <p className="mt-1 text-sm text-gray-600">
              {status
                ? "Try changing the filter"
                : "Jobs will appear here once customers create them"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-[#111827] mb-1">Order #{job.orderNumber}</div>
                    <div className="text-sm text-gray-600">
                      {job.customerName || job.customerEmail}
                    </div>
                  </div>
                  <TailoringStatusBadge status={job.status} />
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  {job.serviceType.replace(/_/g, " ")}
                </div>

                {job.eventDate && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <span>📅</span>
                    <span>Event: {new Date(job.eventDate).toLocaleDateString()}</span>
                  </div>
                )}

                {job.lockedAt && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <span>🔒</span>
                      <span>Locked</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}

function JobDetailsModal({
  job,
  onClose,
  onUpdateStatus,
}: {
  job: AdminTailoringJob;
  onClose: () => void;
  onUpdateStatus: (jobId: string, status: TailoringStatus, note?: string) => void;
}) {
  const [newStatus, setNewStatus] = useState<TailoringStatus>(job.status);
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const allowedStatuses = ALLOWED_NEXT[job.status] || [];

  const handleUpdate = async () => {
    if (newStatus === job.status) return;
    setUpdating(true);
    await onUpdateStatus(job.id, newStatus, note || undefined);
    setUpdating(false);
  };

  return (
    <Modal isOpen onClose={onClose} title="Tailoring Job Details" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600">Order</span>
            <div className="text-sm text-[#111827] font-mono mt-1">#{job.orderNumber}</div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Status</span>
            <div className="mt-1">
              <TailoringStatusBadge status={job.status} />
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Customer</span>
            <div className="text-sm text-[#111827] mt-1">{job.customerName || "—"}</div>
            <div className="text-xs text-gray-500">{job.customerEmail}</div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Service Type</span>
            <div className="text-sm text-[#111827] mt-1">{job.serviceType.replace(/_/g, " ")}</div>
          </div>
        </div>

        {job.fitPreference && (
          <div>
            <span className="text-sm font-medium text-gray-600">Fit Preference</span>
            <div className="text-sm text-[#111827] mt-1">{job.fitPreference}</div>
          </div>
        )}

        {job.eventDate && (
          <div>
            <span className="text-sm font-medium text-gray-600">Event Date</span>
            <div className="text-sm text-[#111827] mt-1">
              {new Date(job.eventDate).toLocaleDateString()}
            </div>
          </div>
        )}

        {job.notes && (
          <div>
            <span className="text-sm font-medium text-gray-600 block mb-2">Notes</span>
            <p className="text-sm text-[#111827] bg-gray-50 p-3 rounded-lg">{job.notes}</p>
          </div>
        )}

        {job.measurements && (
          <div>
            <span className="text-sm font-medium text-gray-600 block mb-2">Measurements</span>
            <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-auto">
              <pre className="text-xs text-[#111827]">
                {JSON.stringify(job.measurements, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {allowedStatuses.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-medium text-[#111827] mb-3">Update Status</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TailoringStatus)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={job.status}>{statusLabel(job.status)} (Current)</option>
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note about this status change"
                  rows={2}
                  maxLength={800}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <Button
                onClick={handleUpdate}
                disabled={updating || newStatus === job.status}
                fullWidth
              >
                {updating ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        )}

        {job.lockedAt && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="text-sm text-amber-800 flex items-center gap-2">
              <span>🔒</span>
              <span>Locked since {new Date(job.lockedAt).toLocaleString()}</span>
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={onClose} variant="outline" fullWidth>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
