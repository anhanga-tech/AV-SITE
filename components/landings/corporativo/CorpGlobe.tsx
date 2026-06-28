import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../shared/motion';

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
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let cleanup: (() => void) | null = null;
        const el = containerRef.current;
        if (!el) return;

        const reduced = prefersReducedMotion();

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
                .arcDashAnimateTime(reduced ? 0 : 3500)
                .arcStroke(0.35)
                .arcAltitude(0.18)
                // Destination dots
                .pointsData(POINTS)
                .pointColor((d: object) => (d as { isHub: boolean }).isHub ? '#FFD600' : '#38bdf8')
                .pointRadius((d: object) => (d as { isHub: boolean }).isHub ? 0.55 : 0.28)
                .pointAltitude(0.01)
                .pointResolution(10);

            // High-DPI rendering — cap DPR at 2 to balance sharpness vs. performance
            const renderer = globe.renderer();
            if (renderer) {
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setSize(el.clientWidth, el.clientHeight);
            }

            // Camera controls — auto-rotation is motion; respect reduced-motion
            const controls = globe.controls();
            controls.autoRotate = !reduced;
            controls.autoRotateSpeed = 0.1;
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;

            globe.pointOfView({ lat: -18, lng: -48, altitude: 1.55 }, 0);

            // React to live changes of the reduced-motion preference
            const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
            const onMotionChange = (e: MediaQueryListEvent) => {
                controls.autoRotate = !e.matches;
                globe.arcDashAnimateTime(e.matches ? 0 : 3500);
            };
            motionQuery?.addEventListener('change', onMotionChange);

            const resizeObserver = new ResizeObserver(() => {
                if (el) {
                    globe.width(el.clientWidth);
                    globe.height(el.clientHeight);
                }
            });
            resizeObserver.observe(el);

            cleanup = () => {
                try {
                    motionQuery?.removeEventListener('change', onMotionChange);
                    resizeObserver.disconnect();
                    const r = globe.renderer();
                    if (r) {
                        r.dispose();
                        r.getContext()?.getExtension('WEBGL_lose_context')?.loseContext();
                    }
                } catch { /* ignore cleanup errors */ }
            };
        }).catch((err) => {
            console.error('Failed to load globe.gl:', err);
            if (!cancelled) setLoadFailed(true);
        });

        return () => {
            cancelled = true;
            cleanup?.();
            cleanup = null;
        };
    }, []);

    if (loadFailed) {
        return (
            <div
                data-testid="corp-globe-fallback"
                className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6"
            >
                <svg
                    className="w-16 h-16 text-brand-yellow"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="9" />
                    <ellipse cx="12" cy="12" rx="4" ry="9" />
                    <path d="M3 12h18" />
                </svg>
                <p className="text-sm font-medium text-white/80 max-w-xs">
                    Conectamos empresas a destinos no mundo todo
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full"
            style={{ filter: 'brightness(1.45) contrast(1.08) saturate(1.5)' }}
        />
    );
}
