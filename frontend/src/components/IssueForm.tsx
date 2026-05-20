import { useState } from 'react';
import type { Issue, UserSummary } from '../types';

interface IssueFormData {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo: string | null;
}

interface IssueFormProps {
  issue?: Issue;
  users: UserSummary[];
  onSubmit: (data: IssueFormData) => void;
}

export function IssueFormActions({
  isLoading,
  isEdit,
  onCancel,
  formId = 'issue-form',
}: {
  isLoading?: boolean;
  isEdit: boolean;
  onCancel: () => void;
  formId?: string;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isLoading}
        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : isEdit ? 'Update Issue' : 'Create Issue'}
      </button>
    </div>
  );
}

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

function getAssignedId(assignedTo: Issue['assignedTo']): string {
  if (!assignedTo) return '';
  return typeof assignedTo === 'string' ? assignedTo : assignedTo._id;
}

export default function IssueForm({
  issue,
  users,
  onSubmit,
}: IssueFormProps) {
  const [title, setTitle] = useState(issue?.title ?? '');
  const [description, setDescription] = useState(issue?.description ?? '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>(
    issue?.priority ?? 'Medium'
  );
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>(
    issue?.severity ?? 'Low'
  );
  const [status, setStatus] = useState<'Open' | 'In Progress' | 'Resolved'>(
    issue?.status ?? 'Open'
  );
  const [assignedTo, setAssignedTo] = useState<string>(getAssignedId(issue?.assignedTo));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      severity,
      status,
      assignedTo: assignedTo || null,
    });
  };

  return (
    <form id="issue-form" onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Brief summary of the issue"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Provide detailed information about the issue"
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
            className={inputClass}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
            Severity
          </label>
          <select
            id="severity"
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')
            }
            className={inputClass}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as 'Open' | 'In Progress' | 'Resolved')
            }
            className={inputClass}
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
            Assign To
          </label>
          <select
            id="assignedTo"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

    </form>
  );
}
