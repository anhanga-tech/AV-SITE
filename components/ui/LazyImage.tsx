import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { optimizeRemoteImageUrl } from '../../data/mediaConfig';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
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
    placeholderClassName = "bg-gray-200",
    width,
    height,
    ...props
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Optimize URL only when source or dimensions change
    const optimizedSrc = useMemo(() => {
        if (!src) return '';
        // If width is provided as a number, use it for optimization.
        // If it's a string (like "100%") or undefined, use default optimization.
        const numericWidth = typeof width === 'number' ? width : 1200;
        const numericHeight = typeof height === 'number' ? height : undefined;
        return optimizeRemoteImageUrl(src, numericWidth, numericHeight);
    }, [src, width, height]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            });
        }, { rootMargin: '100px', threshold: 0.01 });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
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
                    <ImageIcon className="size-8 text-gray-400 opacity-40" />
                </div>
            )}
            {isVisible && (
                <img
                    src={optimizedSrc}
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
            )}
        </div>
    );
});

LazyImage.displayName = 'LazyImage';
