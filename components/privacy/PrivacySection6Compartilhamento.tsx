export function PrivacySection6Compartilhamento() {
    return (
        <section id="compartilhamento" className="space-y-2">
            <h2 className="text-xl md:text-2xl font-merriweather font-semibold">6. Compartilhamento de Dados Pessoais</h2>
            <div className="space-y-2 font-inter text-muted-foreground">
                <h3 className="font-merriweather font-semibold">6.1 Parceiros e Prestadores de Serviços</h3>
                <p>A Anhangá Turismo pode compartilhar dados pessoais com terceiros autorizados, incluindo:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Google LLC</strong> (analytics, publicidade e customer match — Google Ads e GA4; processamento das conversas do assistente virtual de viagens — Google Gemini)</li>
                    <li><strong>Meta Platforms, Inc.</strong> (publicidade, remarketing e customer match — Facebook/Instagram Ads)</li>
                    <li><strong>TikTok Pte. Ltd.</strong> (publicidade e remarketing — TikTok Ads)</li>
                    <li><strong>Cloudflare, Inc.</strong> (hospedagem do site e gerenciamento de tags server-side via Cloudflare Zaraz — responsável pela supressão de IP antes do envio ao Google Analytics e pelo envio server-side das conversões ao Meta e ao TikTok, sem carregar pixel de rastreamento no navegador do titular)</li>
                    <li><strong>Odoo S.A.</strong> (CRM de vendas — registro e gestão de leads comerciais)</li>
                    <li><strong>ONER Travel</strong> (serviços especializados em turismo)</li>
                    <li><strong>Outros prestadores de serviços</strong> devidamente contratados</li>
                </ul>

                <h3 className="font-merriweather font-semibold">6.2 Garantias Contratuais</h3>
                <p>Todos os compartilhamentos são regidos por contratos específicos que asseguram:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Conformidade com a LGPD e demais normas aplicáveis de proteção de dados</li>
                    <li>Implementação de medidas de segurança adequadas</li>
                    <li>Limitação do uso dos dados às finalidades autorizadas</li>
                    <li>Responsabilização pelos danos causados</li>
                </ul>

                <h3 className="font-merriweather font-semibold">6.3 Hipóteses Legais de Compartilhamento</h3>
                <p>Dados pessoais poderão ser compartilhados em cumprimento a:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Ordens judiciais ou administrativas</li>
                    <li>Requisições de autoridades competentes</li>
                    <li>Defesa de direitos da controladora em processos judiciais ou administrativos</li>
                </ul>
            </div>
        </section>
    );
}
