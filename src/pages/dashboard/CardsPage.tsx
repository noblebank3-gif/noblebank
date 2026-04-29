import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Snowflake, Eye, EyeOff, MoreHorizontal, Lock, Unlock,
  Globe, CreditCard as CardIcon, Shield, Plus, AlertTriangle,
} from 'lucide-react';
import { useCardStore } from '@/store/cardStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { Card } from '@/types';

const CARD_COLORS = {
  navy:  'bg-gradient-to-br from-[#0f1a2e] via-[#162238] to-[#1e2d4d]',
  gold:  'bg-gradient-to-br from-[#7c5f18] via-[#c9a84c] to-[#fbbf24]',
  slate: 'bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#475569]',
};

const CardVisual = ({
  card, showNumber = false,
}: {
  card: Card;
  showNumber?: boolean;
}) => (
  <div className={`
    relative w-full aspect-[1.586] rounded-2xl p-6 flex flex-col justify-between
    overflow-hidden shadow-card-lg select-none
    ${CARD_COLORS[card.color]}
    ${card.status === 'frozen' ? 'opacity-60' : ''}
  `}>
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white translate-y-1/2 -translate-x-1/2" />
    </div>

    {/* Frozen overlay */}
    {card.status === 'frozen' && (
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-2">
          <Snowflake className="w-10 h-10 text-blue-300" />
          <span className="text-blue-200 text-sm font-medium">Card Frozen</span>
        </div>
      </div>
    )}

    {/* Top row */}
    <div className="flex items-start justify-between z-10 relative">
      <div>
        <p className="text-white/60 text-xs uppercase tracking-widest">Noble Trust</p>
        <p className="text-white text-sm font-semibold mt-0.5 capitalize">{card.type} Card</p>
      </div>
      {/* Chip */}
      <div className="w-10 h-8 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-80" />
    </div>

    {/* Card number */}
    <div className="z-10 relative">
      <p className="font-mono text-white text-lg tracking-widest">
        {showNumber ? `4532 8871 2109 ${card.last4}` : `•••• •••• •••• ${card.last4}`}
      </p>
    </div>

    {/* Bottom row */}
    <div className="flex items-end justify-between z-10 relative">
      <div>
        <p className="text-white/50 text-[10px] uppercase tracking-wider">Card Holder</p>
        <p className="text-white text-sm font-medium mt-0.5">{card.holderName}</p>
      </div>
      <div className="text-right">
        <p className="text-white/50 text-[10px] uppercase tracking-wider">Expires</p>
        <p className="text-white text-sm font-mono mt-0.5">{card.expiryMonth}/{card.expiryYear}</p>
      </div>
      {/* Network logo */}
      <div className="flex items-center">
        {card.network === 'visa' ? (
          <span className="text-white font-bold text-xl italic tracking-tighter">VISA</span>
        ) : (
          <div className="flex">
            <div className="w-7 h-7 rounded-full bg-red-500/80 -mr-3" />
            <div className="w-7 h-7 rounded-full bg-amber-400/80" />
          </div>
        )}
      </div>
    </div>
  </div>
);

const CardItem = ({ card }: { card: Card }) => {
  const { toggleFreeze, togglingId } = useCardStore();
  const [showNumber, setShowNumber] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [freezeModal, setFreezeModal] = useState(false);

  const isToggling = togglingId === card.id;
  const isFrozen   = card.status === 'frozen';

  const spendPercent = card.spendLimit
    ? Math.min((card.spentThisMonth / card.spendLimit) * 100, 100)
    : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card p-6 space-y-5"
      >
        {/* Card visual */}
        <div className="relative group">
          <CardVisual card={card} showNumber={showNumber} />
          <button
            onClick={() => setShowNumber(n => !n)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs flex items-center gap-1.5"
          >
            {showNumber ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showNumber ? 'Hide' : 'Show'} number
          </button>
        </div>

        {/* Card info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardIcon className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white capitalize">{card.type} • {card.network}</p>
              <p className="text-xs text-slate-500">
                {card.isVirtual ? 'Virtual card' : 'Physical card'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isFrozen ? 'info' : card.status === 'active' ? 'success' : 'error'}
              dot
            >
              {isFrozen ? 'Frozen' : card.status}
            </Badge>
            <div className="relative">
              <button
                onClick={() => setShowMenu(m => !m)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-surface-elevated transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-10 w-44 bg-surface-card border border-surface-border rounded-xl shadow-card-lg z-20 overflow-hidden"
                  >
                    {[
                      { label: 'View statements', icon: CardIcon },
                      { label: 'Set spend limit',  icon: Shield   },
                      { label: 'Virtual card',     icon: Globe    },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => setShowMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-surface-elevated transition-colors"
                      >
                        <item.icon className="w-4 h-4 text-slate-500" />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Spend progress */}
        {card.spendLimit && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Monthly spend</span>
              <span className="text-white font-mono">
                {formatCurrency(card.spentThisMonth)} / {formatCurrency(card.spendLimit)}
              </span>
            </div>
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spendPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  spendPercent > 80 ? 'bg-red-400' : spendPercent > 60 ? 'bg-amber-400' : 'bg-gradient-gold'
                }`}
              />
            </div>
            <p className="text-xs text-slate-500">{(100 - spendPercent).toFixed(0)}% remaining this month</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={isFrozen ? 'secondary' : 'danger'}
            size="sm"
            fullWidth
            isLoading={isToggling}
            leftIcon={isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            onClick={() => setFreezeModal(true)}
          >
            {isFrozen ? 'Unfreeze card' : 'Freeze card'}
          </Button>
        </div>
      </motion.div>

      {/* Freeze confirmation modal */}
      <Modal
        isOpen={freezeModal}
        onClose={() => setFreezeModal(false)}
        title={isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-400">
              {isFrozen
                ? 'Unfreezing will re-enable all purchases and ATM withdrawals.'
                : 'Freezing will immediately block all purchases and ATM withdrawals on this card.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setFreezeModal(false)}>
              Cancel
            </Button>
            <Button
              variant={isFrozen ? 'primary' : 'danger'}
              fullWidth
              isLoading={isToggling}
              onClick={async () => {
                await toggleFreeze(card.id);
                setFreezeModal(false);
              }}
            >
              {isFrozen ? 'Unfreeze' : 'Freeze'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const CardsPage = () => {
  const { cards, isLoading, fetchCards } = useCardStore();

  useEffect(() => { fetchCards(); }, [fetchCards]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Cards</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your debit and credit cards</p>
        </div>
        <Button variant="gold" leftIcon={<Plus className="w-4 h-4" />}>
          Add Card
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Cards',  value: isLoading ? '—' : cards.filter(c => c.status === 'active').length },
          { label: 'Frozen Cards',  value: isLoading ? '—' : cards.filter(c => c.status === 'frozen').length },
          { label: 'Total Cards',   value: isLoading ? '—' : cards.length                                    },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="label-text">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <Skeleton className="w-full aspect-[1.586] rounded-xl" />
              <Skeleton className="w-1/2 h-4" />
              <Skeleton className="w-full h-8 rounded-lg" />
            </div>
          ))
        ) : (
          cards.map(card => <CardItem key={card.id} card={card} />)
        )}
      </div>

      {/* Security info */}
      <div className="card p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-gold-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Card Security</p>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            All Noble Trust Bank cards are protected by 3D Secure, real-time fraud monitoring,
            and zero-liability fraud protection. Contact us immediately if you suspect unauthorized use.
          </p>
        </div>
      </div>
    </div>
  );
};
