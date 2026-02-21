"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 bg-[#1E2A78] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-[#1E2A78] hidden sm:block">Maikanwa</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link
              href="/shop"
              className="px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/tailoring"
              className="px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
            >
              Tailoring
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <Link
              href="/auth/login"
              className="hidden sm:block px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
            >
              Login
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-[#F4B400] text-[#111827] text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>

            <Link
              href="/account"
              className="hidden sm:flex p-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              aria-label="Toggle menu"
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-2 space-y-1">
            <Link
              href="/shop"
              className="block px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/tailoring"
              className="block px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tailoring
            </Link>
            <Link
              href="/about"
              className="block px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/auth/login"
              className="block px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/account"
              className="block px-4 py-2 text-gray-700 hover:text-[#1E2A78] hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
