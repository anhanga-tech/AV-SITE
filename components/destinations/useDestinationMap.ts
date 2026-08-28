import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { removeLeafletMapAfterActiveZoom } from '@/components/maps/removeLeafletMapAfterActiveZoom';
import { CONTINENT_COLORS, type Destination } from '../../data/mapDestinations';

const MARKER_STYLE_ID = 'leaflet-marker-anim-styles';

function ensureMarkerStyles() {
    if (document.getElementById(MARKER_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = MARKER_STYLE_ID;
    style.innerHTML = `
            @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.3) translateY(-10px); } 50% { opacity: 1; transform: scale(1.1) translateY(5px); } 70% { transform: scale(0.95) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes pin-shadow-pulse { 0% { opacity: 0.3; transform: scale(0.8); } 100% { opacity: 0.5; transform: scale(1.1); } }

            /* CUSTOM STICKER MARKER */
            .custom-marker-container { position: relative; display: flex; align-items: flex-end; justify-content: center; cursor: pointer; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3)); }

            /* Pin Animation */
            .pin-animated { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: bottom center; }

            /* Pin Shadow on Map */
            .pin-shadow { position: absolute; bottom: 0px; width: 60%; height: 15%; background: black; border-radius: 50%; opacity: 0.3; filter: blur(3px); z-index: -1; transform: translateY(2px); animation: pin-shadow-pulse 2s infinite alternate; }

            .leaflet-div-icon { background: transparent; border: none; }

            /* Tooltip "Handwritten" Style - Updated for better Portuguese legibility */
            .custom-dest-tooltip {
                background-color: #ffffff !important;
                color: #0f172a !important;
                font-family: 'Poppins', sans-serif !important;
                font-weight: 700 !important;
                font-size: 14px !important;
                border: 2px solid #fff !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                border-radius: 8px !important;
                padding: 6px 12px !important;
                white-space: nowrap;
                transform: rotate(-1deg);
            }
            .leaflet-tooltip-top.custom-dest-tooltip::before { border-top-color: #ffffff !important; }

            /* MAP TILE STYLING - OpenStreetMap standard tiles are saturated enough on their own */
            .leaflet-container { background: #FAFAFA; font-family: 'Poppins', sans-serif; }

            /* Hide Default Zoom Controls to replace with custom stickers */
            .leaflet-control-zoom { display: none !important; }
        `;
    document.head.appendChild(style);
}

function createDestinationIcon(destination: Destination, index: number, isMobile: boolean) {
    const markerWidth = isMobile ? 32 : 36;
    const markerHeight = isMobile ? 48 : 54;
    const baseColor = CONTINENT_COLORS[destination.continent] || '#0ea5e9';

    return {
        icon: L.divIcon({
            className: 'bg-transparent border-none',
            html: `
                <div class="custom-marker-container" style="width: ${markerWidth}px; height: ${markerHeight}px;">
                    <div class="pin-animated" style="animation-delay: ${index * 50}ms; opacity: 0; width: 100%; height: 100%;">
                         <svg viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));">
                            <!-- Stick -->
                            <path d="M16 30V48" stroke="#555" stroke-width="2" stroke-linecap="round"/>
                            <!-- Head -->
                            <circle cx="16" cy="16" r="15" fill="${baseColor}" stroke="white" stroke-width="3"/>
                            <!-- Inner Shine/Dot -->
                            <circle cx="16" cy="16" r="5" fill="white"/>
                            <!-- Reflection -->
                            <path d="M16 4 Q 24 4 26 8" stroke="white" stroke-width="2" opacity="0.4" fill="none" stroke-linecap="round"/>
                         </svg>
                    </div>
                    <div class="pin-shadow" style="width: 40%; height: 8%; opacity: 0.2;"></div>
                </div>
            `,
            iconSize: [markerWidth, markerHeight],
            iconAnchor: [markerWidth / 2, markerHeight],
            popupAnchor: [0, -markerHeight],
        }),
        markerHeight,
    };
}

export function useDestinationMap(
    filteredDestinations: Destination[],
    onSelect: (destination: Destination) => void,
) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.FeatureGroup | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        let zoomInProgress = false;
        const handleZoomStart = () => {
            zoomInProgress = true;
        };
        const handleZoomEnd = () => {
            zoomInProgress = false;
        };
        const isMobile = window.innerWidth < 768;
        ensureMarkerStyles();

        const map = L.map(mapRef.current, {
            scrollWheelZoom: false,
            zoomControl: false,
            dragging: !isMobile,
            touchZoom: true,
            zoomSnap: 0.5,
            zoomDelta: 0.5
        }).setView([20, -40], 3);
        const markersLayer = L.featureGroup().addTo(map);
        map.on('zoomstart', handleZoomStart);
        map.on('zoomend', handleZoomEnd);

        mapInstance.current = map;
        markersLayerRef.current = markersLayer;

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        return () => {
            const shouldWaitForZoomEnd = zoomInProgress;
            map.off('zoomstart', handleZoomStart);
            map.off('zoomend', handleZoomEnd);
            if (markersLayerRef.current === markersLayer) {
                markersLayerRef.current = null;
            }
            if (mapInstance.current === map) {
                mapInstance.current = null;
            }
            removeLeafletMapAfterActiveZoom(map, shouldWaitForZoomEnd);
        };
    }, []);

    useEffect(() => {
        const map = mapInstance.current;
        const markersLayer = markersLayerRef.current;
        if (!map || !markersLayer) return;

        markersLayer.clearLayers();
        const destinationsByMarker = new Map<L.Marker, Destination>();
        const isMobile = window.innerWidth < 768;

        const handleMarkerClick = (event: L.LeafletMouseEvent) => {
            const destination = destinationsByMarker.get(event.propagatedFrom as L.Marker);
            if (!destination) return;

            L.DomEvent.stopPropagation(event);
            onSelect(destination);
        };

        filteredDestinations.forEach((destination, index) => {
            const { icon, markerHeight } = createDestinationIcon(destination, index, isMobile);
            const marker = L.marker(destination.coords, {
                icon,
                riseOnHover: true,
                zIndexOffset: 100
            });

            marker.bindTooltip(destination.city, {
                direction: 'top',
                offset: [0, -(markerHeight + 5)],
                className: 'custom-dest-tooltip',
                permanent: false
            });

            destinationsByMarker.set(marker, destination);
            marker.addTo(markersLayer);
        });

        markersLayer.on('click', handleMarkerClick);

        let flyTimer: ReturnType<typeof setTimeout> | undefined;
        if (markersLayer.getLayers().length > 0) {
            flyTimer = setTimeout(() => {
                try {
                    map.invalidateSize();
                    const bounds = markersLayer.getBounds();
                    if (bounds.isValid()) {
                        map.flyToBounds(bounds, {
                            padding: isMobile ? [40, 40] : [80, 80],
                            duration: 1.5,
                            maxZoom: 5
                        });
                    }
                } catch {
                    return;
                }
            }, 100);
        }

        return () => {
            if (flyTimer !== undefined) clearTimeout(flyTimer);
            markersLayer.off('click', handleMarkerClick);
            destinationsByMarker.clear();
            markersLayer.clearLayers();
        };
    }, [filteredDestinations, onSelect]);

    const handleZoom = useCallback((type: 'in' | 'out') => {
        const map = mapInstance.current;
        if (!map) return;

        if (type === 'in') map.zoomIn();
        else map.zoomOut();
    }, []);

    return { mapRef, handleZoom };
}
