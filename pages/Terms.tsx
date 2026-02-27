import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BreadcrumbSchema } from "@/components/schemas/BreadcrumbSchema";

const Terms = () => {
    const metaDescription = "Termos e Condições de Uso da Anhangá Turismo: intermediação, simulações, responsabilidade e privacidade.";
    const canonicalUrl = "https://www.anhanga.tur.br/termos-de-uso";
    const lastUpdatedDisplay = "26 de fevereiro de 2026";
    const lastUpdatedIso = "2026-02-26";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title="Termos e Condições de Uso | Anhangá Viagens"
                description={metaDescription}
                canonical={canonicalUrl}
            />
            <BreadcrumbSchema items={[
                { name: "Home", item: "https://www.anhanga.tur.br/" },
                { name: "Termos de Uso", item: canonicalUrl }
            ]} />
            <Header />
            <main className="container mx-auto px-4 py-10">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-merriweather font-bold">Termos e Condições de Uso</h1>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground font-inter">
                        Última atualização: {lastUpdatedDisplay}
                    </p>
                </header>

                <article className="max-w-3xl mx-auto space-y-6">
                    <section id="disposicoes-preliminares" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">1. Disposições Preliminares</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">1.1 Identificação da Controladora</h3>
                            <p>
                                Os presentes Termos e Condições de Uso ("Termos") são estabelecidos pela <strong>Anhangá Turismo Ltda.</strong>,
                                pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>37.036.732/0001-41</strong>, com sede em
                                <em> Avenida Dom Pedro I, 773, Vila Monumento, São Paulo-SP</em> ("Anhangá Turismo", "Controladora" ou "nós"), que opera o website
                                <a href="https://anhanga.tur.br" target="_blank" rel="noopener noreferrer" className="text-primary underline"> https://anhanga.tur.br</a>
                                e demais plataformas digitais correlatas.
                            </p>
                            <h3 className="font-merriweather font-semibold">1.2 Aceitação e Concordância</h3>
                            <p>
                                Ao acessar, navegar ou utilizar qualquer funcionalidade de nossos serviços digitais, o usuário ("Usuário" ou "você")
                                declara expressamente ter lido, compreendido e aceito integralmente estes Termos, bem como nossa Política de
                                Privacidade e Proteção de Dados Pessoais.
                            </p>
                            <h3 className="font-merriweather font-semibold">1.3 Capacidade Jurídica</h3>
                            <p>
                                O acesso e uso de nossos serviços são destinados exclusivamente a pessoas plenamente capazes. Menores de idade devem
                                obter autorização expressa de seus responsáveis legais antes da utilização.
                            </p>
                        </div>
                    </section>

                    <section id="definicoes" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">2. Definições e Terminologia</h2>
                        <div className="font-inter text-muted-foreground space-y-1">
                            <p><strong>a) Plataforma:</strong> Conjunto de websites, aplicativos e interfaces digitais operados pela Anhangá Turismo;</p>
                            <p><strong>b) Serviços:</strong> Atividades de intermediação, informação, divulgação e facilitação de acesso a produtos turísticos;</p>
                            <p><strong>c) Usuário:</strong> Pessoa física que acessa ou utiliza a Plataforma;</p>
                            <p><strong>d) Fornecedores:</strong> Empresas parceiras que oferecem produtos e serviços turísticos;</p>
                            <p><strong>e) ONER Travel:</strong> Plataforma tecnológica integrada para simulações e reservas;</p>
                            <p><strong>f) Conteúdo:</strong> Informações, dados, textos, imagens, vídeos e demais materiais disponibilizados na Plataforma.</p>
                        </div>
                    </section>

                    <section id="natureza-servicos" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">3. Natureza dos Serviços Prestados</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">3.1 Escopo da Intermediação</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Consulta e comparação de produtos turísticos;</li>
                                <li>Acesso a informações sobre destinos e serviços;</li>
                                <li>Simulações de preços e disponibilidade;</li>
                                <li>Redirecionamento para plataformas de reserva especializadas.</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">3.2 Natureza Não-Vinculante</h3>
                            <p>As informações apresentadas em nossa Plataforma têm caráter meramente informativo e promocional, não constituindo proposta comercial vinculante ou garantia de disponibilidade.</p>
                            <h3 className="font-merriweather font-semibold">3.3 Integração Tecnológica</h3>
                            <p>Nossos serviços integram-se com a plataforma <strong>ONER Travel</strong> e outras soluções tecnológicas para proporcionar melhor experiência ao Usuário, mantendo a natureza intermediadora de nossas atividades.</p>
                        </div>
                    </section>

                    <section id="limitacao-responsabilidade" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">4. Limitação de Responsabilidade</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">4.1 Responsabilidade dos Fornecedores</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Qualidade, disponibilidade ou adequação dos produtos e serviços oferecidos por Fornecedores;</li>
                                <li>Preços, prazos, condições comerciais ou políticas de cancelamento estabelecidas por terceiros;</li>
                                <li>Execução deficiente ou não execução de serviços contratados junto a Fornecedores;</li>
                                <li>Alterações unilaterais de preços, disponibilidade ou condições por parte dos Fornecedores.</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">4.2 Exclusão de Garantias</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Continuidade ou disponibilidade ininterrupta da Plataforma;</li>
                                <li>Ausência de erros, vírus ou componentes prejudiciais;</li>
                                <li>Precisão absoluta das informações apresentadas;</li>
                                <li>Adequação dos serviços às necessidades específicas do Usuário.</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">4.3 Limitação de Danos</h3>
                            <p>Em hipótese alguma seremos responsáveis por danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso de nossa Plataforma.</p>
                        </div>
                    </section>

                    <section id="simulacoes-reservas" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">5. Simulações, Cotações e Reservas</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">5.1 Natureza das Simulações</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Indicativas e não vinculantes;</li>
                                <li>Baseadas em informações fornecidas por terceiros;</li>
                                <li>Sujeitas a alterações sem aviso prévio;</li>
                                <li>Válidas apenas no momento da consulta;</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">5.2 Processo de Reserva</h3>
                            <p>As reservas são processadas via plataformas especializadas (como ONER Travel), sistemas próprios dos Fornecedores ou canais oficiais de comercialização de terceiros.</p>
                            <h3 className="font-merriweather font-semibold">5.3 Confirmação e Contratação</h3>
                            <p>A confirmação efetiva e contratação de serviços ocorre exclusivamente entre o Usuário e o Fornecedor final, não participando a Anhangá Turismo da relação contratual estabelecida.</p>
                        </div>
                    </section>

                    <section id="protecao-dados" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">6. Proteção de Dados Pessoais</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">6.1 Remissão à Política Específica</h3>
                            <p>
                                O tratamento de dados pessoais é regulamentado por nossa <strong>Política de Privacidade e Proteção de Dados Pessoais</strong>,
                                disponível em: <a href="https://anhanga.tur.br/politica-privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://anhanga.tur.br/politica-privacidade</a>.
                            </p>
                            <h3 className="font-merriweather font-semibold">6.2 Bases Legais do Tratamento</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Consentimento livre, específico e informado;</li>
                                <li>Legítimo interesse para melhoria dos serviços;</li>
                                <li>Cumprimento de obrigações legais e regulatórias.</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">6.3 Direitos dos Titulares</h3>
                            <p>Os Usuários possuem todos os direitos assegurados pela LGPD, podendo exercê-los através do canal: <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline">privacidade@anhanga.tur.br</a>.</p>
                        </div>
                    </section>

                    <section id="propriedade-intelectual" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">7. Propriedade Intelectual</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">7.1 Direitos Autorais</h3>
                            <p>Todo o conteúdo da Plataforma é protegido por direitos autorais e pertence exclusivamente à Anhangá Turismo ou seus licenciadores.</p>
                            <h3 className="font-merriweather font-semibold">7.2 Uso Autorizado</h3>
                            <p>É concedida ao Usuário licença limitada, não exclusiva e revogável para acessar e utilizar as funcionalidades da Plataforma para fins pessoais.</p>
                            <h3 className="font-merriweather font-semibold">7.3 Proibições</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Reproduzir, distribuir, modificar ou criar obras derivadas;</li>
                                <li>Utilizar conteúdo para fins comerciais sem autorização;</li>
                                <li>Remover ou alterar avisos de propriedade intelectual;</li>
                                <li>Realizar engenharia reversa de códigos ou funcionalidades.</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">7.4 Consequências do Descumprimento</h3>
                            <p>O descumprimento poderá resultar em suspensão de acesso, remoção de conteúdo inadequado e medidas legais cabíveis.</p>
                        </div>
                    </section>

                    <section id="conduta-usuario" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">8. Conduta do Usuário</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">8.1 Uso Adequado</h3>
                            <p>O Usuário compromete-se a utilizar a Plataforma de forma legal, respeitosa, compatível com a finalidade dos serviços e ética.</p>
                            <h3 className="font-merriweather font-semibold">8.2 Atividades Proibidas</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Utilizar a Plataforma para fins ilícitos, fraudulentos ou prejudiciais;</li>
                                <li>Transmitir vírus, malware ou códigos maliciosos;</li>
                                <li>Interferir no funcionamento normal da Plataforma;</li>
                                <li>Violar direitos de propriedade intelectual de terceiros;</li>
                                <li>Coletar dados de outros usuários sem autorização;</li>
                                <li>Realizar atividades de spam ou comunicações não solicitadas.</li>
                            </ul>
                            <h3 className="font-merriweather font-semibold">8.3 Consequências do Descumprimento</h3>
                            <p>O descumprimento poderá resultar em suspensão de acesso, remoção de conteúdo inadequado e medidas legais cabíveis.</p>
                        </div>
                    </section>

                    <section id="disponibilidade-manutencao" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">9. Disponibilidade e Manutenção</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">9.1 Esforços de Disponibilidade</h3>
                            <p>Mantemos esforços para disponibilidade contínua, sem garantia de ininterruptibilidade.</p>
                            <h3 className="font-merriweather font-semibold">9.2 Manutenções e Atualizações</h3>
                            <p>Podemos realizar manutenções programadas ou emergenciais, resultando em indisponibilidade temporária.</p>
                            <h3 className="font-merriweather font-semibold">9.3 Modificações na Plataforma</h3>
                            <p>Podemos modificar, atualizar, suspender ou descontinuar funcionalidades a qualquer tempo, sem aviso prévio.</p>
                        </div>
                    </section>

                    <section id="links-terceiros" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">10. Links para Terceiros</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">10.1 Conteúdo de Terceiros</h3>
                            <p>Podem existir links para websites e serviços de terceiros, sobre os quais não exercemos controle.</p>
                            <h3 className="font-merriweather font-semibold">10.2 Avaliação Independente</h3>
                            <p>Recomendamos avaliação independente dos termos de uso e políticas de privacidade de terceiros antes de sua utilização.</p>
                        </div>
                    </section>

                    <section id="modificacoes-termos" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">11. Modificações dos Termos</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">11.1 Direito de Alteração</h3>
                            <p>Reservamo-nos o direito de modificar estes Termos a qualquer tempo, considerando mudanças legais, evolução dos serviços, necessidades operacionais e melhorias de experiência.</p>
                            <h3 className="font-merriweather font-semibold">11.2 Publicação e Vigência</h3>
                            <p>As alterações entram em vigor imediatamente após sua publicação na Plataforma; o uso continuado implica aceitação.</p>
                            <h3 className="font-merriweather font-semibold">11.3 Recomendação de Acompanhamento</h3>
                            <p>Verifique periodicamente esta página para manter-se informado sobre atualizações.</p>
                        </div>
                    </section>

                    <section id="resolucao-disputas" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">12. Resolução de Disputas</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">12.1 Composição Amigável</h3>
                            <p>Divergências serão preferencialmente resolvidas por negociação direta e de boa-fé.</p>
                            <h3 className="font-merriweather font-semibold">12.2 Mediação e Arbitragem</h3>
                            <p>Não sendo possível a composição, as partes poderão optar por mediação ou arbitragem, conforme regulamento aplicável.</p>
                            <h3 className="font-merriweather font-semibold">12.3 Legislação Aplicável e Foro</h3>
                            <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o Foro da Comarca da cidade de São Paulo, Estado de São Paulo, com exclusão de qualquer outro.</p>
                        </div>
                    </section>

                    <section id="disposicoes-finais" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">13. Disposições Finais</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">13.1 Integralidade do Acordo</h3>
                            <p>Estes Termos, juntamente com a Política de Privacidade, constituem o acordo integral entre as partes.</p>
                            <h3 className="font-merriweather font-semibold">13.2 Autonomia das Cláusulas</h3>
                            <p>A eventual invalidade de qualquer cláusula não afetará a validade das demais disposições.</p>
                            <h3 className="font-merriweather font-semibold">13.3 Renúncia</h3>
                            <p>A tolerância ou não exercício de qualquer direito não implica renúncia ou novação.</p>
                            <h3 className="font-merriweather font-semibold">13.4 Cessão</h3>
                            <p>Os direitos e obrigações decorrentes destes Termos não podem ser cedidos pelo Usuário sem consentimento prévio e por escrito.</p>
                        </div>
                    </section>

                    <section id="informacoes-contato" className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-merriweather font-semibold">14. Informações de Contato</h2>
                        <div className="space-y-2 font-inter text-muted-foreground">
                            <h3 className="font-merriweather font-semibold">14.1 Encarregado de Proteção de Dados (DPO)</h3>
                            <p><strong>Nome:</strong> Felipe William Rodrigues Silva<br />
                                <strong>E-mail:</strong> <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline">privacidade@anhanga.tur.br</a><br />
                                <strong>Função:</strong> Data Protection Officer</p>
                            <h3 className="font-merriweather font-semibold">14.2 Canais de Comunicação</h3>
                            <p><strong>E-mail Geral:</strong> privacidade@anhanga.tur.br<br />
                                <strong>WhatsApp Business:</strong> +55 (11) 5283-3309<br />
                                <strong>Instagram:</strong> <a href="https://instagram.com/anhangatur" target="_blank" rel="noopener noreferrer" className="text-primary underline">@anhangatur</a><br />
                                <strong>Website:</strong> <a href="https://anhanga.tur.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">https://anhanga.tur.br</a></p>
                            <h3 className="font-merriweather font-semibold">14.3 Atendimento</h3>
                            <p>Nossos canais funcionam em horário comercial, com compromisso de resposta em até 5 dias úteis para questões relacionadas a estes Termos.</p>
                        </div>
                        <p className="font-inter text-muted-foreground">
                            Ao utilizar nossa Plataforma, você reconhece ter lido, compreendido e aceito integralmente estes Termos e Condições de Uso.
                        </p>
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
                        name: "Termos e Condições de Uso - Anhangá Turismo",
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

export default Terms;
