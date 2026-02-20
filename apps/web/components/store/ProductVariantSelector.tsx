'use client';

import { cn } from '@/lib/utils';

interface Variant {
  id: string;
  name: string;
  available: boolean;
}

interface ProductVariantSelectorProps {
  label: string;
  variants: Variant[];
  selected: string;
  onSelect: (id: string) => void;
  type?: 'button' | 'color';
}

export default function ProductVariantSelector({ label, variants, selected, onSelect, type = 'button' }: ProductVariantSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#111827] mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => variant.available && onSelect(variant.id)}
            disabled={!variant.available}
            className={cn(
              'px-4 py-2 border rounded-lg text-sm font-medium transition-colors',
              selected === variant.id
                ? 'border-[#1E2A78] bg-[#1E2A78] text-white'
                : 'border-[#E5E7EB] text-[#111827] hover:border-[#1E2A78]',
              !variant.available && 'opacity-50 cursor-not-allowed line-through'
            )}
          >
            {variant.name}
          </button>
        ))}
      </div>
    </div>
  );
}
