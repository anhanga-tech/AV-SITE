import { z } from 'zod';

export const AuthCallbackQuerySchema = z.object({
    code:  z.string().min(1),
    state: z.string().min(1),
});

export type AuthCallbackQuery = z.infer<typeof AuthCallbackQuerySchema>;
