import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateRequest = (schema: z.ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // 🎯 Use .parseAsync on the incoming parts of the request
            const parsedData = (await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            })) as any;

            // 💾 Only overwrite fields if they were safely validated and returned by the schema
            if (parsedData.body) req.body = parsedData.body;
            if (parsedData.query) req.query = parsedData.query;
            if (parsedData.params) req.params = parsedData.params;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    error: 'Validation Failed',
                    details: error.issues.map((issue) => ({
                        field: issue.path.join('.').replace('body.', '').replace('params.', ''),
                        message: issue.message,
                    })),
                });
                return;
            }
            // Log the exact error to the terminal so we can see what went wrong internally
            console.error('Validation Middleware Error:', error);
            res.status(500).json({ error: 'Internal validation fault' });
        }
    };
};