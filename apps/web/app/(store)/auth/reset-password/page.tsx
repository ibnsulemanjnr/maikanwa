"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button, Alert } from "@/components/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token") || "";
  const email = sp.get("email") || "";

  const invalidLink = useMemo(() => !token || !email, [token, email]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Reset failed");

      setDone(true);
      setTimeout(() => router.push("/auth/login"), 800);
    } catch (err: any) {
      setError(err?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (invalidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <Alert variant="error">Invalid reset link.</Alert>
          <div className="mt-6 text-center">
            <Link href="/auth/forgot-password" className="text-[#1E2A78] font-bold hover:underline">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-[#111827]">Reset password</h1>
          <p className="mt-2 text-gray-600">Set a new password for {email}.</p>

          {error && (
            <Alert variant="error" className="mt-6">
              {error}
            </Alert>
          )}

          {done ? (
            <Alert variant="success" className="mt-6">
              Password updated. Redirecting to login...
            </Alert>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-5">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/auth/login" className="text-[#1E2A78] font-bold hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
