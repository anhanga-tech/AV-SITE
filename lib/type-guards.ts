export function isRecord<T>(value: T): value is T & Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isObjectWithProp<T, K extends string>(
    value: T,
    key: K,
): value is T & Record<K, unknown> {
    return isRecord(value) && key in value;
}
