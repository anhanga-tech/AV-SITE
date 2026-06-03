import { Check } from '@phosphor-icons/react';

interface CorpLgpdConsentProps {
    checked: boolean;
    onChange: (value: boolean) => void;
    error: boolean;
}

export function CorpLgpdConsent({ checked, onChange, error }: CorpLgpdConsentProps) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor="lgpd-corp" className="flex items-start gap-3 cursor-pointer group">
                <span className="relative flex items-center mt-0.5">
                    <input
                        id="lgpd-corp"
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className="peer size-4 cursor-pointer appearance-none rounded border-2 border-zinc-300 bg-white checked:bg-brand-cyan checked:border-brand-cyan transition focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
                    />
                    <Check className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" weight="bold" />
                </span>
                <span className="text-xs text-zinc-500 leading-tight">
                    Aceito receber comunicações e autorizo o tratamento dos meus dados conforme a{' '}
                    <a
                        href="https://www.anhanga.tur.br/politica-privacidade/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-brand-cyan"
                    >
                        Política de Privacidade
                    </a>
                    .
                </span>
            </label>
            {error && (
                <span className="text-[10px] text-red-500 font-bold ml-7 uppercase">
                    Aceite obrigatório
                </span>
            )}
        </div>
    );
}
