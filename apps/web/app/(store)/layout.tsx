import Navbar from '@/components/store/Navbar';
import Footer from '@/components/store/Footer';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
