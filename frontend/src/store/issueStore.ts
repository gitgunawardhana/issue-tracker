import { create } from 'zustand';
import type { Issue, StatusCounts, PaginationData } from '../types';

interface IssueStore {
  issues: Issue[];
  statusCounts: StatusCounts;
  pagination: PaginationData;
  isLoading: boolean;
  error: string | null;
  setIssues: (issues: Issue[]) => void;
  setStatusCounts: (counts: StatusCounts) => void;
  setPagination: (pagination: PaginationData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (issue: Issue) => void;
  removeIssue: (id: string) => void;
  reset: () => void;
}

export const useIssueStore = create<IssueStore>((set) => ({
  issues: [],
  statusCounts: { open: 0, inProgress: 0, resolved: 0, assignedToMe: 0 },
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  isLoading: false,
  error: null,
  setIssues: (issues) => set({ issues }),
  setStatusCounts: (counts) => set({ statusCounts: counts }),
  setPagination: (pagination) => set({ pagination }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  addIssue: (issue) =>
    set((state) => ({
      issues: [issue, ...state.issues],
    })),
  updateIssue: (issue) =>
    set((state) => ({
      issues: state.issues.map((i) => (i._id === issue._id ? issue : i)),
    })),
  removeIssue: (id) =>
    set((state) => ({
      issues: state.issues.filter((i) => i._id !== id),
    })),
  reset: () =>
    set({
      issues: [],
      statusCounts: { open: 0, inProgress: 0, resolved: 0, assignedToMe: 0 },
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    }),
}));
