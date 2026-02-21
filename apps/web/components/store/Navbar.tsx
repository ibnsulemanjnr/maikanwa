"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1E2A78] to-[#2A3A88] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
            <span className="text-2xl font-bold text-[#1E2A78]">Maikanwa</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/shop"
              className="px-5 py-2.5 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-lg font-medium transition-all"
            >
              Shop
            </Link>
            <Link
              href="/tailoring"
              className="px-5 py-2.5 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-lg font-medium transition-all"
            >
              Tailoring
            </Link>
            <Link
              href="/about"
              className="px-5 py-2.5 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-lg font-medium transition-all"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden md:block px-5 py-2.5 text-[#1E2A78] font-semibold hover:bg-gray-50 rounded-lg transition-all"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="hidden md:block px-5 py-2.5 bg-[#1E2A78] text-white font-semibold rounded-lg hover:bg-[#2A3A88] transition-all"
            >
              Sign Up
            </Link>

            <Link
              href="/cart"
              className="relative p-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-[#F4B400] text-[#111827] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                0
              </span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/shop"
              className="block px-4 py-3 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-lg font-medium transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/tailoring"
              className="block px-4 py-3 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-lg font-medium transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tailoring
            </Link>
            <Link
              href="/about"
              className="block px-4 py-3 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-lg font-medium transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <Link
                href="/auth/login"
                className="block px-4 py-3 text-[#1E2A78] font-semibold hover:bg-gray-50 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="block px-4 py-3 bg-[#1E2A78] text-white font-semibold rounded-lg hover:bg-[#2A3A88] transition-all text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
