import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-semibold">
            Maikanwa Admin
          </Link>
          <nav className="text-sm text-gray-600">
            <Link href="/admin">Dashboard</Link>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
