import { Send, MessageCircle } from 'lucide-react';

export function SolutionPhoneMockup() {
  return (
    <div className="lg:w-1/2 relative flex justify-center mt-12 lg:mt-0">

      {/* Decorative Elements behind phone */}
      <div className="absolute top-10 right-0 size-32 bg-fun-yellow rounded-full border-2 border-fun-dark mix-blend-multiply opacity-80 animate-pulse"></div>
      <div className="absolute bottom-10 left-10 size-20 bg-fun-pink rounded-full border-2 border-fun-dark mix-blend-multiply opacity-80"></div>

      {/* The Phone */}
      <div className="bg-white p-3 rounded-[3rem] border-4 border-fun-dark shadow-hard-lg max-w-sm w-full relative z-10 transform rotate-2 transition-transform hover:rotate-0 duration-500">

        {/* Screen */}
        <div className="bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-gray-200 h-[500px] relative flex flex-col">

          {/* Header */}
          <div className="bg-fun-green p-4 pt-8 flex items-center gap-3 border-b-2 border-fun-dark">
            <div className="size-10 bg-white rounded-full flex items-center justify-center border-2 border-fun-dark">
              <span className="font-bold text-fun-green text-lg">A</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Anhangá Viagens</p>
              <p className="text-green-100 text-xs flex items-center gap-1">
                <span className="size-2 bg-green-300 rounded-full animate-pulse"></span> Online agora
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            {/* Msg 1 (User) */}
            <div className="flex justify-end animate-[slideUp_0.5s_ease-out_forwards]">
              <div className="bg-white border-2 border-gray-200 text-slate-700 p-3 px-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                <p className="text-sm">Oi! Quero levar as crianças pro Beto Carrero em Julho. 🎢</p>
                <span className="text-[10px] text-gray-400 block text-right mt-1">10:42</span>
              </div>
            </div>

            {/* Msg 2 (Agent) */}
            <div className="flex justify-start animate-[slideUp_0.6s_ease-out_0.5s_both]">
              <div className="bg-fun-green text-white border-2 border-fun-dark p-3 px-4 rounded-2xl rounded-tl-none shadow-hard max-w-[90%]">
                <p className="text-sm font-bold">Claro! Já montei tudo pra você:</p>
                <ul className="mt-2 text-xs space-y-1 opacity-90">
                  <li>✈️ Voo direto (manhã)</li>
                  <li>🏨 Hotel com café (5min do parque)</li>
                  <li>🎟️ Ingressos p/ 2 dias</li>
                </ul>
                <span className="text-[10px] text-green-200 block text-right mt-2">10:45</span>
              </div>
            </div>

            {/* Msg 3 (User) */}
            <div className="flex justify-end animate-[slideUp_0.6s_ease-out_1.5s_both]">
              <div className="bg-white border-2 border-gray-200 text-slate-700 p-3 px-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                <p className="text-sm">Perfeito! Vamos fechar. 😍</p>
              </div>
            </div>
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <div className="w-full h-10 bg-gray-100 rounded-full border border-gray-300"></div>
            <div className="size-10 bg-fun-blue rounded-full flex items-center justify-center text-white">
              <Send size={18} />
            </div>
          </div>

        </div>

        {/* Sticker: "Tudo no Zap" */}
        <div className="absolute -bottom-6 -right-6 bg-white p-3 rounded-xl border-2 border-fun-dark shadow-hard transform -rotate-6 z-20">
          <div className="flex items-center gap-2">
            <MessageCircle className="text-green-500 fill-current" />
            <span className="font-sans font-bold text-fun-dark text-sm">Tudo no Zap!</span>
          </div>
        </div>
      </div>

    </div>
  );
}
