import {
  Briefcase, ShoppingBag, Plane, Zap,
  ArrowUpDown, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, CreditCard, Building2,
} from 'lucide-react';
import type { TransactionCategory } from '@/types';

const iconMap: Record<TransactionCategory, React.ElementType> = {
  salary:     Briefcase,
  shopping:   ShoppingBag,
  travel:     Plane,
  utilities:  Zap,
  transfer:   ArrowUpDown,
  deposit:    ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  investment: TrendingUp,
  payment:    CreditCard,
  fee:        Building2,
};

const colorMap: Record<TransactionCategory, string> = {
  salary:     'text-emerald-400 bg-emerald-500/10',
  shopping:   'text-pink-400   bg-pink-500/10',
  travel:     'text-blue-400   bg-blue-500/10',
  utilities:  'text-amber-400  bg-amber-500/10',
  transfer:   'text-purple-400 bg-purple-500/10',
  deposit:    'text-emerald-400 bg-emerald-500/10',
  withdrawal: 'text-red-400    bg-red-500/10',
  investment: 'text-gold-500   bg-gold-500/10',
  payment:    'text-blue-400   bg-blue-500/10',
  fee:        'text-slate-400  bg-slate-500/10',
};

export const CategoryIcon = ({
  category,
  size = 'md',
}: {
  category: TransactionCategory;
  size?: 'sm' | 'md';
}) => {
  const Icon = iconMap[category] ?? Building2;
  const colors = colorMap[category] ?? 'text-slate-400 bg-slate-500/10';
  const dims = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={`${dims} rounded-full ${colors} flex items-center justify-center shrink-0`}
      aria-hidden="true">
      <Icon className={iconSize} />
    </div>
  );
};
