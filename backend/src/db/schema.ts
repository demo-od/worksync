import {primaryKey, pgTable, uuid, text, timestamp, varchar, boolean, unique} from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    profilePicture: text('profile_picture'), // Nullable
    isVerified: boolean('is_verified').default(false).notNull(),
    verificationToken: text('verification_token'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 2. Workspaces Table (The groups/teams)
export const workspaces = pgTable('workspaces', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Tasks Table (Now inside specific channels!)
export const tasks = pgTable('tasks', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).default('TODO').notNull(), // TODO, IN_PROGRESS, DONE
    priority: varchar('priority', { length: 50 }).default('MEDIUM').notNull(), // LOW, MEDIUM, HIGH
    projectId: uuid('project_id')
        .references(() => projects.id, { onDelete: 'cascade' }) // If the channel is wiped, its tasks vanish too!
        .notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const channels = pgTable('channels', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    workspaceId: uuid('workspace_id')
        .references(() => workspaces.id, {onDelete: "cascade"})  // Wipes channels if workspace is deleted
        .notNull(),
    userId: uuid('user_id').notNull()
        .references(() => users.id, {onDelete: "cascade"}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. PROJECTS TABLE
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    workspaceId: uuid('workspace_id')
        .references(() => workspaces.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const WorkspaceMembers = pgTable('workspace_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
        .references(() => workspaces.id, { onDelete: 'cascade' })
        .notNull(),
    userId: uuid('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    role: varchar('role', { length: 50 }).default('MEMBER').notNull(), // OWNER, ADMIN, MEMBER
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => [
    unique('unique_workspace_user').on(table.workspaceId, table.userId) // Prevents duplicate memberships
]);

// 8. Inbox Notifications Table
export const inboxNotifications = pgTable('inbox_notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(), // Who owns this inbox item
    type: varchar('type', { length: 50}).notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }), // Required if type is 'INVITATION'
    roleRequested: varchar('role-requested', {length: 50}).default('MEMBER'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Messages Table
export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    channelId: uuid('channel_id')
        .references(() => channels.id, { onDelete: 'cascade' })
        .notNull(),
    userId: uuid('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(), // Identifies the sender
    createdAt: timestamp('created_at').defaultNow().notNull(),
    isEdited: boolean('is_edited').default(false).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});