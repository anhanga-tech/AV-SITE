import { z } from 'zod';

const MAX_TEXT_LENGTH = 5000;
const MAX_CONTENTS_ENTRIES = 50;

const GeneratePartSchema = z.object({
    text: z.string().max(MAX_TEXT_LENGTH),
});

const GenerateMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(GeneratePartSchema).min(1),
});

export const GenerateRequestSchema = z.object({
    contents: z.array(GenerateMessageSchema).min(1).max(MAX_CONTENTS_ENTRIES),
});

export type ValidatedGenerateRequest = z.infer<typeof GenerateRequestSchema>;
