"use client";

import { useState } from "react";
import Link from "next/link";
import { Input, Button, Alert } from "@/components/ui";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setError("Login functionality coming soon");
    }, 1000);
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
          <h1 className="text-4xl font-bold text-[#111827] mb-3">Welcome Back</h1>
          <p className="text-gray-600 text-lg">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Button type="submit" fullWidth disabled={isLoading} className="mt-6">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/auth/register" className="text-[#1E2A78] font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
