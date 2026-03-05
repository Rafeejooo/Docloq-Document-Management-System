// Task Controller — CRUD + completion with workflow integration

import { db } from '../db/index.js';
import {
  tasks,
  taskComments,
  users,
  documents,
  forms,
  formInstances,
  formWorkflowSteps,
} from '../db/schema.js';
import { eq, and, desc, asc, sql, or } from 'drizzle-orm';

// ──────────────────────────────────────────────
// Helper: resolve orgId (dev fallback)
// ──────────────────────────────────────────────
async function resolveOrgId(req) {
  let orgId = req.user?.organizationId;
  if (!orgId) {
    const { organizations } = await import('../db/schema.js');
    const [firstOrg] = await db.select().from(organizations).limit(1);
    if (firstOrg) orgId = firstOrg.id;
  }
  return orgId;
}

async function resolveUserId(req) {
  let userId = req.user?.id;
  if (!userId) {
    const [firstUser] = await db.select().from(users).limit(1);
    if (firstUser) userId = firstUser.id;
  }
  return userId;
}

// ══════════════════════════════════════════════
//  TASKS CRUD
// ══════════════════════════════════════════════

// GET /api/tasks — list tasks (optional filters: status, assignedTo)
export const getTasks = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const { status, priority } = req.query;

    // Build conditions
    const conditions = [eq(tasks.organizationId, orgId)];
    if (status) conditions.push(eq(tasks.status, status));
    if (priority) conditions.push(eq(tasks.priority, priority));

    const allTasks = await db
      .select({
        task: tasks,
        assigneeName: users.firstName,
        assigneeLastName: users.lastName,
        assigneeEmail: users.email,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    // Get creator info for all tasks
    const creatorIds = [...new Set(allTasks.map(t => t.task.createdBy).filter(Boolean))];
    let creatorsMap = {};
    if (creatorIds.length > 0) {
      const creators = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(sql`${users.id} = ANY(${creatorIds})`);
      for (const c of creators) {
        creatorsMap[c.id] = {
          name: c.firstName ? `${c.firstName}${c.lastName ? ' ' + c.lastName : ''}` : c.email,
          avatar: c.firstName ? c.firstName.charAt(0).toUpperCase() + (c.lastName ? c.lastName.charAt(0).toUpperCase() : '') : c.email.charAt(0).toUpperCase(),
        };
      }
    }

    // Get related document names
    const docIds = [...new Set(allTasks.map(t => t.task.relatedDocumentId).filter(Boolean))];
    let docsMap = {};
    if (docIds.length > 0) {
      const docs = await db
        .select({ id: documents.id, filename: documents.filename, originalFilename: documents.originalFilename })
        .from(documents)
        .where(sql`${documents.id} = ANY(${docIds})`);
      for (const d of docs) {
        docsMap[d.id] = d.originalFilename || d.filename;
      }
    }

    // Get related form names
    const formIds = [...new Set(allTasks.map(t => t.task.relatedFormId).filter(Boolean))];
    let formsMap = {};
    if (formIds.length > 0) {
      const formsList = await db
        .select({ id: forms.id, title: forms.title })
        .from(forms)
        .where(sql`${forms.id} = ANY(${formIds})`);
      for (const f of formsList) {
        formsMap[f.id] = f.title;
      }
    }

    const data = allTasks.map(row => ({
      ...row.task,
      assignee: row.assigneeName
        ? {
            name: `${row.assigneeName}${row.assigneeLastName ? ' ' + row.assigneeLastName : ''}`,
            avatar: row.assigneeName.charAt(0).toUpperCase() + (row.assigneeLastName ? row.assigneeLastName.charAt(0).toUpperCase() : ''),
          }
        : row.assigneeEmail ? { name: row.assigneeEmail, avatar: row.assigneeEmail.charAt(0).toUpperCase() } : null,
      assignedBy: creatorsMap[row.task.createdBy] || { name: 'System', avatar: 'S' },
      documentName: docsMap[row.task.relatedDocumentId] || null,
      formName: formsMap[row.task.relatedFormId] || null,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// GET /api/tasks/:id — single task
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [row] = await db
      .select({
        task: tasks,
        assigneeName: users.firstName,
        assigneeLastName: users.lastName,
        assigneeEmail: users.email,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, id));

    if (!row) return res.status(404).json({ success: false, message: 'Task not found' });

    // Get comments
    const comments = await db
      .select({
        comment: taskComments,
        authorName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.createdBy, users.id))
      .where(eq(taskComments.taskId, id))
      .orderBy(asc(taskComments.createdAt));

    const data = {
      ...row.task,
      assignee: row.assigneeName
        ? `${row.assigneeName}${row.assigneeLastName ? ' ' + row.assigneeLastName : ''}`
        : row.assigneeEmail || null,
      comments: comments.map(c => ({
        ...c.comment,
        author: c.authorName ? `${c.authorName}${c.authorLastName ? ' ' + c.authorLastName : ''}` : 'Unknown',
      })),
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

// POST /api/tasks — create task
export const createTask = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const { title, description, taskType, assignedTo, priority, dueDate, relatedDocumentId, relatedFormId, checklist } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const createdBy = await resolveUserId(req);

    const [task] = await db.insert(tasks).values({
      organizationId: orgId,
      title,
      description: description || null,
      taskType: taskType || 'general',
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      relatedDocumentId: relatedDocumentId || null,
      relatedFormId: relatedFormId || null,
      checklist: checklist || null,
      createdBy,
    }).returning();

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// PUT /api/tasks/:id — update task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

    const updateData = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status === 'completed') updateData.completedAt = new Date();

    const [updated] = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// PUT /api/tasks/:id/complete — complete a task (+ sync workflow step)
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Mark task completed
    const [updated] = await db.update(tasks).set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(tasks.id, id)).returning();

    // If this task is linked to a workflow step, update it too
    const [linkedStep] = await db.select().from(formWorkflowSteps)
      .where(eq(formWorkflowSteps.taskId, id));

    if (linkedStep) {
      // Mark step completed
      await db.update(formWorkflowSteps).set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(formWorkflowSteps.id, linkedStep.id));

      // Activate next step
      const [nextStep] = await db.select().from(formWorkflowSteps)
        .where(and(
          eq(formWorkflowSteps.formInstanceId, linkedStep.formInstanceId),
          eq(formWorkflowSteps.stepOrder, linkedStep.stepOrder + 1),
        ));

      if (nextStep) {
        await db.update(formWorkflowSteps).set({
          status: 'in_progress', updatedAt: new Date(),
        }).where(eq(formWorkflowSteps.id, nextStep.id));

        if (nextStep.taskId) {
          await db.update(tasks).set({
            status: 'in_progress', updatedAt: new Date(),
          }).where(eq(tasks.id, nextStep.taskId));
        }
      } else {
        // All steps done — complete the form instance
        await db.update(formInstances).set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(formInstances.id, linkedStep.formInstanceId));
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete task' });
  }
};

// DELETE /api/tasks/:id — delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(taskComments).where(eq(taskComments.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

// POST /api/tasks/:id/comments — add comment
export const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

    const createdBy = await resolveUserId(req);

    const [comment] = await db.insert(taskComments).values({
      taskId: id,
      content,
      createdBy,
    }).returning();

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Add task comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};
