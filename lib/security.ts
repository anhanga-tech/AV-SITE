/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * Tradeoff: the early length check leaks whether the two inputs share the same
 * length, but not the value itself. This is acceptable for the values compared
 * here (fixed-length OAuth state UUIDs, HMAC-SHA256 signatures) and the operator
 * secret in purchase-dispatch, where length disclosure does not aid brute force
 * and abuse is already bounded by rate limiting.
 */
export function timingSafeEqual(left: string, right: string): boolean {
    if (left.length !== right.length) {
        return false;
    }

    let mismatch = 0;
    for (let index = 0; index < left.length; index += 1) {
        mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }

    return mismatch === 0;
}
