import React from 'react';
import { MessageCircle } from 'lucide-react';
import { openContactModal } from '../../../utils/contactForm';

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
  dataTracking?: string;
}

const BASE_STYLES = "inline-flex items-center justify-center font-sans font-bold text-lg md:text-xl px-8 py-4 rounded-full transition duration-200 transform hover:-translate-y-1 border-2 border-fun-dark relative z-10 focus:outline-none focus:ring-4 focus:ring-fun-blue focus:ring-offset-2 focus:ring-offset-white";

const VARIANTS = {
  primary: "bg-fun-green text-white shadow-hard hover:shadow-hard-hover",
  secondary: "bg-fun-pink text-white shadow-hard hover:shadow-hard-hover",
  outline: "bg-white text-fun-dark shadow-hard hover:shadow-hard-hover",
};

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  variant = 'primary',
  fullWidth = false,
  icon = true,
  className = '',
  tooltip,
  tooltipPosition = 'top',
  ariaLabel,
  dataTracking
}) => {

  const positionStyles = tooltipPosition === 'top'
    ? 'bottom-full mb-3'
    : 'top-full mt-3';

  const arrowStyles = tooltipPosition === 'top'
    ? 'top-full -mt-1 border-r-2 border-b-2 border-white'
    : 'bottom-full -mb-1 border-t-2 border-l-2 border-white';

  const animationStyles = tooltipPosition === 'top'
    ? 'translate-y-2 group-hover:translate-y-0'
    : '-translate-y-2 group-hover:translate-y-0';

  const computedAriaLabel = ariaLabel || (tooltip ? `${text}. ${tooltip}` : text);


  return (
    <div className={`relative group ${fullWidth ? 'w-full' : 'inline-block'}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          openContactModal({ source: 'beto-carrero' });
          onClick?.();
        }}
        className={`btn-whatsapp btn-specialist ${BASE_STYLES} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        aria-label={computedAriaLabel}
        data-tracking={dataTracking}
      >
        {icon && <MessageCircle className="size-6 mr-2" />}
        {text}
      </button>

      {tooltip && (
        <div className={`absolute left-1/2 transform -translate-x-1/2 w-max max-w-[200px] md:max-w-xs transition duration-200 opacity-0 group-hover:opacity-100 pointer-events-none z-50 ${positionStyles} ${animationStyles}`}>
          <div className="bg-fun-dark text-white text-sm font-bold py-2 px-3 rounded-xl shadow-lg border-2 border-white text-center relative">
            {tooltip}
            <div className={`absolute left-1/2 transform -translate-x-1/2 size-3 bg-fun-dark rotate-45 ${arrowStyles}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Button;
