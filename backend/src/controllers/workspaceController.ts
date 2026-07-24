import {Response} from "express";
import {db} from "../db/index.js";
import {users, WorkspaceMembers, workspaces} from "../db/schema.js";
import {eq, and} from 'drizzle-orm';
import {AuthenticatedRequest} from "../middleware/authMiddleware.js";


// 1. Fetch all workspaces a user belongs to
export const getUserWorkspaces = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId as string;

        if (!userId) {
            res.status(400).json({error: 'User identification failed.'});
            return;
        }

        // 🎯 Fix: Join workspaces with WorkspaceMembers to find all joined teams
        const userWorkspaces = await db
            .select({
                id: workspaces.id,
                name: workspaces.name,
                slug: workspaces.slug,
                description: workspaces.description,
                createdAt: workspaces.createdAt,
                updatedAt: workspaces.updatedAt,
                myRole: WorkspaceMembers.role // Pass their access level to the frontend too!
            })
            .from(workspaces)
            .innerJoin(
                WorkspaceMembers,
                eq(workspaces.id, WorkspaceMembers.workspaceId)
            )
            .where(eq(WorkspaceMembers.userId, userId));

        res.status(200).json(userWorkspaces);
    } catch (error) {
        console.error('Database Error in getUserWorkspaces:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 2. CREATE A BRAND-NEW WORKSPACE
export const createWorkSpace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {name, description} = req.body;

        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }

        // Generate a URL-friendly slug (e.g., "Acme Corp" -> "acme-corp-12345")
        const slug = `${name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newWorkspace = await db.transaction(async (tx) => {
            const [workspace] = await tx.insert(workspaces).values({
                name: name as string,
                slug: slug as string,
                description: description as string || null,
                userId: userId as string,
            }).returning();

            await tx.insert(WorkspaceMembers).values({
                workspaceId: workspace!.id,
                userId: userId as string,
                role: 'OWNER',
            });

            return workspace;
        });

        res.status(201).json({
            message: 'Workspace created successfully!',
            workspace: newWorkspace,
        });
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 2. UPDATE A WORKSPACE
export const updateWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {id} = req.params;
        const {name, description} = req.body;
        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }
        const updateData: Partial<typeof workspaces.$inferInsert> = {
            updatedAt: new Date(),
        };
        if (name) updateData.name = name as string;
        if (description !== undefined) updateData.description = description as string;

        const updatedWorkspace = await db
            .update(workspaces)
            .set(updateData)
            .where(and(eq(workspaces.id, id as string), eq(workspaces.userId, userId as string)))
            .returning();

        if (updatedWorkspace.length === 0) {
            res.status(404).json({error: 'Workspace not found or unauthorized.'});
            return;
        }

        res.status(200).json({
            message: 'Workspace updated successfully!',
            workspace: updatedWorkspace[0],
        });
    } catch (error) {
        console.error('Error updating workspace:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 3. DELETE A WORKSPACES
export const deleteWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {id} = req.params;

        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }

        const deletedWorkspace = await db
            .delete(workspaces)
            .where(and(eq(workspaces.id, id as string), eq(workspaces.userId, userId as string)))
            .returning();

        if (deletedWorkspace.length === 0) {
            res.status(404).json({error: 'Workspace not found or unauthorized.'});
            return;
        }

        res.status(200).json({message: 'Workspace deleted successfully!'});
    } catch (error) {
        console.error('Error deleting workspace:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 4. GET A SINGLE WORKSPACE BY ID
export const getWorkspaceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const {id} = req.params;

    if (!userId) {
        res.status(401).json({error: 'User identification failed.'});
        return;
    }

    // Cross-verify across the membership join table
    const workspaceResult = await db
        .select({
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
            description: workspaces.description,
            createdAt: workspaces.createdAt
        })
        .from(workspaces)
        .innerJoin(WorkspaceMembers, eq(workspaces.id, WorkspaceMembers.workspaceId))
        .where(
            and(
                eq(workspaces.id, id as string),
                eq(WorkspaceMembers.userId, userId as string)
            )
        );

    if (workspaceResult.length === 0) {
        res.status(404).json({error: 'Workspace not found or unauthorized.'});
        return;
    }

    res.status(200).json(workspaceResult[0]);
};

// 7. FETCH ALL MEMBERS BELONGING TO A WORKSPACE
export const getWorkspaceMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {id} = req.params;

        if (!id) {
            res.status(400).json({error: 'Workspace ID parameter is required.'});
            return;
        }

        const result = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                role: WorkspaceMembers.role,
            })
            .from(WorkspaceMembers)
            .innerJoin(users, eq(WorkspaceMembers.userId, users.id))
            .where(eq(WorkspaceMembers.workspaceId, id as string));

        // Format the names into full names to align beautifully with the UI
        const formattedMembers = result.map((member) => ({
            id: member.id,
            name: `${member.firstName} ${member.lastName}`.trim(),
            email: member.email,
            // Format casing to match frontend expected 'Owner' | 'Admin' | 'Member' values
            role: member.role.charAt(0).toUpperCase() + member.role.slice(1).toLowerCase(),
        }));

        res.status(200).json({members: formattedMembers});
    } catch (error) {
        console.error('Error fetching workspace members:', error);
        res.status(500).json({error: 'Internal system server tracking fault.'});
        return;
    }
}

// 8. JOIN A WORKSPACE BY ID
export const joinWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {workspaceId} = req.body;

        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }

        if (!workspaceId) {
            res.status(400).json({error: 'Workspace ID is required.'});
            return;
        }

        // Check if workspace exists
        const workspace = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, workspaceId))
            .limit(1);

        if (workspace.length === 0) {
            res.status(404).json({error: 'Workspace not found.'});
            return;
        }

        // Check if user is already a member
        const existingMembership = await db
            .select()
            .from(WorkspaceMembers)
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, workspaceId),
                    eq(WorkspaceMembers.userId, userId)
                )
            )
            .limit(1);

        if (existingMembership.length > 0) {
            res.status(400).json({error: 'You are already a member of this workspace.'});
            return;
        }

        // Add user to workspace as a member
        await db.insert(WorkspaceMembers).values({
            workspaceId: workspaceId,
            userId: userId,
            role: 'MEMBER',
        });

        res.status(200).json({
            message: 'Successfully joined the workspace!',
            workspace: workspace[0],
        });
    } catch (error) {
        console.error('Error joining workspace:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 9. LEAVE A WORKSPACE
export const leaveWorkspace = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {id} = req.params;

        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }

        if (!id) {
            res.status(400).json({error: 'Workspace ID is required.'});
            return;
        }

        // Check if user is a member of the workspace
        const membership = await db
            .select()
            .from(WorkspaceMembers)
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, id as string),
                    eq(WorkspaceMembers.userId, userId)
                )
            )
            .limit(1);

        if (membership.length === 0) {
            res.status(404).json({error: 'You are not a member of this workspace.'});
            return;
        }

        // Prevent the owner from leaving the workspace
        if (membership[0]!.role === 'OWNER') {
            res.status(400).json({error: 'Owners cannot leave their workspace. Please transfer ownership first.'});
            return;
        }

        // Remove user from workspace
        await db
            .delete(WorkspaceMembers)
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, id as string),
                    eq(WorkspaceMembers.userId, userId)
                )
            );

        res.status(200).json({message: 'Successfully left the workspace.'});
    } catch (error) {
        console.error('Error leaving workspace:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 10. UPDATE MEMBER ROLE
export const updateMemberRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const {workspaceId, memberId} = req.params;
        const {role} = req.body;

        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }

        if (!workspaceId || !memberId) {
            res.status(400).json({error: 'Workspace ID and Member ID are required.'});
            return;
        }

        if (!role || !['OWNER', 'ADMIN', 'MEMBER'].includes(role.toUpperCase())) {
            res.status(400).json({error: 'Invalid role. Must be OWNER, ADMIN, or MEMBER.'});
            return;
        }

        // Check if the current user has permission (Owner or Admin)
        const currentUserMembership = await db
            .select({role: WorkspaceMembers.role})
            .from(WorkspaceMembers)
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, workspaceId as string),
                    eq(WorkspaceMembers.userId, userId as string)
                )
            )
            .limit(1);

        if (currentUserMembership.length === 0) {
            res.status(403).json({error: 'You are not a member of this workspace.'});
            return;
        }

        const currentUserRole = currentUserMembership[0]!.role.toUpperCase();
        if (currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN') {
            res.status(403).json({error: 'Only Owners and Admins can update member roles.'});
            return;
        }

        // Get the target member's current role
        const targetMember = await db
            .select({role: WorkspaceMembers.role})
            .from(WorkspaceMembers)
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, workspaceId as string),
                    eq(WorkspaceMembers.userId, memberId as string)
                )
            )
            .limit(1);

        if (targetMember.length === 0) {
            res.status(404).json({error: 'Member not found in this workspace.'});
            return;
        }

        const targetCurrentRole = targetMember[0]!.role.toUpperCase();

        // Prevent demoting the last owner
        if (role.toUpperCase() !== 'OWNER' && targetCurrentRole === 'OWNER') {
            const ownerCount = await db
                .select({count: WorkspaceMembers.role})
                .from(WorkspaceMembers)
                .where(
                    and(
                        eq(WorkspaceMembers.workspaceId, workspaceId as string),
                        eq(WorkspaceMembers.role, 'OWNER')
                    )
                );

            if (ownerCount.length === 1) {
                res.status(400).json({error: 'Cannot demote the last Owner of the workspace.'});
                return;
            }
        }

        // If promoting someone to OWNER, automatically demote current owner to ADMIN
        if (role.toUpperCase() === 'OWNER' && currentUserRole === 'OWNER' && targetCurrentRole !== 'OWNER') {
            await db.transaction(async (tx) => {
                // Demote current owner to admin
                await tx
                    .update(WorkspaceMembers)
                    .set({role: 'ADMIN'})
                    .where(
                        and(
                            eq(WorkspaceMembers.workspaceId, workspaceId as string),
                            eq(WorkspaceMembers.userId, userId as string)
                        )
                    );

                // Promote target member to owner
                await tx
                    .update(WorkspaceMembers)
                    .set({role: 'OWNER'})
                    .where(
                        and(
                            eq(WorkspaceMembers.workspaceId, workspaceId as string),
                            eq(WorkspaceMembers.userId, memberId as string)
                        )
                    );
            });

            res.status(200).json({
                message: 'Ownership transferred successfully! You are now an Admin.',
                transferred: true
            });
            return;
        }

        // Update the member's role (normal case)
        const updatedMember = await db
            .update(WorkspaceMembers)
            .set({role: role.toUpperCase() as 'OWNER' | 'ADMIN' | 'MEMBER'})
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, workspaceId as string),
                    eq(WorkspaceMembers.userId, memberId as string)
                )
            )
            .returning();

        if (updatedMember.length === 0) {
            res.status(404).json({error: 'Member not found in this workspace.'});
            return;
        }

        res.status(200).json({
            message: 'Member role updated successfully!',
            member: updatedMember[0],
            transferred: false
        });
    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}