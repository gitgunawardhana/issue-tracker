export interface User {
  _id?: string;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
}

export interface Issue {
  _id?: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  createdBy: string;
  assignedTo?: string | null;
  resolutionNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}
