export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-600">
        © {new Date().getFullYear()} Maikanwa Clothing. All rights reserved.
      </div>
    </footer>
  );
}
