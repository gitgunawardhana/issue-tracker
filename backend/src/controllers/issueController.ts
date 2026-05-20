import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { IssueModel } from '../models/Issue';
import { z } from 'zod';

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Low'),
  status: z.enum(['Open', 'In Progress', 'Resolved']).default('Open'),
  assignedTo: z.string().nullable().optional(),
});

const POPULATE_FIELDS = [
  { path: 'createdBy', select: 'name email' },
  { path: 'assignedTo', select: 'name email' },
];

export const createIssue = async (req: Request, res: Response) => {
  try {
    const validation = issueSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validation.error.issues,
      });
    }

    const issue = new IssueModel({
      ...validation.data,
      createdBy: req.user?.userId,
    });

    const saved = await issue.save();
    const populated = await saved.populate(POPULATE_FIELDS);

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Issue created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating issue',
      error: (error as Error).message,
    });
  }
};

export const getIssues = async (req: Request, res: Response) => {
  try {
    const {
      search = '',
      status = '',
      priority = '',
      severity = '',
      assignedTo = '',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * pageSize;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (severity) filter.severity = severity;

    if (assignedTo === 'me') {
      filter.assignedTo = req.user?.userId;
    } else if (assignedTo === 'unassigned') {
      filter.assignedTo = null;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const issues = await IssueModel.find(filter)
      .populate(POPULATE_FIELDS)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const total = await IssueModel.countDocuments(filter);

    const statusCounts = {
      open: await IssueModel.countDocuments({ ...filter, status: 'Open' }),
      inProgress: await IssueModel.countDocuments({ ...filter, status: 'In Progress' }),
      resolved: await IssueModel.countDocuments({ ...filter, status: 'Resolved' }),
      assignedToMe: await IssueModel.countDocuments({ assignedTo: req.user?.userId }),
    };

    res.json({
      success: true,
      data: {
        issues,
        statusCounts,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
      message: 'Issues retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching issues',
      error: (error as Error).message,
    });
  }
};

export const getIssueById = async (req: Request, res: Response) => {
  try {
    const issue = await IssueModel.findById(req.params.id).populate(POPULATE_FIELDS);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    res.json({
      success: true,
      data: issue,
      message: 'Issue retrieved successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching issue',
      error: (error as Error).message,
    });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    const validation = issueSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validation.error.issues,
      });
    }

    const existing = await IssueModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    if (existing.createdBy.toString() !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the reporter can edit this issue',
      });
    }

    const issue = await IssueModel.findByIdAndUpdate(
      req.params.id,
      validation.data,
      { new: true }
    ).populate(POPULATE_FIELDS);

    res.json({
      success: true,
      data: issue,
      message: 'Issue updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating issue',
      error: (error as Error).message,
    });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const existing = await IssueModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    if (existing.createdBy.toString() !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the reporter can delete this issue',
      });
    }

    await IssueModel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting issue',
      error: (error as Error).message,
    });
  }
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const issue = await IssueModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate(POPULATE_FIELDS);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    res.json({
      success: true,
      data: issue,
      message: 'Issue status updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating issue status',
      error: (error as Error).message,
    });
  }
};

export const assignIssue = async (req: Request, res: Response) => {
  try {
    const { assignedTo } = req.body;

    if (assignedTo !== null && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignee ID',
      });
    }

    const issue = await IssueModel.findByIdAndUpdate(
      req.params.id,
      { assignedTo },
      { new: true }
    ).populate(POPULATE_FIELDS);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    res.json({
      success: true,
      data: issue,
      message: assignedTo ? 'Issue assigned successfully' : 'Issue unassigned',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning issue',
      error: (error as Error).message,
    });
  }
};
