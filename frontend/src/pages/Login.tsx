import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { authService } from '../services/api';
import PasswordInput from '../components/PasswordInput';
import AuthLayout from '../components/AuthLayout';

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
      <h1 className="text-2xl sm:text-3xl font-semibold text-center tracking-tight mb-8">
        Welcome back
      </h1>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-2.5">
            <p className="text-sm text-red-700 dark:text-red-200 text-center">{error}</p>
          </div>
        )}

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          autoComplete="email"
          className="w-full px-5 py-3 border border-gray-300 dark:border-neutral-700 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors"
        />

        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-4 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Signing in...' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="font-medium text-gray-900 dark:text-gray-100 underline underline-offset-2 hover:no-underline"
        >
          Sign up
        </button>
      </p>
    </AuthLayout>
  );
}
