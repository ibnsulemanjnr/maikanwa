'use client';

import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function QuantitySelector({ value, onChange, min = 1, max = 999, step = 1, className }: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + step);
    }
  };

  return (
    <div className={cn('inline-flex items-center border border-[#E5E7EB] rounded-lg', className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="px-3 py-2 hover:bg-[#FAFAFA] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const newValue = parseInt(e.target.value) || min;
          if (newValue >= min && newValue <= max) {
            onChange(newValue);
          }
        }}
        className="w-16 text-center border-x border-[#E5E7EB] py-2 focus:outline-none"
        min={min}
        max={max}
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="px-3 py-2 hover:bg-[#FAFAFA] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
