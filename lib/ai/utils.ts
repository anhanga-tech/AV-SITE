export function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeLabel(value: string): string {
    return normalizeText(value).replace(/[–—]/g, '-');
}

export function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hasAliasMatch(text: string, alias: string): boolean {
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) return false;

    // Match aliases as independent terms to avoid false positives like "ira" inside "emirados"
    const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalizedAlias)}(?:$|[^a-z0-9])`, 'i');
    return pattern.test(text);
}

export function cleanString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveMaxMessageLength(rawValue: string | undefined): number {
    const parsed = Number.parseInt(rawValue || '4000', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 4000;
}

export function hasOversizedMessage(contents: unknown, maxMessageLength: number): boolean {
    if (!Array.isArray(contents)) return false;

    return contents.some((msg: unknown) => {
        if (typeof msg !== 'object' || !msg) return false;
        const parts = (msg as { parts?: unknown[] }).parts;
        if (!Array.isArray(parts)) return false;

        return parts.some((part: unknown) => {
            if (typeof part !== 'object' || !part) return false;
            const text = (part as { text?: unknown }).text;
            return typeof text === 'string' && text.length > maxMessageLength;
        });
    });
}

export function extractRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return value as Record<string, unknown>;
}

export function getClientIP(request: Request): string {
    // Try various headers that might contain the real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[ips.length - 1]; // Use the last one for Vercel
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Vercel-specific header
    const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
    if (vercelForwardedFor) {
        return vercelForwardedFor.split(',')[0].trim();
    }

    return 'unknown';
}
