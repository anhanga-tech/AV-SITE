import React, { useState, useEffect, useRef } from 'react';
import ImageIcon from 'lucide-react/dist/esm/icons/image';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = "",
    placeholderClassName = "bg-gray-200",
    ...props
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
            {!isLoaded && (
                <div className={`absolute inset-0 flex items-center justify-center z-10 ${placeholderClassName}`}>
                    <ImageIcon className="w-8 h-8 text-gray-400 opacity-40" />
                </div>
            )}
            {isVisible && (
                <img
                    src={src}
                    alt={alt}
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
};
