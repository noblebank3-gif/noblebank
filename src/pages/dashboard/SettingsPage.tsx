import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Shield, CreditCard, Globe, Moon,
  ChevronRight, Check, LogOut, Trash2, Key, Smartphone,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ checked, onChange, disabled }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked ? 'true' : 'false'}
    aria-label={checked ? 'Enabled' : 'Disabled'}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:outline-none ${
      checked ? 'bg-gold-500' : 'bg-surface-border'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
      checked ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </button>
);

const SettingRow = ({
  icon: Icon, label, description, right, onClick, danger = false,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 transition-colors duration-150 text-left ${
      onClick ? (danger ? 'hover:bg-red-500/5' : 'hover:bg-surface-elevated') : 'cursor-default'
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10' : 'bg-surface-elevated'}`}>
      <Icon className={`w-4 h-4 ${danger ? 'text-red-400' : 'text-slate-400'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0">
      {right ?? (onClick && !danger && <ChevronRight className="w-4 h-4 text-slate-500" />)}
    </div>
  </button>
);

export const SettingsPage = () => {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [saving, setSaving]           = useState(false);
  const [savingToggle, setSavingToggle] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    email:     user?.email     ?? '',
    phone:     user?.phone     ?? '',
    country:   user?.country   ?? '',
  });

  const [notifications, setNotifications] = useState(user?.notifications ?? true);
  const [twoFactor,     setTwoFactor]     = useState(user?.twoFactor     ?? false);
  const [darkMode]                        = useState(true);
  const [mktEmails,     setMktEmails]     = useState(false);

  // Sync form when user loads or updates in the store
  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      phone:     user.phone ?? '',
      country:   user.country ?? '',
    });
    setNotifications(user.notifications);
    setTwoFactor(user.twoFactor);
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        firstName: profile.firstName,
        lastName:  profile.lastName,
        phone:     profile.phone,
        country:   profile.country,
      });
      updateUser(updated);
      toast.success('Profile updated', 'Your changes have been saved');
    } catch (err: unknown) {
      toast.error('Save failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (field: 'notifications' | 'twoFactor', value: boolean) => {
    if (field === 'notifications') setNotifications(value);
    if (field === 'twoFactor')     setTwoFactor(value);
    setSavingToggle(field);
    try {
      const updated = await authService.updateProfile({ [field]: value });
      updateUser(updated);
    } catch {
      // Revert on failure
      if (field === 'notifications') setNotifications(!value);
      if (field === 'twoFactor')     setTwoFactor(!value);
      toast.error('Update failed', 'Could not save preference');
    } finally {
      setSavingToggle(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out');
    navigate('/login');
  };

  const sections = [
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          icon: Bell,
          label: 'Push notifications',
          description: 'Transaction alerts and account activity',
          right: (
            <Toggle
              checked={notifications}
              onChange={v => handleToggle('notifications', v)}
              disabled={savingToggle === 'notifications'}
            />
          ),
        },
        {
          icon: Globe,
          label: 'Marketing emails',
          description: 'News, offers, and product updates',
          right: <Toggle checked={mktEmails} onChange={setMktEmails} />,
        },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        {
          icon: Shield,
          label: 'Two-factor authentication',
          description: 'Extra security via authenticator app',
          right: (
            <div className="flex items-center gap-2">
              {twoFactor && <Badge variant="success" dot>Active</Badge>}
              <Toggle
                checked={twoFactor}
                onChange={v => handleToggle('twoFactor', v)}
                disabled={savingToggle === 'twoFactor'}
              />
            </div>
          ),
        },
        {
          icon: Key,
          label: 'Change password',
          description: 'Update your account password',
          onClick: () => toast.info('Change password', 'Feature coming soon'),
        },
        {
          icon: Smartphone,
          label: 'Active sessions',
          description: 'Manage devices logged in to your account',
          onClick: () => toast.info('Sessions', 'Feature coming soon'),
        },
      ],
    },
    {
      title: 'Preferences',
      icon: Moon,
      items: [
        {
          icon: Moon,
          label: 'Dark mode',
          description: 'Always on for Noble Trust Bank',
          right: <Toggle checked={darkMode} onChange={() => {}} disabled />,
        },
        {
          icon: Globe,
          label: 'Language',
          description: 'English (United States)',
          onClick: () => toast.info('Language', 'Feature coming soon'),
        },
        {
          icon: CreditCard,
          label: 'Default currency',
          description: 'USD — US Dollar',
          onClick: () => toast.info('Currency', 'Feature coming soon'),
        },
      ],
    },
    {
      title: 'Account',
      icon: User,
      danger: true,
      items: [
        {
          icon: LogOut,
          label: 'Sign out',
          description: 'Log out from this device',
          onClick: handleLogout,
          danger: true,
        },
        {
          icon: Trash2,
          label: 'Close account',
          description: 'Permanently delete your Noble Trust account',
          onClick: () => toast.error('Close account', 'Please contact support to close your account'),
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card p-6 space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center">
            <span className="text-navy-900 text-xl font-bold">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{user?.firstName} {user?.lastName}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="gold">{user?.tier?.toUpperCase()} CLIENT</Badge>
              <p className="text-xs text-slate-500">
                Member since {user?.joinedAt ? new Date(user.joinedAt).getFullYear() : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            value={profile.firstName}
            onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
          />
          <Input
            label="Last name"
            value={profile.lastName}
            onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
          />
          <Input
            label="Email address"
            type="email"
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            className="col-span-2"
            disabled
          />
          <Input
            label="Phone number"
            type="tel"
            value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
          />
          <Input
            label="Country"
            value={profile.country}
            onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
            placeholder="e.g. United States"
          />
        </div>

        <Button
          variant="gold"
          onClick={handleSaveProfile}
          isLoading={saving}
          leftIcon={saving ? undefined : <Check className="w-4 h-4" />}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </motion.div>

      {/* Settings sections */}
      {sections.map((section, si) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: (si + 1) * 0.07 }}
          className="card overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-surface-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{section.title}</p>
          </div>
          <div className="divide-y divide-surface-border">
            {section.items.map((item) => (
              <SettingRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                description={item.description}
                right={'right' in item ? item.right : undefined}
                onClick={'onClick' in item ? item.onClick : undefined}
                danger={'danger' in item ? item.danger : false}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
