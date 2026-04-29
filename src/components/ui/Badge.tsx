import { cn } from '@/lib/utils';
import type { TransactionStatus } from '@/types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  error:   'bg-red-500/10    text-red-400    border-red-500/20',
  info:    'bg-blue-500/10   text-blue-400   border-blue-500/20',
  neutral: 'bg-slate-500/10  text-slate-400  border-slate-500/20',
  gold:    'bg-gold-500/10   text-gold-500   border-gold-500/20',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge = ({ variant = 'neutral', children, className, dot }: BadgeProps) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
    variants[variant],
    className,
  )}>
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
      'bg-emerald-400': variant === 'success',
      'bg-amber-400':   variant === 'warning',
      'bg-red-400':     variant === 'error',
      'bg-blue-400':    variant === 'info',
      'bg-slate-400':   variant === 'neutral',
      'bg-gold-500':    variant === 'gold',
    })} />}
    {children}
  </span>
);

export const statusBadge = (status: TransactionStatus) => {
  const map: Record<TransactionStatus, { variant: BadgeVariant; label: string }> = {
    completed:  { variant: 'success', label: 'Completed'  },
    pending:    { variant: 'warning', label: 'Pending'    },
    failed:     { variant: 'error',   label: 'Failed'     },
    processing: { variant: 'info',    label: 'Processing' },
  };
  return map[status];
};
