import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { IssueModel } from '../models/Issue';

interface BadgeColor {
  bg: string;
  text: string;
}

const statusColors: Record<string, BadgeColor> = {
  Open: { bg: '#f1f5f9', text: '#334155' },
  'In Progress': { bg: '#eff6ff', text: '#1d4ed8' },
  Resolved: { bg: '#ecfdf5', text: '#047857' },
};

const priorityColors: Record<string, BadgeColor> = {
  Low: { bg: '#ecfdf5', text: '#047857' },
  Medium: { bg: '#fffbeb', text: '#b45309' },
  High: { bg: '#fff1f2', text: '#be123c' },
};

const severityColors: Record<string, BadgeColor> = {
  Low: { bg: '#f0f9ff', text: '#0369a1' },
  Medium: { bg: '#fff7ed', text: '#c2410c' },
  High: { bg: '#fff1f2', text: '#be123c' },
  Critical: { bg: '#fee2e2', text: '#991b1b' },
};

function drawBadge(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  text: string,
  color: BadgeColor
): number {
  const paddingX = 6;
  const paddingY = 3;
  const fontSize = 8;

  doc.font('Helvetica-Bold').fontSize(fontSize);
  const textWidth = doc.widthOfString(text);
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = fontSize + paddingY * 2;

  doc
    .save()
    .roundedRect(x, y, badgeWidth, badgeHeight, 8)
    .fillColor(color.bg)
    .fill()
    .restore();

  doc.fillColor(color.text).text(text, x + paddingX, y + paddingY, {
    width: textWidth + 1,
    lineBreak: false,
  });

  doc.font('Helvetica');
  return x + badgeWidth + 6;
}

interface PopulatedUser {
  _id?: unknown;
  name?: string;
  email?: string;
}

function userLabel(field: unknown): string {
  if (!field) return 'Unassigned';
  if (typeof field === 'object') {
    const u = field as PopulatedUser;
    return u.name || u.email || 'User';
  }
  return 'User';
}

const splitCsv = (value: unknown): string[] => {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

function buildFilter(req: Request): Record<string, unknown> {
  const { search = '', status = '', priority = '', severity = '', assignedTo = '' } = req.query;
  const conditions: Record<string, unknown>[] = [];

  if (search) {
    conditions.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const statuses = splitCsv(status);
  if (statuses.length > 0) conditions.push({ status: { $in: statuses } });

  const priorities = splitCsv(priority);
  if (priorities.length > 0) conditions.push({ priority: { $in: priorities } });

  const severities = splitCsv(severity);
  if (severities.length > 0) conditions.push({ severity: { $in: severities } });

  const assignees = splitCsv(assignedTo);
  if (assignees.length > 0) {
    const assigneeOr: Record<string, unknown>[] = [];
    const ids: string[] = [];
    for (const v of assignees) {
      if (v === 'me' && req.user?.userId) ids.push(req.user.userId);
      else if (v === 'unassigned') assigneeOr.push({ assignedTo: null });
      else ids.push(v);
    }
    if (ids.length > 0) assigneeOr.push({ assignedTo: { $in: ids } });
    if (assigneeOr.length === 1) conditions.push(assigneeOr[0]);
    else if (assigneeOr.length > 1) conditions.push({ $or: assigneeOr });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

export const exportIssues = async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'json';
    const filter = buildFilter(req);

    const issues = await IssueModel.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="issues-${timestamp}.json"`
      );

      const payload = issues.map((i) => ({
        id: String(i._id),
        title: i.title,
        description: i.description,
        status: i.status,
        priority: i.priority,
        severity: i.severity,
        reporter: userLabel(i.createdBy),
        assignee: userLabel(i.assignedTo),
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      }));

      return res.json(payload);
    }

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="issues-${timestamp}.pdf"`
      );

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.pipe(res);

      const headerHeight = 80;
      const innerPaddingX = doc.page.margins.left;

      doc
        .save()
        .rect(0, 0, doc.page.width, headerHeight)
        .fillColor('#0a0a0a')
        .fill()
        .restore();

      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('Issue Tracker Report', innerPaddingX, 22, {
          width: doc.page.width - innerPaddingX * 2,
        });

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#a3a3a3')
        .text(
          `Generated on ${new Date().toLocaleString()}  •  Total issues: ${issues.length}`,
          innerPaddingX,
          52,
          { width: doc.page.width - innerPaddingX * 2 }
        );

      doc.y = headerHeight + 20;
      doc.fillColor('#000');

      issues.forEach((issue, index) => {
        if (doc.y > doc.page.height - 180) doc.addPage();

        doc
          .fontSize(13)
          .fillColor('#111')
          .font('Helvetica-Bold')
          .text(`${index + 1}. ${issue.title}`, { continued: false });

        doc.font('Helvetica');
        doc.moveDown(0.3);

        doc
          .fontSize(10)
          .fillColor('#374151')
          .text(issue.description || '(no description provided)', {
            align: 'left',
            lineGap: 2,
          });

        doc.moveDown(0.5);

        const badgeY = doc.y;
        let badgeX = doc.page.margins.left;
        badgeX = drawBadge(
          doc,
          badgeX,
          badgeY,
          issue.status,
          statusColors[issue.status] || statusColors.Open
        );
        badgeX = drawBadge(
          doc,
          badgeX,
          badgeY,
          `${issue.priority} priority`,
          priorityColors[issue.priority] || priorityColors.Medium
        );
        badgeX = drawBadge(
          doc,
          badgeX,
          badgeY,
          `${issue.severity} severity`,
          severityColors[issue.severity] || severityColors.Low
        );

        doc.y = badgeY + 18;
        doc.x = doc.page.margins.left;

        doc
          .fontSize(9)
          .fillColor('#666')
          .text(
            `Reporter: ${userLabel(issue.createdBy)}   |   Assignee: ${userLabel(issue.assignedTo)}`
          );

        doc
          .fontSize(8)
          .fillColor('#888')
          .text(
            `Created: ${new Date(issue.createdAt as unknown as string).toLocaleString()}   |   Updated: ${new Date(issue.updatedAt as unknown as string).toLocaleString()}`
          );

        doc.moveDown(0.6);
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();
        doc.moveDown(0.8);
      });

      if (issues.length === 0) {
        doc.fontSize(11).fillColor('#666').text('No issues match the current filters.');
      }

      doc.end();
      return;
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid format. Use ?format=json or ?format=pdf',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting issues',
      error: (error as Error).message,
    });
  }
};
