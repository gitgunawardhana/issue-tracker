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
  onEdit: (issue: Issue) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onAssignToMe: (id: string) => void;
  onUnassign: (id: string) => void;
  onClose: () => void;
}

const priorityStyles = {
  Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  High: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const severityStyles = {
  Low: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  Medium: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  High: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Critical: 'bg-red-100 text-red-800 ring-1 ring-red-300 font-semibold',
};

const statusStyles = {
  Open: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
  'In Progress': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
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

export default function IssueDetail({
  issue,
  currentUserId,
  onEdit,
  onDelete,
  onResolve,
  onAssignToMe,
  onUnassign,
  onClose,
}: IssueDetailProps) {
  const reporterName = getUserName(issue.createdBy);
  const reporterId = getUserId(issue.createdBy);
  const assigneeName = getUserName(issue.assignedTo);
  const assigneeId = getUserId(issue.assignedTo);
  const isReporter = currentUserId && reporterId === currentUserId;
  const isAssignedToMe = currentUserId && assigneeId === currentUserId;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{issue.title}</h3>
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
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Description
        </h4>
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-gray-50 border border-gray-200 rounded-lg p-4">
          {issue.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Reporter
          </h4>
          {reporterName ? (
            <div className="flex items-center gap-2">
              <Avatar name={reporterName} size="sm" />
              <span className="text-sm text-gray-800">{reporterName}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Unknown</span>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Assignee
          </h4>
          {assigneeName ? (
            <div className="flex items-center gap-2">
              <Avatar name={assigneeName} size="sm" />
              <span className={`text-sm ${isAssignedToMe ? 'text-blue-700 font-semibold' : 'text-gray-800'}`}>
                {assigneeName}
                {isAssignedToMe && <span className="text-xs text-blue-500 ml-1">(you)</span>}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">Unassigned</span>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Created
          </h4>
          <p className="text-sm text-gray-700">{formatDate(issue.createdAt)}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Last Updated
          </h4>
          <p className="text-sm text-gray-700">{formatDate(issue.updatedAt)}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-2">
        {!assigneeId && (
          <button
            onClick={() => onAssignToMe(issue._id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <UserPlusIcon className="w-4 h-4" />
            Take
          </button>
        )}
        {isAssignedToMe && (
          <button
            onClick={() => onUnassign(issue._id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <UserMinusIcon className="w-4 h-4" />
            Untake
          </button>
        )}
        {issue.status !== 'Resolved' && (
          <button
            onClick={() => onResolve(issue._id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Resolve
          </button>
        )}
        {isReporter && (
          <>
            <button
              onClick={() => onEdit(issue)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <EditIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(issue._id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
