
import React from 'react';
import { Link } from 'react-router-dom';
import {
    InstagramLogo,
    FacebookLogo,
    Phone,
    Envelope,
    MapPin,
    Heart,
} from '@phosphor-icons/react';
import { getBlogHomeUrl } from '../utils/blog';

const SITE_URL = 'https://www.anhanga.tur.br';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const baseUrl = import.meta.env.BASE_URL;

    return (
        <footer className="relative bg-brand-dark text-gray-300 pt-32 pb-32 md:pb-24 font-sans overflow-hidden">

            {/* Wavy Top Border */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
                <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#f0f9ff"></path>
                </svg>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-4 gap-12 mb-16">

                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="mb-6">
                            <img
                                src={`${baseUrl}assets/LOGO ANHANGA VIAGENS - BRANCO.svg`}
                                alt="Anhangá Viagens"
                                width="247"
                                height="128"
                                className="h-32 w-auto object-contain"
                            />
                        </div>
                        <p className="text-gray-400 leading-relaxed max-w-sm font-medium">
                            Roteiros feitos do zero. Sem pacote pronto, sem estresse. <br />
                            Só a sua viagem.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Menu</h4>
                        <ul className="space-y-3 font-medium">
                            <li><a href={`${SITE_URL}/`} className="hover:text-brand-yellow transition-colors">Agência de Viagens em São Paulo</a></li>
                            <li><a href={`${SITE_URL}/sobre/`} className="hover:text-brand-yellow transition-colors">Sobre a Anhangá</a></li>
                            <li><a href={getBlogHomeUrl()} className="hover:text-brand-yellow transition-colors">Blog de Viagens e Roteiros</a></li>
                            <li><a href={`${SITE_URL}/orlando/`} className="hover:text-brand-yellow transition-colors">Pacotes para Orlando</a></li>
                            <li><a href={`${SITE_URL}/beto-carrero/`} className="hover:text-brand-yellow transition-colors">Pacote Beto Carrero</a></li>
                            <li><a href={`${SITE_URL}/lollapalooza/`} className="hover:text-brand-yellow transition-colors">Lollapalooza Brasil</a></li>
                            <li><a href={`${SITE_URL}/mapa-do-site/`} className="hover:text-brand-yellow transition-colors">Mapa do Site</a></li>
                            <li><a href={`${SITE_URL}/termos-de-uso/`} className="hover:text-brand-yellow transition-colors">Termos de Uso</a></li>
                            <li><a href={`${SITE_URL}/politica-privacidade/`} className="hover:text-brand-yellow transition-colors">Política de Privacidade</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Fale Conosco</h4>
                        <ul className="space-y-4 font-medium text-sm">
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-brand-cyan" weight="fill" />
                                <a href="tel:+551152833309" className="hover:text-brand-yellow transition-colors">(11) 5283-3309</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Envelope className="w-5 h-5 text-brand-cyan" weight="fill" />
                                <a href="mailto:contato@anhanga.tur.br" className="hover:text-brand-yellow transition-colors">contato@anhanga.tur.br</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-brand-cyan shrink-0 mt-1" weight="fill" />
                                <span className="leading-snug">Av. Dom Pedro I, 773<br />Vila Monumento, São Paulo-SP</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex gap-4 order-2 md:order-1">
                        <a
                            href="https://instagram.com/anhangaviagens"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 rounded-full hover:bg-brand-vibrant hover:text-white transition-colors"
                            aria-label="Siga a Anhangá Viagens no Instagram"
                        >
                            <InstagramLogo className="w-5 h-5" weight="fill" />
                        </a>
                        <a
                            href="https://facebook.com/profile.php?id=61585422494271"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 rounded-full hover:bg-brand-vibrant hover:text-white transition-colors"
                            aria-label="Siga a Anhangá Viagens no Facebook"
                        >
                            <FacebookLogo className="w-5 h-5" weight="fill" />
                        </a>
                    </div>

                    <div className="flex flex-col md:items-end gap-2 text-center md:text-right order-1 md:order-2">
                        <div className="text-xs text-gray-500 font-medium flex items-center justify-center md:justify-end gap-1">
                            Feito com <Heart className="w-3 h-3 text-red-500" weight="fill" aria-hidden="true" /> pela <img src={baseUrl + "assets/LOGO%20ANHANGA%20TECH.svg"} alt="Anhangá.tech" width="80" height="16" loading="lazy" className="h-4 w-auto inline-block mx-1 align-sub" /> • {currentYear}
                        </div>
                        <div className="text-[10px] text-gray-600 font-medium flex flex-wrap justify-center md:justify-end gap-x-2">
                            <span>ANHANGA TURISMO LTDA • CNPJ/Cadastur: <a href="https://cadastur.turismo.gov.br/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors underline decoration-gray-600 underline-offset-2">37.036.732/0001-41</a></span>
                            <span className="hidden md:inline">•</span>
                            <a href="https://www.abav.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors underline decoration-gray-600 underline-offset-2">Membro ABAV</a>
                            <span className="hidden md:inline">•</span>
                            <a href="https://www.gov.br/turismo/pt-br" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors underline decoration-gray-600 underline-offset-2">Ministério do Turismo</a>
                        </div>
                        <div className="text-[10px] text-gray-700 font-bold uppercase tracking-widest mt-2">
                            Conteúdo da equipe Anhangá Viagens • Última atualização: {new Date().toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
