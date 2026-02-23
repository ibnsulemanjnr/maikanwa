// apps/web/app/(store)/checkout/success/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Spinner, Badge } from "@/components/ui";

type VerifyData =
  | {
      reference: string;
      verified: true;
      alreadyPaid?: true;
      paid?: true;
      orderId: string;
    }
  | {
      reference: string;
      verified: true;
      paid: false;
      paystackStatus?: string;
      orderId: string;
    };

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error?: string };

export default function CheckoutSuccessPage() {
  const sp = useSearchParams();

  // Paystack commonly returns `reference` and sometimes `trxref`
  const reference = useMemo(() => {
    const ref = sp.get("reference")?.trim();
    const trx = sp.get("trxref")?.trim();
    return ref || trx || "";
  }, [sp]);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    if (!reference) {
      setError("No payment reference provided");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/payments/paystack/verify?reference=${encodeURIComponent(reference)}`,
        { cache: "no-store", credentials: "include" },
      );
      const json = (await res.json()) as ApiResponse<VerifyData>;

      if (!json.ok) {
        setData(null);
        setError(json.error || "Payment verification failed. Please try again or contact support.");
        return;
      }

      setData(json.data);

      // If paid, we can nudge user to account/orders page.
      // Keep it simple: you can change the target when orders pages are ready.
      if (
        (json.data as { paid?: boolean; alreadyPaid?: boolean }).paid === true ||
        (json.data as { paid?: boolean; alreadyPaid?: boolean }).alreadyPaid === true
      ) {
        // Optional: auto-route after a short moment
        // router.push(`/account/orders/${json.data.orderId}`);
      }
    } catch (err) {
      setData(null);
      setError(
        (err as Error)?.message || "Network error. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (reference) {
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (!reference) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Payment Status</h1>
          <p className="mt-2 text-gray-600">
            No payment reference found. If you just placed an order, please check your email or
            account.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/orders">
              <Button>View Orders</Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaid =
    (data as { paid?: boolean; alreadyPaid?: boolean })?.paid === true ||
    (data as { paid?: boolean; alreadyPaid?: boolean })?.alreadyPaid === true;
  const isPending = data && (data as { paid?: boolean })?.paid === false;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Payment Status</h1>
            <p className="mt-1 text-sm text-gray-600">
              Reference: <span className="font-mono">{reference}</span>
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Spinner />
              <span className="text-sm">Verifying...</span>
            </div>
          ) : isPaid ? (
            <Badge variant="success">Paid</Badge>
          ) : isPending ? (
            <Badge variant="warning">Pending</Badge>
          ) : error ? (
            <Badge variant="error">Error</Badge>
          ) : (
            <Badge variant="info">Checking</Badge>
          )}
        </div>

        <div className="mt-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {!error && !data && !loading && (
            <p className="text-gray-600">Click verify to confirm your payment.</p>
          )}

          {data && isPaid && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="font-semibold text-[#111827]">Payment confirmed.</p>
              <p className="mt-2 text-sm text-gray-700">
                Order ID: <span className="font-mono">{data.orderId}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">Your order is now being processed.</p>
            </div>
          )}

          {data && isPending && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="font-semibold text-[#111827]">Payment not confirmed yet.</p>
              <p className="mt-2 text-sm text-gray-700">
                Paystack status:{" "}
                <span className="font-mono">{data.paystackStatus || "unknown"}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                If you already paid, click verify again in a moment.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button onClick={verify} disabled={loading}>
            {loading ? "Verifying..." : "Verify Again"}
          </Button>

          {data?.orderId && (
            <Link href="/orders" className="sm:ml-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                View Orders
              </Button>
            </Link>
          )}

          <Link href="/shop">
            <Button variant="outline" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Payments are verified on the server. If verification keeps failing but you were charged,
          contact support with your reference.
        </p>
      </div>
    </div>
  );
}
