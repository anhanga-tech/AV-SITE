export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isObjectWithProp<K extends string>(
    value: unknown,
    key: K,
): value is Record<K, unknown> {
    return isRecord(value) && key in value;
}
