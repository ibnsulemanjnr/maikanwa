"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Spinner, Alert } from "@/components/ui";
import TailoringStatusBadge from "@/components/store/TailoringStatusBadge";
import MeasurementForm from "@/components/store/MeasurementForm";
import Modal from "@/components/ui/Modal";

type TailoringJob = {
  id: string;
  serviceType: string;
  status: string;
  notes: string | null;
  measurements: any;
  eventDate: string | null;
  fitPreference: string | null;
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
  order: {
    id: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  };
  link: {
    serviceOrderItemId: string;
    fabricOrderItemId: string | null;
  } | null;
  attachments: any[];
};

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  items: {
    id: string;
    title: string;
    productType: string;
    quantity: string;
  }[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getServiceTypeLabel(type: string) {
  const map: Record<string, string> = {
    SEW_FROM_FABRIC: "Sew from Fabric",
    ALTERATION: "Alteration",
    CUSTOM_REQUEST: "Custom Request",
  };
  return map[type] || type;
}

export default function TailoringPage() {
  const [jobs, setJobs] = useState<TailoringJob[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<TailoringJob | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadJobs() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tailoring/jobs", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/auth/login?next=/tailoring";
          return;
        }
        throw new Error("Failed to load tailoring jobs");
      }
      const data = await res.json();
      setJobs(data.data || []);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load tailoring jobs");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders", { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  }

  useEffect(() => {
    loadJobs();
    loadOrders();
  }, []);

  async function handleCreateJob(formData: any) {
    setCreating(true);
    try {
      const res = await fetch("/api/tailoring/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tailoring job");
      }

      await loadJobs();
      setShowCreateModal(false);
    } catch (err) {
      alert((err as Error)?.message || "Failed to create tailoring job");
    } finally {
      setCreating(false);
    }
  }

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
          <h1 className="text-3xl font-bold text-[#111827]">Tailoring Services</h1>
          <p className="text-gray-600 mt-1">Manage your custom tailoring orders</p>
        </div>
        <div className="flex gap-2">
          <Link href="/account">
            <Button variant="outline">Back to Account</Button>
          </Link>
          <Button onClick={() => setShowCreateModal(true)}>New Tailoring Job</Button>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}
          <Button onClick={loadJobs} className="mt-2">
            Retry
          </Button>
        </Alert>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1E2A78] to-[#2D3E9F] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✂️</span>
          </div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">No tailoring jobs yet</h2>
          <p className="text-gray-600 mb-6">Create your first custom tailoring order</p>
          <Button onClick={() => setShowCreateModal(true)}>Create Tailoring Job</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-[#111827]">
                      {getServiceTypeLabel(job.serviceType)}
                    </h3>
                    <TailoringStatusBadge status={job.status as any} />
                  </div>
                  <p className="text-sm text-gray-600">Order #{job.order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-1">Created {formatDate(job.createdAt)}</p>
                </div>
              </div>

              {job.eventDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>📅</span>
                  <span>Event: {formatDate(job.eventDate)}</span>
                </div>
              )}

              {job.fitPreference && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>👔</span>
                  <span>{job.fitPreference}</span>
                </div>
              )}

              {job.notes && <p className="text-sm text-gray-600 line-clamp-2 mt-2">{job.notes}</p>}

              {job.lockedAt && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <span>🔒</span>
                    <span>Locked for production</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          orders={orders}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateJob}
          creating={creating}
        />
      )}

      {/* Job Details Modal */}
      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}

function CreateJobModal({
  orders,
  onClose,
  onCreate,
  creating,
}: {
  orders: Order[];
  onClose: () => void;
  onCreate: (data: any) => void;
  creating: boolean;
}) {
  const [orderId, setOrderId] = useState("");
  const [serviceItemId, setServiceItemId] = useState("");
  const [fabricItemId, setFabricItemId] = useState("");
  const [serviceType, setServiceType] = useState("SEW_FROM_FABRIC");
  const [notes, setNotes] = useState("");
  const [fitPreference, setFitPreference] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [measurements, setMeasurements] = useState<any>({});

  const selectedOrder = orders.find((o) => o.id === orderId);
  const allItems = selectedOrder?.items || [];
  const fabricItems = selectedOrder?.items.filter((i) => i.productType === "FABRIC") || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      orderId,
      serviceOrderItemId: serviceItemId,
      fabricOrderItemId: fabricItemId || undefined,
      serviceType,
      notes: notes || undefined,
      fitPreference: fitPreference || undefined,
      eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
      measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Create Tailoring Job" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-1.5">Order</label>
          <select
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setServiceItemId("");
              setFabricItemId("");
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
          >
            <option value="">Select an order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                Order #{order.id.slice(0, 8)} - {order.status}
              </option>
            ))}
          </select>
        </div>

        {orderId && allItems.length > 0 && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
              >
                <option value="SEW_FROM_FABRIC">Sew from Fabric</option>
                <option value="ALTERATION">Alteration</option>
                <option value="CUSTOM_REQUEST">Custom Request</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Item to Tailor
              </label>
              <select
                value={serviceItemId}
                onChange={(e) => setServiceItemId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
              >
                <option value="">Select item</option>
                {allItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} (x{item.quantity})
                  </option>
                ))}
              </select>
            </div>

            {serviceType === "SEW_FROM_FABRIC" && fabricItems.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">
                  Fabric Item
                </label>
                <select
                  value={fabricItemId}
                  onChange={(e) => setFabricItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
                >
                  <option value="">Select fabric item (optional)</option>
                  {fabricItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} (x{item.quantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Fit Preference
              </label>
              <input
                type="text"
                value={fitPreference}
                onChange={(e) => setFitPreference(e.target.value)}
                placeholder="e.g., Slim fit, Regular fit"
                maxLength={80}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">
                Event Date (Optional)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or preferences"
                maxLength={800}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
              />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" disabled={creating || !serviceItemId} fullWidth>
            {creating ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function JobDetailsModal({ job, onClose }: { job: TailoringJob; onClose: () => void }) {
  return (
    <Modal isOpen onClose={onClose} title="Tailoring Job Details">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Status</span>
          <TailoringStatusBadge status={job.status as any} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Service Type</span>
          <span className="text-sm text-[#111827]">{getServiceTypeLabel(job.serviceType)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Order ID</span>
          <span className="text-sm text-[#111827] font-mono">#{job.order.id.slice(0, 8)}</span>
        </div>

        {job.fitPreference && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Fit Preference</span>
            <span className="text-sm text-[#111827]">{job.fitPreference}</span>
          </div>
        )}

        {job.eventDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Event Date</span>
            <span className="text-sm text-[#111827]">{formatDate(job.eventDate)}</span>
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
            <div className="bg-gray-50 p-3 rounded-lg">
              <pre className="text-xs text-[#111827] overflow-auto">
                {JSON.stringify(job.measurements, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
          <span>Created: {formatDate(job.createdAt)}</span>
          <span>Updated: {formatDate(job.updatedAt)}</span>
        </div>

        {job.lockedAt && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="text-sm text-amber-800 flex items-center gap-2">
              <span>🔒</span>
              <span>This job is locked for production since {formatDate(job.lockedAt)}</span>
            </span>
          </div>
        )}

        <Button onClick={onClose} fullWidth>
          Close
        </Button>
      </div>
    </Modal>
  );
}
