// Task Routes

import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  addTaskComment,
} from '../controllers/task.controller.js';

const router = Router();

// GET    /api/tasks              — list tasks (filter: ?status=pending&priority=high)
// POST   /api/tasks              — create task
// GET    /api/tasks/:id          — single task with comments
// PUT    /api/tasks/:id          — update task
// PUT    /api/tasks/:id/complete — complete task (syncs workflow step)
// DELETE /api/tasks/:id          — delete task
// POST   /api/tasks/:id/comments — add comment

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.put('/:id/complete', completeTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addTaskComment);

export default router;
