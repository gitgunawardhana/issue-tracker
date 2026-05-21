import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { User, Issue, ApiResponse, UserSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let waitingRequests: Array<(token: string | null) => void> = [];

const onRefreshed = (token: string | null) => {
  waitingRequests.forEach((cb) => cb(token));
  waitingRequests = [];
};

const handleAuthFailure = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const isUnauthorized = error.response?.status === 401;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    if (!isUnauthorized || isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitingRequests.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers = originalRequest.headers ?? {};
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      if (!data.success || !data.data) {
        throw new Error('Refresh failed');
      }

      localStorage.setItem('accessToken', data.data.accessToken);

      onRefreshed(data.data.accessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${data.data.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      onRefreshed(null);
      handleAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const authService = {
  register: async (email: string, password: string, name: string) => {
    const response = await apiClient.post<ApiResponse<{ email: string; name: string }>>(
      '/auth/register',
      { email, password, name }
    );
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post<
      ApiResponse<{ accessToken: string; user: User }>
    >('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore — we still want to clear local state
    }
  },
};

export const userService = {
  getUsers: async () => {
    const response = await apiClient.get<ApiResponse<UserSummary[]>>('/users');
    return response.data;
  },
};

interface IssueFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | string[];
  priority?: string | string[];
  severity?: string | string[];
  assignedTo?: string | string[];
}

const joinCsv = (v: string | string[] | undefined): string => {
  if (!v) return '';
  return Array.isArray(v) ? v.join(',') : v;
};

export const issueService = {
  createIssue: async (
    issue: Omit<Issue, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    const response = await apiClient.post<ApiResponse<Issue>>('/issues', issue);
    return response.data;
  },

  getIssues: async (filters: IssueFilters = {}) => {
    const params: Record<string, string | number> = {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    };
    if (filters.search) params.search = filters.search;
    const status = joinCsv(filters.status);
    if (status) params.status = status;
    const priority = joinCsv(filters.priority);
    if (priority) params.priority = priority;
    const severity = joinCsv(filters.severity);
    if (severity) params.severity = severity;
    const assignedTo = joinCsv(filters.assignedTo);
    if (assignedTo) params.assignedTo = assignedTo;

    const response = await apiClient.get<
      ApiResponse<{
        issues: Issue[];
        statusCounts: {
          open: number;
          inProgress: number;
          resolved: number;
          assignedToMe: number;
        };
        pagination: { page: number; limit: number; total: number; pages: number };
      }>
    >('/issues', { params });
    return response.data;
  },

  getIssueById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Issue>>(`/issues/${id}`);
    return response.data;
  },

  updateIssue: async (id: string, issue: Partial<Issue>) => {
    const response = await apiClient.put<ApiResponse<Issue>>(`/issues/${id}`, issue);
    return response.data;
  },

  deleteIssue: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/issues/${id}`);
    return response.data;
  },

  updateIssueStatus: async (id: string, status: string, note?: string) => {
    const response = await apiClient.patch<ApiResponse<Issue>>(`/issues/${id}/status`, {
      status,
      ...(note !== undefined && { note }),
    });
    return response.data;
  },

  assignIssue: async (id: string, assignedTo: string | null) => {
    const response = await apiClient.patch<ApiResponse<Issue>>(`/issues/${id}/assign`, {
      assignedTo,
    });
    return response.data;
  },

  exportIssues: async (format: 'pdf' | 'json', filters: IssueFilters = {}) => {
    const params: Record<string, string> = { format };
    if (filters.search) params.search = filters.search;
    const status = joinCsv(filters.status);
    if (status) params.status = status;
    const priority = joinCsv(filters.priority);
    if (priority) params.priority = priority;
    const severity = joinCsv(filters.severity);
    if (severity) params.severity = severity;
    const assignedTo = joinCsv(filters.assignedTo);
    if (assignedTo) params.assignedTo = assignedTo;

    const response = await apiClient.get('/issues/export', {
      params,
      responseType: 'blob',
    });

    const blob = response.data as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `issues-${date}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

export default apiClient;
