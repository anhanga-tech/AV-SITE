export function PrivacySection4MetodosColeta() {
    return (
        <section id="metodos-coleta" className="space-y-2">
            <h2 className="text-xl md:text-2xl font-merriweather font-semibold">4. Métodos de Coleta de Dados</h2>
            <div className="space-y-2 font-inter text-muted-foreground">
                <h3 className="font-merriweather font-semibold">4.1 Coleta Direta</h3>
                <p>Dados fornecidos voluntariamente pelo titular através de:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Preenchimento de formulários eletrônicos em nosso website</li>
                    <li>Conversas com nosso assistente virtual de viagens (chatbot com inteligência artificial)</li>
                    <li>Interações diretas via canais de comunicação oficiais</li>
                    <li>Solicitações de informações ou serviços</li>
                </ul>
                <h3 className="font-merriweather font-semibold">4.2 Coleta Automática</h3>
                <p>Dados coletados automaticamente através de:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Cookies e tecnologias de rastreamento</strong>, incluindo:
                        <ul className="list-disc pl-6 mt-1">
                            <li>Google Analytics para análise de tráfego</li>
                            <li>Google Ads para publicidade direcionada</li>
                        </ul>
                    </li>
                    <li><strong>Rastreamento server-side via Cloudflare Zaraz:</strong> eventos de navegação e conversão são processados por um servidor intermediário (Cloudflare, já responsável pela hospedagem do site), onde o endereço IP é suprimido antes do envio ao Google Analytics. Publicidade direcionada e remarketing no Meta (Facebook/Instagram) e no TikTok são medidos **exclusivamente nesse servidor intermediário** — nenhum pixel de rastreamento do Meta ou do TikTok é carregado no navegador do titular, e essas medições só ocorrem após consentimento de marketing.</li>
                    <li><strong>Ferramentas de terceiros integradas:</strong>
                        <ul className="list-disc pl-6 mt-1">
                            <li>Instagram para engajamento em redes sociais</li>
                            <li>WhatsApp Business para atendimento</li>
                            <li>Facebook Messenger para comunicação</li>
                            <li>ONER Travel para serviços especializados</li>
                        </ul>
                    </li>
                </ul>
            </div>
        </section>
    );
}
