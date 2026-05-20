import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useIssueStore } from '../store/issueStore';
import { useToastStore } from '../store/toastStore';
import { useDebounce } from '../hooks/useDebounce';
import { issueService, userService } from '../services/api';
import IssueForm from '../components/IssueForm';
import IssueList from '../components/IssueList';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import type { Issue, UserSummary } from '../types';
import { useNavigate } from 'react-router-dom';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

const initialConfirmState: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  variant: 'danger',
  onConfirm: () => {},
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const {
    issues,
    statusCounts,
    pagination,
    isLoading,
    setIssues,
    setStatusCounts,
    setPagination,
    setLoading,
    updateIssue,
    removeIssue,
  } = useIssueStore();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | undefined>();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirm, setConfirm] = useState<ConfirmState>(initialConfirmState);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [
    currentPage,
    debouncedSearch,
    statusFilter,
    priorityFilter,
    severityFilter,
    assigneeFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, severityFilter, assigneeFilter]);

  const closeConfirm = () => setConfirm(initialConfirmState);

  const fetchUsers = async () => {
    try {
      const result = await userService.getUsers();
      if (result.success && result.data) setUsers(result.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error fetching users', 'error');
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const result = await issueService.getIssues({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        severity: severityFilter,
        assignedTo: assigneeFilter,
      });
      if (result.success && result.data) {
        setIssues(result.data.issues);
        setStatusCounts(result.data.statusCounts);
        setPagination(result.data.pagination);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error fetching issues', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'In Progress' | 'Resolved';
    assignedTo: string | null;
  }) => {
    setLoading(true);
    try {
      if (editingIssue) {
        const result = await issueService.updateIssue(editingIssue._id, data);
        if (result.success && result.data) {
          updateIssue(result.data);
          showToast('Issue updated successfully', 'success');
          setEditingIssue(undefined);
        }
      } else {
        const result = await issueService.createIssue(data as any);
        if (result.success && result.data) {
          showToast('Issue created successfully', 'success');
        }
      }
      setShowForm(false);
      await fetchIssues();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving issue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const performDelete = async (id: string) => {
    try {
      const result = await issueService.deleteIssue(id);
      if (result.success) {
        removeIssue(id);
        showToast('Issue deleted', 'success');
        await fetchIssues();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting issue', 'error');
    }
  };

  const performStatusChange = async (id: string, status: string) => {
    try {
      const result = await issueService.updateIssueStatus(id, status);
      if (result.success && result.data) {
        updateIssue(result.data);
        showToast(`Status changed to ${status}`, 'success');
        await fetchIssues();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error updating status', 'error');
    }
  };

  const performAssign = async (id: string, assignedTo: string | null) => {
    try {
      const result = await issueService.assignIssue(id, assignedTo);
      if (result.success && result.data) {
        updateIssue(result.data);
        showToast(assignedTo ? 'You took this issue' : 'You untook this issue', 'success');
        await fetchIssues();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error assigning issue', 'error');
    }
  };

  const handleDelete = (id: string) => {
    const issue = issues.find((i) => i._id === id);
    setConfirm({
      isOpen: true,
      title: 'Delete Issue',
      message: `Are you sure you want to delete "${issue?.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        await performDelete(id);
      },
    });
  };

  const handleResolve = (id: string) => {
    const issue = issues.find((i) => i._id === id);
    setConfirm({
      isOpen: true,
      title: 'Mark as Resolved',
      message: `Are you sure you want to mark "${issue?.title}" as Resolved?`,
      confirmText: 'Mark Resolved',
      variant: 'info',
      onConfirm: async () => {
        closeConfirm();
        await performStatusChange(id, 'Resolved');
      },
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    if (status === 'Resolved') {
      handleResolve(id);
      return;
    }
    performStatusChange(id, status);
  };

  const handleAssignToMe = (id: string) => {
    if (!user) return;
    performAssign(id, user.id);
  };

  const handleUnassign = (id: string) => performAssign(id, null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Issue Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Open</p>
            <p className="text-3xl font-bold text-blue-600">{statusCounts.open}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-yellow-600">{statusCounts.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Resolved</p>
            <p className="text-3xl font-bold text-green-600">{statusCounts.resolved}</p>
          </div>
          <button
            onClick={() => setAssigneeFilter(assigneeFilter === 'me' ? '' : 'me')}
            className={`text-left bg-white rounded-lg shadow p-6 transition-colors ${
              assigneeFilter === 'me' ? 'ring-2 ring-purple-500' : 'hover:bg-gray-50'
            }`}
          >
            <p className="text-gray-600 text-sm">Assigned to Me</p>
            <p className="text-3xl font-bold text-purple-600">{statusCounts.assignedToMe}</p>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Issues</h2>
            <button
              onClick={() => {
                setEditingIssue(undefined);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              + New Issue
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Assignees</option>
              <option value="me">My Issues</option>
              <option value="unassigned">Unassigned</option>
              {users
                .filter((u) => u._id !== user?.id)
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          <IssueList
            issues={issues}
            currentUserId={user?.id}
            onEdit={(issue) => {
              setEditingIssue(issue);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onResolve={handleResolve}
            onAssignToMe={handleAssignToMe}
            onUnassign={handleUnassign}
            isLoading={isLoading}
          />

          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showForm}
        title={editingIssue ? 'Edit Issue' : 'Create New Issue'}
        onClose={() => {
          setShowForm(false);
          setEditingIssue(undefined);
        }}
        size="lg"
      >
        <IssueForm
          issue={editingIssue}
          users={users}
          onSubmit={handleCreateOrUpdate}
          isLoading={isLoading}
          onCancel={() => {
            setShowForm(false);
            setEditingIssue(undefined);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        variant={confirm.variant}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
