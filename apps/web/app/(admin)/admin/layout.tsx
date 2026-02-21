"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
  { href: "/admin/tailoring", label: "Tailoring", icon: "✂️" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E2A78] rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-xl font-bold text-[#111827]">Maikanwa Admin</span>
            </Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-[#1E2A78]">
              ← Back to Store
            </Link>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        <aside className="w-64 bg-white border-r border-[#E5E7EB] min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-[#1E2A78] text-white"
                    : "text-gray-700 hover:bg-[#FAFAFA]",
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
