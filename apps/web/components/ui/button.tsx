import * as React from 'react';
import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export function Button({ className, variant = 'primary', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        variant === 'primary'
          ? 'bg-black text-white hover:bg-black/90 focus:ring-black'
          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
        className,
      )}
      {...props}
    />
  );
}
