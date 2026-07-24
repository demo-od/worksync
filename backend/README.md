# WorkSync Backend API

A collaborative workspace management backend API built with Express, TypeScript, PostgreSQL, and Socket.io for real-time messaging.

## Features

- **Authentication & Authorization**
  - User registration and login with JWT tokens
  - Password hashing with bcrypt
  - Role-based access control (Owner, Admin, Member)
  - Protected routes with middleware

- **Workspace Management**
  - Create, update, and delete workspaces
  - Join workspaces via unique workspace ID
  - Leave workspaces (members only)
  - Workspace member management with roles

- **Channels**
  - Create channels within workspaces
  - Real-time messaging via Socket.io
  - Message history and editing

- **Projects**
  - Create projects within workspaces
  - Project metadata (name, description)
  - Project settings and deletion (owners only)

- **Tasks**
  - Create, update, and delete tasks
  - Task status tracking (TODO, IN_PROGRESS, DONE)
  - Priority levels (LOW, MEDIUM, HIGH)
  - Task filtering and sorting

- **Notifications**
  - Inbox system for invitations and updates
  - Real-time notification delivery
  - Read/unread status tracking

- **Email Service**
  - Send workspace invitations via email
  - Gmail API integration with OAuth2

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Email**: Gmail API (googleapis)
- **CORS**: cors

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   │   ├── authController.ts
│   │   ├── channelController.ts
│   │   ├── inboxController.ts
│   │   ├── messageController.ts
│   │   ├── projectController.ts
│   │   ├── taskController.ts
│   │   └── workspaceController.ts
│   ├── db/               # Database configuration
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── middleware/       # Custom middleware
│   │   ├── authMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   └── validateRequest.ts
│   ├── routes/          # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── channelRoutes.ts
│   │   ├── inboxRoutes.ts
│   │   ├── messageRoutes.ts
│   │   ├── projectRoutes.ts
│   │   ├── taskRoutes.ts
│   │   └── workspaceRoutes.ts
│   ├── schemas/         # Zod validation schemas
│   │   ├── authSchema.ts
│   │   ├── channelSchema.ts
│   │   ├── inboxSchemas.ts
│   │   ├── messageSchema.ts
│   │   ├── projectSchema.ts
│   │   ├── taskSchema.ts
│   │   └── workspaceSchema.ts
│   ├── services/        # Business logic
│   │   └── emailService.ts
│   └── index.ts         # Application entry point
├── .env                 # Environment variables
├── drizzle.config.ts    # Drizzle configuration
├── package.json
└── tsconfig.json
```

## Database Schema

### Tables

1. **users**
   - id (UUID, primary key)
   - first_name, last_name (varchar)
   - email (varchar, unique)
   - password_hash (text)
   - profile_picture (text, nullable)
   - is_verified (boolean)
   - verification_token (text, nullable)
   - created_at (timestamp)

2. **workspaces**
   - id (UUID, primary key)
   - name (text)
   - slug (text, unique)
   - description (text, nullable)
   - user_id (UUID, foreign key → users)
   - created_at, updated_at (timestamp)

3. **workspace_members**
   - id (UUID, primary key)
   - workspace_id (UUID, foreign key → workspaces)
   - user_id (UUID, foreign key → users)
   - role (varchar: OWNER, ADMIN, MEMBER)
   - joined_at (timestamp)
   - Unique constraint on (workspace_id, user_id)

4. **channels**
   - id (UUID, primary key)
   - name (text)
   - workspace_id (UUID, foreign key → workspaces)
   - user_id (UUID, foreign key → users)
   - created_at, updated_at (timestamp)

5. **projects**
   - id (UUID, primary key)
   - name (text)
   - description (text, nullable)
   - workspace_id (UUID, foreign key → workspaces)
   - created_at, updated_at (timestamp)

6. **tasks**
   - id (UUID, primary key)
   - title (varchar)
   - status (varchar: TODO, IN_PROGRESS, DONE)
   - priority (varchar: LOW, MEDIUM, HIGH)
   - project_id (UUID, foreign key → projects)
   - created_at, updated_at (timestamp)

7. **messages**
   - id (UUID, primary key)
   - content (text)
   - channel_id (UUID, foreign key → channels)
   - user_id (UUID, foreign key → users)
   - created_at (timestamp)
   - is_edited (boolean)
   - updated_at (timestamp)

8. **inbox_notifications**
   - id (UUID, primary key)
   - user_id (UUID, foreign key → users)
   - type (varchar)
   - title (text)
   - message (text)
   - is_read (boolean)
   - workspace_id (UUID, foreign key → workspaces, nullable)
   - role_requested (varchar)
   - created_at (timestamp)

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Workspaces

- `GET /api/workspaces` - Get all user workspaces
- `POST /api/workspaces` - Create a new workspace
- `POST /api/workspaces/join` - Join a workspace by ID
- `POST /api/workspaces/:workspaceId/leave` - Leave a workspace
- `GET /api/workspaces/:workspaceId` - Get workspace details
- `PATCH /api/workspaces/:workspaceId` - Update workspace
- `DELETE /api/workspaces/:workspaceId` - Delete workspace
- `GET /api/workspaces/:workspaceId/members` - Get workspace members

### Channels

- `GET /api/workspaces/:workspaceId/channels` - Get all channels
- `POST /api/workspaces/:workspaceId/channels` - Create a channel
- `GET /api/channels/:channelId` - Get channel details
- `PATCH /api/channels/:channelId` - Update channel
- `DELETE /api/channels/:channelId` - Delete channel

### Projects

- `GET /api/workspaces/:workspaceId/projects` - Get all projects
- `POST /api/workspaces/:workspaceId/projects` - Create a project
- `GET /api/projects/:projectId` - Get project details
- `PATCH /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Tasks

- `GET /api/workspaces/:workspaceId/projects/:projectId/tasks` - Get all tasks
- `POST /api/workspaces/:workspaceId/projects/:projectId/tasks` - Create a task
- `PATCH /api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId` - Update task
- `DELETE /api/workspaces/:workspaceId/projects/:projectId/tasks/:taskId` - Delete task

### Messages

- `GET /api/channels/:channelId/messages` - Get channel messages
- `POST /api/channels/:channelId/messages` - Send a message
- `PATCH /api/messages/:messageId` - Edit a message
- `DELETE /api/messages/:messageId` - Delete a message

### Inbox/Notifications

- `GET /api/inbox` - Get user notifications
- `POST /api/inbox/:notificationId/read` - Mark notification as read
- `POST /api/inbox/:notificationId/accept` - Accept invitation
- `POST /api/inbox/:notificationId/reject` - Reject invitation


## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

- **Owner**: Full access to workspace settings, can delete workspaces, manage members
- **Admin**: Can manage channels, projects, and members (except owners)
- **Member**: Can create/edit tasks and messages, limited management access

## Real-time Communication

Socket.io is used for real-time messaging. Connect to:

```
ws://localhost:5000
```

Events:
- `joinChannel` - Join a channel room
- `leaveChannel` - Leave a channel room
- `message` - Send/receive messages
- `typing` - Typing indicators

## Validation

All requests are validated using Zod schemas. Invalid requests return 400 status with error details.

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a message field:
```json
{
  "error": "Error message description"
}
```

## Development

### Database Migrations

Push schema changes to database:
```bash
npm run db:push
```

### TypeScript

The project uses TypeScript for type safety. Compile with:
```bash
npx tsc
```

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Use a production-grade PostgreSQL instance
3. Configure CORS for your frontend domain
4. Use environment-specific secrets
5. Enable HTTPS
6. Set up process monitoring (PM2, Docker, etc.)

## Security Considerations

- Passwords are hashed with bcrypt before storage
- JWT tokens have expiration (implement refresh tokens for production)
- Role-based middleware protects sensitive endpoints
- Input validation prevents injection attacks
- CORS configured for cross-origin requests

## License

ISC

## Support

For issues or questions, please open an issue on the repository.
