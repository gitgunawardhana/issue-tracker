import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { authService } from '../services/api';
import { BugIcon } from '../components/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const { showToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);
      if (result.success && result.data) {
        setToken(result.data.token);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <BugIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your Issue Tracker account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Create one
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
