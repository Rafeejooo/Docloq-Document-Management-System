// Notification Routes — All routes require authentication

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { list, unreadCount, read, readAll, remove } from '../controllers/notification.controller.js';

const router = Router();

router.use(authenticate);

// List notifications (paginated)
router.get('/', list);

// Unread count
router.get('/unread-count', unreadCount);

// Mark all as read
router.patch('/read-all', readAll);

// Mark single as read
router.patch('/:id/read', read);

// Delete notification
router.delete('/:id', remove);

export default router;
