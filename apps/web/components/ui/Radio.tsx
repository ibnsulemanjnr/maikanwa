import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const radioId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={cn(
            'w-4 h-4 text-[#1E2A78] border-[#E5E7EB]',
            'focus:ring-2 focus:ring-[#1E2A78] focus:ring-offset-0',
            className
          )}
          {...props}
        />
        {label && (
          <label htmlFor={radioId} className="ml-2 text-sm text-[#111827] cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
