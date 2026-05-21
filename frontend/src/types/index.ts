export interface User {
  id: string;
  email: string;
  name: string;
}

export interface IssueCreator {
  _id: string;
  name: string;
  email: string;
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  createdBy: IssueCreator | string;
  assignedTo?: IssueCreator | string | null;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
}

export interface StatusCounts {
  open: number;
  inProgress: number;
  resolved: number;
  assignedToMe: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}
