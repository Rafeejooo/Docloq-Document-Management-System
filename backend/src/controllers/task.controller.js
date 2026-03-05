// Task Controller — CRUD + completion with workflow integration

import { db } from '../db/index.js';
import {
  tasks,
  taskComments,
  users,
  documents,
  documentVersions,
  forms,
  formInstances,
  formWorkflowSteps,
} from '../db/schema.js';
import { eq, and, desc, asc, sql, or, inArray } from 'drizzle-orm';
import path from 'path';

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
        .where(inArray(users.id, creatorIds));
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
        .where(inArray(documents.id, docIds));
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
        .where(inArray(forms.id, formIds));
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

// ══════════════════════════════════════════════
//  TASK DOCUMENT CONFIG (OnlyOffice integration by role)
// ══════════════════════════════════════════════

// GET /api/tasks/:id/document-config — OnlyOffice config based on task type
export const getTaskDocumentConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // Get task + linked workflow step
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const docId = task.relatedDocumentId;
    if (!docId) return res.status(404).json({ success: false, message: 'No document linked to this task' });

    const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Determine mode based on task type
    // fill = edit, sign = edit, review = view, approve = view
    const mode = (task.taskType === 'fill' || task.taskType === 'sign') ? 'edit' : 'view';

    const ext = path.extname(doc.originalFilename || doc.filename).toLowerCase().slice(1);
    const backendUrlDocker = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
    const onlyOfficeUrl = process.env.ONLYOFFICE_URL || 'http://localhost:8082';

    const documentType = ext === 'docx' || ext === 'doc' ? 'word'
      : ext === 'xlsx' || ext === 'xls' ? 'cell'
      : ext === 'pptx' || ext === 'ppt' ? 'slide' : 'word';

    const config = {
      document: {
        fileType: ext,
        key: `${doc.id}-${doc.updatedAt?.getTime() || Date.now()}`,
        title: doc.originalFilename || doc.filename,
        url: `${backendUrlDocker}/api/documents/${doc.id}/file`,
        permissions: {
          edit: mode === 'edit',
          download: true,
          print: true,
          review: false,
          comment: task.taskType === 'review', // reviewers can add comments
        },
      },
      documentType,
      editorConfig: {
        mode,
        lang: 'en',
        callbackUrl: mode === 'edit' ? `${backendUrlDocker}/api/documents/${doc.id}/callback` : undefined,
        user: {
          id: req.user?.id || 'guest',
          name: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Guest User',
        },
        customization: {
          autosave: false,
          forcesave: false,
          chat: false,
          comments: task.taskType === 'review',
          help: false,
        },
      },
      type: 'desktop',
    };

    // Get workflow context (step order, total steps)
    let workflowContext = null;
    if (task.relatedFormInstanceId) {
      const allSteps = await db.select({
        step: formWorkflowSteps,
        userName: users.firstName,
        userLastName: users.lastName,
      })
        .from(formWorkflowSteps)
        .leftJoin(users, eq(formWorkflowSteps.assignedTo, users.id))
        .where(eq(formWorkflowSteps.formInstanceId, task.relatedFormInstanceId))
        .orderBy(asc(formWorkflowSteps.stepOrder));

      const currentStep = allSteps.find(s => s.step.taskId === id);

      workflowContext = {
        steps: allSteps.map(s => ({
          id: s.step.id,
          stepOrder: s.step.stepOrder,
          action: s.step.action,
          status: s.step.status,
          assignee: s.userName ? `${s.userName}${s.userLastName ? ' ' + s.userLastName : ''}` : 'Unknown',
          notes: s.step.notes,
          completedAt: s.step.completedAt,
        })),
        currentStepOrder: currentStep?.step.stepOrder || null,
        totalSteps: allSteps.length,
      };
    }

    res.json({
      success: true,
      data: {
        task,
        document: doc,
        config,
        onlyOfficeUrl: `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`,
        mode,
        workflowContext,
      },
    });
  } catch (error) {
    console.error('Get task document config error:', error);
    res.status(500).json({ success: false, message: 'Failed to get task document config' });
  }
};

// PUT /api/tasks/:id/submit — submit a workflow step action
// For review: { notes: "looks good" }
// For approve: { approved: true/false, notes: "optional reason" }
// For fill/sign: no body needed (just marks as complete)
export const submitTaskAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, approved } = req.body;

    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.status === 'completed') return res.status(400).json({ success: false, message: 'Task already completed' });
    if (task.status === 'pending') return res.status(400).json({ success: false, message: 'Task is not yet active' });

    // For approve action — if rejected, cancel the workflow
    if (task.taskType === 'approve' && approved === false) {
      // Mark task as cancelled
      await db.update(tasks).set({
        status: 'cancelled',
        updatedAt: new Date(),
      }).where(eq(tasks.id, id));

      // Find and update linked workflow step
      const [linkedStep] = await db.select().from(formWorkflowSteps)
        .where(eq(formWorkflowSteps.taskId, id));

      if (linkedStep) {
        await db.update(formWorkflowSteps).set({
          status: 'skipped',
          notes: notes || 'Rejected by approver',
          updatedAt: new Date(),
        }).where(eq(formWorkflowSteps.id, linkedStep.id));

        // Cancel all remaining pending steps
        await db.update(formWorkflowSteps).set({
          status: 'skipped',
          updatedAt: new Date(),
        }).where(and(
          eq(formWorkflowSteps.formInstanceId, linkedStep.formInstanceId),
          eq(formWorkflowSteps.status, 'pending'),
        ));

        // Cancel remaining pending tasks
        const remainingSteps = await db.select().from(formWorkflowSteps)
          .where(and(
            eq(formWorkflowSteps.formInstanceId, linkedStep.formInstanceId),
            eq(formWorkflowSteps.status, 'skipped'),
          ));
        for (const s of remainingSteps) {
          if (s.taskId && s.taskId !== id) {
            await db.update(tasks).set({ status: 'cancelled', updatedAt: new Date() })
              .where(eq(tasks.id, s.taskId));
          }
        }

        // Mark form instance as rejected
        await db.update(formInstances).set({
          status: 'cancelled',
          updatedAt: new Date(),
        }).where(eq(formInstances.id, linkedStep.formInstanceId));
      }

      // Save rejection comment
      if (notes) {
        const userId = await resolveUserId(req);
        await db.insert(taskComments).values({
          taskId: id,
          content: `Rejected: ${notes}`,
          createdBy: userId,
        });
      }

      return res.json({ success: true, message: 'Task rejected, workflow cancelled', data: { status: 'cancelled' } });
    }

    // For review — save notes to the workflow step
    if (task.taskType === 'review' && notes) {
      const [linkedStep] = await db.select().from(formWorkflowSteps)
        .where(eq(formWorkflowSteps.taskId, id));
      if (linkedStep) {
        await db.update(formWorkflowSteps).set({
          notes,
          updatedAt: new Date(),
        }).where(eq(formWorkflowSteps.id, linkedStep.id));
      }

      // Also save as comment
      const userId = await resolveUserId(req);
      await db.insert(taskComments).values({
        taskId: id,
        content: `Review notes: ${notes}`,
        createdBy: userId,
      });
    }

    // Mark task completed
    const [updated] = await db.update(tasks).set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(tasks.id, id)).returning();

    // Sync workflow step + activate next
    const [linkedStep] = await db.select().from(formWorkflowSteps)
      .where(eq(formWorkflowSteps.taskId, id));

    if (linkedStep) {
      await db.update(formWorkflowSteps).set({
        status: 'completed',
        completedAt: new Date(),
        notes: notes || linkedStep.notes,
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
    console.error('Submit task action error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit task action' });
  }
};
