import { z } from 'zod';

export const SubmitNpsBodySchema = z.object({
    firstname: z.string().trim().min(1).max(100),
    email:     z.email().max(254),
    score:     z.number().int().min(0).max(10),
    reason:    z.string().trim().min(1).max(2000),
    highlight: z.string().trim().max(2000).default(''),
});

export type SubmitNpsRequest = z.infer<typeof SubmitNpsBodySchema>;

