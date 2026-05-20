import type { Issue } from '../types';

interface IssueListProps {
  issues: Issue[];
  currentUserId?: string;
  onEdit: (issue: Issue) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onResolve: (id: string) => void;
  onAssignToMe: (id: string) => void;
  onUnassign: (id: string) => void;
  isLoading?: boolean;
}

const priorityColors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800',
};

const severityColors = {
  Low: 'bg-blue-100 text-blue-800',
  Medium: 'bg-orange-100 text-orange-800',
  High: 'bg-red-100 text-red-800',
  Critical: 'bg-red-200 text-red-900',
};

const statusColors = {
  Open: 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-green-100 text-green-800',
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

export default function IssueList({
  issues,
  currentUserId,
  onEdit,
  onDelete,
  onStatusChange,
  onResolve,
  onAssignToMe,
  onUnassign,
  isLoading,
}: IssueListProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading issues...</div>;
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No issues found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">Title</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">Reporter</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">Assigned To</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">Priority</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">Severity</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">Status</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-700 text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const assigneeId = getUserId(issue.assignedTo);
            const assigneeName = getUserName(issue.assignedTo);
            const isAssignedToMe = currentUserId && assigneeId === currentUserId;
            const reporterId = getUserId(issue.createdBy);
            const isReporter = currentUserId && reporterId === currentUserId;

            return (
              <tr
                key={issue._id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-gray-900 truncate">{issue.title}</p>
                  <p className="text-sm text-gray-500 truncate">{issue.description}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {getUserName(issue.createdBy) || 'Unknown'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {assigneeName ? (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        isAssignedToMe ? 'text-blue-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {assigneeName}
                      {isAssignedToMe && <span className="text-xs">(you)</span>}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${priorityColors[issue.priority]}`}
                  >
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${severityColors[issue.severity]}`}
                  >
                    {issue.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={issue.status}
                    onChange={(e) => onStatusChange(issue._id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColors[issue.status]}`}
                    aria-label="Change status"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {!assigneeId && (
                      <button
                        onClick={() => onAssignToMe(issue._id)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        title="Assign to me"
                      >
                        Take
                      </button>
                    )}
                    {isAssignedToMe && (
                      <button
                        onClick={() => onUnassign(issue._id)}
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        title="Remove yourself from this issue"
                      >
                        Untake
                      </button>
                    )}
                    {issue.status !== 'Resolved' && (
                      <button
                        onClick={() => onResolve(issue._id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        title="Mark as Resolved"
                      >
                        Resolve
                      </button>
                    )}
                    {isReporter && (
                      <>
                        <button
                          onClick={() => onEdit(issue)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(issue._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
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
  );
}
