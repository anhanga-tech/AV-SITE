import type L from 'leaflet';

const LEAFLET_ZOOM_FALLBACK_MS = 300;

export function removeLeafletMapAfterActiveZoom(map: L.Map, zoomInProgress: boolean) {
  if (!zoomInProgress) {
    map.remove();
    return;
  }

  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  let removalTimer: ReturnType<typeof setTimeout> | undefined;
  let removed = false;
  let handleZoomEnd: (() => void) | undefined;

  const clearOwnedResources = () => {
    if (handleZoomEnd) {
      map.off('zoomend', handleZoomEnd);
      handleZoomEnd = undefined;
    }
    if (fallbackTimer !== undefined) {
      clearTimeout(fallbackTimer);
      fallbackTimer = undefined;
    }
    if (removalTimer !== undefined) {
      clearTimeout(removalTimer);
      removalTimer = undefined;
    }
  };

  const removeMap = () => {
    if (removed) return;
    removed = true;
    clearOwnedResources();
    map.remove();
  };

  const queueRemoval = () => {
    if (removed || removalTimer !== undefined) return;
    removalTimer = setTimeout(removeMap, 0);
  };

  handleZoomEnd = queueRemoval;
  map.on('zoomend', handleZoomEnd);
  // Leaflet's CSS zoom fallback runs after 250 ms; this guarantees eventual teardown.
  fallbackTimer = setTimeout(removeMap, LEAFLET_ZOOM_FALLBACK_MS);
}
