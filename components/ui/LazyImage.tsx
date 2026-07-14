import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { optimizeRemoteImageUrl, generateResponsiveSrcSets } from '../../data/mediaConfig';

// PERFORMANCE: one IntersectionObserver shared by every LazyImage instance.
// Each image used to allocate its own observer, so a page with N below-the-fold
// images (Categories, Blog cards, Highlights, Testimonials …) ran N separate
// observers and dispatched N callbacks per scroll tick. A single shared observer
// collapses that to one instance and one callback loop — less per-image memory
// and less main-thread work while scrolling. Options match the previous
// per-instance config exactly (rootMargin '100px', threshold 0.01), so all
// instances can safely share one observer.
type VisibilityCallback = () => void;

const observerCallbacks = new WeakMap<Element, VisibilityCallback>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver | null {
    if (typeof IntersectionObserver === 'undefined') return null;
    if (!sharedObserver) {
        sharedObserver = new IntersectionObserver(
            // Use the `observer` the callback receives natively rather than the
            // module-scoped `sharedObserver`, so the callback is self-contained
            // and never depends on the mutable outer reference.
            (entries, observer) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const callback = observerCallbacks.get(entry.target);
                    if (callback) {
                        // Reveal once, then stop observing — mirrors the old
                        // observer.disconnect() after the first intersection.
                        observerCallbacks.delete(entry.target);
                        observer.unobserve(entry.target);
                        callback();
                    }
                }
            },
            { rootMargin: '100px', threshold: 0.01 },
        );
    }
    return sharedObserver;
}

/** Registers an element with the shared observer; returns a cleanup fn. */
function observeVisibility(element: Element, onVisible: VisibilityCallback): () => void {
    const observer = getSharedObserver();
    if (!observer) {
        // No IntersectionObserver available: reveal immediately so the image
        // still loads rather than staying hidden forever.
        onVisible();
        return () => {};
    }
    observerCallbacks.set(element, onVisible);
    observer.observe(element);
    return () => {
        observerCallbacks.delete(element);
        observer.unobserve(element);
    };
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
    sizes?: string;
    width?: number | string;
    height?: number | string;
}

/**
 * Optimized LazyImage component.
 *
 * PERFORMANCE WIN:
 * Wrapped in React.memo to prevent unnecessary re-renders in large lists
 * (like Destinations or Categories) when parent components update state.
 * This saves DOM operations and reduces CPU usage during scroll or interaction.
 */
export const LazyImage = React.memo<LazyImageProps>(({
    src,
    alt,
    className = "",
    placeholderClassName = "bg-zinc-200",
    sizes,
    width,
    height,
    ...props
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { optimizedSrc, avifSrcSet, webpSrcSet, srcSet } = useMemo(() => {
        if (!src) return { optimizedSrc: '', avifSrcSet: '', webpSrcSet: '', srcSet: '' };
        const numericWidth = typeof width === 'number' ? width : 1200;
        const numericHeight = typeof height === 'number' ? height : undefined;
        // Single pass builds all three srcsets while computing each size's base
        // URL only once, instead of three generators recomputing it separately.
        const { srcSet, avifSrcSet, webpSrcSet } = generateResponsiveSrcSets(src);
        return {
            optimizedSrc: optimizeRemoteImageUrl(src, numericWidth, numericHeight),
            avifSrcSet,
            webpSrcSet,
            srcSet,
        };
    }, [src, width, height]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        // Register with the shared observer instead of allocating one per image.
        return observeVisibility(element, () => setIsVisible(true));
    }, []);

    const style = useMemo(() => {
        if (width && height) {
            return { aspectRatio: `${width} / ${height}` };
        }
        return {};
    }, [width, height]);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            style={style}
        >
            {!isLoaded && (
                <div className={`absolute inset-0 flex items-center justify-center z-10 ${placeholderClassName}`}>
                    <ImageIcon className="size-8 text-zinc-400 opacity-40" />
                </div>
            )}
            {isVisible && (
                <picture>
                    {avifSrcSet && (
                        <source srcSet={avifSrcSet} type="image/avif" sizes={sizes} />
                    )}
                    {webpSrcSet && (
                        <source srcSet={webpSrcSet} type="image/webp" sizes={sizes} />
                    )}
                    <img
                        src={optimizedSrc}
                        srcSet={srcSet || undefined}
                        sizes={sizes}
                        alt={alt}
                        width={width}
                        height={height}
                        loading={props.loading ?? "lazy"}
                        fetchPriority={props.fetchPriority ?? "low"}
                        decoding="async"
                        onLoad={() => setIsLoaded(true)}
                        className={`transition-opacity duration-500 w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        {...props}
                    />
                </picture>
            )}
        </div>
    );
});

LazyImage.displayName = 'LazyImage';
