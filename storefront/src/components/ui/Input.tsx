/**
 * Input Component
 * 
 * Elegant form input with floating label animation.
 */

'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          id={inputId}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => setIsFocused(e.target.value.length > 0)}
          className={cn(
            'peer w-full px-4 py-3 pt-6',
            'bg-white border-2 rounded-xl',
            'text-primary-900 text-base',
            'transition-all duration-200 ease-out',
            'focus:outline-none focus:border-primary-900',
            'placeholder-transparent',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-primary-200 hover:border-primary-300',
            className
          )}
          placeholder={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2',
            'text-primary-400 pointer-events-none',
            'transition-all duration-200 ease-out',
            'peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary-600',
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base',
            'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs',
            error && 'text-red-500 peer-focus:text-red-500'
          )}
        >
          {label}
        </label>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-500 animate-fade-in"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
