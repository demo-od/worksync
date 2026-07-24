import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workspaceRouter from './routes/workspaceRoutes.js';
import authRoutes from "./routes/authRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import inboxRoutes from "./routes/inboxRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import {Server} from 'socket.io';
import {createServer} from 'http';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

app.use('/api/workspaces', workspaceRouter);
app.use('/api/workspaces/:workspaceId/channels', channelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/workspaces/:workspaceId/projects/:projectId/tasks', taskRoutes);
app.use('/api/workspaces/:workspaceId/projects', projectRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/channels', messageRoutes);

io.on('connection', (socket) => {
    console.log(`User connected to WebSocket. Socket ID: ${socket.id}`);

    socket.on('join_channel', (channelId: string) => {
        socket.join(channelId);
    });

    // 🎯 Live broadcast channel typing states to room neighbors
    socket.on('user_typing', ({ channelId, firstName, isTyping }) => {
        socket.to(channelId).emit('user_typing_received', { firstName, isTyping, socketId: socket.id });
    });

    socket.on('disconnect', () => {
        console.log(`❌ User disconnected.`);
    });
});


httpServer.listen(PORT, () => {
    console.log(`🚀 Server processing data and sockets on http://localhost:${PORT}`);
});