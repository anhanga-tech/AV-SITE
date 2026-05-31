import { useEffect, useRef } from 'react';

const SP = { lat: -23.5505, lng: -46.6333 };

const DESTINATIONS = [
    { lat: 28.5383,  lng: -81.3792, label: 'Orlando'          },
    { lat: -34.6037, lng: -58.3816, label: 'Buenos Aires'     },
    { lat: 38.7169,  lng:  -9.1399, label: 'Lisboa'           },
    { lat: 21.1619,  lng: -86.8515, label: 'Cancún'           },
    { lat: 25.7617,  lng: -80.1918, label: 'Miami'            },
    { lat: -22.9068, lng: -43.1729, label: 'Rio de Janeiro'   },
    { lat: -15.7797, lng: -47.9297, label: 'Brasília'         },
    { lat:  -8.0476, lng: -34.877,  label: 'Recife'           },
    { lat:  -3.119,  lng: -60.0217, label: 'Manaus'           },
    { lat:  51.5074, lng:  -0.1278, label: 'Londres'          },
    { lat: -33.4489, lng: -70.6693, label: 'Santiago'         },
    { lat:   4.711,  lng: -74.0721, label: 'Bogotá'           },
];

const ARCS = DESTINATIONS.map(dest => ({
    startLat: SP.lat,
    startLng: SP.lng,
    endLat: dest.lat,
    endLng: dest.lng,
}));

const POINTS = [
    { lat: SP.lat, lng: SP.lng, label: 'São Paulo', isHub: true },
    ...DESTINATIONS.map(d => ({ ...d, isHub: false })),
];

export function CorpGlobe() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        let cancelled = false;
        const el = containerRef.current;
        if (!el) return;

        import('globe.gl').then(({ default: Globe }) => {
            if (cancelled || !el) return;

            const globe = new Globe(el)
                .backgroundColor('rgba(0,0,0,0)')
                .width(el.clientWidth)
                .height(el.clientHeight)
                .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
                .atmosphereColor('#60c8f5')
                .atmosphereAltitude(0.22)
                // Arcs — trajectórias suaves, altura moderada
                .arcsData(ARCS)
                .arcColor(() => ['rgba(255,214,0,0.85)', 'rgba(56,189,248,0.95)'])
                .arcDashLength(0.5)
                .arcDashGap(0.5)
                .arcDashAnimateTime(3500)
                .arcStroke(0.35)
                .arcAltitude(0.18)
                // Destination dots
                .pointsData(POINTS)
                .pointColor((d: object) => (d as { isHub: boolean }).isHub ? '#FFD600' : '#38bdf8')
                .pointRadius((d: object) => (d as { isHub: boolean }).isHub ? 0.55 : 0.28)
                .pointAltitude(0.01)
                .pointResolution(10);

            // High-DPI rendering — set DPR then resize canvas at physical pixels
            const renderer = globe.renderer();
            if (renderer) {
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(el.clientWidth, el.clientHeight);
            }

            // Camera controls
            const controls = globe.controls();
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.1;
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;

            globe.pointOfView({ lat: -18, lng: -48, altitude: 1.55 }, 0);

            cleanupRef.current = () => {
                try {
                    const r = globe.renderer();
                    if (r) { r.dispose(); r.forceContextLoss?.(); }
                } catch { /* ignore cleanup errors */ }
            };
        });

        return () => {
            cancelled = true;
            cleanupRef.current?.();
            cleanupRef.current = null;
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ filter: 'brightness(2.8) contrast(1.1) saturate(1.4)' }}
        />
    );
}
