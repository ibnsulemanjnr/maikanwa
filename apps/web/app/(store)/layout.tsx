// apps/web/app/(store)/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
