function normalizeRoute(route: string): string {
  if (route === '/') {
    return '/';
  }

  const normalized = route.replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : '/';
}

export function shouldHydratePrerenderedRoute(
  prerenderedRoute: string | null | undefined,
  currentPath: string
): boolean {
  if (!prerenderedRoute) {
    return false;
  }

  return normalizeRoute(prerenderedRoute) === normalizeRoute(currentPath);
}
