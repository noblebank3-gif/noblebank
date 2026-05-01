import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

export const LoginPage = () => {
  const navigate   = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email, password);
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      toast.success('Welcome back', 'Logged in to Noble Trust Bank');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-dvh flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,168,76,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(30,45,77,0.6),transparent_60%)]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
            <Shield className="w-5 h-5 text-navy-900" />
          </div>
          <div>
            <p className="text-white font-semibold leading-tight">Noble Trust</p>
            <p className="text-gold-500 text-xs tracking-widest uppercase">Bank</p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="font-display text-5xl font-bold text-white leading-tight">
              Banking<br />
              <span className="text-transparent bg-clip-text bg-gradient-gold">
                Redefined.
              </span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed max-w-sm">
              Private banking services crafted for those who demand excellence in every transaction.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: 'Assets Under Management', value: '$2.4B+' },
              { label: 'Global Clients',           value: '18,000+' },
              { label: 'Countries Served',         value: '42' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4">
                <p className="text-2xl font-bold text-gold-500 font-mono">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="relative z-10 text-slate-600 text-sm">
          © {new Date().getFullYear()} Noble Trust Bank. All rights reserved.
        </p>
      </div>

      {/* Right — Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center">
              <Shield className="w-4 h-4 text-navy-900" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Noble Trust Bank</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Sign in</h2>
            <p className="text-slate-400 mt-1 text-sm">Access your private banking account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@nobletrust.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-surface-border accent-gold-500" />
                Remember me
              </label>
              <button type="button" className="text-gold-500 hover:text-gold-400 transition-colors">
                Forgot password?
              </button>
            </div>

            <Button type="submit" variant="gold" fullWidth isLoading={isLoading} size="lg">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400">
            New to Noble Trust?{' '}
            <Link to="/signup" className="text-gold-500 hover:text-gold-400 transition-colors font-medium">
              Open an account
            </Link>
          </p>

          <div className="flex items-center gap-2 justify-center text-xs text-slate-600">
            <Lock className="w-3 h-3" />
            <span>256-bit SSL encrypted connection</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
