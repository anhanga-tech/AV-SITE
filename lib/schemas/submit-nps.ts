import { z } from 'zod';

export const SubmitNpsBodySchema = z.object({
    firstname: z.string().min(1).max(100),
    email:     z.string().email().max(254),
    score:     z.number().int().min(0).max(10),
    reason:    z.string().min(1).max(2000),
    highlight: z.string().max(2000).default(''),
});

export type SubmitNpsBody = z.infer<typeof SubmitNpsBodySchema>;
