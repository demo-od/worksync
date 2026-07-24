import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {sendVerificationEmail} from "../services/emailService.js";
import {AuthenticatedRequest} from "../middleware/authMiddleware.js";

const JWT_SECRET = process.env.JWT_SECRET || 'some_fallback_strign';

// 1. SIGNUP / REGISTER WITH EMAIL TOKEN
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, firstName, lastName } = req.body;

        if (!email || !password || !firstName || !lastName) {
            res.status(400).json({error: 'Missing required fields.'});
            return;
        }

        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length > 0) {
            res.status(409).json({error: 'An account with this email already exists.'});
            return;
        }

        const HashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Send email first - only add user to DB if email succeeds
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            res.status(500).json({error: 'Failed to send verification email. Please try again later.'});
            return;
        }

        // Only insert user if email was sent successfully
        const newUser = await db.insert(users).values({
            email,
            passwordHash: HashedPassword,
            firstName,
            lastName,
            isVerified: false,
            verificationToken,
        }).returning();

        const { passwordHash , verificationToken: vt, ...userResponse } = newUser[0]!;

        res.status(201).json({
            message: 'Registration successful! Please check your email inbox to verify your account.',
            user: userResponse
        })

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({error: 'Internal Server Error during registration.'})
    }
}

//LOGIN CONTROLLER WITH VERIFICATION CHECK

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
             res.status(400).json({error: 'Email and password are required'});
             return;
        }

        const userArray = await db.select().from(users).where(eq(users.email, email));
        const user = userArray[0];
        if (!user) {
            res.status(401).json({error: 'Invalid email or password.'});
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if(!isPasswordValid) {
            res.status(401).json({error: 'Invalid email or password.'});
            return;
        }

        // Reject login attempts if they haven't clicked their email link yet
        if (!user.isVerified) {
            res.status(403).json({error: "Your email address must be verified before logging in."});
            return;
        }

        const token = jwt.sign(
            {
                userId: user.id, email: user.email
            },
            JWT_SECRET,
            {
                expiresIn: '24h'
            }
        );

        res.status(200).json({
            message: 'Authentication successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    }

    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({error: 'Internal Server Error during login.'})
    }
}

// 3. EMAIL VERIFICATION CLICK CONFIRMATION CONTROLLER
export const verifyEmailToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.query.token as string;

        if(!token) {
            res.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - WorkSync</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e4e4e7 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 480px;
            width: 100%;
            padding: 48px 32px;
            text-align: center;
        }
        .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
        }
        .icon svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        p {
            font-size: 16px;
            color: #71717a;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            background: #18181b;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            background: #27272a;
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #a1a1aa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h1>Error</h1>
        <p>Missing or invalid confirmation token. Please check your email link or try registering again.</p>
        <a href="http://localhost:5173/register" class="button">Try Again</a>
        <div class="footer">
            WorkSync SaaS
        </div>
    </div>
</body>
</html>
            `);
            return;
        }

        // Look up the user matching the confirmation token passed in the URL
        const userArray = await db.select().from(users).where(eq(users.verificationToken, token));
        const user = userArray[0];

        if (!user) {
            res.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Failed - WorkSync</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e4e4e7 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 480px;
            width: 100%;
            padding: 48px 32px;
            text-align: center;
        }
        .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
        }
        .icon svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        p {
            font-size: 16px;
            color: #71717a;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            background: #18181b;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            background: #27272a;
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #a1a1aa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </div>
        <h1>Verification Failed</h1>
        <p>The verification link is invalid or has expired. Please try registering again or contact support if the issue persists.</p>
        <a href="http://localhost:5173/register" class="button">Try Again</a>
        <div class="footer">
            WorkSync SaaS
        </div>
    </div>
</body>
</html>
            `);
            return;
        }

        // Render a styled HTML response matching the app's design
        res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified - WorkSync</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e4e4e7 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 480px;
            width: 100%;
            padding: 48px 32px;
            text-align: center;
        }
        .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
        }
        .icon svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        p {
            font-size: 16px;
            color: #71717a;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            background: #18181b;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            background: #27272a;
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #a1a1aa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h1>Email Verified Successfully!</h1>
        <p>Your WorkSync account is now fully active. You can close this tab and proceed to log into the application.</p>
        <a href="http://localhost:5173/login" class="button">Go to Login</a>
        <div class="footer">
            WorkSync SaaS
        </div>
    </div>
</body>
</html>
    `);

        await db.update(users)
            .set({isVerified: true, verificationToken: null})
            .where(eq(users.id, user.id))
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - WorkSync</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e4e4e7 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 480px;
            width: 100%;
            padding: 48px 32px;
            text-align: center;
        }
        .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
        }
        .icon svg {
            width: 40px;
            height: 40px;
            color: white;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 12px;
            letter-spacing: -0.025em;
        }
        p {
            font-size: 16px;
            color: #71717a;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            background: #18181b;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            background: #27272a;
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        .footer {
            margin-top: 24px;
            font-size: 12px;
            color: #a1a1aa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h1>Internal Server Error</h1>
        <p>An unexpected error occurred during confirmation. Please try again or contact support if the issue persists.</p>
        <a href="http://localhost:5173/register" class="button">Try Again</a>
        <div class="footer">
            WorkSync SaaS
        </div>
    </div>
</body>
</html>
        `)
    }
};

// 4. UPDATE USER PROFILE (FIRST NAME, LAST NAME)
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { firstName, lastName } = req.body;

        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }

        if (!firstName && !lastName) {
            res.status(400).json({error: 'At least one field (firstName or lastName) must be provided.'});
            return;
        }

        const updateData: Partial<typeof users.$inferInsert> = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;

        const updatedUser = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        if (updatedUser.length === 0) {
            res.status(404).json({error: 'User not found.'});
            return;
        }

        const { passwordHash, verificationToken, ...userResponse } = updatedUser[0]!;

        res.status(200).json({
            message: 'Profile updated successfully!',
            user: userResponse
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 5. UPDATE USER PASSWORD (REQUIRES OLD PASSWORD VERIFICATION)
export const updateUserPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { oldPassword, newPassword } = req.body;

        if (!userId) {
            res.status(401).json({error: 'User identification failed.'});
            return;
        }

        if (!oldPassword || !newPassword) {
            res.status(400).json({error: 'Old password and new password are required.'});
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({error: 'New password must be at least 6 characters long.'});
            return;
        }

        // Get the current user
        const userArray = await db.select().from(users).where(eq(users.id, userId));
        const user = userArray[0];

        if (!user) {
            res.status(404).json({error: 'User not found.'});
            return;
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({error: 'Current password is incorrect.'});
            return;
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db
            .update(users)
            .set({ passwordHash: hashedNewPassword })
            .where(eq(users.id, userId));

        res.status(200).json({
            message: 'Password updated successfully!'
        });
    } catch (error) {
        console.error('Error updating user password:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}