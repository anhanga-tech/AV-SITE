// Deterministic rotation derived from a PassportStamp instance's useId, instead
// of Math.random: calling an impure function during render breaks React's
// purity rules (and would mismatch between server and client render passes).
export const deriveRotation = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) % 31) - 15;
};
