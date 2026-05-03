import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle, XCircle, Copy, RotateCcw,
  Building2, User, DollarSign, FileText, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useAccountStore } from '@/store/accountStore';
import { useTransferStore } from '@/store/transferStore';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import type { Currency } from '@/types';

type Step = 'form' | 'review' | 'processing' | 'success' | 'error';

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD — US Dollar'      },
  { value: 'GBP', label: 'GBP — British Pound'  },
  { value: 'EUR', label: 'EUR — Euro'            },
  { value: 'NGN', label: 'NGN — Nigerian Naira'  },
  { value: 'AED', label: 'AED — UAE Dirham'      },
];

const BANKS = [
  'Noble Trust Bank',
  'JPMorgan Chase',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'HSBC',
  'Barclays',
  'Deutsche Bank',
  'Standard Chartered',
  'Other',
];

export const TransferPage = () => {
  const { accounts, fetchAccounts, fetchTransactions } = useAccountStore();
  const { status, reference, error, initiateTransfer, reset } = useTransferStore();

  const [step, setStep]           = useState<Step>('form');
  const [ownAccount, setOwnAccount] = useState(false);
  const [form, setForm] = useState({
    fromAccountId:   accounts[0]?.id ?? '',
    toAccountId:     '',
    toAccountNumber: '',
    toBankName:      'Noble Trust Bank',
    toName:          '',
    amount:          '',
    currency:        'USD' as Currency,
    description:     '',
    reference:       '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  useEffect(() => {
    if (accounts.length && !form.fromAccountId) {
      setForm(f => ({ ...f, fromAccountId: accounts[0].id }));
    }
  }, [accounts]);

  // When switching to own-account mode, pre-fill destination fields
  const handleOwnAccountToggle = (value: boolean) => {
    setOwnAccount(value);
    if (value) {
      const dest = accounts.find(a => a.id !== form.fromAccountId);
      if (dest) {
        setForm(f => ({
          ...f,
          toAccountId:     dest.id,
          toAccountNumber: dest.accountNumber,
          toBankName:      'Noble Trust Bank',
          toName:          dest.name,
        }));
      }
    } else {
      setForm(f => ({ ...f, toAccountId: '', toAccountNumber: '', toBankName: 'Noble Trust Bank', toName: '' }));
    }
    setErrors({});
  };

  // When own-account destination changes, sync fields
  const handleDestAccountChange = (destId: string) => {
    const dest = accounts.find(a => a.id === destId);
    if (!dest) return;
    setForm(f => ({
      ...f,
      toAccountId:     dest.id,
      toAccountNumber: dest.accountNumber,
      toBankName:      'Noble Trust Bank',
      toName:          dest.name,
    }));
  };

  const handleSourceAccountChange = (sourceId: string) => {
    setForm(f => {
      const next = { ...f, fromAccountId: sourceId };
      if (!ownAccount || f.toAccountId !== sourceId) return next;

      const dest = accounts.find(a => a.id !== sourceId);
      return dest
        ? {
            ...next,
            toAccountId:     dest.id,
            toAccountNumber: dest.accountNumber,
            toBankName:      'Noble Trust Bank',
            toName:          dest.name,
          }
        : {
            ...next,
            toAccountId:     '',
            toAccountNumber: '',
            toBankName:      'Noble Trust Bank',
            toName:          '',
          };
    });
  };

  useEffect(() => {
    if (status === 'success') setStep('success');
    if (status === 'error')   setStep('error');
  }, [status]);

  const fromAccount = accounts.find(a => a.id === form.fromAccountId);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.toAccountNumber) e.toAccountNumber = 'Required';
    if (!form.toBankName)      e.toBankName      = 'Required';
    if (!form.toName)          e.toName          = 'Required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount';
    if (fromAccount && Number(form.amount) > fromAccount.balance)
      e.amount = 'Insufficient balance';
    if (ownAccount && form.toAccountId === form.fromAccountId)
      e.toAccountNumber = 'Choose a different destination account';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep('review');
  };

  const handleSend = async () => {
    setStep('processing');
    await initiateTransfer({
      fromAccountId:   form.fromAccountId,
      toAccountId:     form.toAccountId || undefined,
      toAccountNumber: form.toAccountNumber,
      toBankName:      form.toBankName,
      toName:          form.toName,
      amount:          Number(form.amount),
      currency:        form.currency,
      description:     form.description || 'Bank Transfer',
      reference:       form.reference,
    });
    // Refresh balances and transactions after transfer attempt
    await Promise.all([fetchAccounts(), fetchTransactions()]);
  };

  const handleReset = () => {
    reset();
    setStep('form');
    setOwnAccount(false);
    setForm(f => ({ ...f, toAccountId: '', toAccountNumber: '', toBankName: 'Noble Trust Bank', toName: '', amount: '', description: '', reference: '' }));
    setErrors({});
  };

  const copyRef = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      toast.success('Copied', 'Reference copied to clipboard');
    }
  };

  const accountOptions = accounts.map(a => ({
    value: a.id,
    label: `${a.name} — ${formatCurrency(a.balance, a.currency)} ${a.accountNumber}`,
  }));

  const bankOptions = BANKS.map(b => ({ value: b, label: b }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Send Money</h1>
        <p className="text-slate-400 text-sm mt-0.5">Domestic and international wire transfers</p>
      </div>

      {/* Progress indicator */}
      {step === 'form' || step === 'review' ? (
        <div className="flex items-center gap-3">
          {(['form', 'review'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                s === step
                  ? 'bg-gradient-gold text-navy-900'
                  : step === 'review' && i === 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-surface-elevated text-slate-500'
              }`}>
                {step === 'review' && i === 0 ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${s === step ? 'text-white font-medium' : 'text-slate-500'}`}>
                {s === 'form' ? 'Transfer details' : 'Review & confirm'}
              </span>
              {i < 1 && <ArrowRight className="w-4 h-4 text-slate-600" />}
            </div>
          ))}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {/* FORM STEP */}
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleReview} className="card p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-white mb-4">From</h2>
                <Select
                  label="Source account"
                  value={form.fromAccountId}
                  onChange={e => handleSourceAccountChange(e.target.value)}
                  options={accountOptions}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-border" />
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-surface-card px-3">
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">To</h2>
                  <button
                    type="button"
                    onClick={() => handleOwnAccountToggle(!ownAccount)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
                      ownAccount
                        ? 'bg-gold-500/10 text-gold-500 border-gold-500/30'
                        : 'bg-surface-elevated text-slate-400 border-surface-border hover:text-white'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {ownAccount ? 'Own account' : 'Transfer to own account'}
                  </button>
                </div>

                {ownAccount ? (
                  <Select
                    label="Destination account"
                    value={form.toAccountId}
                    onChange={e => handleDestAccountChange(e.target.value)}
                    options={accounts
                      .filter(a => a.id !== form.fromAccountId)
                      .map(a => ({ value: a.id, label: `${a.name} — ${formatCurrency(a.balance, a.currency)} ${a.accountNumber}` }))}
                    error={errors.toAccountNumber}
                  />
                ) : (
                  <>
                    <Input
                      label="Recipient name"
                      value={form.toName}
                      onChange={e => setForm(f => ({ ...f, toName: e.target.value }))}
                      leftIcon={<User className="w-4 h-4" />}
                      placeholder="John Smith"
                      error={errors.toName}
                      required
                    />
                    <Input
                      label="Account / IBAN number"
                      value={form.toAccountNumber}
                      onChange={e => setForm(f => ({ ...f, toAccountNumber: e.target.value }))}
                      leftIcon={<Building2 className="w-4 h-4" />}
                      placeholder="GB29NWBK60161331926819"
                      error={errors.toAccountNumber}
                      required
                    />
                    <Select
                      label="Recipient bank"
                      value={form.toBankName}
                      onChange={e => setForm(f => ({ ...f, toBankName: e.target.value }))}
                      options={[{ value: '', label: 'Select bank…' }, ...bankOptions]}
                      error={errors.toBankName}
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Amount"
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  error={errors.amount}
                  required
                />
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}
                  options={CURRENCIES}
                />
              </div>

              <Input
                label="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                leftIcon={<FileText className="w-4 h-4" />}
                placeholder="Payment reference or note"
              />

              {fromAccount && form.amount && (
                <div className="bg-surface-elevated rounded-xl p-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Remaining after transfer</span>
                  <span className="font-mono font-semibold text-white">
                    {formatCurrency(fromAccount.balance - Number(form.amount), fromAccount.currency)}
                  </span>
                </div>
              )}

              <Button type="submit" variant="gold" fullWidth size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Review Transfer
              </Button>
            </form>
          </motion.div>
        )}

        {/* REVIEW STEP */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
          >
            <div className="card p-6 space-y-6">
              <h2 className="text-base font-semibold text-white">Confirm Transfer</h2>

              <div className="bg-surface-elevated rounded-xl p-5 space-y-4">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">You are sending</p>
                  <p className="text-4xl font-bold text-white font-mono mt-1">
                    {formatCurrency(Number(form.amount), form.currency)}
                  </p>
                </div>
                <div className="border-t border-surface-border pt-4 space-y-3">
                  {[
                    { label: 'From',         value: fromAccount?.name ?? '—' },
                    { label: 'To',           value: form.toName              },
                    { label: 'Bank',         value: form.toBankName          },
                    { label: 'Account',      value: form.toAccountNumber     },
                    { label: 'Description',  value: form.description || '—'  },
                    { label: 'Fee',          value: 'Waived (Private client)' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-white font-medium text-right max-w-[60%] break-words">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400">
                  Please verify all details before confirming. International transfers may take 1–3 business days.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setStep('form')}>
                  Edit
                </Button>
                <Button variant="gold" fullWidth onClick={handleSend} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Confirm & Send
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-12 flex flex-col items-center gap-6 text-center"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-surface-border" />
              <div className="absolute inset-0 rounded-full border-4 border-t-gold-500 border-r-gold-500/30 border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-3 rounded-full bg-gold-500/10 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gold-500" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-white">Processing Transfer</p>
              <p className="text-slate-400 text-sm mt-1">Securely routing your payment…</p>
            </div>
          </motion.div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, type: 'spring', damping: 20 }}
            className="card p-10 flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <div>
              <p className="text-2xl font-bold text-white">Transfer Successful!</p>
              <p className="text-slate-400 text-sm mt-1">
                {formatCurrency(Number(form.amount), form.currency)} sent to {form.toName}
              </p>
            </div>
            {reference && (
              <div className="bg-surface-elevated rounded-xl px-5 py-3 flex items-center gap-3 w-full max-w-xs">
                <div className="flex-1">
                  <p className="text-xs text-slate-400">Reference</p>
                  <p className="text-sm font-mono text-white mt-0.5">{reference}</p>
                </div>
                <button onClick={copyRef} className="text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
            <Button variant="secondary" onClick={handleReset} leftIcon={<RotateCcw className="w-4 h-4" />}>
              New Transfer
            </Button>
          </motion.div>
        )}

        {/* ERROR */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-10 flex flex-col items-center gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Transfer Failed</p>
              <p className="text-slate-400 text-sm mt-1">{error ?? 'An unexpected error occurred'}</p>
            </div>
            <Button variant="secondary" onClick={handleReset} leftIcon={<RotateCcw className="w-4 h-4" />}>
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
