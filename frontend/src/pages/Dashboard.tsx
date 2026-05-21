import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useIssueStore } from '../store/issueStore';
import { useToastStore } from '../store/toastStore';
import { useDebounce } from 'use-debounce';
import { issueService, userService, authService } from '../services/api';
import IssueForm, { IssueFormActions } from '../components/IssueForm';
import IssueList from '../components/IssueList';
import IssueDetail, { IssueDetailActions } from '../components/IssueDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import ResolveDialog from '../components/ResolveDialog';
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
  const [debouncedSearch] = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useQueryState('status', stringArray);
  const [priorityFilter, setPriorityFilter] = useQueryState('priority', stringArray);
  const [severityFilter, setSeverityFilter] = useQueryState('severity', stringArray);
  const [assigneeFilter, setAssigneeFilter] = useQueryState('assignedTo', stringArray);
  const [currentPage, setCurrentPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1)
  );

  const [confirm, setConfirm] = useState<ConfirmState>(initialConfirmState);
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null);
  const resolveTargetIssue = resolveTargetId
    ? issues.find((i) => i._id === resolveTargetId)
    : undefined;

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

  const performStatusChange = async (id: string, status: string, note?: string) => {
    try {
      const result = await issueService.updateIssueStatus(id, status, note);
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
    setResolveTargetId(id);
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
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <nav className="bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Issue Tracker" className="w-7 h-7 object-contain brightness-0 dark:invert" />
            <span className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50">Issue Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center w-9 h-9 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full">
              {user && <Avatar name={user.name} size="xs" />}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
            >
              <LogoutIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={card.onClick}
                className={`text-left border rounded-2xl p-4 sm:p-5 transition-colors ${
                  card.active
                    ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-neutral-900'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-50 mt-1">{card.count}</p>
                  </div>
                  <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-1" />
                </div>
              </button>
            );
          })}
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">Issues</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pagination.total} total</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportMenu onExport={handleExport} disabled={issues.length === 0} />
              <button
                onClick={() => {
                  setEditingIssue(undefined);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 font-medium text-sm transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                New Issue
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {hasActiveFilters && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 underline underline-offset-2"
                >
                  Clear all filters
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-neutral-700 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors"
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
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

      <ResolveDialog
        isOpen={!!resolveTargetIssue}
        issueTitle={resolveTargetIssue?.title ?? ''}
        onCancel={() => setResolveTargetId(null)}
        onConfirm={async (note) => {
          const id = resolveTargetId;
          setResolveTargetId(null);
          if (id) await performStatusChange(id, 'Resolved', note);
        }}
      />

      <ScrollToTopButton />
    </div>
  );
}
