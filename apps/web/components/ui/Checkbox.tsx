import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'w-4 h-4 text-[#1E2A78] border-[#E5E7EB] rounded',
            'focus:ring-2 focus:ring-[#1E2A78] focus:ring-offset-0',
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="ml-2 text-sm text-[#111827] cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
