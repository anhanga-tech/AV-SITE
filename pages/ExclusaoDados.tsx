import { Seo } from "@/components/Seo";
import { BreadcrumbSchema } from "@/components/schemas/BreadcrumbSchema";
import { WebPageSchema } from "@/components/schemas/WebPageSchema";

const CANONICAL = "https://www.anhanga.tur.br/exclusao-de-dados/";
const DESCRIPTION = "Instruções para solicitar a exclusão de dados pessoais junto à Anhangá Turismo, conforme a LGPD (Lei nº 13.709/2018).";
const UPDATED = "03 de junho de 2026";

const ExclusaoDados = () => (
    <>
        <Seo title="Exclusão de Dados Pessoais | Anhangá Viagens" description={DESCRIPTION} canonical={CANONICAL} />
        <BreadcrumbSchema items={[{ name: "Home", item: "https://www.anhanga.tur.br/" }, { name: "Exclusão de Dados", item: CANONICAL }]} />
        <div className="container mx-auto px-4 py-10">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-merriweather font-bold">Instruções de Exclusão de Dados</h1>
                <p className="mt-2 text-sm md:text-base text-muted-foreground font-inter">Última atualização: {UPDATED}</p>
            </header>
            <article className="max-w-3xl mx-auto space-y-6">
                <section id="direito-exclusao" className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-merriweather font-semibold">Seu direito à exclusão</h2>
                    <div className="space-y-2 font-inter text-muted-foreground">
                        <p>
                            A <strong>Anhangá Turismo Ltda.</strong> (CNPJ 37.036.732/0001-41) respeita os direitos dos titulares previstos na Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018). Você pode solicitar a exclusão dos seus dados pessoais a qualquer momento.
                        </p>
                    </div>
                </section>

                <section id="como-solicitar" className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-merriweather font-semibold">Como solicitar a exclusão</h2>
                    <div className="space-y-2 font-inter text-muted-foreground">
                        <p>
                            Envie um e-mail para <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline">privacidade@anhanga.tur.br</a> com o assunto <strong>"Solicitação de Exclusão de Dados"</strong> e inclua as seguintes informações:
                        </p>
                        <ol className="list-decimal pl-6 space-y-1">
                            <li><strong>Nome completo</strong></li>
                            <li><strong>E-mail</strong> utilizado ao entrar em contato conosco</li>
                            <li><strong>Telefone</strong> (se fornecido anteriormente)</li>
                            <li><strong>Descrição do pedido</strong> — indique se deseja exclusão parcial (ex.: apenas e-mails de marketing) ou total dos seus dados</li>
                        </ol>
                        <p>Você também pode enviar sua solicitação pelos seguintes canais:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li><strong>WhatsApp:</strong> <a href="tel:+551152833309" className="text-primary underline">(11) 5283-3309</a> (informe "Exclusão de Dados" no início da mensagem)</li>
                            <li><strong>Correio:</strong> Avenida Dom Pedro I, 773, Vila Monumento, São Paulo-SP, CEP 01552-001</li>
                        </ul>
                    </div>
                </section>

                <section id="o-que-sera-excluido" className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-merriweather font-semibold">O que será excluído</h2>
                    <div className="space-y-2 font-inter text-muted-foreground">
                        <p>Após a confirmação da sua identidade, removeremos os seguintes dados dos nossos sistemas:</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-2 pr-4 font-semibold text-foreground">Dado</th>
                                        <th className="py-2 font-semibold text-foreground">Sistema</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="py-2 pr-4">Nome, e-mail e telefone coletados pelo chatbot ou formulários</td>
                                        <td className="py-2">HubSpot CRM</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Histórico de conversas com nosso assistente de IA</td>
                                        <td className="py-2">Servidores de processamento (Google Gemini)</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Dados de rastreamento (UTM, clique em anúncios) associados ao seu perfil</td>
                                        <td className="py-2">Google Analytics 4 / GTM</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4">Cookies de identificação persistentes</td>
                                        <td className="py-2">Navegador do usuário (instrução de remoção enviada)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="prazo-resposta" className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-merriweather font-semibold">Prazo de resposta</h2>
                    <div className="space-y-2 font-inter text-muted-foreground">
                        <p>
                            Responderemos à sua solicitação em até <strong>15 dias corridos</strong> a partir do recebimento. Caso precisemos verificar sua identidade, o prazo começa após a confirmação.
                        </p>
                        <p>Você receberá uma confirmação por e-mail quando a exclusão for concluída.</p>
                    </div>
                </section>

                <section id="excecoes-legais" className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-merriweather font-semibold">Exceções legais</h2>
                    <div className="space-y-2 font-inter text-muted-foreground">
                        <p>Alguns dados podem ser retidos mesmo após seu pedido, quando houver obrigação legal ou regulatória, conforme o art. 16 da LGPD. São exemplos:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Dados necessários para cumprimento de obrigações fiscais (ex.: notas fiscais de viagens contratadas)</li>
                            <li>Registros de acesso exigidos pelo Marco Civil da Internet (Lei nº 12.965/2014) pelo prazo de 6 meses</li>
                            <li>Dados relacionados a processos judiciais, administrativos ou arbitrais em curso</li>
                        </ul>
                        <p>Nesses casos, informaremos quais dados foram retidos e o motivo.</p>
                    </div>
                </section>

                <section id="duvidas" className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-merriweather font-semibold">Dúvidas</h2>
                    <div className="space-y-2 font-inter text-muted-foreground">
                        <p>Se tiver qualquer dúvida sobre este processo, entre em contato com nosso Encarregado de Proteção de Dados (DPO):</p>
                        <p>
                            <strong>E-mail:</strong> <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline">privacidade@anhanga.tur.br</a><br />
                            <strong>Endereço:</strong> Avenida Dom Pedro I, 773, Vila Monumento, São Paulo-SP, CEP 01552-001
                        </p>
                        <p>
                            Você também tem o direito de registrar uma reclamação junto à <strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong>{" "}
                            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.gov.br/anpd</a>
                        </p>
                    </div>
                </section>
            </article>
        </div>
        <WebPageSchema name="Exclusão de Dados Pessoais - Anhangá Turismo" url={CANONICAL} description={DESCRIPTION} dateModified="2026-06-03" />
    </>
);

export default ExclusaoDados;
