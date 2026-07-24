import { Response } from 'express';
import { db } from '../db/index.js';
import { tasks } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

// 1. CREATE A NEW TASK INSIDE A PROJECT (Lean execution)
export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;
        const { title, status, priority } = req.body;

        // Directly insert without transaction block overhead
        const [newTask] = await db.insert(tasks).values({
            title: title as string,
            status: (status as string || 'TODO').toUpperCase(), // Keeps casing safe for the client filter
            priority: (priority as string || 'MEDIUM').toUpperCase(),
            projectId: projectId as string,
        }).returning();

        res.status(201).json({ message: 'Task created successfully!', task: newTask });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 2. GET ALL TASKS FOR A SPECIFIC PROJECT
export const getProjectTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;

        // Fetch flattened list matching only the necessary properties
        const flatTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.projectId, projectId as string));

        res.status(200).json(flatTasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 3. UPDATE TASK (Stripped down metadata updates)
export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { taskId, projectId } = req.params;
        const { title, status, priority } = req.body;

        const updateData: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
        if (title) updateData.title = title as string;
        if (status) updateData.status = (status as string).toUpperCase();
        if (priority) updateData.priority = (priority as string).toUpperCase();

        const updated = await db.update(tasks)
            .set(updateData)
            .where(and(eq(tasks.id, taskId as string), eq(tasks.projectId, projectId as string)))
            .returning();

        if (updated.length === 0) {
            res.status(404).json({ error: 'Task matrix unit not found.' });
            return;
        }

        res.status(200).json({ message: 'Task updated successfully!', task: updated[0] });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 4. DELETE TASK
export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { taskId, projectId } = req.params;

        const deleted = await db.delete(tasks)
            .where(and(eq(tasks.id, taskId as string), eq(tasks.projectId, projectId as string)))
            .returning();

        if (deleted.length === 0) {
            res.status(404).json({ error: 'Task not found.' });
            return;
        }

        res.status(200).json({ message: 'Task deleted successfully!' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};