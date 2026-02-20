import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          {
            'bg-[#1E2A78] text-white hover:bg-[#162056] focus:ring-[#1E2A78]': variant === 'primary',
            'bg-[#F4B400] text-[#111827] hover:bg-[#D99F00] focus:ring-[#F4B400]': variant === 'secondary',
            'border-2 border-[#1E2A78] text-[#1E2A78] hover:bg-[#1E2A78] hover:text-white focus:ring-[#1E2A78]': variant === 'outline',
            'text-[#1E2A78] hover:bg-[#E5E7EB] focus:ring-[#1E2A78]': variant === 'ghost',
            'bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#EF4444]': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
