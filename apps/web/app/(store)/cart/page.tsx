// apps/web/app/(store)/cart/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Spinner, Badge } from "@/components/ui";

type CartItemProduct = {
  id: string;
  title: string;
  slug: string;
  type: "FABRIC" | "READY_MADE" | "CAP" | "SHOE" | "SERVICE";
  image: string | null;
};

type CartItemVariant = {
  id: string;
  priceKobo: number;
  unit: "METER" | "YARD" | "PIECE" | null;
  product: CartItemProduct;
};

type CartItem = {
  id: string;
  quantity: string; // decimal string
  attachedToCartItemId: string | null;
  inStock: boolean;
  lineTotalKobo: number;
  variant: CartItemVariant;
};

type CartPayload = {
  id: string;
  currency: string;
  subtotalKobo: number;
  items: CartItem[];
};

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error?: string };

const FALLBACK_IMG = "/images/placeholders/product.jpg";

function formatNgnFromKobo(kobo: number) {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

function unitLabel(unit: CartItemVariant["unit"]) {
  if (unit === "METER") return "meter";
  if (unit === "YARD") return "yard";
  if (unit === "PIECE") return "piece";
  return "";
}

function normalizeQty(q: string) {
  // display nicer: "2.00" -> "2"
  const n = Number(q);
  if (!Number.isFinite(n)) return q;
  return Number.isInteger(n) ? String(n) : q;
}

export default function CartPage() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // local editable quantities per item
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  // image fallback per cartItemId (so each Image can fail independently)
  const [imgFailedByItem, setImgFailedByItem] = useState<Record<string, boolean>>({});

  async function loadCart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/items", {
        cache: "no-store",
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<CartPayload>;
      if (json.ok) {
        setCart(json.data);

        const nextDraft: Record<string, string> = {};
        const nextImgFailed: Record<string, boolean> = {};

        for (const it of json.data.items) {
          nextDraft[it.id] = normalizeQty(it.quantity);
          // preserve existing failure flags if already set
          nextImgFailed[it.id] = imgFailedByItem[it.id] ?? false;
        }

        setQtyDraft(nextDraft);
        setImgFailedByItem(nextImgFailed);
      } else {
        setCart(null);
        setError(json.error || "Failed to load cart");
      }
    } catch {
      setCart(null);
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const items = cart?.items ?? [];
    const roots = items.filter((i) => !i.attachedToCartItemId);
    const childrenByParent = new Map<string, CartItem[]>();
    for (const i of items) {
      if (!i.attachedToCartItemId) continue;
      const arr = childrenByParent.get(i.attachedToCartItemId) ?? [];
      arr.push(i);
      childrenByParent.set(i.attachedToCartItemId, arr);
    }
    return { roots, childrenByParent };
  }, [cart]);

  async function updateQuantity(itemId: string) {
    if (!cart) return;
    const qty = qtyDraft[itemId];

    if (!qty || qty.trim() === "") {
      setError("Quantity cannot be empty");
      return;
    }

    const numQty = Number(qty);
    if (isNaN(numQty) || numQty <= 0) {
      setError("Quantity must be a positive number");
      return;
    }

    setBusyItemId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity: qty }),
      });
      const json = (await res.json()) as ApiResponse<CartPayload>;
      if (!json.ok) {
        setError(json.error || "Failed to update quantity");
        return;
      }
      setCart(json.data);
      const nextDraft: Record<string, string> = {};
      for (const it of json.data.items) nextDraft[it.id] = normalizeQty(it.quantity);
      setQtyDraft(nextDraft);
    } catch (err) {
      setError((err as Error)?.message || "Failed to update quantity");
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusyItemId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as ApiResponse<CartPayload>;
      if (!json.ok) {
        setError(json.error || "Failed to remove item");
        return;
      }
      setCart(json.data);

      const nextDraft: Record<string, string> = {};
      for (const it of json.data.items) nextDraft[it.id] = normalizeQty(it.quantity);
      setQtyDraft(nextDraft);

      // remove image-failed flag for removed item
      setImgFailedByItem((p) => {
        const { [itemId]: _, ...rest } = p;
        return rest;
      });
    } catch (err) {
      setError((err as Error)?.message || "Failed to remove item");
    } finally {
      setBusyItemId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  const hasItems = (cart?.items?.length ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Cart</h1>
          <p className="text-gray-600 mt-1">Review items before checkout.</p>
        </div>
        <Link href="/shop">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {!hasItems ? (
        <div className="rounded-2xl bg-white p-10 shadow-sm text-center">
          <h2 className="text-xl font-semibold text-[#111827]">Your cart is empty</h2>
          <p className="mt-2 text-gray-600">Add products to start your order.</p>
          <div className="mt-6">
            <Link href="/shop">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {grouped.roots.map((item) => {
              const imgFailed = !!imgFailedByItem[item.id];
              const src = imgFailed ? FALLBACK_IMG : item.variant.product.image || FALLBACK_IMG;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image
                        src={src}
                        alt={item.variant.product.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                        onError={() => setImgFailedByItem((p) => ({ ...p, [item.id]: true }))}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/product/${item.variant.product.slug}`}
                            className="font-semibold text-[#111827] hover:text-[#1E2A78]"
                          >
                            {item.variant.product.title}
                          </Link>

                          <div className="mt-1 text-sm text-gray-600">
                            {formatNgnFromKobo(item.variant.priceKobo)}
                            {item.variant.unit ? ` / ${unitLabel(item.variant.unit)}` : ""}
                          </div>

                          {!item.inStock && (
                            <div className="mt-2">
                              <Badge variant="error">Out of Stock</Badge>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-[#111827]">
                            {formatNgnFromKobo(item.lineTotalKobo)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Line total</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Qty</label>
                          <input
                            value={qtyDraft[item.id] ?? normalizeQty(item.quantity)}
                            onChange={(e) =>
                              setQtyDraft((p) => ({ ...p, [item.id]: e.target.value }))
                            }
                            inputMode="decimal"
                            className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2A78]/30"
                          />
                          <Button
                            variant="outline"
                            onClick={() => updateQuantity(item.id)}
                            disabled={busyItemId === item.id}
                          >
                            {busyItemId === item.id ? "..." : "Update"}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => removeItem(item.id)}
                            disabled={busyItemId === item.id}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Attached items (e.g., tailoring service linked to fabric) */}
                      {(grouped.childrenByParent.get(item.id) ?? []).length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                          {(grouped.childrenByParent.get(item.id) ?? []).map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2"
                            >
                              <div className="text-sm">
                                <span className="font-medium text-[#111827]">
                                  {child.variant.product.title}
                                </span>{" "}
                                <span className="text-gray-600">(attached)</span>
                              </div>
                              <div className="text-sm font-semibold text-[#111827]">
                                {formatNgnFromKobo(child.lineTotalKobo)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-semibold text-[#111827]">Order Summary</h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold text-[#111827]">
                  {formatNgnFromKobo(cart?.subtotalKobo ?? 0)}
                </span>
              </div>

              {/* Shipping calculated at checkout */}
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <span className="font-semibold text-[#111827]">Estimated Total</span>
                <span className="text-lg font-bold text-[#1E2A78]">
                  {formatNgnFromKobo(cart?.subtotalKobo ?? 0)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/checkout" className="block">
                <Button className="w-full">Proceed to Checkout</Button>
              </Link>
              <p className="text-xs text-gray-500">
                Trust option: Pay on Delivery available in selected cities.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
