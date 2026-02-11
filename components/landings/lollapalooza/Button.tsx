import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppLink } from './utils/whatsapp';

interface ButtonProps {
  text: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  dataWhatsappLocation?: string;
}

/**
 * Botão CTA para WhatsApp - Versão Safari-Safe
 * 
 * IMPORTANTE: Não usa fake loading nem preventDefault.
 * O href é preenchido com a URL do WhatsApp incluindo todos os parâmetros de tracking.
 * A navegação é 100% nativa, garantindo funcionamento no iOS/Safari.
 */
const Button: React.FC<ButtonProps> = ({ text, className = '', variant = 'primary', fullWidth = false, dataWhatsappLocation }) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-lg uppercase tracking-wide cursor-pointer select-none";

  const variants = {
    primary: "bg-anhanga-yellow text-anhanga-darkBlue hover:bg-anhanga-yellowHover",
    secondary: "bg-white text-anhanga-blue hover:bg-gray-100",
    outline: "border-2 border-white text-white hover:bg-white hover:text-anhanga-blue"
  };

  const widthClass = fullWidth ? "w-full" : "";

  // URL gerada com todos os parâmetros de tracking (utm, gclid, fbclid, ttclid, cid, etc.)
  const whatsappUrl = getWhatsAppLink();

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-whatsapp ${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      id="btn-whatsapp-cta"
      data-whatsapp-location={dataWhatsappLocation}
    >
      <MessageCircle size={24} />
      <span>{text}</span>
    </a>
  );
};

export default Button;