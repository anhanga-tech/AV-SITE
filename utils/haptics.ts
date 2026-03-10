export type HapticPattern = 'light' | 'medium' | 'heavy';

type WebHapticsInstance = {
  trigger: (input: HapticPattern) => Promise<void>;
  destroy: () => void;
};

type HapticsLoader = () => Promise<WebHapticsInstance | null>;

let hapticsPromise: Promise<WebHapticsInstance | null> | null = null;

const createHapticsInstance = async (): Promise<WebHapticsInstance | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const { WebHaptics } = await import('web-haptics');
    return new WebHaptics();
  } catch {
    return null;
  }
};

let hapticsLoader: HapticsLoader = createHapticsInstance;

const getHaptics = async (): Promise<WebHapticsInstance | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!hapticsPromise) {
    hapticsPromise = hapticsLoader();
  }

  return hapticsPromise;
};

export async function triggerHaptic(pattern: HapticPattern = 'light'): Promise<void> {
  try {
    const haptics = await getHaptics();
    if (!haptics) {
      return;
    }

    await haptics.trigger(pattern);
  } catch {
    // Haptics are a progressive enhancement and must never break the UI.
  }
}

export function destroyHaptics(): void {
  const pendingInstance = hapticsPromise;
  hapticsPromise = null;

  void pendingInstance?.then((instance) => {
    try {
      instance?.destroy();
    } catch {
      // Ignore cleanup failures from the haptics adapter.
    }
  }).catch(() => {
    // Ignore failed lazy-init promises during cleanup.
  });
}

export function __setHapticsLoaderForTests(loader: HapticsLoader): void {
  hapticsPromise = null;
  hapticsLoader = loader;
}

export function __resetHapticsLoaderForTests(): void {
  hapticsPromise = null;
  hapticsLoader = createHapticsInstance;
}
