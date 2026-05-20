import { useState } from 'react';
import { Input, Select, Button } from 'antd';
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
      <Button onClick={onCancel} disabled={isLoading} size="large" className="flex-1">
        Cancel
      </Button>
      <Button
        type="primary"
        htmlType="submit"
        form={formId}
        loading={isLoading}
        size="large"
        className="flex-1"
      >
        {isEdit ? 'Update Issue' : 'Create Issue'}
      </Button>
    </div>
  );
}

function getAssignedId(assignedTo: Issue['assignedTo']): string {
  if (!assignedTo) return '';
  return typeof assignedTo === 'string' ? assignedTo : assignedTo._id;
}

export default function IssueForm({ issue, users, onSubmit }: IssueFormProps) {
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

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <form id="issue-form" onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          size="large"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Brief summary of the issue"
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description <span className="text-red-500">*</span>
        </label>
        <Input.TextArea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Provide detailed information about the issue"
          rows={4}
          autoSize={{ minRows: 4, maxRows: 8 }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <Select
            id="priority"
            size="large"
            value={priority}
            onChange={(v) => setPriority(v)}
            className="w-full"
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
            ]}
          />
        </div>

        <div>
          <label htmlFor="severity" className={labelClass}>
            Severity
          </label>
          <Select
            id="severity"
            size="large"
            value={severity}
            onChange={(v) => setSeverity(v)}
            className="w-full"
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Critical', label: 'Critical' },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <Select
            id="status"
            size="large"
            value={status}
            onChange={(v) => setStatus(v)}
            className="w-full"
            options={[
              { value: 'Open', label: 'Open' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Resolved', label: 'Resolved' },
            ]}
          />
        </div>

        <div>
          <label htmlFor="assignedTo" className={labelClass}>
            Assign To
          </label>
          <Select
            id="assignedTo"
            size="large"
            value={assignedTo}
            onChange={(v) => setAssignedTo(v)}
            showSearch
            allowClear
            placeholder="Unassigned"
            className="w-full"
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={users.map((u) => ({ value: u._id, label: u.name }))}
          />
        </div>
      </div>
    </form>
  );
}
