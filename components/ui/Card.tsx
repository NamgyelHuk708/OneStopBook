import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-card border border-[#d0ebe0]',
        hover && 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-g400',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
