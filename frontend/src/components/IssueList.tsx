import type { Issue } from '../types';
import Avatar from './Avatar';
import {
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  InboxIcon,
} from './Icons';

interface IssueListProps {
  issues: Issue[];
  currentUserId?: string;
  onEdit: (issue: Issue) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onResolve: (id: string) => void;
  onAssignToMe: (id: string) => void;
  onUnassign: (id: string) => void;
  onSelect: (issue: Issue) => void;
  isLoading?: boolean;
}

const priorityStyles = {
  Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800',
  High: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800',
};

const severityStyles = {
  Low: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800',
  Medium: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-800',
  High: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800',
  Critical: 'bg-red-100 text-red-800 ring-1 ring-red-300 font-semibold dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700',
};

const statusStyles = {
  Open: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700',
  'In Progress': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800',
};

const statusDot = {
  Open: 'bg-slate-400',
  'In Progress': 'bg-blue-500',
  Resolved: 'bg-emerald-500',
};

function getUserName(field: Issue['createdBy'] | Issue['assignedTo']): string | null {
  if (!field) return null;
  if (typeof field === 'string') return 'User';
  return field.name || field.email || 'User';
}

function getUserId(field: Issue['createdBy'] | Issue['assignedTo']): string | null {
  if (!field) return null;
  return typeof field === 'string' ? field : field._id;
}

function IconButton({
  onClick,
  title,
  className = '',
  children,
}: {
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export default function IssueList({
  issues,
  currentUserId,
  onEdit,
  onDelete,
  onStatusChange,
  onResolve,
  onAssignToMe,
  onUnassign,
  onSelect,
  isLoading,
}: IssueListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-4 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-1/4" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-1/6" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-1/6" />
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full mb-4">
          <InboxIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-700 dark:text-gray-200 font-medium">No issues yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a new issue to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden divide-y divide-gray-100 dark:divide-neutral-800">
        {issues.map((issue) => {
          const assigneeId = getUserId(issue.assignedTo);
          const assigneeName = getUserName(issue.assignedTo);
          const reporterName = getUserName(issue.createdBy);
          const reporterId = getUserId(issue.createdBy);
          const isAssignedToMe = currentUserId && assigneeId === currentUserId;
          const isReporter = currentUserId && reporterId === currentUserId;

          return (
            <div
              key={issue._id}
              onClick={() => onSelect(issue)}
              className="px-4 py-4 active:bg-slate-50 dark:active:bg-neutral-800 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-50 break-words">{issue.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {issue.description}
                  </p>
                </div>
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={issue.status}
                    onChange={(e) => onStatusChange(issue._id, e.target.value)}
                    className={`pl-5 pr-7 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none hover:opacity-80 ${statusStyles[issue.status]}`}
                    aria-label="Change status"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                  <span
                    className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${statusDot[issue.status]}`}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-70"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityStyles[issue.priority]}`}
                >
                  {issue.priority}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${severityStyles[issue.severity]}`}
                >
                  {issue.severity}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {reporterName && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Avatar name={reporterName} size="xs" />
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[80px]">
                        {reporterName}
                      </span>
                    </div>
                  )}
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                  {assigneeName ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Avatar name={assigneeName} size="xs" />
                      <span
                        className={`text-xs truncate max-w-[80px] ${
                          isAssignedToMe ? 'text-blue-700 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {assigneeName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                  )}
                </div>

                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!assigneeId && (
                    <IconButton
                      onClick={() => onAssignToMe(issue._id)}
                      title="Take this issue"
                      className="text-purple-600 hover:bg-purple-50"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                    </IconButton>
                  )}
                  {isAssignedToMe && (
                    <IconButton
                      onClick={() => onUnassign(issue._id)}
                      title="Untake"
                      className="text-orange-600 hover:bg-orange-50"
                    >
                      <UserMinusIcon className="w-4 h-4" />
                    </IconButton>
                  )}
                  {issue.status !== 'Resolved' && (
                    <IconButton
                      onClick={() => onResolve(issue._id)}
                      title="Mark as Resolved"
                      className="text-emerald-600 hover:bg-emerald-50"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                    </IconButton>
                  )}
                  {isReporter && (
                    <>
                      <IconButton
                        onClick={() => onEdit(issue)}
                        title="Edit"
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <EditIcon className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        onClick={() => onDelete(issue._id)}
                        title="Delete"
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </IconButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-neutral-800">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reporter</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assignee</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
          {issues.map((issue) => {
            const assigneeId = getUserId(issue.assignedTo);
            const assigneeName = getUserName(issue.assignedTo);
            const reporterName = getUserName(issue.createdBy);
            const reporterId = getUserId(issue.createdBy);
            const isAssignedToMe = currentUserId && assigneeId === currentUserId;
            const isReporter = currentUserId && reporterId === currentUserId;

            return (
              <tr
                key={issue._id}
                onClick={() => onSelect(issue)}
                className="hover:bg-slate-50/70 dark:hover:bg-neutral-800/40 transition-colors group cursor-pointer"
              >
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-gray-900 dark:text-gray-50 truncate">{issue.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{issue.description}</p>
                </td>
                <td className="px-4 py-3">
                  {reporterName && (
                    <div className="flex items-center gap-2">
                      <Avatar name={reporterName} size="sm" />
                      <span className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-[120px]">{reporterName}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {assigneeName ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={assigneeName} size="sm" />
                      <span className={`text-sm truncate max-w-[120px] ${isAssignedToMe ? 'text-blue-700 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-200'}`}>
                        {assigneeName}
                        {isAssignedToMe && <span className="text-xs text-blue-500 dark:text-blue-400 ml-1">(you)</span>}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[issue.priority]}`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${severityStyles[issue.severity]}`}>
                    {issue.severity}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="relative inline-block">
                    <select
                      value={issue.status}
                      onChange={(e) => onStatusChange(issue._id, e.target.value)}
                      className={`pl-6 pr-8 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none hover:opacity-80 ${statusStyles[issue.status]}`}
                      aria-label="Change status"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                    <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusDot[issue.status]}`} />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-70"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {!assigneeId && (
                      <IconButton
                        onClick={() => onAssignToMe(issue._id)}
                        title="Take this issue"
                        className="text-purple-600 hover:bg-purple-50"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                      </IconButton>
                    )}
                    {isAssignedToMe && (
                      <IconButton
                        onClick={() => onUnassign(issue._id)}
                        title="Untake (remove yourself)"
                        className="text-orange-600 hover:bg-orange-50"
                      >
                        <UserMinusIcon className="w-4 h-4" />
                      </IconButton>
                    )}
                    {issue.status !== 'Resolved' && (
                      <IconButton
                        onClick={() => onResolve(issue._id)}
                        title="Mark as Resolved"
                        className="text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </IconButton>
                    )}
                    {isReporter && (
                      <>
                        <IconButton
                          onClick={() => onEdit(issue)}
                          title="Edit"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <EditIcon className="w-4 h-4" />
                        </IconButton>
                        <IconButton
                          onClick={() => onDelete(issue._id)}
                          title="Delete"
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </IconButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
