import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBg?: string;
  delay?: number;
}

export const StatCard = ({
  label, value, change, changeLabel, icon, iconBg = 'bg-blue-500/10', delay = 0,
}: StatCardProps) => {
  const isPositive = (change ?? 0) > 0;
  const isNeutral  = change === 0 || change === undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] }}
      className="card p-5 space-y-3 hover:border-surface-elevated transition-colors duration-200"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
        {icon}
      </div>

      <div>
        <p className="label-text">{label}</p>
        <p className="text-2xl font-bold text-white font-mono mt-1">{value}</p>
      </div>

      {change !== undefined && (
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-medium',
          isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-400' : 'text-red-400',
        )}>
          {isNeutral ? (
            <Minus className="w-3 h-3" />
          ) : isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {!isNeutral && `${Math.abs(change)}%`}
          {changeLabel && <span className="text-slate-500 font-normal ml-0.5">{changeLabel}</span>}
        </div>
      )}
    </motion.div>
  );
};
