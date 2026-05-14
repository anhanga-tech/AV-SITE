import React from 'react';

interface PassportStampProps {
    destination: string;
    date?: string;
    iataCode?: string;
    className?: string;
}

// Helper to generate a rough IATA code if one isn't provided
// (e.g., "São Paulo" -> "SAO", "Paris" -> "PAR")
const generatePseudoIata = (city: string): string => {
    const clean = city.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (clean.length < 3) return 'UNK';
    return clean.substring(0, 3);
};

export const PassportStamp: React.FC<PassportStampProps> = ({
    destination,
    date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ de /g, '/').toUpperCase(),
    iataCode,
    className = ''
}) => {
    const displayIata = iataCode || generatePseudoIata(destination);

    // Random rotation between -15 and 15 degrees for an organic look
    const rotation = React.useMemo(() => Math.floor(Math.random() * 30) - 15, []);

    return (
        <div
            className={`pointer-events-none select-none absolute z-20 opacity-60 flex items-center justify-center animate-[stamp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards] ${className}`}
            style={{ transform: `rotate(${rotation}deg)` }}
            aria-hidden="true"
        >
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes stamp {
          0% { transform: scale(2) rotate(${rotation - 10}deg); opacity: 0; }
          50% { transform: scale(0.9) rotate(${rotation}deg); opacity: 0.9; }
          100% { transform: scale(1) rotate(${rotation}deg); opacity: 0.60; }
        }
      `}} />

            <div className="relative size-24 md:w-28 md:h-28 shrink-0">
                {/* Outer distressed ring */}
                <div className="absolute inset-0 rounded-full border-[3px] border-brand-vibrant border-dashed opacity-80" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 90%, 80% 100%, 0% 100%)' }}></div>
                <div className="absolute inset-1 rounded-full border-[2px] border-brand-vibrant opacity-60"></div>

                {/* Inner solid ring */}
                <div className="absolute inset-3 rounded-full border-[1.5px] border-brand-vibrant opacity-90 border-dotted"></div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-vibrant font-black tracking-tighter uppercase p-2">

                    {/* Top Text Arc */}
                    <div className="text-[7px] md:text-[8px] absolute top-6 tracking-widest opacity-90 font-bold">
                        ANHANGÁ VIAGENS
                    </div>

                    {/* Center Focus (IATA) */}
                    <div className="text-2xl md:text-3xl font-bold opacity-85" style={{ letterSpacing: '-0.05em' }}>
                        {displayIata}
                    </div>

                    {/* Bottom Text (Date) */}
                    <div className="text-[7px] md:text-[8px] absolute bottom-6 font-mono tracking-tight opacity-75">
                        {date}
                    </div>

                    {/* Distressed overlay lines */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0tMSwxIGwyLC0yIE0wLDQgbDQsLTQgTTMsNSBsMiwtMiIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-10 mix-blend-overlay rounded-full" style={{ maskImage: 'radial-gradient(circle, transparent 30%, black 100%)' }}></div>
                </div>
            </div>
        </div>
    );
};
