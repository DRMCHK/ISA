'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateKeyPair } from '@/lib/encryption';
import { validateStrongPassword } from '@/lib/utils';

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: '12+ characters', ok: password.length >= 12 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Symbol', ok: /[!@#$%^&*()_+=[\]{};':"\\|,.<>/?`~\-]/.test(password) },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const strength = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][passed] ?? '';
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < passed ? colors[passed] : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(({ label, ok }) => (
          <span key={label} className={`flex items-center gap-1 text-xs ${ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            {ok ? <CheckCircle size={11} /> : <XCircle size={11} />} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwError = form.password ? validateStrongPassword(form.password) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const pwErr = validateStrongPassword(form.password);
    if (pwErr) { toast.error(pwErr); return; }

    setLoading(true);

    // Generate E2E keypair client-side
    const { publicKey, privateKey } = generateKeyPair();

    // Store private key ONLY in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('isa_privateKey', privateKey);
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, publicKey }),
    });

    setLoading(false);
    const data = (await res.json()) as { error?: string };

    if (!res.ok) {
      toast.error(data.error ?? 'Registration failed');
    } else {
      toast.success('Account created! Please sign in.');
      router.push('/login');
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create account</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Join the ISA Link community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
            <input id="name" type="text" required className="input" placeholder="Jane Doe"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
            <input id="username" type="text" required className="input" placeholder="jane_doe"
              pattern="[a-zA-Z0-9_-]{3,30}" title="3-30 characters: letters, numbers, _ or -"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
          <input id="reg-email" type="email" autoComplete="email" required className="input" placeholder="you@example.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
          <div className="relative">
            <input id="reg-password" type={showPassword ? 'text' : 'password'} required className="input pr-12"
              placeholder="••••••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrengthBar password={form.password} />
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
          🔐 Your private encryption key is stored only in your browser. Keep your device secure.
        </div>

        <button type="submit" disabled={loading || !!pwError} id="register-submit-btn"
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><UserPlus size={18} /> Create account</>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-isa-600 dark:text-isa-400 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
