import { cn } from '@/lib/utils/cn';

type Variant = 'open' | 'delayed' | 'closed' | 'confirmed' | 'cancelled' | 'completed' | 'default' | 'pill';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  withDot?: boolean;
}

const variantClasses: Record<Variant, string> = {
  open: 'bg-success-bg text-success border-success/20',
  confirmed: 'bg-success-bg text-success border-success/20',
  completed: 'bg-g100/30 text-g600 border-g100',
  delayed: 'bg-warning-bg text-warning-text border-warning/20',
  closed: 'bg-danger-bg text-danger border-danger/20',
  cancelled: 'bg-danger-bg text-danger border-danger/20',
  default: 'bg-g100/30 text-g600 border-g100',
  pill: 'bg-g100/20 text-g800 border-g100/50',
};

const dotColorClasses: Record<Variant, string> = {
  open: 'bg-g400',
  confirmed: 'bg-g400',
  completed: 'bg-g200',
  delayed: 'bg-warning',
  closed: 'bg-danger',
  cancelled: 'bg-danger',
  default: 'bg-g200',
  pill: 'bg-g200',
};

export function Badge({ variant = 'default', children, className, withDot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-tag text-xs font-medium border tracking-label',
        variantClasses[variant],
        className
      )}
    >
      {withDot && (
        <span className={cn('w-[7px] h-[7px] rounded-full flex-shrink-0', dotColorClasses[variant])} />
      )}
      {children}
    </span>
  );
}
