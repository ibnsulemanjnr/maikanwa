import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PriceDisplay({ price, originalPrice, currency = '₦', size = 'md', className }: PriceDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-bold text-[#1E2A78]', sizeClasses[size])}>
        {currency}{price.toLocaleString()}
      </span>
      {originalPrice && originalPrice > price && (
        <span className="text-gray-400 line-through text-sm">
          {currency}{originalPrice.toLocaleString()}
        </span>
      )}
    </div>
  );
}
