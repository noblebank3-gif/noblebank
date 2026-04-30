import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ArrowLeftRight, CreditCard,
  BarChart3, Settings, LogOut, Shield, Bell,
  Menu, X, ChevronRight, CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAccountStore } from '@/store/accountStore';
import { notificationService } from '@/services/api';
import { cn, getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import type { Notification } from '@/types';

const navItemsDisplay = [
  { path: '/dashboard',              label: 'Overview',     icon: LayoutDashboard },
  { path: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight  },
  { path: '/dashboard/cards',        label: 'Cards',        icon: CreditCard      },
  { path: '/dashboard/analytics',    label: 'Analytics',    icon: BarChart3       },
  { path: '/dashboard/settings',     label: 'Settings',     icon: Settings        },
];

const NOTIF_ICONS: Record<Notification['type'], string> = {
  success: 'bg-emerald-500/10 text-emerald-400',
  info:    'bg-blue-500/10 text-blue-400',
  warning: 'bg-amber-500/10 text-amber-400',
  alert:   'bg-red-500/10 text-red-400',
};

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout }    = useAuthStore();
  const { fetchAccounts }   = useAccountStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifs,      setNotifs]      = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    notificationService.getNotifications()
      .then(setNotifs)
      .catch(() => {});
  }, []);

  // Close notif panel on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const unreadCount = notifs.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await notificationService.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    const unread = notifs.filter(n => !n.read);
    await Promise.all(unread.map(n => notificationService.markRead(n.id)));
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out', 'You have been securely logged out');
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn('flex flex-col h-full', mobile ? 'px-4 py-6' : 'px-4 py-8')}>
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-navy-900" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Noble Trust</p>
          <p className="text-gold-500 text-[10px] tracking-widest uppercase">Private Bank</p>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <p className="label-text px-2 mb-3">Main menu</p>
        {navItemsDisplay.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
                : 'text-slate-400 hover:text-white hover:bg-surface-elevated',
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-gold-500' : 'text-slate-500 group-hover:text-white')} />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-gold-500/60" />}
              </>
            )}
          </NavLink>
        ))}

        <div className="my-4 border-t border-surface-border" />
        <p className="label-text px-2 mb-3">Quick action</p>
        <NavLink
          to="/dashboard/transfer"
          onClick={() => mobile && setSidebarOpen(false)}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
            isActive
              ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
              : 'text-slate-400 hover:text-white hover:bg-surface-elevated',
          )}
        >
          {({ isActive }) => (
            <>
              <ArrowLeftRight className={cn('w-4 h-4 shrink-0', isActive ? 'text-gold-500' : 'text-slate-500 group-hover:text-white')} />
              Send Money
            </>
          )}
        </NavLink>
      </div>

      <div className="border-t border-surface-border pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
            <span className="text-navy-900 text-xs font-bold">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gold-500 capitalize">{user?.tier} Client</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh flex bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-navy-900 focus:rounded-lg focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-surface-card border-r border-surface-border">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-surface-card border-r border-surface-border z-50 lg:hidden"
            >
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
              <Sidebar mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-surface-border bg-surface-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-surface-elevated"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 bg-surface-card border border-surface-border rounded-2xl shadow-card-lg z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">Notifications</p>
                        {unreadCount > 0 && (
                          <span className="bg-gold-500/20 text-gold-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-gold-500 transition-colors"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
                      {notifs.length === 0 ? (
                        <div className="py-10 text-center text-slate-500 text-sm">
                          No notifications
                        </div>
                      ) : (
                        notifs.map(n => (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => handleMarkRead(n.id)}
                            className={cn(
                              'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-elevated',
                              !n.read && 'bg-gold-500/3',
                            )}
                          >
                            <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', NOTIF_ICONS[n.type].split(' ')[0], 'bg-current')} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn('text-xs font-semibold truncate', n.read ? 'text-slate-300' : 'text-white')}>
                                  {n.title}
                                </p>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">
              <span className="text-navy-900 text-xs font-bold">
                {user ? getInitials(user.firstName, user.lastName) : 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
