import type { Issue } from '../types';
import Avatar from './Avatar';
import {
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
} from './Icons';

interface IssueDetailProps {
  issue: Issue;
  currentUserId?: string;
}

interface IssueDetailActionsProps {
  issue: Issue;
  currentUserId?: string;
  onEdit: (issue: Issue) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onAssignToMe: (id: string) => void;
  onUnassign: (id: string) => void;
  onClose: () => void;
}

export function IssueDetailActions({
  issue,
  currentUserId,
  onEdit,
  onDelete,
  onResolve,
  onAssignToMe,
  onUnassign,
  onClose,
}: IssueDetailActionsProps) {
  const reporterId = getUserId(issue.createdBy);
  const assigneeId = getUserId(issue.assignedTo);
  const isReporter = currentUserId && reporterId === currentUserId;
  const isAssignedToMe = currentUserId && assigneeId === currentUserId;

  const ghostBtn =
    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors';

  return (
    <div className="flex flex-wrap gap-2">
      {!assigneeId && (
        <button onClick={() => onAssignToMe(issue._id)} className={ghostBtn}>
          <UserPlusIcon className="w-4 h-4" />
          Take
        </button>
      )}
      {isAssignedToMe && (
        <button onClick={() => onUnassign(issue._id)} className={ghostBtn}>
          <UserMinusIcon className="w-4 h-4" />
          Untake
        </button>
      )}
      {issue.status !== 'Resolved' && (
        <button onClick={() => onResolve(issue._id)} className={ghostBtn}>
          <CheckCircleIcon className="w-4 h-4" />
          Resolve
        </button>
      )}
      {isReporter && (
        <>
          <button onClick={() => onEdit(issue)} className={ghostBtn}>
            <EditIcon className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(issue._id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </>
      )}
      <button
        onClick={onClose}
        className="ml-auto inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
      >
        Close
      </button>
    </div>
  );
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

function getUserName(field: Issue['createdBy'] | Issue['assignedTo']): string | null {
  if (!field) return null;
  if (typeof field === 'string') return 'User';
  return field.name || field.email || 'User';
}

function getUserId(field: Issue['createdBy'] | Issue['assignedTo']): string | null {
  if (!field) return null;
  return typeof field === 'string' ? field : field._id;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IssueDetail({ issue, currentUserId }: IssueDetailProps) {
  const reporterName = getUserName(issue.createdBy);
  const assigneeName = getUserName(issue.assignedTo);
  const assigneeId = getUserId(issue.assignedTo);
  const isAssignedToMe = currentUserId && assigneeId === currentUserId;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{issue.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[issue.status]}`}>
            {issue.status}
          </span>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[issue.priority]}`}>
            {issue.priority} priority
          </span>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${severityStyles[issue.severity]}`}>
            {issue.severity} severity
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Description
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
          {issue.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Reporter
          </h4>
          {reporterName ? (
            <div className="flex items-center gap-2">
              <Avatar name={reporterName} size="sm" />
              <span className="text-sm text-gray-800 dark:text-gray-100">{reporterName}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500">Unknown</span>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Assignee
          </h4>
          {assigneeName ? (
            <div className="flex items-center gap-2">
              <Avatar name={assigneeName} size="sm" />
              <span className={`text-sm ${isAssignedToMe ? 'text-blue-700 dark:text-blue-400 font-semibold' : 'text-gray-800 dark:text-gray-100'}`}>
                {assigneeName}
                {isAssignedToMe && <span className="text-xs text-blue-500 dark:text-blue-400 ml-1">(you)</span>}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">Unassigned</span>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Created
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-200">{formatDate(issue.createdAt)}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Last Updated
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-200">{formatDate(issue.updatedAt)}</p>
        </div>
      </div>

    </div>
  );
}
