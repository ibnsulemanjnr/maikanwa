"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Alert } from "@/components/ui";

type MeResponse =
  | { user: null }
  | {
      user: {
        id: string;
        email: string;
        role: "CUSTOMER" | "ADMIN";
        fullName: string | null;
        phone: string | null;
      };
    };

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse>({ user: null });
  const [error, setError] = useState("");

  async function loadMe() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as MeResponse;
      setMe(data);

      if (!data.user) {
        router.replace("/auth/login?next=/account");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setError("");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/auth/login");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Logout failed");
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-gray-600">Loading account...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
        <Button onClick={loadMe}>Retry</Button>
      </div>
    );
  }

  if (!me.user) return null; // router already redirected

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="mt-1 text-gray-600">Welcome back.</p>
        </div>
        <Button onClick={logout}>Logout</Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Full Name</div>
          <div className="mt-1 font-medium">{me.user.fullName ?? "—"}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Email</div>
          <div className="mt-1 font-medium">{me.user.email}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Phone</div>
          <div className="mt-1 font-medium">{me.user.phone ?? "—"}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Role</div>
          <div className="mt-1 font-medium">{me.user.role}</div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border p-4">
        <div className="font-medium">My Orders</div>
        <div className="mt-1 text-sm text-gray-600">
          Placeholder: we’ll connect this to orders in EPIC 3.
        </div>
      </div>
    </div>
  );
}
