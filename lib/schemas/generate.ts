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
    // Guard the array length BEFORE validating elements. z.array().max() parses
    // every element against GeneratePartSchema first and only then enforces the
    // cap, so a huge `parts` array would still be iterated in full (CPU-exhaustion
    // DoS) before being rejected. Pre-checking the length via refine short-circuits
    // that iteration, so an oversized array is rejected in O(1).
    parts: z
        .unknown()
        .refine(
            (value): value is unknown[] => Array.isArray(value) && value.length <= MAX_PARTS_PER_MESSAGE,
            { message: `parts deve ter no máximo ${MAX_PARTS_PER_MESSAGE} itens` },
        )
        .pipe(z.array(GeneratePartSchema).min(1)),
});

export const GenerateRequestSchema = z.object({
    contents: z.array(GenerateMessageSchema).min(1).max(MAX_CONTENTS_ENTRIES),
});

