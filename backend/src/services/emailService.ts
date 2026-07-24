import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN || null
});

export const sendVerificationEmail = async (toEmail: string, token: string): Promise<void> => {
    try {
        const accessToken = await oauth2Client.getAccessToken();
        
        if (!accessToken.token) {
            throw new Error('Failed to obtain access token');
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verificationLink = `${frontendUrl}/verify?token=${token}`;

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const emailContent = [
            `From: WorkSync Team <${process.env.GMAIL_USER}>`,
            `To: ${toEmail}`,
            `Subject: Verify your WorkSync Account`,
            'Content-Type: text/html; charset=utf-8',
            '',
            `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
        <h2 style="color: #333;">Welcome to WorkSync SaaS!</h2>
        <p>Thank you for signing up. Please verify your email address to secure and activate your account.</p>
        <div style="margin: 24px 0;">
          <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #007bff; word-break: break-all;">${verificationLink}</p>
      </div>
    `
        ].join('\r\n');

        const encodedMessage = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        console.log('Email sent successfully via Gmail API');
    } catch (error) {
        console.error('Failed to send email via Gmail API:', error);
        throw new Error(`Email service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};