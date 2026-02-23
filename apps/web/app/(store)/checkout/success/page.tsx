// apps/web/app/(store)/checkout/success/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
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
    if (!reference) return;
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
        setError(json.error || "Verification failed");
        return;
      }

      setData(json.data);

      // If paid, we can nudge user to account/orders page.
      // Keep it simple: you can change the target when orders pages are ready.
      if ((json.data as any).paid === true || (json.data as any).alreadyPaid === true) {
        // Optional: auto-route after a short moment
        // router.push(`/account/orders/${json.data.orderId}`);
      }
    } catch {
      setData(null);
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Auto-verify once on arrival
    if (reference) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (!reference) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Payment Status</h1>
          <p className="mt-2 text-gray-600">
            Missing payment reference. Please return to your account or try checkout again.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cart">
              <Button variant="outline">Back to Cart</Button>
            </Link>
            <Link href="/shop">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = (data as any)?.paid === true || (data as any)?.alreadyPaid === true;
  const isPending = data && (data as any)?.paid === false;

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

          {/* If/when you create orders routes, switch to `/account/orders` or `/account/orders/${data?.orderId}` */}
          <Link href="/account" className="sm:ml-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Go to Account
            </Button>
          </Link>

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
