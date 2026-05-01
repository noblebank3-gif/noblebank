import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { path: '/admin', label: 'Super Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out', 'Admin session ended');
    navigate('/login');
  };

  return (
    <div className="min-h-dvh flex bg-surface">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-surface-card border-r border-surface-border">
        <nav className="flex flex-col h-full px-4 py-8">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-navy-900" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Noble Trust</p>
              <p className="text-gold-500 text-[10px] tracking-widest uppercase">Super Admin</p>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <p className="label-text px-2 mb-3">Admin menu</p>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
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
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="border-t border-surface-border pt-4 mt-4">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                <span className="text-navy-900 text-xs font-bold">
                  {user ? getInitials(user.firstName, user.lastName) : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gold-500">Super Admin</p>
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
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-surface-border bg-surface-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-xs text-gold-500 uppercase tracking-widest font-semibold">Admin Console</p>
            <p className="text-sm text-slate-400">All customer accounts and balances</p>
          </div>
          <NavLink
            to="/dashboard"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Customer dashboard
          </NavLink>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
