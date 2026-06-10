import { useEffect, useRef, useState } from 'react';

const useIntersectionObserver = (threshold = 0.1) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // react-doctor-disable-next-line no-adjust-state-on-prop-change
  useEffect(() => {
    const element = elementRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible to run animation only once
          if (element) {
            observer.unobserve(element);
          }
        }
      },
      { threshold }
    );

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  return { elementRef, isVisible };
};

export default useIntersectionObserver;
