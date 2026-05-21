import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { authService } from '../services/api';
import PasswordInput from '../components/PasswordInput';
import AuthLayout from '../components/AuthLayout';

const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
    />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();
  const { showToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);
      if (result.success && result.data) {
        setAccessToken(result.data.accessToken);
        setUser(result.data.user);
        showToast(`Welcome back, ${result.data.user.name}!`, 'success');
        navigate('/');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message || 'Login failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm dark:shadow-black/20 p-8">
        <div className="flex flex-col items-center mb-7">
          <img
            src="/logo.png"
            alt="Issue Tracker"
            className="w-24 h-24 object-contain dark:invert dark:hue-rotate-180"
          />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Sign in to continue to Issue Tracker
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2.5">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide"
            >
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                <MailIcon />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                Sign in
                <span className="transition-transform group-hover:translate-x-0.5">
                  <ArrowRightIcon />
                </span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-neutral-800">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
