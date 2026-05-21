import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useIssueStore } from '../store/issueStore';
import { useToastStore } from '../store/toastStore';
import { useDebounce } from '../hooks/useDebounce';
import { issueService, userService, authService } from '../services/api';
import IssueForm, { IssueFormActions } from '../components/IssueForm';
import IssueList from '../components/IssueList';
import IssueDetail, { IssueDetailActions } from '../components/IssueDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import ExportMenu from '../components/ExportMenu';
import ScrollToTopButton from '../components/ScrollToTopButton';
import Pagination from '../components/Pagination';
import { Select } from 'antd';
import {
  CircleOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  SearchIcon,
  PlusIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
} from '../components/Icons';
import { useThemeStore } from '../store/themeStore';
import type { Issue, UserSummary } from '../types';
import { useNavigate } from 'react-router-dom';
import { useQueryState, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs';

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

const stringArray = parseAsArrayOf(parseAsString).withDefault([]);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme, toggleTheme } = useThemeStore();
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
  const [viewingIssueId, setViewingIssueId] = useState<string | null>(null);
  const viewingIssue = viewingIssueId
    ? issues.find((i) => i._id === viewingIssueId)
    : undefined;

  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useQueryState('status', stringArray);
  const [priorityFilter, setPriorityFilter] = useQueryState('priority', stringArray);
  const [severityFilter, setSeverityFilter] = useQueryState('severity', stringArray);
  const [assigneeFilter, setAssigneeFilter] = useQueryState('assignedTo', stringArray);
  const [currentPage, setCurrentPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1)
  );

  const [confirm, setConfirm] = useState<ConfirmState>(initialConfirmState);

  const closeConfirm = () => setConfirm(initialConfirmState);

  const errorMessage = (err: unknown, fallback: string): string => {
    const e = err as { response?: { data?: { message?: string } } };
    return e?.response?.data?.message || fallback;
  };

  const fetchUsers = async () => {
    try {
      const result = await userService.getUsers();
      if (result.success && result.data) setUsers(result.data);
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error fetching users'), 'error');
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
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error fetching issues'), 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const onSearchChange = (v: string) => {
    setSearch(v || null);
    setCurrentPage(1);
  };
  const onStatusChange = (v: string[]) => {
    setStatusFilter(v.length ? v : null);
    setCurrentPage(1);
  };
  const onPriorityChange = (v: string[]) => {
    setPriorityFilter(v.length ? v : null);
    setCurrentPage(1);
  };
  const onSeverityChange = (v: string[]) => {
    setSeverityFilter(v.length ? v : null);
    setCurrentPage(1);
  };
  const onAssigneeChange = (v: string[]) => {
    setAssigneeFilter(v.length ? v : null);
    setCurrentPage(1);
  };

  const toggleArrayValue = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const hasActiveFilters =
    !!search ||
    statusFilter.length > 0 ||
    priorityFilter.length > 0 ||
    severityFilter.length > 0 ||
    assigneeFilter.length > 0;

  const clearAllFilters = () => {
    setSearch(null);
    setStatusFilter(null);
    setPriorityFilter(null);
    setSeverityFilter(null);
    setAssigneeFilter(null);
    setCurrentPage(1);
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
        const result = await issueService.createIssue(data);
        if (result.success && result.data) {
          showToast('Issue created successfully', 'success');
        }
      }
      setShowForm(false);
      await fetchIssues();
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error saving issue'), 'error');
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
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error deleting issue'), 'error');
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
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error updating status'), 'error');
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
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Error assigning issue'), 'error');
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

  const handleExport = async (format: 'pdf' | 'json') => {
    try {
      await issueService.exportIssues(format, {
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        severity: severityFilter,
        assignedTo: assigneeFilter,
      });
      showToast(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (err: unknown) {
      showToast(errorMessage(err, 'Export failed'), 'error');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    logout();
    navigate('/login');
  };

  const statCards = [
    {
      label: 'Open',
      count: statusCounts.open,
      icon: CircleOpenIcon,
      iconBg: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300',
      onClick: () => onStatusChange(toggleArrayValue(statusFilter, 'Open')),
      active: statusFilter.includes('Open'),
      ringColor: 'ring-slate-400',
    },
    {
      label: 'In Progress',
      count: statusCounts.inProgress,
      icon: ClockIcon,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
      onClick: () => onStatusChange(toggleArrayValue(statusFilter, 'In Progress')),
      active: statusFilter.includes('In Progress'),
      ringColor: 'ring-blue-400',
    },
    {
      label: 'Resolved',
      count: statusCounts.resolved,
      icon: CheckCircleIcon,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
      onClick: () => onStatusChange(toggleArrayValue(statusFilter, 'Resolved')),
      active: statusFilter.includes('Resolved'),
      ringColor: 'ring-emerald-400',
    },
    {
      label: 'Assigned to Me',
      count: statusCounts.assignedToMe,
      icon: UserPlusIcon,
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
      onClick: () => onAssigneeChange(toggleArrayValue(assigneeFilter, 'me')),
      active: assigneeFilter.includes('me'),
      ringColor: 'ring-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Issue Tracker" className="w-10 h-10 object-contain dark:invert dark:hue-rotate-180" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 leading-tight">Issue Tracker</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Manage your team's work</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center w-9 h-9 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-neutral-800">
              {user && <Avatar name={user.name} size="xs" />}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 text-sm font-medium transition-colors"
            >
              <LogoutIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={card.onClick}
                className={`text-left bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-4 sm:p-5 hover:border-gray-300 dark:hover:border-neutral-700 transition-colors ${
                  card.active ? `ring-2 ${card.ringColor} border-transparent` : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{card.count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Issues</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} total</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportMenu onExport={handleExport} disabled={issues.length === 0} />
              <button
                onClick={() => {
                  setEditingIssue(undefined);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Issue
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filters</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  Clear all filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Select
              mode="multiple"
              allowClear
              size="large"
              placeholder="Status"
              value={statusFilter}
              onChange={onStatusChange}
              maxTagCount="responsive"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Resolved', label: 'Resolved' },
              ]}
              className="w-full"
            />
            <Select
              mode="multiple"
              allowClear
              size="large"
              placeholder="Priority"
              value={priorityFilter}
              onChange={onPriorityChange}
              maxTagCount="responsive"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
              ]}
              className="w-full"
            />
            <Select
              mode="multiple"
              allowClear
              size="large"
              placeholder="Severity"
              value={severityFilter}
              onChange={onSeverityChange}
              maxTagCount="responsive"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
              className="w-full"
            />
            <Select
              mode="multiple"
              allowClear
              size="large"
              placeholder="Assignees"
              value={assigneeFilter}
              onChange={onAssigneeChange}
              maxTagCount="responsive"
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: 'me', label: 'My Issues' },
                { value: 'unassigned', label: 'Unassigned' },
                ...users
                  .filter((u) => u._id !== user?.id)
                  .map((u) => ({ value: u._id, label: u.name })),
              ]}
              className="w-full"
            />
            </div>
          </div>

          <IssueList
            issues={issues}
            currentUserId={user?.id}
            onSelect={(issue) => setViewingIssueId(issue._id)}
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
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.pages}
                onPageChange={setCurrentPage}
              />
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
        footer={
          <IssueFormActions
            isEdit={!!editingIssue}
            isLoading={isLoading}
            onCancel={() => {
              setShowForm(false);
              setEditingIssue(undefined);
            }}
          />
        }
      >
        <IssueForm
          issue={editingIssue}
          users={users}
          onSubmit={handleCreateOrUpdate}
        />
      </Modal>

      <Modal
        isOpen={!!viewingIssue}
        title="Issue Details"
        onClose={() => setViewingIssueId(null)}
        size="lg"
        footer={
          viewingIssue && (
            <IssueDetailActions
              issue={viewingIssue}
              currentUserId={user?.id}
              onEdit={(issue) => {
                setViewingIssueId(null);
                setEditingIssue(issue);
                setShowForm(true);
              }}
              onDelete={(id) => {
                setViewingIssueId(null);
                handleDelete(id);
              }}
              onResolve={(id) => handleResolve(id)}
              onAssignToMe={handleAssignToMe}
              onUnassign={handleUnassign}
              onClose={() => setViewingIssueId(null)}
            />
          )
        }
      >
        {viewingIssue && (
          <IssueDetail issue={viewingIssue} currentUserId={user?.id} />
        )}
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

      <ScrollToTopButton />
    </div>
  );
}
