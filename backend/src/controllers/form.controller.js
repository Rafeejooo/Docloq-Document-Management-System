// Form Controller — Templates, Instances, Workflow

import { db } from '../db/index.js';
import {
  forms,
  formInstances,
  formWorkflowSteps,
  formSubmissions,
  tasks,
  users,
  documents,
  documentVersions,
  trashItems,
} from '../db/schema.js';
import { eq, and, desc, asc, sql, count, inArray } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { createBlankDocx, convertDocument, downloadFromUrl } from '../services/conversion.service.js';
import { downloadFile, uploadFile } from '../services/storage.service.js';
import { decryptFile, encryptFile as encryptFileService, generateDocumentKey } from '../services/encryption.service.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ensureUploadDir = async () => {
  try { await fs.access(UPLOAD_DIR); } catch { await fs.mkdir(UPLOAD_DIR, { recursive: true }); }
};

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

// ══════════════════════════════════════════════
//  FORM TEMPLATES (CRUD)
// ══════════════════════════════════════════════

// GET /api/forms/templates — list all form templates
export const getFormTemplates = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const allForms = await db
      .select()
      .from(forms)
      .where(and(eq(forms.organizationId, orgId), eq(forms.isActive, true)))
      .orderBy(desc(forms.createdAt));

    res.json({ success: true, data: allForms });
  } catch (error) {
    console.error('Get form templates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch form templates' });
  }
};

// GET /api/forms/templates/:id — single template
export const getFormTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    if (!form) return res.status(404).json({ success: false, message: 'Form template not found' });

    res.json({ success: true, data: form });
  } catch (error) {
    console.error('Get form template error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch form template' });
  }
};

// POST /api/forms/templates — create new template
export const createFormTemplate = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const { title, description, icon, category, schema: formSchema, uiSchema, linkedTemplateId } = req.body;
    if (!title || !formSchema) {
      return res.status(400).json({ success: false, message: 'Title and schema are required' });
    }

    // Resolve creator
    let createdBy = req.user?.id;
    if (!createdBy) {
      const [firstUser] = await db.select().from(users).limit(1);
      if (firstUser) createdBy = firstUser.id;
    }

    const [newForm] = await db.insert(forms).values({
      organizationId: orgId,
      title,
      description: description || null,
      icon: icon || 'document',
      category: category || 'general',
      schema: formSchema,
      uiSchema: uiSchema || null,
      linkedTemplateId: linkedTemplateId || null,
      createdBy,
    }).returning();

    res.status(201).json({ success: true, data: newForm });
  } catch (error) {
    console.error('Create form template error:', error);
    res.status(500).json({ success: false, message: 'Failed to create form template' });
  }
};

// PUT /api/forms/templates/:id — update template
export const updateFormTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, category, schema: formSchema, uiSchema } = req.body;

    const [existing] = await db.select().from(forms).where(eq(forms.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Form template not found' });

    const [updated] = await db.update(forms).set({
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(icon && { icon }),
      ...(category && { category }),
      ...(formSchema && { schema: formSchema }),
      ...(uiSchema !== undefined && { uiSchema }),
      updatedAt: new Date(),
    }).where(eq(forms.id, id)).returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update form template error:', error);
    res.status(500).json({ success: false, message: 'Failed to update form template' });
  }
};

// DELETE /api/forms/templates/:id — soft delete template
export const deleteFormTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Get template info for trash metadata
    const [template] = await db.select().from(forms).where(eq(forms.id, id));
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const userId = req.user?.id || template.createdBy;
    const orgId = template.organizationId;
    const now = new Date();
    const autoDeleteDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Soft-delete template
    await db.update(forms).set({ isActive: false, updatedAt: now }).where(eq(forms.id, id));

    // Insert into trash_items
    await db.insert(trashItems).values({
      organizationId: orgId,
      itemType: 'template',
      itemId: id,
      originalFolderId: null,
      originalPath: template.title,
      itemMetadata: {
        title: template.title,
        description: template.description,
        icon: template.icon,
        category: template.category,
        createdBy: template.createdBy,
        documentId: template.schema?.documentId || null,
      },
      autoDeleteAt: autoDeleteDate,
      deletedBy: userId,
      deletedAt: now,
    });

    res.json({ success: true, message: 'Template moved to trash' });
  } catch (error) {
    console.error('Delete form template error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete form template' });
  }
};

// ══════════════════════════════════════════════
//  FORM INSTANCES (created from templates with workflow)
// ══════════════════════════════════════════════

// GET /api/forms/instances — list form instances
export const getFormInstances = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    // Get instances with form template info
    const instances = await db
      .select({
        instance: formInstances,
        formTitle: forms.title,
        formIcon: forms.icon,
        formCategory: forms.category,
      })
      .from(formInstances)
      .leftJoin(forms, eq(formInstances.formId, forms.id))
      .where(eq(formInstances.organizationId, orgId))
      .orderBy(desc(formInstances.createdAt));

    // Get workflow steps for each instance
    const instanceIds = instances.map(i => i.instance.id);
    let allSteps = [];
    if (instanceIds.length > 0) {
      allSteps = await db
        .select({
          step: formWorkflowSteps,
          userName: users.firstName,
          userLastName: users.lastName,
          userEmail: users.email,
        })
        .from(formWorkflowSteps)
        .leftJoin(users, eq(formWorkflowSteps.assignedTo, users.id))
        .where(inArray(formWorkflowSteps.formInstanceId, instanceIds))
        .orderBy(asc(formWorkflowSteps.stepOrder));
    }

    // Map steps to instances
    const stepsMap = {};
    for (const row of allSteps) {
      const instId = row.step.formInstanceId;
      if (!stepsMap[instId]) stepsMap[instId] = [];
      stepsMap[instId].push({
        ...row.step,
        user: row.userName
          ? `${row.userName}${row.userLastName ? ' ' + row.userLastName : ''}`
          : row.userEmail || 'Unknown',
      });
    }

    // Get creator info
    const creatorIds = [...new Set(instances.map(i => i.instance.createdBy).filter(Boolean))];
    let creatorsMap = {};
    if (creatorIds.length > 0) {
      const creators = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .where(inArray(users.id, creatorIds));
      for (const c of creators) {
        creatorsMap[c.id] = c.firstName ? `${c.firstName}${c.lastName ? ' ' + c.lastName : ''}` : c.email;
      }
    }

    const data = instances.map(row => ({
      ...row.instance,
      templateName: row.formTitle,
      templateIcon: row.formIcon,
      templateCategory: row.formCategory,
      creatorName: creatorsMap[row.instance.createdBy] || 'Unknown',
      workflow: stepsMap[row.instance.id] || [],
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get form instances error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch form instances' });
  }
};

// GET /api/forms/instances/:id — single instance with workflow
export const getFormInstance = async (req, res) => {
  try {
    const { id } = req.params;

    const [instanceRow] = await db
      .select({
        instance: formInstances,
        formTitle: forms.title,
        formIcon: forms.icon,
        formCategory: forms.category,
        formSchema: forms.schema,
      })
      .from(formInstances)
      .leftJoin(forms, eq(formInstances.formId, forms.id))
      .where(eq(formInstances.id, id));

    if (!instanceRow) return res.status(404).json({ success: false, message: 'Form instance not found' });

    // Get workflow steps
    const steps = await db
      .select({
        step: formWorkflowSteps,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(formWorkflowSteps)
      .leftJoin(users, eq(formWorkflowSteps.assignedTo, users.id))
      .where(eq(formWorkflowSteps.formInstanceId, id))
      .orderBy(asc(formWorkflowSteps.stepOrder));

    const data = {
      ...instanceRow.instance,
      templateName: instanceRow.formTitle,
      templateIcon: instanceRow.formIcon,
      templateCategory: instanceRow.formCategory,
      formSchema: instanceRow.formSchema,
      workflow: steps.map(row => ({
        ...row.step,
        user: row.userName
          ? `${row.userName}${row.userLastName ? ' ' + row.userLastName : ''}`
          : row.userEmail || 'Unknown',
      })),
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get form instance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch form instance' });
  }
};

// POST /api/forms/instances — create form instance from template
export const createFormInstance = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const { name, formId, startDate, dueDate, workflowSteps } = req.body;
    if (!name || !formId) {
      return res.status(400).json({ success: false, message: 'Name and formId are required' });
    }

    // Validate form template exists
    const [formTemplate] = await db.select().from(forms).where(eq(forms.id, formId));
    if (!formTemplate) return res.status(404).json({ success: false, message: 'Form template not found' });

    // Resolve creator
    let createdBy = req.user?.id;
    if (!createdBy) {
      const [firstUser] = await db.select().from(users).limit(1);
      if (firstUser) createdBy = firstUser.id;
    }

    // ── Copy the template document if it has one ──
    let copiedDocumentId = null;
    const templateDocId = formTemplate.schema?.documentId;

    if (templateDocId) {
      // Fetch original document record
      const [originalDoc] = await db.select().from(documents).where(eq(documents.id, templateDocId));

      if (originalDoc) {
        let fileBuffer = null;

        // Strategy 1: Encrypted pipeline file (has a version with encryption data)
        if (originalDoc.currentVersionId) {
          try {
            const [version] = await db.select().from(documentVersions)
              .where(eq(documentVersions.id, originalDoc.currentVersionId));

            if (version && version.encryptionKeyId && version.encryptionIv && version.s3Key) {
              const encryptedBuffer = await downloadFile(version.s3Key);

              let authTag = null;
              try {
                const metaBuffer = await downloadFile(`${version.s3Key}.meta.json`);
                const meta = JSON.parse(metaBuffer.toString());
                authTag = meta.authTag;
              } catch { /* no meta file */ }

              if (authTag) {
                fileBuffer = decryptFile(encryptedBuffer, version.encryptionKeyId, version.encryptionIv, authTag);
              }
            }
          } catch (err) {
            console.warn('Encrypted copy failed, trying legacy:', err.message);
          }
        }

        // Strategy 2: Legacy plain file in uploads/
        if (!fileBuffer && originalDoc.filename) {
          try {
            const legacyPath = path.join(process.cwd(), 'uploads', originalDoc.filename);
            fileBuffer = await fs.readFile(legacyPath);
          } catch { /* file not found */ }
        }

        if (fileBuffer) {
          // Save the copy as a new simple file in uploads/
          const fileExt = path.extname(originalDoc.originalFilename || originalDoc.filename);
          const copyFilename = `${randomUUID()}${fileExt}`;
          const copyPath = path.join(UPLOAD_DIR, copyFilename);
          await ensureUploadDir();
          await fs.writeFile(copyPath, fileBuffer);

          // Create new document record
          const [copiedDoc] = await db.insert(documents).values({
            organizationId: orgId,
            filename: copyFilename,
            originalFilename: `${name}${fileExt}`,
            mimeType: originalDoc.mimeType,
            fileSize: fileBuffer.length,
            ownerId: createdBy,
            status: 'active',
          }).returning();

          copiedDocumentId = copiedDoc.id;
          console.log(`[CreateFormInstance] Copied template doc ${templateDocId} → ${copiedDocumentId}`);
        }
      }
    }

    // Create instance
    const [instance] = await db.insert(formInstances).values({
      organizationId: orgId,
      formId,
      name,
      status: 'active',
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      generatedDocumentId: copiedDocumentId,
      createdBy,
    }).returning();

    // Increment usage count on template
    await db.update(forms).set({
      usageCount: sql`${forms.usageCount} + 1`,
    }).where(eq(forms.id, formId));

    // Create workflow steps and auto-create tasks
    let createdSteps = [];
    if (workflowSteps && workflowSteps.length > 0) {
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        
        // Create task for this workflow step
        const [task] = await db.insert(tasks).values({
          organizationId: orgId,
          title: `${step.action.charAt(0).toUpperCase() + step.action.slice(1)} — ${name}`,
          description: `Workflow step: ${step.action} for form "${name}" (based on ${formTemplate.title})`,
          taskType: step.action,
          assignedTo: step.userId,
          relatedDocumentId: copiedDocumentId,
          relatedFormId: formId,
          relatedFormInstanceId: instance.id,
          status: i === 0 ? 'in_progress' : 'pending', // First step is active
          priority: 'medium',
          dueDate: dueDate ? new Date(dueDate) : null,
          createdBy,
        }).returning();

        // Create workflow step with task reference
        const [createdStep] = await db.insert(formWorkflowSteps).values({
          formInstanceId: instance.id,
          stepOrder: i + 1,
          action: step.action,
          assignedTo: step.userId,
          status: i === 0 ? 'in_progress' : 'pending',
          taskId: task.id,
        }).returning();

        createdSteps.push(createdStep);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...instance,
        templateName: formTemplate.title,
        workflow: createdSteps,
        copiedDocumentId,
      },
    });
  } catch (error) {
    console.error('Create form instance error:', error);
    res.status(500).json({ success: false, message: 'Failed to create form instance' });
  }
};

// PUT /api/forms/instances/:id — update form instance
export const updateFormInstance = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, startDate, dueDate } = req.body;

    const [existing] = await db.select().from(formInstances).where(eq(formInstances.id, id));
    if (!existing) return res.status(404).json({ success: false, message: 'Form instance not found' });

    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status === 'completed') updateData.completedAt = new Date();

    const [updated] = await db.update(formInstances)
      .set(updateData)
      .where(eq(formInstances.id, id))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update form instance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update form instance' });
  }
};

// DELETE /api/forms/instances/:id — delete instance + steps + tasks
export const deleteFormInstance = async (req, res) => {
  try {
    const { id } = req.params;

    // Get workflow steps to find associated tasks
    const steps = await db.select().from(formWorkflowSteps)
      .where(eq(formWorkflowSteps.formInstanceId, id));

    // Cancel associated tasks
    for (const step of steps) {
      if (step.taskId) {
        await db.update(tasks).set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(tasks.id, step.taskId));
      }
    }

    // Delete workflow steps (cascade should handle this but be explicit)
    await db.delete(formWorkflowSteps).where(eq(formWorkflowSteps.formInstanceId, id));

    // Delete instance
    await db.delete(formInstances).where(eq(formInstances.id, id));

    res.json({ success: true, message: 'Form instance deleted' });
  } catch (error) {
    console.error('Delete form instance error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete form instance' });
  }
};

// ══════════════════════════════════════════════
//  WORKFLOW STEP ACTIONS
// ══════════════════════════════════════════════

// PUT /api/forms/workflow-steps/:id — update workflow step status
export const updateWorkflowStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const [step] = await db.select().from(formWorkflowSteps).where(eq(formWorkflowSteps.id, id));
    if (!step) return res.status(404).json({ success: false, message: 'Workflow step not found' });

    const updateData = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'completed') updateData.completedAt = new Date();

    const [updated] = await db.update(formWorkflowSteps)
      .set(updateData)
      .where(eq(formWorkflowSteps.id, id))
      .returning();

    // Also update the linked task
    if (step.taskId) {
      const taskStatus = status === 'completed' ? 'completed' : status === 'in_progress' ? 'in_progress' : 'pending';
      await db.update(tasks).set({
        status: taskStatus,
        ...(status === 'completed' && { completedAt: new Date() }),
        updatedAt: new Date(),
      }).where(eq(tasks.id, step.taskId));
    }

    // If step completed, activate next step
    if (status === 'completed') {
      const nextSteps = await db.select().from(formWorkflowSteps)
        .where(and(
          eq(formWorkflowSteps.formInstanceId, step.formInstanceId),
          eq(formWorkflowSteps.stepOrder, step.stepOrder + 1),
        ));

      if (nextSteps.length > 0) {
        const nextStep = nextSteps[0];
        await db.update(formWorkflowSteps).set({
          status: 'in_progress',
          updatedAt: new Date(),
        }).where(eq(formWorkflowSteps.id, nextStep.id));

        // Activate the next task
        if (nextStep.taskId) {
          await db.update(tasks).set({
            status: 'in_progress',
            updatedAt: new Date(),
          }).where(eq(tasks.id, nextStep.taskId));
        }
      } else {
        // All steps completed — mark instance as completed
        await db.update(formInstances).set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(formInstances.id, step.formInstanceId));
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update workflow step error:', error);
    res.status(500).json({ success: false, message: 'Failed to update workflow step' });
  }
};

// ══════════════════════════════════════════════
//  USERS LIST (for workflow assignment)
// ══════════════════════════════════════════════

// GET /api/forms/users — list org users for assignment
export const getOrgUsers = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const orgUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(asc(users.firstName));

    const data = orgUsers.map(u => ({
      ...u,
      name: u.firstName ? `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}` : u.email,
      avatar: u.firstName ? u.firstName.charAt(0).toUpperCase() + (u.lastName ? u.lastName.charAt(0).toUpperCase() : '') : u.email.charAt(0).toUpperCase(),
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get org users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// ══════════════════════════════════════════════
//  TEMPLATE DOCUMENT MANAGEMENT
//  Creates document-backed templates that open in OnlyOffice
// ══════════════════════════════════════════════

// Helper: create a document record from a buffer
async function createDocumentRecord(orgId, userId, filename, buffer, mimeType) {
  await ensureUploadDir();
  const ext = path.extname(filename);
  const uniqueFilename = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, uniqueFilename);
  await fs.writeFile(filePath, buffer);

  const [newDoc] = await db.insert(documents).values({
    organizationId: orgId,
    filename: uniqueFilename,
    originalFilename: filename,
    mimeType,
    fileSize: buffer.length,
    ownerId: userId,
    status: 'active',
  }).returning();

  return newDoc;
}

// POST /api/forms/templates/create-blank
// Creates a blank DOCX document, then creates a form template linked to it.
// Returns { template, document } so frontend can open OnlyOffice.
export const createBlankTemplate = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    let userId = req.user?.id;
    if (!userId) {
      const [firstUser] = await db.select().from(users).limit(1);
      if (firstUser) userId = firstUser.id;
    }
    if (!userId) return res.status(400).json({ success: false, message: 'No user found' });

    const { title, description, icon, category } = req.body;
    const templateName = title || 'Untitled Template';

    // 1. Create blank .docx buffer
    const docxBuffer = await createBlankDocx();

    // 2. Save as document record
    const doc = await createDocumentRecord(
      orgId,
      userId,
      `${templateName.replace(/[^a-zA-Z0-9 ]/g, '')}.docx`,
      docxBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    // 3. Create form template with document reference in schema
    const [template] = await db.insert(forms).values({
      organizationId: orgId,
      title: templateName,
      description: description || null,
      icon: icon || 'document',
      category: category || 'general',
      schema: { type: 'document-template', documentId: doc.id, fields: [] },
      createdBy: userId,
    }).returning();

    res.status(201).json({
      success: true,
      data: { template, document: doc },
    });
  } catch (error) {
    console.error('Create blank template error:', error);
    res.status(500).json({ success: false, message: 'Failed to create blank template' });
  }
};

// POST /api/forms/templates/upload-file
// Accepts file upload (DOCX, PDF, ODT, etc.). If PDF → converts to DOCX via OnlyOffice.
// Creates document record + form template. Returns both.
export const uploadExistingTemplate = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    let userId = req.user?.id;
    if (!userId) {
      const [firstUser] = await db.select().from(users).limit(1);
      if (firstUser) userId = firstUser.id;
    }
    if (!userId) return res.status(400).json({ success: false, message: 'No user found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { title, description, icon, category } = req.body;
    const { originalname, mimetype, buffer } = req.file;
    const ext = path.extname(originalname).toLowerCase();
    const templateName = title || path.basename(originalname, ext);

    let finalBuffer = buffer;
    let finalMimeType = mimetype;
    let finalExt = ext;
    let finalOriginalName = originalname;

    // If PDF, convert to DOCX via OnlyOffice
    if (ext === '.pdf' || mimetype === 'application/pdf') {
      console.log('[UploadTemplate] PDF detected, converting to DOCX...');

      // Save PDF temporarily so OnlyOffice can fetch it
      await ensureUploadDir();
      const tempFilename = `temp_${randomUUID()}.pdf`;
      const tempPath = path.join(UPLOAD_DIR, tempFilename);
      await fs.writeFile(tempPath, buffer);

      try {
        // Build URL that OnlyOffice (in Docker) can access
        const backendUrlDocker = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
        const tempFileUrl = `${backendUrlDocker}/uploads/${tempFilename}`;

        const { url: convertedUrl } = await convertDocument(tempFileUrl, 'pdf', 'docx');

        // Download converted file
        finalBuffer = await downloadFromUrl(convertedUrl);
        finalMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        finalExt = '.docx';
        finalOriginalName = originalname.replace(/\.pdf$/i, '.docx');
        console.log('[UploadTemplate] PDF→DOCX conversion successful');
      } finally {
        // Clean up temp PDF
        try { await fs.unlink(tempPath); } catch {}
      }
    }

    // Save document
    const doc = await createDocumentRecord(
      orgId,
      userId,
      finalOriginalName,
      finalBuffer,
      finalMimeType,
    );

    // Create form template
    const [template] = await db.insert(forms).values({
      organizationId: orgId,
      title: templateName,
      description: description || null,
      icon: icon || 'document',
      category: category || 'general',
      schema: { type: 'document-template', documentId: doc.id, fields: [] },
      createdBy: userId,
    }).returning();

    res.status(201).json({
      success: true,
      data: { template, document: doc },
    });
  } catch (error) {
    console.error('Upload existing template error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload template' });
  }
};

// GET /api/forms/templates/:id/document
// Returns the document info and OnlyOffice config for a template's linked document
export const getTemplateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const mode = req.query.mode === 'view' ? 'view' : 'edit';

    const [template] = await db.select().from(forms).where(eq(forms.id, id));
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const docId = template.schema?.documentId;
    if (!docId) return res.status(404).json({ success: false, message: 'No document linked to this template' });

    const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
    if (!doc) return res.status(404).json({ success: false, message: 'Linked document not found' });

    // Build OnlyOffice config (same pattern as document.controller.js)
    const ext = path.extname(doc.originalFilename).toLowerCase().slice(1);
    const backendUrlDocker = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
    const onlyOfficeUrl = process.env.ONLYOFFICE_URL || 'http://localhost:8082';

    // Use template title as the displayed document name (preserving file extension)
    const displayTitle = `${template.title}.${ext}`;

    const config = {
      document: {
        fileType: ext,
        key: `${doc.id}-${doc.updatedAt?.getTime() || Date.now()}`,
        title: displayTitle,
        url: `${backendUrlDocker}/api/documents/${doc.id}/file`,
        permissions: {
          edit: mode === 'edit',
          download: true,
          print: true,
          review: mode === 'edit',
          comment: mode === 'edit',
        },
      },
      documentType: ext === 'docx' || ext === 'doc' ? 'word' : ext === 'xlsx' || ext === 'xls' ? 'cell' : ext === 'pptx' || ext === 'ppt' ? 'slide' : 'word',
      editorConfig: {
        mode: mode,
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
          comments: true,
          help: false,
        },
      },
      type: 'desktop',
    };

    res.json({
      success: true,
      data: {
        document: doc,
        templateTitle: template.title,
        config,
        onlyOfficeUrl: `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`,
      },
    });
  } catch (error) {
    console.error('Get template document error:', error);
    res.status(500).json({ success: false, message: 'Failed to get template document' });
  }
};