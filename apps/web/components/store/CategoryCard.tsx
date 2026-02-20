import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';

interface CategoryCardProps {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

export default function CategoryCard({ name, slug, image, productCount }: CategoryCardProps) {
  return (
    <Link href={`/shop/${slug}`}>
      <Card hover className="overflow-hidden">
        <div className="relative aspect-[4/3]">
          <Image src={image} alt={name} fill className="object-cover transition-transform hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-bold text-lg mb-1">{name}</h3>
            {productCount !== undefined && (
              <p className="text-sm text-white/90">{productCount} products</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
