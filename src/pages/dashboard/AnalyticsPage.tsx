import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon } from 'lucide-react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 shadow-card-lg">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300 capitalize">{p.name}:</span>
          <span className="text-white font-mono font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { percentage: number; color: string } }[];
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 shadow-card-lg">
      <p className="text-sm font-medium text-white">{item.name}</p>
      <p className="text-xs text-slate-400">{formatCurrency(item.value)}</p>
      <p className="text-xs text-gold-500">{item.payload.percentage}% of total</p>
    </div>
  );
};

export const AnalyticsPage = () => {
  const { analytics, spendingCategories, isLoading, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const latestMonth   = analytics[analytics.length - 1];
  const prevMonth     = analytics[analytics.length - 2];
  const incomeChange  = latestMonth && prevMonth && prevMonth.income !== 0
    ? ((latestMonth.income  - prevMonth.income)  / prevMonth.income  * 100).toFixed(1)
    : '0';
  const expenseChange = latestMonth && prevMonth && prevMonth.expenses !== 0
    ? ((latestMonth.expenses - prevMonth.expenses) / prevMonth.expenses * 100).toFixed(1)
    : '0';

  const savingsRate = latestMonth?.income
    ? `${((latestMonth.savings / latestMonth.income) * 100).toFixed(0)}%`
    : '0%';

  const axisStyle = { fill: '#64748b', fontSize: 11 };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-0.5">7-month financial overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-20 h-3" />
              <Skeleton className="w-32 h-7" />
            </div>
          ))
        ) : (
          <>
            {[
              {
                label: 'This Month Income',
                value: formatCurrency(latestMonth?.income ?? 0),
                change: `+${incomeChange}%`,
                positive: true,
                icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
                bg: 'bg-emerald-500/10',
              },
              {
                label: 'This Month Expenses',
                value: formatCurrency(latestMonth?.expenses ?? 0),
                change: `${expenseChange}%`,
                positive: Number(expenseChange) < 0,
                icon: <TrendingDown className="w-5 h-5 text-red-400" />,
                bg: 'bg-red-500/10',
              },
              {
                label: 'Net Savings',
                value: formatCurrency(latestMonth?.savings ?? 0),
                change: latestMonth?.savings > 0 ? 'Surplus' : 'Deficit',
                positive: (latestMonth?.savings ?? 0) > 0,
                icon: <DollarSign className="w-5 h-5 text-gold-500" />,
                bg: 'bg-gold-500/10',
              },
              {
                label: 'Savings Rate',
                value: savingsRate,
                change: 'of income',
                positive: true,
                icon: <PieIcon className="w-5 h-5 text-blue-400" />,
                bg: 'bg-blue-500/10',
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="card p-5 space-y-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                  {s.icon}
                </div>
                <p className="label-text">{s.label}</p>
                <p className="text-xl font-bold text-white font-mono">{s.value}</p>
                <p className={`text-xs font-medium ${s.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.change}
                </p>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Income vs Expenses Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="card p-6"
      >
        <h2 className="section-title mb-6">Income vs. Expenses</h2>
        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280} aria-label="Area chart comparing monthly income and expenses over 7 months">
            <AreaChart data={analytics} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f87171" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#243351" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="income"   name="Income"
                stroke="#34d399" fill="url(#incomeGrad)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="expenses" name="Expenses"
                stroke="#f87171" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Bar + Pie row */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Bar chart — savings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card p-6 lg:col-span-3"
        >
          <h2 className="section-title mb-6">Monthly Savings</h2>
          {isLoading ? (
            <Skeleton className="w-full h-56 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220} aria-label="Bar chart showing monthly net savings over 7 months">
              <BarChart data={analytics} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243351" vertical={false} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="savings" name="Savings" radius={[4, 4, 0, 0]}>
                  {analytics.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.savings >= 0 ? '#c9a84c' : '#f87171'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Pie chart — spending breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="card p-6 lg:col-span-2"
        >
          <h2 className="section-title mb-4">Spending Breakdown</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-56">
              <Skeleton className="w-40 h-40 rounded-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={180} aria-label="Donut chart showing spending breakdown by category">
                <PieChart>
                  <Pie
                    data={spendingCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {spendingCategories.map((entry, index) => (
                      <Cell key={index} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2">
                {spendingCategories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-slate-400">{cat.name}</span>
                    <span className="text-white font-mono">{formatCurrency(cat.amount)}</span>
                    <span className="text-slate-500">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
