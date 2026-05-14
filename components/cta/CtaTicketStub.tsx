import { AirplaneTilt, DeviceMobile } from '@phosphor-icons/react';

export function CtaTicketStub() {
  return (
    <div className="w-full md:w-[30%] bg-gray-50 p-6 flex flex-col relative">

      {/* Stub Header */}
      <div className="flex justify-between items-center mb-5 opacity-60">
        <span className="text-[10px] font-bold tracking-widest uppercase">Anhangá Air</span>
        <AirplaneTilt className="w-3 h-3" weight="fill" />
      </div>

      {/* Passenger Name */}
      <div className="mb-4">
        <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Passenger Name</span>
        <span className="block text-lg font-black text-brand-dark truncate">VOCÊ / VIP</span>
      </div>

      {/* Flight Details Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 border-b-2 border-dashed border-gray-200 pb-4">
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Flight</span>
          <span className="block text-sm font-bold font-mono text-gray-800">ANH 777</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Date</span>
          <span className="block text-sm font-bold font-mono text-gray-800">HOJE</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">From</span>
          <span className="block text-base font-black text-gray-800">GRU</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">To</span>
          <span className="block text-base font-black text-brand-vibrant">MUNDO</span>
        </div>
      </div>

      {/* Critical Boarding Info */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-2 flex justify-between items-center shadow-sm mb-4">
        <div className="text-center flex-1">
          <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Gate</span>
          <span className="block text-xl font-black text-brand-dark">01</span>
        </div>
        <div className="w-[1px] h-8 bg-gray-100"></div>
        <div className="text-center flex-1">
          <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Seat</span>
          <span className="block text-xl font-black text-brand-dark">1A</span>
        </div>
        <div className="w-[1px] h-8 bg-gray-100"></div>
        <div className="text-center flex-1">
          <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Zone</span>
          <span className="block text-xl font-black text-brand-dark">1</span>
        </div>
      </div>

      {/* Footer Info & Barcode */}
      <div className="mt-auto">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Boarding</span>
            <span className="block text-sm font-black text-red-500">AGORA</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">SEQ</span>
            <span className="block text-sm font-mono font-bold text-gray-600">001</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-center items-stretch h-12 w-full overflow-hidden select-none bg-transparent gap-[1px]">
            {[4, 2, 1, 1, 3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 3, 1, 1, 2, 1, 4, 1, 2].map((w, i) => (
              <div key={`bar-start-${i}`} className="bg-gray-950" style={{ width: `${w * 2}px`, flexShrink: 0 }} />
            ))}
            <div className="flex-1"></div>
            {[2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2].map((w, i) => (
              <div key={`bar-end-${i}`} className="bg-gray-950" style={{ width: `${w * 2}px`, flexShrink: 0 }} />
            ))}
          </div>

          <div className="flex justify-between items-center mt-1">
            <span className="font-mono text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase">
              ETKT 29384910239
            </span>
            <DeviceMobile className="w-3 h-3 text-gray-300" weight="fill" />
          </div>
        </div>
      </div>

      {/* Decorative Stamp Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-30deg] pointer-events-none">
        <AirplaneTilt className="w-32 h-32 text-brand-dark" weight="fill" />
      </div>
    </div>
  );
}
