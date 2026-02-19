import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">
          Maikanwa
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/shop">Shop</Link>
          <Link href="/tailoring">Tailoring</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
