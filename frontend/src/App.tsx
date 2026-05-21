import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ToastContainer from './components/ToastContainer';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  return accessToken ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const { accessToken } = useAuthStore();
  const { theme } = useThemeStore();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <Router>
        <NuqsAdapter>
          <ToastContainer />
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={accessToken ? '/' : '/login'} />} />
          </Routes>
        </NuqsAdapter>
      </Router>
    </ConfigProvider>
  );
}
