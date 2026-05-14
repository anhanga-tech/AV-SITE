import React, { useEffect, useState, useRef } from 'react';
import { m } from 'framer-motion';
import {
    InstagramLogo,
    FacebookLogo,
    WhatsappLogo,
    CheckCircle,
    MapPin,
    Phone,
    Envelope,
    Sparkle,
    AirplaneTilt,
    UsersThree,
    ClipboardText,
    PaperPlaneTilt,
    SpinnerGap,
    ArrowRight,
} from '@phosphor-icons/react';
import { SEO } from '../../components/SEO';
import { useLeadCapture, createLeadEventId } from '../../hooks/useLeadCapture';
import { useWhatsAppLink } from '../../utils/whatsapp';
import { openContactModal } from '../../utils/contactForm';
import { BRAND_LOGO_BLUE_URL } from '../../lib/media-assets';

// ─── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_MESSAGE =
    'Olá! Conheci a Anhangá Viagens na Brazil Promotion Day e gostaria de saber mais sobre roteiros personalizados. ✈️🌎';

const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/anhangaviagens',
    facebook: 'https://facebook.com/profile.php?id=61585422494271',
};

const PILLARS = [
    {
        icon: UsersThree,
        title: 'Concierge Humano',
        description: 'Esqueça os robôs. Fale com gente que entende de gente.',
        bg: 'bg-blue-100',
        accent: 'border-blue-200',
        iconColor: 'text-blue-600',
        rotate: '-rotate-1',
    },
    {
        icon: Sparkle,
        title: 'Roteiros à Mão',
        description: 'Cada dia de viagem desenhado do zero, só para você. Sem pacote genérico, sem destino padrão.',
        bg: 'bg-emerald-100',
        accent: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        rotate: 'rotate-2',
    },
    {
        icon: ClipboardText,
        title: 'Zero Burocracia',
        description: 'Vistos, transfers, seguro viagem e chatices? Cuida com a gente.',
        bg: 'bg-orange-100',
        accent: 'border-orange-200',
        iconColor: 'text-orange-600',
        rotate: '-rotate-2',
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' as const },
    }),
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BrazilPromotionDayLanding: React.FC = () => {
    const { submitLead, isSubmitting } = useLeadCapture();
    const whatsappUrl = useWhatsAppLink(WHATSAPP_MESSAGE, { appendTrackingRef: true });

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        whatsapp: '',
        destination: '',
    });
    const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const isLocallySubmitting = useRef(false);

    // Push campaign data to GTM dataLayer on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'landing_view',
                campaign: 'brazil-promotion-day-2026',
                landing_type: 'event_qr',
            });
        }
    }, []);

    function handleField(field: keyof typeof form) {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
        };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isLocallySubmitting.current) return;
        isLocallySubmitting.current = true;
        setErrorMessage('');

        try {
            const eventId = createLeadEventId();
            const destination = form.destination.trim() || 'A definir';

            const result = await submitLead(
                {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    whatsapp: form.whatsapp,
                    destination,
                    bantSummary: `Lead captado via QR Code — Brazil Promotion Day 2026. Destino de interesse: ${destination}.`,
                },
                { eventId, pushDataLayerEvent: true, formType: 'event_lead' },
            );

            if (result.ok) {
                setSubmitState('success');
            } else {
                setSubmitState('error');
                setErrorMessage('error' in result ? result.error : 'Ocorreu um erro ao enviar. Tente novamente.');
                isLocallySubmitting.current = false;
            }
        } catch (err) {
            setSubmitState('error');
            setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
            isLocallySubmitting.current = false;
        }
    }

    return (
        <>
            <SEO
                title="Anhangá Viagens na Brazil Promotion Day | Roteiros Personalizados"
                description="Conheça a Anhangá Viagens na Brazil Promotion Day. Agência de viagens em SP com roteiros exclusivos feitos do zero, sem pacote pronto."
                canonical="https://www.anhanga.tur.br/brazil-promotion-day/"
            />

            <div className="bg-[#fffdf5] min-h-screen font-sans">

                {/* ── Nav ───────────────────────────────────────────────── */}
                <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-6 py-2">
                    <div className="container mx-auto flex items-center justify-between">
                        <a href="https://www.anhanga.tur.br/" aria-label="Voltar para o site principal">
                            <img
                                src={BRAND_LOGO_BLUE_URL}
                                alt="Anhangá Viagens"
                                width="160"
                                height="83"
                                className="h-12 w-auto object-contain"
                            />
                        </a>
                        <button
                            type="button"
                            onClick={() => openContactModal({ source: 'brazil-promotion-day' })}
                            className="btn-whatsapp btn-specialist hidden sm:flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                            data-contact-intent
                            data-tracking="header-brazil-promotion-day"
                        >
                            <WhatsappLogo className="size-4" weight="fill" />
                            Falar no WhatsApp
                        </button>
                    </div>
                </nav>

                {/* ── Hero ──────────────────────────────────────────────── */}
                <section className="relative w-full min-h-[100svh] md:min-h-[720px] flex items-center overflow-hidden">

                    {/* Background gradient — same language as main Hero */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/85 to-blue-900/75" />
                        {/* Noise texture (same as main Hero) */}
                        <div
                            className="hidden md:block absolute inset-0 opacity-20"
                            style={{ backgroundImage: "url('/noise.png')" }}
                        />
                    </div>

                    {/* Decorative blobs */}
                    <div
                        aria-hidden="true"
                        className="absolute top-0 right-0 size-[500px] rounded-full bg-blue-500/20 blur-3xl animate-blob"
                    />
                    <div
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 size-96 rounded-full bg-brand-yellow/10 blur-3xl animate-blob"
                        style={{ animationDelay: '4s' }}
                    />

                    <div className="container mx-auto px-6 relative z-10 pt-20 pb-24">
                        <div className="flex flex-col items-center text-center">

                            {/* Event badge — skewed like Highlights badge */}
                            <m.div
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={0}
                                className="inline-block relative mb-6"
                            >
                                <span className="absolute inset-0 bg-brand-yellow/30 transform -skew-x-12 rounded-lg" />
                                <span className="relative px-4 py-1.5 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <AirplaneTilt className="size-4" weight="fill" />
                                    Brazil Promotion Day 2026
                                </span>
                            </m.div>

                            <m.h1
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={1}
                                className="font-sans font-extrabold text-white leading-[0.9] tracking-tight drop-shadow-lg text-5xl sm:text-6xl md:text-8xl mb-6"
                            >
                                Sua equipe <br />
                                <span className="text-yellow-300">
                                    Viaja bem.
                                </span>
                            </m.h1>

                            <m.p
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={2}
                                className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md"
                            >
                                Roteiros exclusivos feitos do zero. Sem pacote pronto,
                                sem estresse. Só a sua viagem.
                            </m.p>

                            <m.div
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={3}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <button
                                    type="button"
                                    onClick={() => openContactModal({ source: 'brazil-promotion-day' })}
                                    className="btn-whatsapp btn-specialist flex items-center justify-center gap-3 bg-brand-yellow text-brand-dark px-8 py-4 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                                    data-contact-intent
                                    data-tracking="hero-brazil-promotion-day"
                                >
                                    <WhatsappLogo className="size-6" weight="fill" />
                                    Falar com a gente agora
                                </button>
                                <a
                                    href="#contato"
                                    className="btn-specialist flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:border-white hover:bg-white/10 transition-all duration-200"
                                >
                                    Prefiro ser contatado
                                    <ArrowRight className="size-5" />
                                </a>
                            </m.div>

                            {/* Quick feature pills — identical pattern to main Hero */}
                            <m.div
                                className="mt-10 flex flex-wrap justify-center gap-4"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: {},
                                    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
                                }}
                            >
                                {[
                                    { icon: '✈️', text: 'Roteiro Personalizado' },
                                    { icon: '🤝', text: 'Atendimento Humano' },
                                    { icon: '🌎', text: 'Viagem Sob Medida' },
                                    { icon: '💛', text: 'Sem Pacote Pronto' },
                                ].map((feat) => (
                                    <m.div
                                        key={feat.text}
                                        variants={{
                                            hidden: { opacity: 0, y: 16, scale: 0.9 },
                                            visible: {
                                                opacity: 1, y: 0, scale: 1,
                                                transition: { type: 'spring', stiffness: 400, damping: 20 },
                                            },
                                        }}
                                        className="flex items-center gap-2 text-white/90 font-bold text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all duration-300 cursor-default"
                                    >
                                        <span>{feat.icon}</span>
                                        {feat.text}
                                    </m.div>
                                ))}
                            </m.div>
                        </div>
                    </div>

                    {/* Wavy bottom separator — exact pattern from main Hero */}
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
                        <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                            <path
                                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                                fill="#fffdf5"
                            />
                        </svg>
                    </div>
                </section>

                {/* ── Pillars ───────────────────────────────────────────── */}
                <section className="py-24 bg-[#fffdf5] relative overflow-hidden">

                    {/* Dot pattern — same as Highlights */}
                    <div
                        className="absolute inset-0 z-0 opacity-[0.3]"
                        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
                    />

                    <div className="container mx-auto px-6 relative z-10">

                        <m.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            custom={0}
                            className="text-center mb-16"
                        >
                            <div className="inline-block relative mb-4">
                                <span className="absolute inset-0 bg-blue-100 transform -skew-x-12 rounded-lg" />
                                <span className="relative px-3 py-1 text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Sparkle className="size-4" weight="fill" /> O Jeito Anhangá
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
                                Não existe roteiro certo <br />
                                <span className="text-brand-cyan">
                                    para o viajante errado.
                                </span>
                            </h2>
                        </m.div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {PILLARS.map((item, idx) => {
                                const Icon = item.icon;
                                const rotateVal = parseInt(item.rotate.replace(/rotate-|-/g, ''), 10) || 0;
                                const sign = item.rotate.startsWith('-') ? -1 : 1;

                                return (
                                    <m.div
                                        key={item.title}
                                        className={`relative p-8 rounded-[2.5rem] bg-white border-[3px] ${item.accent} shadow-[8px_8px_0px_rgba(0,0,0,0.05)] flex flex-col h-full group`}
                                        variants={fadeUp}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{ once: true, amount: 0.1 }}
                                        custom={idx + 1}
                                        whileHover={{
                                            scale: 1.03,
                                            rotate: 0,
                                            y: -8,
                                            boxShadow: '14px 14px 0px rgba(0,0,0,0.05)',
                                            zIndex: 10,
                                            transition: { type: 'spring', stiffness: 350, damping: 18 },
                                        }}
                                        style={{ rotate: `${sign * rotateVal}deg` }}
                                    >
                                        {/* Washi tape */}
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-50/90 backdrop-blur-sm border-l-2 border-r-2 border-white/40 rotate-1 shadow-sm z-20 opacity-90" />

                                        <m.div
                                            className={`size-16 rounded-2xl ${item.bg} border-2 ${item.accent} flex items-center justify-center mb-6 shadow-sm`}
                                            whileHover={{ scale: 1.1, rotate: 6, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                        >
                                            <Icon className={`size-8 ${item.iconColor}`} weight="fill" />
                                        </m.div>

                                        <h3 className="text-xl font-extrabold text-gray-900 mb-3 leading-tight group-hover:text-brand-cyan transition-colors duration-300">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-500 font-medium leading-relaxed text-sm">
                                            {item.description}
                                        </p>

                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight className={`size-5 ${item.iconColor}`} />
                                        </div>
                                    </m.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── WhatsApp CTA band ─────────────────────────────────── */}
                <section className="py-16 bg-brand-dark relative overflow-hidden">
                    <div
                        className="absolute top-5 left-10 text-9xl opacity-[0.03] rotate-12 font-black text-white pointer-events-none select-none"
                    >
                        FLY
                    </div>
                    <div
                        className="absolute bottom-5 right-10 text-9xl opacity-[0.03] -rotate-12 font-black text-white pointer-events-none select-none"
                    >
                        TRAVEL
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5 rounded-[2rem] p-10 border border-white/10">
                            <div>
                                <p className="text-brand-yellow font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                    <AirplaneTilt className="size-4" weight="fill" />
                                    Atendimento imediato
                                </p>
                                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                    Veio pelo QR Code? <br />
                                    <span className="text-brand-cyan">Bora conversar.</span>
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => openContactModal({ source: 'brazil-promotion-day' })}
                                className="btn-whatsapp btn-specialist shrink-0 flex items-center gap-3 bg-brand-yellow text-brand-dark px-10 py-5 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all whitespace-nowrap"
                                data-contact-intent
                                data-tracking="whatsapp-band-brazil-promotion-day"
                            >
                                <WhatsappLogo className="size-6" weight="fill" />
                                Abrir WhatsApp
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Contact Form ──────────────────────────────────────── */}
                <section id="contato" className="py-24 bg-[#fffdf5] relative overflow-hidden">

                    <div
                        className="absolute inset-0 z-0 opacity-[0.3]"
                        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
                    />

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">

                            {/* Left: contact info */}
                            <m.div
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                custom={0}
                            >
                                <div className="inline-block relative mb-4">
                                    <span className="absolute inset-0 bg-emerald-100 transform -skew-x-12 rounded-lg" />
                                    <span className="relative px-3 py-1 text-emerald-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                        <Sparkle className="size-4" weight="fill" /> Fale com a gente
                                    </span>
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight mb-6">
                                    Prefere que a gente <br />
                                    <span className="text-brand-cyan">
                                        entre em contato?
                                    </span>
                                </h2>

                                <p className="text-gray-500 font-medium text-lg leading-relaxed mb-10 max-w-sm">
                                    Preencha o formulário e um consultor entra em contato pelo canal que você preferir, sem enrolação.
                                </p>

                                <ul className="space-y-5 mb-10" role="list">
                                    {[
                                        { icon: Phone, label: '(11) 5283-3309', href: 'tel:+551152833309' },
                                        { icon: Envelope, label: 'contato@anhanga.tur.br', href: 'mailto:contato@anhanga.tur.br' },
                                        { icon: MapPin, label: 'Av. Dom Pedro I, 773 — Vila Monumento, SP', href: null },
                                    ].map(({ icon: Icon, label, href }) => (
                                        <li key={label} className="flex items-start gap-4">
                                            <div className="size-10 rounded-xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                                                <Icon className="size-5 text-blue-600" weight="fill" />
                                            </div>
                                            {href ? (
                                                <a href={href} className="font-semibold text-gray-700 hover:text-brand-cyan transition-colors duration-150 pt-1.5">
                                                    {label}
                                                </a>
                                            ) : (
                                                <span className="font-semibold text-gray-700 leading-snug pt-1.5">{label}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                {/* Social links */}
                                <div>
                                    <p className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-4">
                                        Nos siga nas redes
                                    </p>
                                    <div className="flex gap-3">
                                        {[
                                            { href: SOCIAL_LINKS.instagram, icon: InstagramLogo, label: 'Instagram da Anhangá Viagens' },
                                            { href: SOCIAL_LINKS.facebook, icon: FacebookLogo, label: 'Facebook da Anhangá Viagens' },
                                            { href: whatsappUrl, icon: WhatsappLogo, label: 'WhatsApp da Anhangá Viagens', contact: true },
                                        ].map(({ href, icon: Icon, label, contact }) => (
                                            <a
                                                key={label}
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="size-11 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-cyan hover:text-brand-cyan shadow-[2px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_0px_#fbbf24] hover:-translate-y-1 transition-all duration-200"
                                                aria-label={label}
                                                {...(contact ? { 'data-contact-intent': true, 'data-tracking': 'social-whatsapp-brazil-promotion-day' } : {})}
                                            >
                                                <Icon className="size-5" weight="fill" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </m.div>

                            {/* Right: form */}
                            <m.div
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                custom={1}
                                className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden"
                            >
                                {submitState === 'success' ? (
                                    <div className="flex flex-col items-center text-center p-12">
                                        <m.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        >
                                            <CheckCircle className="size-16 text-emerald-500 mb-4" weight="fill" />
                                        </m.div>
                                        <h3 className="text-2xl font-black text-brand-dark mb-3">
                                            Mensagem recebida! 🎉
                                        </h3>
                                        <p className="text-gray-500 max-w-xs leading-relaxed mb-8">
                                            Um consultor da Anhangá vai entrar em contato em breve. Fique de olho no WhatsApp ou e-mail.
                                        </p>
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-whatsapp btn-specialist flex items-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                                            data-contact-intent
                                            data-tracking="success-brazil-promotion-day"
                                        >
                                            <WhatsappLogo className="size-4" weight="fill" />
                                            Ou fale agora no WhatsApp →
                                        </a>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} noValidate>
                                        {/* Form header strip */}
                                        <div className="flex justify-between items-center px-8 py-5 border-b-2 border-dashed border-gray-100">
                                            <span className="text-brand-cyan font-black tracking-widest text-sm uppercase flex items-center gap-2">
                                                <AirplaneTilt className="size-4" weight="fill" /> Formulário de Contato
                                            </span>
                                            <span className="text-gray-400 font-bold text-xs uppercase">Brazil Promotion Day</span>
                                        </div>

                                        <div className="p-8 space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="firstName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        Nome <span className="text-brand-cyan">*</span>
                                                    </label>
                                                    <input
                                                        id="firstName"
                                                        type="text"
                                                        placeholder="João"
                                                        autoComplete="given-name"
                                                        value={form.firstName}
                                                        onChange={handleField('firstName')}
                                                        required
                                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-gray-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="lastName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        Sobrenome <span className="text-brand-cyan">*</span>
                                                    </label>
                                                    <input
                                                        id="lastName"
                                                        type="text"
                                                        placeholder="Silva"
                                                        autoComplete="family-name"
                                                        value={form.lastName}
                                                        onChange={handleField('lastName')}
                                                        required
                                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-gray-400"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                    E-mail <span className="text-brand-cyan">*</span>
                                                </label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    placeholder="joao@empresa.com.br"
                                                    autoComplete="email"
                                                    value={form.email}
                                                    onChange={handleField('email')}
                                                    required
                                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-gray-400"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="whatsapp" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                    WhatsApp <span className="text-brand-cyan">*</span>
                                                </label>
                                                <input
                                                    id="whatsapp"
                                                    type="tel"
                                                    placeholder="(11) 99999-9999"
                                                    autoComplete="tel"
                                                    value={form.whatsapp}
                                                    onChange={handleField('whatsapp')}
                                                    required
                                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-gray-400"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="destination" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                    Destino de interesse
                                                </label>
                                                <input
                                                    id="destination"
                                                    type="text"
                                                    placeholder="Ex: Orlando, Europa, Nordeste…"
                                                    autoComplete="off"
                                                    value={form.destination}
                                                    onChange={handleField('destination')}
                                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-gray-400"
                                                />
                                            </div>

                                            {submitState === 'error' && errorMessage && (
                                                <p className="text-red-500 text-xs font-medium" role="alert">
                                                    {errorMessage}
                                                </p>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full flex items-center justify-center gap-3 bg-brand-dark text-white py-4 rounded-xl font-bold text-base shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-60 disabled:pointer-events-none"
                                                data-tracking="submit-form-brazil-promotion-day"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <SpinnerGap className="size-5 animate-spin" weight="bold" />
                                                        Enviando…
                                                    </>
                                                ) : (
                                                    <>
                                                        <PaperPlaneTilt className="size-5" weight="fill" />
                                                        Quero ser contatado
                                                    </>
                                                )}
                                            </button>

                                            <p className="text-xs text-gray-400 text-center leading-relaxed">
                                                Seus dados são usados apenas para entrar em contato. Não compartilhamos com terceiros.
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </m.div>
                        </div>
                    </div>
                </section>

                {/* ── Footer ────────────────────────────────────────────── */}
                <footer className="bg-brand-dark text-gray-300 py-10">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <img
                            src={BRAND_LOGO_BLUE_URL}
                            alt="Anhangá Viagens"
                            width="120"
                            height="62"
                            className="h-8 w-auto object-contain brightness-0 invert"
                        />
                        <p className="text-xs text-white/50 font-medium text-center">
                            ANHANGA TURISMO LTDA • CNPJ 37.036.732/0001-41
                        </p>
                        <a
                            href="https://www.anhanga.tur.br/"
                            className="text-xs text-white/50 hover:text-white transition-colors duration-150 font-medium underline underline-offset-2"
                        >
                            Ir para o site principal →
                        </a>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default BrazilPromotionDayLanding;
