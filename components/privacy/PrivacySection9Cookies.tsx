export function PrivacySection9Cookies() {
    return (
        <section id="cookies" className="space-y-2">
            <h2 className="text-xl md:text-2xl font-merriweather font-semibold">9. Cookies e Tecnologias de Rastreamento</h2>
            <div className="space-y-2 font-inter text-muted-foreground">
                <h3 className="font-merriweather font-semibold">9.1 Definição e Propósito</h3>
                <p>Utilizamos cookies e tecnologias similares para:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Facilitar a navegação no website</li>
                    <li>Personalizar a experiência do usuário</li>
                    <li>Coletar estatísticas de uso</li>
                    <li>Exibir publicidade direcionada</li>
                </ul>
                <h3 className="font-merriweather font-semibold">9.2 Categorias de Cookies e Bases Legais</h3>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Essenciais:</strong> Necessários para o funcionamento básico do website. Não dependem de consentimento</li>
                    <li><strong>Funcionais:</strong> Melhoram a funcionalidade e personalização</li>
                    <li><strong>Analíticos:</strong> Coletam eventos de uso do website com remoção de IP no servidor intermediário (ver Seção 4.2) e identificadores pseudonimizados. Quando não existe um cookie legado do Google, podemos criar o cookie próprio <code>anhanga_ga_cid</code>, com duração de até 2 (dois) anos; se o titular enviar um formulário, esse identificador pode ser registrado junto ao cadastro no CRM para atribuição e correlação operacional. Tratados com base no <strong>legítimo interesse</strong> da controladora (Art. 7º, IX, LGPD), com direito de oposição garantido (ver Seção 9.4)</li>
                    <li><strong>Atribuição de campanhas:</strong> O cookie próprio <code>tracking_data</code> armazena parâmetros de campanha por até 30 (trinta) dias para mensuração de conversões</li>
                    <li><strong>Publicitários e de marketing:</strong> Utilizados para publicidade direcionada, remarketing e automação de marketing. Carregados <strong>somente após o consentimento</strong> do titular, manifestado no aviso de cookies (Art. 7º, I, LGPD)</li>
                </ul>
                <h3 className="font-merriweather font-semibold">9.3 Gestão e Revogação do Consentimento</h3>
                <p>O titular pode alterar sua escolha a qualquer momento, de forma gratuita e facilitada:</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Pelo link <strong>"Gerenciar cookies"</strong>, disponível no rodapé de todas as páginas do website, que reabre o aviso de preferências. Ao recusar, os cookies de marketing deixam de ser carregados imediatamente</li>
                    <li>Pelas configurações do navegador, que permitem bloquear ou excluir cookies</li>
                </ul>
                <h3 className="font-merriweather font-semibold">9.4 Direito de Oposição ao Tratamento Analítico</h3>
                <p>Nos termos do Art. 18, § 2º, da LGPD, o titular pode opor-se ao tratamento de dados analíticos realizado com base em legítimo interesse. Para exercer esse direito, envie solicitação ao nosso Encarregado pelo e-mail{" "}
                    <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline">privacidade@anhanga.tur.br</a>, ou utilize as configurações de bloqueio de cookies do seu navegador, que impedem a coleta analítica neste website.</p>
            </div>
        </section>
    );
}
