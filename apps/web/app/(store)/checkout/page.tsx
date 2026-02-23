// apps/web/app/(store)/checkout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Spinner, Badge } from "@/components/ui";

type ShippingMethod = {
  id: string;
  name: string;
  feeKobo: number;
  currency: string;
  rules: unknown;
};

type Address = {
  id: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  country: string;
  state: string | null;
  city: string | null;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  postalCode: string | null;
  isDefault: boolean;
};

type CheckoutContext = {
  cart: null | {
    id: string;
    currency: string;
    subtotalKobo: number;
    itemsCount: number;
  };
  shippingMethods: ShippingMethod[];
  addresses: Address[];
};

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error?: string };

type PaymentMethod = "PAYSTACK" | "CASH_ON_DELIVERY";

function formatNgnFromKobo(kobo: number) {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

function safeStr(v: string | null | undefined) {
  return v ?? "";
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState<CheckoutContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  // selections
  const [shippingMethodId, setShippingMethodId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PAYSTACK");
  const [notes, setNotes] = useState("");

  // logged-in address selection
  const [addressId, setAddressId] = useState<string>("");

  // guest inputs (also used if logged-in user has no address)
  const [guestEmail, setGuestEmail] = useState("");
  const [guestFullName, setGuestFullName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestState, setGuestState] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [guestAddressLine1, setGuestAddressLine1] = useState("");
  const [guestAddressLine2, setGuestAddressLine2] = useState("");
  const [guestLandmark, setGuestLandmark] = useState("");
  const [guestPostalCode, setGuestPostalCode] = useState("");
  const [guestCountry, setGuestCountry] = useState("NG");

  // submission state
  const [submitting, setSubmitting] = useState(false);
  const [codSuccess, setCodSuccess] = useState<null | {
    orderId: string;
    paymentReference: string;
    totalKobo: number;
  }>(null);

  async function loadCheckoutContext() {
    setLoading(true);
    setError(null);
    setCodSuccess(null);

    try {
      const res = await fetch("/api/checkout", {
        cache: "no-store",
        credentials: "include",
      });

      const json = (await res.json()) as ApiResponse<CheckoutContext>;
      if (!json.ok) {
        setCtx(null);
        setError(json.error || "Failed to load checkout");
        return;
      }

      setCtx(json.data);

      // default shipping method (first active)
      const firstShipping = json.data.shippingMethods?.[0];
      if (firstShipping && !shippingMethodId) setShippingMethodId(firstShipping.id);

      // default address (if any)
      const defaultAddr = json.data.addresses?.find((a) => a.isDefault) ?? json.data.addresses?.[0];
      if (defaultAddr && !addressId) setAddressId(defaultAddr.id);
    } catch {
      setCtx(null);
      setError("Failed to load checkout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCheckoutContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cart = ctx?.cart ?? null;

  const shippingMethod = useMemo(() => {
    if (!ctx?.shippingMethods?.length) return null;
    return ctx.shippingMethods.find((s) => s.id === shippingMethodId) ?? ctx.shippingMethods[0];
  }, [ctx, shippingMethodId]);

  const shippingKobo = shippingMethod?.feeKobo ?? 0;
  const subtotalKobo = cart?.subtotalKobo ?? 0;
  const totalKobo = subtotalKobo + shippingKobo;

  const isLoggedIn = (ctx?.addresses?.length ?? 0) > 0 || addressId.length > 0; // heuristic
  const hasSavedAddress = (ctx?.addresses?.length ?? 0) > 0;

  const canSubmit = useMemo(() => {
    if (!cart) return false;
    if (!shippingMethodId) return false;

    // Paystack needs an email if user is guest (backend enforces)
    if (!hasSavedAddress) {
      // guest address required
      if (!guestAddressLine1.trim()) return false;
      if (!guestCity.trim()) return false;
      if (!guestState.trim()) return false;
      if (!guestPhone.trim()) return false;
      if (paymentMethod === "PAYSTACK" && !guestEmail.trim()) return false;
    } else {
      // logged-in: must choose addressId
      if (!addressId) return false;
    }

    return true;
  }, [
    cart,
    shippingMethodId,
    hasSavedAddress,
    addressId,
    guestAddressLine1,
    guestCity,
    guestState,
    guestPhone,
    guestEmail,
    paymentMethod,
  ]);

  async function submitCheckout() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setCodSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        paymentMethod,
        shippingMethodId,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      if (hasSavedAddress) {
        payload.addressId = addressId;
      } else {
        payload.email = paymentMethod === "PAYSTACK" ? guestEmail.trim() : undefined;
        payload.address = {
          fullName: guestFullName.trim() || undefined,
          phone: guestPhone.trim(),
          country: guestCountry.trim() || "NG",
          state: guestState.trim(),
          city: guestCity.trim(),
          addressLine1: guestAddressLine1.trim(),
          addressLine2: guestAddressLine2.trim() || undefined,
          landmark: guestLandmark.trim() || undefined,
          postalCode: guestPostalCode.trim() || undefined,
        };
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiResponse<{
        orderId: string;
        paymentMethod: PaymentMethod;
        paymentReference: string;
        authorizationUrl?: string;
        totalKobo: number;
        message?: string;
      }>;

      if (!json.ok) {
        setError(json.error || "Checkout failed");
        return;
      }

      // Paystack: redirect to authorization URL
      if (json.data.paymentMethod === "PAYSTACK") {
        const url = json.data.authorizationUrl;
        if (!url) {
          setError("Paystack initialization failed (missing authorizationUrl)");
          return;
        }
        window.location.href = url;
        return;
      }

      // COD: show success inline
      setCodSuccess({
        orderId: json.data.orderId,
        paymentReference: json.data.paymentReference,
        totalKobo: json.data.totalKobo,
      });

      // refresh context (cart becomes ORDERED and should no longer be active)
      await loadCheckoutContext();
    } catch {
      setError("Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <h1 className="text-xl font-semibold text-[#111827]">Checkout</h1>
          <p className="mt-2 text-gray-600">Failed to load checkout.</p>
          {error && <p className="mt-3 text-red-700">{error}</p>}
          <div className="mt-6">
            <Link href="/cart">
              <Button variant="outline">Back to Cart</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <h1 className="text-2xl font-semibold text-[#111827]">Checkout</h1>
          <p className="mt-2 text-gray-600">Your cart is empty.</p>
          <div className="mt-6">
            <Link href="/shop">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your order in a few steps.</p>
        </div>
        <Link href="/cart">
          <Button variant="outline">Back to Cart</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {codSuccess && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="success">Order Created</Badge>
            <span className="font-semibold text-[#111827]">Pay on Delivery</span>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Order ID: <span className="font-mono">{codSuccess.orderId}</span>
          </p>
          <p className="text-sm text-gray-700">
            Reference: <span className="font-mono">{codSuccess.paymentReference}</span>
          </p>
          <p className="mt-2 font-semibold text-[#111827]">
            Total: {formatNgnFromKobo(codSuccess.totalKobo)}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            We’ll contact you to confirm delivery. Payment is made when you receive your order.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-[#111827]">Shipping Method</h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose delivery option (fee will be added).
            </p>

            <div className="mt-4">
              <select
                value={shippingMethodId}
                onChange={(e) => setShippingMethodId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1E2A78]/30"
              >
                {ctx.shippingMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} • {formatNgnFromKobo(m.feeKobo)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-[#111827]">Delivery Address</h2>

            {hasSavedAddress ? (
              <>
                <p className="mt-1 text-sm text-gray-600">Select a saved address.</p>

                <div className="mt-4">
                  <select
                    value={addressId}
                    onChange={(e) => setAddressId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#1E2A78]/30"
                  >
                    {ctx.addresses.map((a) => {
                      const label = a.label || "Address";
                      const line = `${safeStr(a.city)}, ${safeStr(a.state)}`;
                      return (
                        <option key={a.id} value={a.id}>
                          {label} • {line} • {a.addressLine1}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-gray-600">
                  Enter your delivery address (guest checkout).
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-[#111827]">Email (Paystack)</label>
                    <input
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Required only if you choose Paystack.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#111827]">Full Name</label>
                    <input
                      value={guestFullName}
                      onChange={(e) => setGuestFullName(e.target.value)}
                      placeholder="Full name"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#111827]">Phone *</label>
                    <input
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="080..."
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#111827]">State *</label>
                    <input
                      value={guestState}
                      onChange={(e) => setGuestState(e.target.value)}
                      placeholder="Kano"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#111827]">City *</label>
                    <input
                      value={guestCity}
                      onChange={(e) => setGuestCity(e.target.value)}
                      placeholder="Kano"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-[#111827]">Address Line 1 *</label>
                    <input
                      value={guestAddressLine1}
                      onChange={(e) => setGuestAddressLine1(e.target.value)}
                      placeholder="Street, house number"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-[#111827]">Address Line 2</label>
                    <input
                      value={guestAddressLine2}
                      onChange={(e) => setGuestAddressLine2(e.target.value)}
                      placeholder="Optional"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#111827]">Landmark</label>
                    <input
                      value={guestLandmark}
                      onChange={(e) => setGuestLandmark(e.target.value)}
                      placeholder="Optional"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#111827]">Postal Code</label>
                    <input
                      value={guestPostalCode}
                      onChange={(e) => setGuestPostalCode(e.target.value)}
                      placeholder="Optional"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#111827]">Country</label>
                    <input
                      value={guestCountry}
                      onChange={(e) => setGuestCountry(e.target.value)}
                      placeholder="NG"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-[#111827]">Payment Method</h2>
            <p className="mt-1 text-sm text-gray-600">Choose how you want to pay.</p>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "PAYSTACK"}
                  onChange={() => setPaymentMethod("PAYSTACK")}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-[#111827]">Paystack (Card/Bank Transfer)</div>
                  <div className="text-sm text-gray-600">Fast confirmation (webhook verified).</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "CASH_ON_DELIVERY"}
                  onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-[#111827]">Pay on Delivery</div>
                  <div className="text-sm text-gray-600">
                    Builds trust — available in selected cities.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-[#111827]">Order Notes</h2>
            <p className="mt-1 text-sm text-gray-600">Optional.</p>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any delivery instructions?"
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 min-h-[110px]"
            />
          </div>
        </div>

        {/* RIGHT: summary */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold text-[#111827]">Order Summary</h2>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-gray-700">
              <span>Items</span>
              <span className="font-semibold text-[#111827]">{cart.itemsCount}</span>
            </div>

            <div className="flex items-center justify-between text-gray-700">
              <span>Subtotal</span>
              <span className="font-semibold text-[#111827]">
                {formatNgnFromKobo(subtotalKobo)}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-700">
              <span>Shipping</span>
              <span className="font-semibold text-[#111827]">
                {formatNgnFromKobo(shippingKobo)}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <span className="font-semibold text-[#111827]">Total</span>
              <span className="text-lg font-bold text-[#1E2A78]">
                {formatNgnFromKobo(totalKobo)}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button className="w-full" disabled={!canSubmit || submitting} onClick={submitCheckout}>
              {submitting
                ? "Processing..."
                : paymentMethod === "PAYSTACK"
                  ? "Pay with Paystack"
                  : "Place Order (Pay on Delivery)"}
            </Button>

            <p className="text-xs text-gray-500">
              Totals are verified on the server. Payments are confirmed by webhook (Paystack).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
