import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { useAccountStore } from '@/store/accountStore';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TransactionSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategoryIcon } from '@/lib/categoryIcons';
import type { Transaction, TransactionStatus, TransactionCategory } from '@/types';

const CATEGORIES: TransactionCategory[] = [
  'transfer', 'payment', 'deposit', 'withdrawal',
  'investment', 'fee', 'salary', 'shopping', 'utilities', 'travel',
];

const TransactionDetailRow = ({ txn, delay }: { txn: Transaction; delay: number }) => {
  const [expanded, setExpanded] = useState(false);
  const { variant, label } = statusBadge(txn.status);
  const isCredit = txn.type === 'credit';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className="border-b border-surface-border last:border-0"
    >
      <button
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-elevated transition-colors duration-150 text-left"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <CategoryIcon category={txn.category} />

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{txn.description}</p>
            <p className="text-xs text-slate-500">{txn.merchant ?? txn.counterparty ?? '—'}</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400">{formatDate(txn.date, 'long')}</p>
            <p className="text-xs text-slate-600 capitalize">{txn.category}</p>
          </div>
          <div className="flex sm:justify-end items-center gap-3">
            <Badge variant={variant} dot>{label}</Badge>
            <span className={`text-sm font-semibold font-mono ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
              {isCredit ? '+' : '−'}{formatCurrency(txn.amount, txn.currency)}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 ml-14"
        >
          <div className="bg-surface-elevated rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Reference',    value: txn.reference },
              { label: 'Date',         value: formatDate(txn.date, 'long') },
              { label: 'Type',         value: txn.type.charAt(0).toUpperCase() + txn.type.slice(1) },
              { label: 'Category',     value: txn.category.charAt(0).toUpperCase() + txn.category.slice(1) },
              txn.counterparty ? { label: 'Counterparty', value: txn.counterparty } : null,
              txn.processedAt  ? { label: 'Processed',    value: formatDate(txn.processedAt, 'long') } : null,
            ].filter(Boolean).map((item) => (
              <div key={item!.label}>
                <p className="text-xs text-slate-500 mb-0.5">{item!.label}</p>
                <p className="text-sm text-white font-mono">{item!.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export const TransactionsPage = () => {
  const { transactions, isLoadingTransactions, fetchTransactions } = useAccountStore();
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter]     = useState<'all' | 'credit' | 'debit'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'all'>('all');

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !search || [t.description, t.merchant, t.reference, t.counterparty]
        .some(s => s?.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus   = statusFilter   === 'all' || t.status   === statusFilter;
      const matchesType     = typeFilter     === 'all' || t.type     === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [transactions, search, statusFilter, typeFilter, categoryFilter]);

  const hasFilters = statusFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || search;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  const totalCredit  = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit   = filtered.filter(t => t.type === 'debit' ).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} transactions found</p>
        </div>
        <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Filtered Total',  value: filtered.length, suffix: 'transactions', color: 'text-white'        },
          { label: 'Total Inflow',    value: formatCurrency(totalCredit),  color: 'text-emerald-400' },
          { label: 'Total Outflow',   value: formatCurrency(totalDebit),   color: 'text-red-400'     },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="label-text">{s.label}</p>
            <p className={`text-xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Filters</span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="w-full h-10 bg-surface-elevated border border-surface-border rounded-lg pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as TransactionStatus | 'all')}
            className="h-10 bg-surface-elevated border border-surface-border rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'all' | 'credit' | 'debit')}
            className="h-10 bg-surface-elevated border border-surface-border rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          >
            <option value="all">All Types</option>
            <option value="credit">Credit (Inflow)</option>
            <option value="debit">Debit (Outflow)</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 border ${
              categoryFilter === 'all'
                ? 'bg-gold-500/10 text-gold-500 border-gold-500/30'
                : 'bg-surface-elevated text-slate-400 border-surface-border hover:text-white'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 border capitalize ${
                categoryFilter === cat
                  ? 'bg-gold-500/10 text-gold-500 border-gold-500/30'
                  : 'bg-surface-elevated text-slate-400 border-surface-border hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-3 px-4 py-3 border-b border-surface-border">
          <p className="label-text">Transaction</p>
          <p className="label-text">Date</p>
          <p className="label-text text-right">Amount</p>
        </div>

        {isLoadingTransactions ? (
          Array.from({ length: 6 }).map((_, i) => <TransactionSkeleton key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map((txn, i) => (
            <TransactionDetailRow key={txn.id} txn={txn} delay={i * 0.03} />
          ))
        ) : (
          <div className="py-20 text-center space-y-2">
            <p className="text-slate-400 font-medium">No transactions match your filters</p>
            <button
              onClick={clearFilters}
              className="text-xs text-gold-500 hover:text-gold-400 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
