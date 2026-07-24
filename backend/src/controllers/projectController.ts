import { Response } from 'express';
import { db } from '../db/index.js';
import { projects } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

// 1. CREATE PROJECT (Members and up can create)
export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { workspaceId } = req.params;
        const { name, description } = req.body;

        const newProject = await db.insert(projects).values({
            name: name as string,
            description: description as string || null,
            workspaceId: workspaceId as string,
        }).returning();

        res.status(201).json({ message: 'Project created successfully!', project: newProject[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 2. GET ALL PROJECTS FOR WORKSPACE
export const getWorkspaceProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { workspaceId } = req.params;
        const allProjects = await db.select().from(projects).where(eq(projects.workspaceId, workspaceId as string));
        res.status(200).json(allProjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 3. UPDATE PROJECT (Admins and Owners only)
export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { projectId, workspaceId } = req.params;
        const { name, description } = req.body;

        const updateData: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };
        if (name) updateData.name = name as string;
        if (description !== undefined) updateData.description = description as string;

        const updated = await db
            .update(projects)
            .set(updateData)
            .where(and(eq(projects.id, projectId as string), eq(projects.workspaceId, workspaceId as string)))
            .returning();

        if (updated.length === 0) {
            res.status(404).json({ error: 'Project not found.' });
            return;
        }

        res.status(200).json({ message: 'Project updated successfully!', project: updated[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 4. DELETE PROJECT (Owners only)
export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { projectId, workspaceId } = req.params;

        const deleted = await db
            .delete(projects)
            .where(and(eq(projects.id, projectId as string), eq(projects.workspaceId, workspaceId as string)))
            .returning();

        if (deleted.length === 0) {
            res.status(404).json({ error: 'Project not found.' });
            return;
        }

        res.status(200).json({ message: 'Project deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 5. GET A SINGLE WORKSPACE BY ID
export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {projectId, workspaceId} = req.params;

        if (!userId) {
            res.status(401).json({ error: 'User identification failed.' });
            return;
        }

        const project = await db
            .select()
            .from(projects)
            .where(
                and(
                    eq(projects.id, projectId as string),
                    eq(projects.workspaceId, workspaceId as string)
                )
            );

        if (project.length === 0) {
            res.status(404).json({ error: 'Project not found.' });
            return;
        }

        res.status(200).json(project[0]);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}