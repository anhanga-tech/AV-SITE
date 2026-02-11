import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Loader2, ExternalLink } from 'lucide-react';
import { WHATSAPP_LINK } from './constants';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  icon?: boolean;
  className?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom';
  ariaLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  variant = 'primary',
  fullWidth = false,
  icon = true,
  className = '',
  tooltip,
  tooltipPosition = 'top',
  ariaLabel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const timeoutRef1 = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef2 = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef1.current) {
        clearTimeout(timeoutRef1.current);
        timeoutRef1.current = null;
      }
      if (timeoutRef2.current) {
        clearTimeout(timeoutRef2.current);
        timeoutRef2.current = null;
      }
    };
  }, []);

  // Added explicit ring-offset-white for contrast
  const baseStyles = "inline-flex items-center justify-center font-heading font-bold text-lg md:text-xl px-8 py-4 rounded-full transition-all duration-200 transform hover:-translate-y-1 border-2 border-fun-dark relative z-10 focus:outline-none focus:ring-4 focus:ring-fun-blue focus:ring-offset-2 focus:ring-offset-white";

  const variants = {
    primary: "bg-fun-green text-white shadow-hard hover:shadow-hard-hover",
    secondary: "bg-fun-pink text-white shadow-hard hover:shadow-hard-hover",
    outline: "bg-white text-fun-dark shadow-hard hover:shadow-hard-hover",
  };

  const handleClick = () => {
    if (isLoading) return;

    setIsLoading(true);

    // Simulate "preparing" delay for better UX
    timeoutRef1.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }
      if (onClick) onClick();

      // Show confirmation toast
      setShowToast(true);

      // Navigate to WhatsApp
      window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');

      setIsLoading(false);

      // Hide toast after 3 seconds
      timeoutRef2.current = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        setShowToast(false);
      }, 3000);
    }, 1500);
  };

  const positionStyles = tooltipPosition === 'top'
    ? 'bottom-full mb-3'
    : 'top-full mt-3';

  const arrowStyles = tooltipPosition === 'top'
    ? 'top-full -mt-1 border-r-2 border-b-2 border-white'
    : 'bottom-full -mb-1 border-t-2 border-l-2 border-white';

  const animationStyles = tooltipPosition === 'top'
    ? 'translate-y-2 group-hover:translate-y-0'
    : '-translate-y-2 group-hover:translate-y-0';

  // Construct a descriptive label if not provided
  const computedAriaLabel = ariaLabel || (tooltip ? `${text}. ${tooltip}` : text);

  return (
    <div className={`relative group ${fullWidth ? 'w-full' : 'inline-block'}`}>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className} ${isLoading ? 'cursor-wait opacity-90' : ''}`}
        aria-label={computedAriaLabel}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Preparando Conversa...
          </>
        ) : (
          <>
            {icon && <MessageCircle className="w-6 h-6 mr-2" />}
            {text}
          </>
        )}
      </button>

      {!isLoading && tooltip && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 w-max max-w-[200px] md:max-w-xs transition-all duration-200 opacity-0 group-hover:opacity-100 pointer-events-none z-50 ${positionStyles} ${animationStyles}`}>
          <div className="bg-fun-dark text-white text-sm font-bold py-2 px-3 rounded-xl shadow-lg border-2 border-white text-center relative">
            {tooltip}
            {/* Arrow */}
            <div className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-fun-dark rotate-45 ${arrowStyles}`}></div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {showToast && (() => {
        const bodyExists = !!document.body;
        if (!document.body) {
          return null;
        }
        return createPortal(
          <div
            className="fixed top-6 left-0 right-0 z-[9999] flex justify-center pointer-events-none animate-bounce"
            role="status"
            aria-live="polite"
          >
            <div className="bg-fun-green text-white px-6 py-3 rounded-2xl shadow-hard border-2 border-fun-dark flex items-center gap-3">
              <ExternalLink size={24} strokeWidth={2.5} />
              <span className="font-heading font-bold text-lg">Abrindo WhatsApp...</span>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default Button;
