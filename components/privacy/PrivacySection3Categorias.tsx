export function PrivacySection3Categorias() {
    return (
        <section id="categorias-dados" className="space-y-2">
            <h2 className="text-xl md:text-2xl font-merriweather font-semibold">3. Categorias de Dados Pessoais Coletados</h2>
            <div className="space-y-2 font-inter text-muted-foreground">
                <h3 className="font-merriweather font-semibold">3.1 Dados de Identificação e Contato</h3>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Nome completo</li>
                    <li>Endereço de correio eletrônico</li>
                    <li>Número de telefone</li>
                    <li>Dados fornecidos voluntariamente através de formulários de contato</li>
                </ul>
                <h3 className="font-merriweather font-semibold">3.2 Dados de Planejamento de Viagem (Assistente Virtual)</h3>
                <p>Informações fornecidas voluntariamente durante conversas com nosso assistente virtual de viagens (chatbot com inteligência artificial):</p>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Destino, datas e motivo da viagem</li>
                    <li>Número de viajantes e perfil do grupo</li>
                    <li>Faixa de orçamento estimada para a viagem</li>
                    <li>Conteúdo das mensagens trocadas com o assistente</li>
                </ul>
                <h3 className="font-merriweather font-semibold">3.3 Dados Técnicos e de Navegação</h3>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Endereço de Protocolo de Internet (IP)</li>
                    <li>Informações de geolocalização</li>
                    <li>Características do dispositivo utilizado</li>
                    <li>Tipo e versão do navegador</li>
                    <li>Sistema operacional</li>
                    <li>Páginas visitadas e tempo de permanência</li>
                    <li>Origem do tráfego e padrões de navegação</li>
                </ul>
                <h3 className="font-merriweather font-semibold">3.4 Dados de Marketing e Engajamento</h3>
                <ul className="list-disc pl-6 space-y-1">
                    <li>Interações com newsletters e comunicações promocionais</li>
                    <li>Histórico de cliques em anúncios e links</li>
                    <li>Preferências manifestadas</li>
                    <li>Dados coletados através de cookies e tecnologias similares</li>
                    <li>E-mail e telefone pseudonimizados por meio de hash unidirecional (SHA-256) para criação de públicos personalizados (customer match) no Google Ads e Meta Ads, exclusivamente para titulares que consentiram com comunicações de marketing</li>
                </ul>
                <h3 className="font-merriweather font-semibold">3.5 Dados de Crianças e Adolescentes</h3>
                <p>
                    Nossos serviços digitais não são direcionados a crianças. Informações sobre menores que integram o grupo de viajantes
                    (como idades para cotação) devem ser fornecidas exclusivamente pelos pais ou responsáveis legais, são tratadas no melhor
                    interesse da criança (Art. 14 da LGPD) e utilizadas apenas para a elaboração do orçamento e a prestação do serviço solicitado.
                    Pais ou responsáveis podem solicitar acesso, correção ou exclusão desses dados pelos canais indicados na Seção 14.
                </p>
            </div>
        </section>
    );
}
