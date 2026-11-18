import React, { useEffect, useState } from 'react';
import { WhatsappLogo } from '@phosphor-icons/react';
import { openParquesContact } from './contact';
import { useParquesProfile } from './ProfileContext';

export const PARQUES_HERO_ID = 'parques-hero';
export const PARQUES_FINAL_CTA_ID = 'parques-cta';

/*
  Barra de orçamento só no celular. No mobile a página passa de 9.000px, e o
  único CTA sem contexto de parque ficava no fim.

  - Aparece depois do hero (lá o seletor já tem o próprio botão) e some quando
    o CTA final entra na tela, para não haver dois CTAs iguais lado a lado.
  - Fica à esquerda do botão do chat (size-16, right-4) e na mesma altura, sem
    cobrir nenhum dos dois; sobe junto quando o banner de cookies aparece.
  - Sem Âmbar: o Âmbar é do CTA final.
*/
export const MobileQuoteBar: React.FC<{ whatsappUrl: string }> = ({ whatsappUrl }) => {
  const { profile } = useParquesProfile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const hero = document.getElementById(PARQUES_HERO_ID);
      const cta = document.getElementById(PARQUES_FINAL_CTA_ID);
      const pastHero = hero ? hero.getBoundingClientRect().bottom < 0 : false;
      const beforeCta = cta ? cta.getBoundingClientRect().top > window.innerHeight : true;
      setVisible(pastHero && beforeCta);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-[calc(1rem+var(--cookie-banner-h,0px))] left-4 right-24 z-[9980] flex h-16 items-center gap-2 rounded-2xl bg-white p-2 shadow-float-lg md:hidden"
    >
      <button
        type="button"
        onClick={() => openParquesContact(undefined, profile)}
        className="inline-flex h-full min-h-[44px] flex-1 items-center justify-center rounded-xl bg-anhanga-dark px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
      >
        Quero um orçamento
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar pelo WhatsApp"
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl text-anhanga-dark hover:text-anhanga-actionInk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
      >
        <WhatsappLogo className="size-6" weight="fill" aria-hidden="true" />
      </a>
    </div>
  );
};
