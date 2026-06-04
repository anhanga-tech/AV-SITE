export function PrivacySection6Compartilhamento() {
    return (
        <section id="compartilhamento" className="space-y-2">
            <h2 className="text-xl md:text-2xl font-merriweather font-semibold">6. Compartilhamento de Dados Pessoais</h2>
            <div className="space-y-2 font-inter text-muted-foreground">
                <h3 className="font-merriweather font-semibold">6.1 Parceiros e Prestadores de Serviços</h3>
                <p>A Anhangá Turismo pode compartilhar dados pessoais com terceiros autorizados, incluindo:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Google LLC</strong> (analytics, publicidade e customer match — Google Ads e GA4)</li>
                    <li><strong>Meta Platforms, Inc.</strong> (publicidade, remarketing e customer match — Facebook/Instagram Ads)</li>
                    <li><strong>Stape OÜ</strong> (gerenciamento de tags server-side — empresa sediada na Estônia com servidor intermediário hospedado no Brasil, responsável pela anonimização de IP e dados de navegação antes do envio ao Google e Meta)</li>
                    <li><strong>Salesforce, Inc.</strong> (CRM de vendas — registro e gestão de leads comerciais)</li>
                    <li><strong>Substack, Inc.</strong> (plataforma de newsletter)</li>
                    <li><strong>ONER Travel</strong> (serviços especializados em turismo)</li>
                    <li><strong>Outros prestadores de serviços</strong> devidamente contratados</li>
                </ul>

                <h3 className="font-merriweather font-semibold">6.2 Garantias Contratuais</h3>
                <p>Todos os compartilhamentos são regidos por contratos específicos que asseguram:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Conformidade com a LGPD e GDPR</li>
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
