export function PrivacySection4MetodosColeta() {
    return (
        <section id="metodos-coleta" className="space-y-2">
            <h2 className="text-xl md:text-2xl font-merriweather font-semibold">4. Métodos de Coleta de Dados</h2>
            <div className="space-y-2 font-inter text-muted-foreground">
                <h3 className="font-merriweather font-semibold">4.1 Coleta Direta</h3>
                <p>Dados fornecidos voluntariamente pelo titular através de:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Preenchimento de formulários eletrônicos em nosso website</li>
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
                            <li>Meta Pixel (Facebook) para remarketing</li>
                        </ul>
                    </li>
                    <li><strong>Rastreamento server-side via Stape:</strong> eventos de navegação e conversão são transmitidos do browser para um servidor intermediário (provido pela Stape OÜ, empresa sediada na Estônia, com servidores hospedados no Brasil), onde o endereço IP é removido e dados pessoais são anonimizados antes de serem encaminhados ao Google e Meta. Essa camada reduz a exposição de dados pessoais em comparação ao rastreamento client-side convencional.</li>
                    <li><strong>Ferramentas de terceiros integradas:</strong>
                        <ul className="list-disc pl-6 mt-1">
                            <li>Substack para gestão de newsletters</li>
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
