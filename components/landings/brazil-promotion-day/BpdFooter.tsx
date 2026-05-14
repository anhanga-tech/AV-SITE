import { BRAND_LOGO_BLUE_URL } from '../../../lib/media-assets';

export function BpdFooter() {
    return (
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
    );
}
