'use client';

import Image from 'next/image';
import Button from '@/components/ui/Button';

interface CartItemProps {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ id, name, image, price, quantity, variant, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-4 border-b border-[#E5E7EB]">
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
        <Image src={image} alt={name} fill className="object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#111827] truncate">{name}</h3>
        {variant && <p className="text-sm text-gray-500">{variant}</p>}
        <p className="text-[#1E2A78] font-bold mt-1">₦{price.toLocaleString()}</p>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => onRemove(id)}
          className="text-gray-400 hover:text-[#EF4444]"
          aria-label="Remove item"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(id, quantity - 1)}
            disabled={quantity <= 1}
            className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] rounded hover:bg-[#FAFAFA] disabled:opacity-50"
          >
            -
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button
            onClick={() => onUpdateQuantity(id, quantity + 1)}
            className="w-7 h-7 flex items-center justify-center border border-[#E5E7EB] rounded hover:bg-[#FAFAFA]"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
