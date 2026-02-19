import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Maikanwa Clothing</h1>
      <p className="mt-2 text-gray-600">
        Fabrics • Ready-made • Caps • Shoes • Tailoring Services
      </p>

      <div className="mt-6 flex gap-3">
        <Button as-child={undefined}> {/* keep simple for now */}
          <a href="/shop">Browse Shop</a>
        </Button>
        <Button variant="secondary">
          <a href="/tailoring">Tailoring</a>
        </Button>
      </div>
    </div>
  );
}
