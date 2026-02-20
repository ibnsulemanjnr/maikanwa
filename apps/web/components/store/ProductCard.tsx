import Link from 'next/link';
import Image from 'next/image';
import { Card, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category?: string;
  inStock?: boolean;
  isNew?: boolean;
}

export default function ProductCard({ id, name, slug, price, image, category, inStock = true, isNew }: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`}>
      <Card hover className="h-full">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
          {isNew && (
            <div className="absolute top-2 left-2">
              <Badge variant="warning">New</Badge>
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="error">Out of Stock</Badge>
            </div>
          )}
        </div>
        <CardBody>
          {category && <p className="text-xs text-gray-500 uppercase mb-1">{category}</p>}
          <h3 className="font-semibold text-[#111827] mb-2 line-clamp-2">{name}</h3>
          <p className="text-lg font-bold text-[#1E2A78]">₦{price.toLocaleString()}</p>
        </CardBody>
      </Card>
    </Link>
  );
}
