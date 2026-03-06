
import React from 'react';
import { Link } from 'react-router-dom';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Facebook from 'lucide-react/dist/esm/icons/facebook';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Globe2 from 'lucide-react/dist/esm/icons/globe-2';
import Heart from 'lucide-react/dist/esm/icons/heart';
import { getBlogHomeUrl } from '../utils/blog';

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
                            Planejamento de viagens com alma, design e zero estresse. <br />
                            Vamos criar memórias?
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Menu</h4>
                        <ul className="space-y-3 font-medium">
                            <li><Link to="/" className="hover:text-brand-yellow transition-colors">Agência de Viagens em São Paulo</Link></li>
                            <li><a href={getBlogHomeUrl()} className="hover:text-brand-yellow transition-colors">Blog de Viagens e Roteiros</a></li>
                            <li><Link to="/orlando" className="hover:text-brand-yellow transition-colors">Pacotes para Orlando</Link></li>
                            <li><Link to="/beto-carrero" className="hover:text-brand-yellow transition-colors">Pacote Beto Carrero</Link></li>
                            <li><Link to="/lollapalooza-2026" className="hover:text-brand-yellow transition-colors">Pacotes para Lollapalooza 2026</Link></li>
                            <li><Link to="/mapa-do-site" className="hover:text-brand-yellow transition-colors">Mapa do Site</Link></li>
                            <li><Link to="/termos-de-uso" className="hover:text-brand-yellow transition-colors">Termos de Uso</Link></li>
                            <li><Link to="/politica-privacidade" className="hover:text-brand-yellow transition-colors">Política de Privacidade</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Fale Conosco</h4>
                        <ul className="space-y-4 font-medium text-sm">
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-brand-cyan" />
                                <a href="tel:+551152833309" className="hover:text-brand-yellow transition-colors">(11) 5283-3309</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-brand-cyan" />
                                <a href="mailto:contato@anhanga.tur.br" className="hover:text-brand-yellow transition-colors">contato@anhanga.tur.br</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-brand-cyan shrink-0 mt-1" />
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
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a
                            href="https://facebook.com/profile.php?id=61585422494271"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 rounded-full hover:bg-brand-vibrant hover:text-white transition-colors"
                            aria-label="Siga a Anhangá Viagens no Facebook"
                        >
                            <Facebook className="w-5 h-5" />
                        </a>
                    </div>

                    <div className="flex flex-col md:items-end gap-2 text-center md:text-right order-1 md:order-2">
                        <div className="text-xs text-gray-500 font-medium flex items-center justify-center md:justify-end gap-1">
                            Feito com <Heart className="w-3 h-3 text-red-500 fill-current" aria-hidden="true" /> pela <img src={`${baseUrl}assets/LOGO ANHANGA TECH.svg`} alt="Anhangá.tech" width="80" height="16" className="h-4 w-auto inline-block mx-1 align-sub" /> • {currentYear}
                        </div>
                        <div className="text-[10px] text-gray-600 font-medium">
                            ANHANGA TURISMO LTDA • CNPJ/Cadastur: 37.036.732/0001-41
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
