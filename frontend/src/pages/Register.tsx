import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useToastStore } from '../store/toastStore';
import PasswordInput from '../components/PasswordInput';
import AuthLayout from '../components/AuthLayout';

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-3.5 h-3.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

const XMarkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-3.5 h-3.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const DotIcon = () => (
  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
);

interface PasswordCriterion {
  label: string;
  test: (value: string) => boolean;
}

const passwordCriteria: PasswordCriterion[] = [
  { label: 'At least 6 characters', test: (v) => v.length >= 6 },
  { label: 'Contains a lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'Contains an uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'Contains a number', test: (v) => /\d/.test(v) },
  { label: 'Contains a symbol (!@#$...)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const inputClass =
  'w-full px-5 py-3 border border-gray-300 dark:border-neutral-700 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register(email, password, name);
      if (result.success) {
        showToast('Account created! Please sign in.', 'success');
        navigate('/login');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message || 'Registration failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl sm:text-3xl font-semibold text-center tracking-tight mb-8">
        Create your account
      </h1>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-2.5">
            <p className="text-sm text-red-700 dark:text-red-200 text-center">{error}</p>
          </div>
        )}

        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          required
          autoComplete="name"
          className={inputClass}
        />

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          autoComplete="email"
          className={inputClass}
        />

        <div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Password"
            required
          />
          {password.length > 0 && (
            <ul className="mt-3 px-2 space-y-1">
              {passwordCriteria.map((c) => {
                const passed = c.test(password);
                return (
                  <li
                    key={c.label}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      passed
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    <span className="inline-flex w-4 h-4 items-center justify-center">
                      {passed ? <CheckIcon /> : <DotIcon />}
                    </span>
                    {c.label}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm password"
            required
          />
          {confirmPassword.length > 0 && (
            <p
              className={`mt-2 px-2 text-xs flex items-center gap-1.5 ${
                password === confirmPassword
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              <span className="inline-flex w-4 h-4 items-center justify-center">
                {password === confirmPassword ? <CheckIcon /> : <XMarkIcon />}
              </span>
              {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-4 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating account...' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-medium text-gray-900 dark:text-gray-100 underline underline-offset-2 hover:no-underline"
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  );
}
