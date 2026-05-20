import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { User, Issue, ApiResponse, UserSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async (email: string, password: string, name: string) => {
    const response = await apiClient.post<ApiResponse<{ email: string; name: string }>>(
      '/auth/register',
      { email, password, name }
    );
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/login',
      { email, password }
    );
    return response.data;
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
  status?: string;
  priority?: string;
  severity?: string;
  assignedTo?: string;
}

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
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.severity) params.severity = filters.severity;
    if (filters.assignedTo) params.assignedTo = filters.assignedTo;

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

  updateIssueStatus: async (id: string, status: string) => {
    const response = await apiClient.patch<ApiResponse<Issue>>(`/issues/${id}/status`, {
      status,
    });
    return response.data;
  },

  assignIssue: async (id: string, assignedTo: string | null) => {
    const response = await apiClient.patch<ApiResponse<Issue>>(`/issues/${id}/assign`, {
      assignedTo,
    });
    return response.data;
  },
};

export default apiClient;
