// apps/web/app/(admin)/admin/layout.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

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

function titleFromPath(path: string) {
  if (path === "/admin") return "Dashboard";
  if (path.startsWith("/admin/products")) return "Products";
  if (path.startsWith("/admin/orders")) return "Orders";
  if (path.startsWith("/admin/tailoring")) return "Tailoring";
  if (path.startsWith("/admin/reports")) return "Reports";
  return "Admin";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse>({ user: null });

  // mobile drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const user = (me as any).user ?? null;

  async function loadMe() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });

      const data = (await res.json()) as MeResponse;
      setMe(data);

      // Guard admin area
      if (!data.user) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (data.user.role !== "ADMIN") {
        router.replace("/account");
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  // close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <div className="p-6 text-gray-600">Loading admin...</div>
      </div>
    );
  }

  // if redirected, avoid flashing admin UI
  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {/* Mobile drawer sidebar */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Overlay */}
            <button
              className="absolute inset-0 bg-black/40"
              aria-label="Close sidebar overlay"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
              <AdminSidebar />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <AdminHeader
            title={title}
            user={user}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
          />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
