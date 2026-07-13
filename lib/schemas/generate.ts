import { z } from 'zod';

const MAX_TEXT_LENGTH = 5000;
const MAX_CONTENTS_ENTRIES = 50;
// Cap the parts array so a single message can't force unbounded validation work.
// The chat client always sends exactly one text part per message, so a small cap
// is generous for real traffic while closing a DoS vector: without it, a lone
// message could carry a huge `parts` array that Zod iterates in full before the
// downstream total-size guard (hasOversizedPayload) ever runs.
const MAX_PARTS_PER_MESSAGE = 20;

const GeneratePartSchema = z.object({
    text: z.string().max(MAX_TEXT_LENGTH),
});

const GenerateMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(GeneratePartSchema).min(1).max(MAX_PARTS_PER_MESSAGE),
});

export const GenerateRequestSchema = z.object({
    contents: z.array(GenerateMessageSchema).min(1).max(MAX_CONTENTS_ENTRIES),
});

