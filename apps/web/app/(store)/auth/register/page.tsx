// apps/web/app/(store)/auth/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, Alert } from "@/components/ui";

type RegisterPayload = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const payload: RegisterPayload = {
        fullName: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // cookie session is set by server via Set-Cookie automatically
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // expect backend: { message: "..." }
        throw new Error(data?.message || "Registration failed");
      }

      // Success: server should set HTTP-only cookie session
      router.push("/account"); // adjust if your post-login route differs
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1E2A78] to-[#2A3A88] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-[#111827] mb-3">Create Account</h1>
          <p className="text-gray-600 text-lg">Join Maikanwa today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <Button type="submit" fullWidth disabled={isLoading} className="mt-6">
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/auth/login" className="text-[#1E2A78] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
