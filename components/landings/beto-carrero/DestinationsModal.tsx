import { useEffect, useRef } from 'react';
import { Sun, Fish, Building2, X } from 'lucide-react';
import Button from './Button';

interface DestinationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DestinationsModal({ isOpen, onClose }: DestinationsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[100] m-auto p-4 bg-transparent backdrop:bg-fun-dark/80 backdrop:backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] max-w-lg w-full"
      aria-label="Destinos Extras"
    >
      {/* Modal Content */}
      <div className="relative bg-white w-full rounded-3xl border-4 border-fun-dark shadow-hard-lg p-6 md:p-8 animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 bg-fun-pink text-white p-2 rounded-full border-2 border-fun-dark shadow-hard hover:scale-110 hover:rotate-90 transition z-10"
          aria-label="Fechar janela"
        >
          <X size={20} strokeWidth={3} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="font-sans font-bold text-3xl md:text-4xl text-fun-dark mb-2">Destinos Extras</h3>
          <p className="text-slate-600 font-bold">Escolha um (ou todos) e peça no Zap!</p>
        </div>

        {/* Destinations List */}
        <div className="space-y-5 mb-4">

          {/* Item 1: Floripa */}
          <div className="group bg-white p-5 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition duration-300 flex items-center gap-5 cursor-default relative overflow-hidden">
            <div className="absolute right-0 top-0 size-16 bg-fun-yellow/20 rounded-bl-full z-0"></div>

            <div className="size-16 bg-fun-yellow border-2 border-fun-dark rounded-full flex items-center justify-center shadow-sm shrink-0 z-10 group-hover:rotate-12 transition-transform duration-300">
              <Sun size={32} className="text-fun-dark" strokeWidth={2.5} />
            </div>
            <div className="z-10">
              <h4 className="font-sans font-bold text-2xl text-fun-dark mb-1">Florianópolis</h4>
              <p className="text-sm font-bold text-slate-500 leading-tight">42 praias, dunas de areia e gastronomia.</p>
            </div>
          </div>

          {/* Item 2: Bombinhas */}
          <div className="group bg-white p-5 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition duration-300 flex items-center gap-5 cursor-default relative overflow-hidden">
            <div className="absolute right-0 top-0 size-16 bg-fun-green/20 rounded-bl-full z-0"></div>

            <div className="size-16 bg-fun-green border-2 border-fun-dark rounded-full flex items-center justify-center shadow-sm shrink-0 z-10 group-hover:-rotate-12 transition-transform duration-300">
              <Fish size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="z-10">
              <h4 className="font-sans font-bold text-2xl text-fun-dark mb-1">Bombinhas</h4>
              <p className="text-sm font-bold text-slate-500 leading-tight">Mergulho ecológico e águas cristalinas.</p>
            </div>
          </div>

          {/* Item 3: Balneário */}
          <div className="group bg-white p-5 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition duration-300 flex items-center gap-5 cursor-default relative overflow-hidden">
            <div className="absolute right-0 top-0 size-16 bg-fun-blue/20 rounded-bl-full z-0"></div>

            <div className="size-16 bg-fun-blue border-2 border-fun-dark rounded-full flex items-center justify-center shadow-sm shrink-0 z-10 group-hover:rotate-6 transition-transform duration-300">
              <Building2 size={32} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="z-10">
              <h4 className="font-sans font-bold text-2xl text-fun-dark mb-1">Balneário Camboriú</h4>
              <p className="text-sm font-bold text-slate-500 leading-tight">Roda gigante, aquário e vida noturna.</p>
            </div>
          </div>

        </div>

        {/* Footer CTA */}
        <div className="text-center mt-8 pt-6 border-t-2 border-dashed border-gray-300">
          <Button
            text="Montar Roteiro no Zap"
            variant="secondary"
            fullWidth={true}
            onClick={onClose}
            tooltip="Ajustamos tudo para você"
            dataTracking="modal-betocarrero"
          />
        </div>

      </div>
    </dialog>
  );
}
