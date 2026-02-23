"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, Button, Alert } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Request failed");

      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-[#111827]">Forgot password</h1>
          <p className="mt-2 text-gray-600">
            Enter your email. If it exists, you’ll receive a reset link.
          </p>

          {error && (
            <Alert variant="error" className="mt-6">
              {error}
            </Alert>
          )}

          {done ? (
            <Alert variant="success" className="mt-6">
              If the email exists, a reset link has been sent. Check your inbox (and spam).
            </Alert>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
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
