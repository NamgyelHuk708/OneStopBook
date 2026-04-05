import { cn } from '@/lib/utils/cn';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-g400 text-g50 hover:bg-g600 disabled:opacity-50',
  secondary:
    'bg-g50 text-g800 border border-[0.5px] border-g100 hover:border-g400 hover:text-g400 disabled:opacity-50',
  ghost:
    'bg-transparent text-g800 hover:bg-g100/30 disabled:opacity-50',
  danger:
    'bg-danger-bg text-danger border border-danger-DEFAULT hover:bg-red-100 disabled:opacity-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-pill font-medium transition-all inline-flex items-center justify-center gap-2 cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
