import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export const Skeleton = ({ className, rounded }: SkeletonProps) => (
  <div className={cn(
    'relative overflow-hidden bg-surface-elevated',
    rounded ? 'rounded-full' : 'rounded-lg',
    className,
  )}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
  </div>
);

export const AccountCardSkeleton = () => (
  <div className="rounded-2xl bg-surface-card border border-surface-border p-6 space-y-4">
    <div className="flex justify-between">
      <Skeleton className="w-24 h-4" />
      <Skeleton className="w-10 h-4" />
    </div>
    <Skeleton className="w-48 h-8 mt-2" />
    <div className="flex gap-3 mt-4">
      <Skeleton className="w-20 h-8 rounded-lg" />
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
  </div>
);

export const TransactionSkeleton = () => (
  <div className="flex items-center gap-4 p-4">
    <Skeleton className="w-10 h-10 shrink-0" rounded />
    <div className="flex-1 space-y-2">
      <Skeleton className="w-32 h-4" />
      <Skeleton className="w-20 h-3" />
    </div>
    <Skeleton className="w-20 h-4" />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="rounded-2xl bg-surface-card border border-surface-border p-5 space-y-3">
    <Skeleton className="w-8 h-8 rounded-lg" />
    <Skeleton className="w-16 h-3" />
    <Skeleton className="w-28 h-7" />
  </div>
);
