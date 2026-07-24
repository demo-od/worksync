import {Request, Response, NextFunction} from 'express'
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'some_fallback_strign';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    }
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void=> {
    // 1. Grab the Authorization header (Expected format: "Bearer <token>")
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    // 2. Extract the raw token
    const token: string = authHeader.split(' ')[1]!;

    try {
       const decoded = jwt.verify(token, JWT_SECRET as string) as {userId: string; email: string};

       // 4. Attach the user's ID directly to the request object so our controllers know exactly who is making this call
        req.user = decoded;

        //5. Let them pass safely to the controller!
        next();
    }

    catch (error) {
        res.status(403).json({ error: 'Invalid or expired session token.' });
    }
}