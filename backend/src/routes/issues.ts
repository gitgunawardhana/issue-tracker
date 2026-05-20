import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  updateIssueStatus,
  assignIssue,
} from '../controllers/issueController';

const router = Router();

router.use(authenticateToken);

router.post('/', createIssue);
router.get('/', getIssues);
router.get('/:id', getIssueById);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);
router.patch('/:id/status', updateIssueStatus);
router.patch('/:id/assign', assignIssue);

export default router;
