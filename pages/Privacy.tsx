import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
    const metaDescription = "Política de Privacidade e Proteção de Dados da Anhangá Turismo: coleta, tratamento, armazenamento e direitos dos titulares.";
    const canonicalUrl = "https://www.anhanga.tur.br/politica-privacidade/";
    const lastUpdatedDisplay = "27 de fevereiro de 2026";
    const lastUpdatedIso = "2026-02-27";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title="Política de Privacidade | Anhangá Viagens"
                description={metaDescription}
                canonical={canonicalUrl}
            />
            <Header />
            <main className="container mx-auto px-4 py-10">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-merriweather font-bold">Política de Privacidade e Proteção de Dados Pessoais</h1>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground font-inter">
                        Data de Vigência: {lastUpdatedDisplay} | Última Atualização: {lastUpdatedDisplay}
                    </p>
                </header>

                <article className="max-w-3xl mx-auto space-y-6">
                    <section id="disposicoes-gerais" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">1. Disposições Gerais</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">1.1 Escopo e Aplicação</h3>
                            <p>
                                A presente Política de Privacidade e Proteção de Dados Pessoais ("Política") estabelece as diretrizes e procedimentos adotados pela
                                <strong> Anhangá Turismo Ltda.</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 37.036.732/0001-41,
                                com sede em Avenida Dom Pedro I, 773, Vila Monumento, São Paulo-SP ("Controladora" ou "Anhangá Turismo"),
                                no tratamento de dados pessoais de titulares que interagem com nossos serviços digitais e plataformas.
                            </p>
                            <h3 className="font-merriweather font-semibold">1.2 Fundamentação Legal</h3>
                            <p>Esta Política está em conformidade com:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</li>
                                <li>Regulamento Geral sobre a Proteção de Dados da União Europeia (GDPR)</li>
                                <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
                                <li>Código de Defesa do Consumidor (Lei nº 8.078/1990)</li>
                            </ul>
                        </div>
                    </section>

                    <section id="definicoes" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">2. Definições e Terminologia</h2>
                        <div className="font-inter text-muted-foreground space-y-1">
                            <p><strong>a) Titular:</strong> Pessoa natural a quem se referem os dados pessoais objeto de tratamento;</p>
                            <p><strong>b) Dados Pessoais:</strong> Informação relacionada à pessoa natural identificada ou identificável;</p>
                            <p><strong>c) Tratamento:</strong> Toda operação realizada com dados pessoais, incluindo coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração;</p>
                            <p><strong>d) Controlador:</strong> Pessoa natural ou jurídica, de direito público ou privado, a quem competem as decisões referentes ao tratamento de dados pessoais;</p>
                            <p><strong>e) Operador:</strong> Pessoa natural ou jurídica, de direito público ou privado, que realiza o tratamento de dados pessoais em nome do controlador;</p>
                            <p><strong>f) Encarregado (DPO):</strong> Pessoa indicada pelo controlador e operador para atuar como canal de comunicação entre o controlador, os titulares dos dados e a Autoridade Nacional de Proteção de Dados (ANPD).</p>
                        </div>
                    </section>

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
                            <h3 className="font-merriweather font-semibold">3.2 Dados Técnicos e de Navegação</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Endereço de Protocolo de Internet (IP)</li>
                                <li>Informações de geolocalização</li>
                                <li>Características do dispositivo utilizado</li>
                                <li>Tipo e versão do navegador</li>
                                <li>Sistema operacional</li>
                                <li>Páginas visitadas e tempo de permanência</li>
                                <li>Origem do tráfego e padrões de navegação</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">3.3 Dados de Marketing e Engajamento</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Interações com newsletters e comunicações promocionais</li>
                                <li>Histórico de cliques em anúncios e links</li>
                                <li>Preferências manifestadas</li>
                                <li>Dados coletados através de cookies e tecnologias similares</li>
                            </ul>
                        </div>
                    </section>

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

                    <section id="finalidades-bases" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">5. Finalidades e Bases Legais do Tratamento</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">5.1 Atendimento e Relacionamento com Clientes</h3>
                            <p><strong>Finalidade:</strong> Responder solicitações, prestar suporte e manter comunicação comercial<br />
                                <strong>Base Legal:</strong> Consentimento do titular ou legítimo interesse</p>

                            <h3 className="font-merriweather font-semibold">5.2 Marketing e Comunicação Promocional</h3>
                            <p><strong>Finalidade:</strong> Envio de newsletters, promoções e conteúdo relevante<br />
                                <strong>Base Legal:</strong> Consentimento específico e livre do titular</p>

                            <h3 className="font-merriweather font-semibold">5.3 Análise e Otimização da Experiência Digital</h3>
                            <p><strong>Finalidade:</strong> Melhoria contínua de nossos serviços e plataformas digitais<br />
                                <strong>Base Legal:</strong> Legítimo interesse da controladora</p>

                            <h3 className="font-merriweather font-semibold">5.4 Publicidade Direcionada e Remarketing</h3>
                            <p><strong>Finalidade:</strong> Exibição de anúncios personalizados e campanhas de retargeting<br />
                                <strong>Base Legal:</strong> Consentimento do titular</p>

                            <h3 className="font-merriweather font-semibold">5.5 Cumprimento de Obrigações Legais</h3>
                            <p><strong>Finalidade:</strong> Atendimento a determinações legais, regulamentares ou de autoridades competentes<br />
                                <strong>Base Legal:</strong> Cumprimento de obrigação legal ou regulatória</p>
                        </div>
                    </section>

                    <section id="compartilhamento" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">6. Compartilhamento de Dados Pessoais</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">6.1 Parceiros e Prestadores de Serviços</h3>
                            <p>A Anhangá Turismo pode compartilhar dados pessoais com terceiros autorizados, incluindo:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Google LLC</strong> (serviços de analytics e publicidade)</li>
                                <li><strong>Meta Platforms, Inc.</strong> (Facebook - serviços de marketing digital)</li>
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

                    <section id="armazenamento" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">7. Armazenamento e Retenção de Dados</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">7.1 Períodos de Retenção</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Dados de contato e relacionamento:</strong> 5 (cinco) anos após a última interação</li>
                                <li><strong>Dados de navegação:</strong> até 26 (vinte e seis) meses conforme políticas de privacidade</li>
                                <li><strong>Cookies:</strong> conforme configurações do navegador e políticas específicas de cada tecnologia</li>
                            </ul>

                            <h3 className="font-merriweather font-semibold">7.2 Critérios para Retenção</h3>
                            <p>Os períodos de retenção baseiam-se em:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Necessidade para cumprimento das finalidades declaradas</li>
                                <li>Exigências legais e regulatórias aplicáveis</li>
                                <li>Legítimos interesses da controladora</li>
                                <li>Exercício regular de direitos em processos judiciais ou administrativos</li>
                            </ul>
                        </div>
                    </section>

                    <section id="direitos-titulares" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">8. Direitos dos Titulares</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">8.1 Direitos Assegurados</h3>
                            <p>Conforme previsto na LGPD, os titulares possuem os seguintes direitos:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Confirmação e Acesso:</strong> Confirmação da existência de tratamento e acesso aos dados pessoais;</li>
                                <li><strong>Correção:</strong> Correção de dados incompletos, inexatos ou desatualizados;</li>
                                <li><strong>Anonimização ou Eliminação:</strong> Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
                                <li><strong>Portabilidade:</strong> Portabilidade dos dados a outro fornecedor, mediante requisição expressa;</li>
                                <li><strong>Eliminação:</strong> Eliminação dos dados tratados com base no consentimento;</li>
                                <li><strong>Informação:</strong> Informação sobre entidades com as quais os dados foram compartilhados;</li>
                                <li><strong>Revogação do Consentimento:</strong> Revogação do consentimento a qualquer momento;</li>
                                <li><strong>Revisão:</strong> Revisão de decisões automatizadas.</li>
                            </ul>

                            <h3 className="font-merriweather font-semibold">8.2 Exercício dos Direitos</h3>
                            <p>Para exercer qualquer dos direitos mencionados, o titular deve enviar solicitação através do e-mail:
                                <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline"> privacidade@anhanga.tur.br</a></p>
                            <p><strong>Prazo de Resposta:</strong> 15 (quinze) dias corridos, prorrogáveis por igual período mediante justificativa expressa.</p>
                        </div>
                    </section>

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

                            <h3 className="font-merriweather font-semibold">9.2 Categorias de Cookies</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><strong>Essenciais:</strong> Necessários para o funcionamento básico do website</li>
                                <li><strong>Funcionais:</strong> Melhoram a funcionalidade e personalização</li>
                                <li><strong>Analíticos:</strong> Coletam informações sobre o uso do website</li>
                                <li><strong>Publicitários:</strong> Utilizados para publicidade direcionada</li>
                            </ul>

                            <h3 className="font-merriweather font-semibold">9.3 Gestão de Cookies</h3>
                            <p>O usuário pode gerenciar suas preferências de cookies através das configurações do navegador, podendo desativar ou restringir seu uso.</p>
                        </div>
                    </section>

                    <section id="transferencia-internacional" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">10. Transferência Internacional de Dados</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">10.1 Âmbito das Transferências</h3>
                            <p>Dados pessoais podem ser transferidos para países estrangeiros no contexto de:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Utilização de serviços de nuvem</li>
                                <li>Ferramentas de analytics e marketing digital</li>
                                <li>Plataformas de comunicação e relacionamento</li>
                            </ul>

                            <h3 className="font-merriweather font-semibold">10.2 Garantias Implementadas</h3>
                            <p>Todas as transferências internacionais são realizadas com:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Cláusulas contratuais padrão aprovadas pela ANPD</li>
                                <li>Certificações de adequação dos destinatários</li>
                                <li>Garantias de nível adequado de proteção</li>
                            </ul>
                        </div>
                    </section>

                    <section id="seguranca" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">11. Segurança da Informação</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">11.1 Medidas Implementadas</h3>
                            <p>A Anhangá Turismo adota medidas técnicas, administrativas e físicas apropriadas para:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Proteger dados pessoais contra acessos não autorizados</li>
                                <li>Prevenir situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão</li>
                                <li>Garantir a confidencialidade, integridade e disponibilidade dos dados</li>
                            </ul>

                            <h3 className="font-merriweather font-semibold">11.2 Incidentes de Segurança</h3>
                            <p>Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a controladora:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Comunicará a ANPD no prazo de 72 (setenta e duas) horas</li>
                                <li>Informará os titulares afetados quando aplicável</li>
                                <li>Implementará medidas corretivas imediatas</li>
                            </ul>
                        </div>
                    </section>

                    <section id="encarregado" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">12. Encarregado de Proteção de Dados (DPO)</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">12.1 Identificação</h3>
                            <p><strong>Nome:</strong> Felipe William Rodrigues Silva<br />
                                <strong>E-mail:</strong> <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline">privacidade@anhanga.tur.br</a><br />
                                <strong>Função:</strong> Encarregado de Proteção de Dados (Data Protection Officer)</p>

                            <h3 className="font-merriweather font-semibold">12.2 Atribuições</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Canal de comunicação entre titulares, controladora e ANPD</li>
                                <li>Orientação sobre cumprimento da legislação de proteção de dados</li>
                                <li>Execução de treinamentos e conscientização</li>
                                <li>Auditoria e monitoramento do cumprimento desta Política</li>
                            </ul>
                        </div>
                    </section>

                    <section id="alteracoes" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">13. Alterações e Atualizações</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">13.1 Direito de Modificação</h3>
                            <p>Esta Política pode ser alterada a qualquer tempo, considerando:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Mudanças na legislação aplicável</li>
                                <li>Evolução de tecnologias e práticas de mercado</li>
                                <li>Alterações nos serviços oferecidos</li>
                            </ul>

                            <h3 className="font-merriweather font-semibold">13.2 Comunicação de Alterações</h3>
                            <p>Alterações substanciais serão comunicadas através de:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Publicação em nosso website oficial</li>
                                <li>Notificação por e-mail quando aplicável</li>
                                <li>Outros canais de comunicação adequados</li>
                            </ul>
                        </div>
                    </section>

                    <section id="canais-contato" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">14. Canais de Contato</h2>
                        <div className="font-inter text-muted-foreground">
                            <p>Para questões relacionadas a esta Política de Privacidade ou ao tratamento de dados pessoais:</p>
                            <p className="mt-2">
                                <strong>E-mail:</strong> <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline">privacidade@anhanga.tur.br</a><br />
                                <strong>WhatsApp:</strong> <a href="https://wa.me/551152833309" className="text-primary underline" target="_blank" rel="noopener noreferrer">+55 (11) 5283-3309</a><br />
                                <strong>Instagram:</strong> <a href="https://instagram.com/anhangaviagens" className="text-primary underline" target="_blank" rel="noopener noreferrer">@anhangatur</a><br />
                                <strong>Facebook Messenger:</strong> Anhangá Viagens<br />
                                <strong>Website:</strong> <a href="https://anhanga.tur.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://anhanga.tur.br</a>
                            </p>
                        </div>
                    </section>

                    <section id="disposicoes-finais" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">15. Disposições Finais</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">15.1 Prevalência</h3>
                            <p>Em caso de conflito entre esta Política e termos específicos de serviços oferecidos, prevalecerão os termos mais restritivos quanto à proteção de dados pessoais.</p>

                            <h3 className="font-merriweather font-semibold">15.2 Legislação Aplicável</h3>
                            <p>Esta Política é regida pela legislação brasileira, especialmente pela LGPD, sendo competente o Foro da Comarca de São Paulo, Estado de São Paulo, para dirimir eventuais controvérsias.</p>
                        </div>
                    </section>
                </article>
            </main>

            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        name: "Política de Privacidade - Anhangá Turismo",
                        url: canonicalUrl,
                        description: metaDescription,
                        dateModified: lastUpdatedIso,
                        inLanguage: "pt-BR",
                    }),
                }}
            />

            <Footer />
        </div>
    );
};

export default Privacy;
