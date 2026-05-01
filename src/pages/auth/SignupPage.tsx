import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    await signup(form);
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      toast.success('Account created', 'Welcome to Noble Trust Bank');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
            <Shield className="w-5 h-5 text-navy-900" />
          </div>
          <div>
            <p className="text-white font-semibold leading-tight">Noble Trust Bank</p>
            <p className="text-gold-500 text-xs tracking-widest uppercase">Private Banking</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Open an account</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Step {step} of 2 — {step === 1 ? 'Personal details' : 'Security setup'}
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-surface-border rounded-full overflow-hidden">
            <motion.div
              animate={{ width: step === 1 ? '50%' : '100%' }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-gold rounded-full"
            />
          </div>
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

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                value={form.firstName}
                onChange={update('firstName')}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="First name"
                required
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={update('lastName')}
                placeholder="Last name"
                required
              />
            </div>
            <Input
              label="Email address"
              type="email"
              value={form.email}
              onChange={update('email')}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="you@email.com"
              required
            />
            <Input
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder="+1 (555) 000-0000"
              required
            />
            <Button type="submit" variant="gold" fullWidth size="lg">
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Create password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              helperText="Minimum 8 characters"
              required
              minLength={8}
            />
            <Input
              label="Confirm password"
              type={showPass ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="bg-surface-elevated border border-surface-border rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-slate-300">Account type</p>
              <div className="grid grid-cols-2 gap-2">
                {['Standard', 'Premium'].map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    className="card p-3 text-center text-sm text-slate-300 hover:text-white hover:border-gold-500/30 transition-all duration-150"
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button type="submit" variant="gold" fullWidth isLoading={isLoading}>
                Create account
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-gold-500 hover:text-gold-400 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
