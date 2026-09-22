import { Seo } from "@/components/Seo";
import { BreadcrumbSchema } from "@/components/schemas/BreadcrumbSchema";
import { WebPageSchema } from "@/components/schemas/WebPageSchema";

const CANONICAL = "https://www.anhanga.tur.br/creditos-de-imagens/";
const DESCRIPTION = "Informações sobre créditos, autoria e origem das imagens usadas no blog da Anhangá Viagens.";
const UPDATED = "22 de setembro de 2026";
const UPDATED_ISO = "2026-09-22";

const ImageCredits = () => (
    <>
        <Seo title="Créditos de imagens | Anhangá Viagens" description={DESCRIPTION} canonical={CANONICAL} />
        <BreadcrumbSchema items={[
            { name: "Home", item: "https://www.anhanga.tur.br/" },
            { name: "Créditos de imagens", item: CANONICAL },
        ]} />
        <WebPageSchema
            name="Créditos de imagens | Anhangá Viagens"
            description={DESCRIPTION}
            url={CANONICAL}
            dateModified={UPDATED_ISO}
        />
        <div className="container mx-auto px-4 py-10">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-merriweather font-bold md:text-4xl">Créditos de imagens</h1>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">Última atualização: {UPDATED}</p>
            </header>

            <article className="mx-auto max-w-3xl space-y-8 font-inter text-muted-foreground">
                <section className="space-y-3">
                    <h2 className="text-xl font-merriweather font-semibold text-foreground md:text-2xl">Como tratamos as imagens</h2>
                    <p>
                        A Anhangá Viagens procura identificar a autoria, a fonte e a licença das imagens usadas em seus conteúdos. Quando a origem está confirmada, publicamos o crédito correspondente e mantemos o link para a fonte original sempre que possível.
                    </p>
                    <p>
                        Parte do acervo visual do blog foi criada ou incorporada em períodos anteriores. Essas imagens estão passando por uma revisão de autoria e licenciamento. Por isso, alguns artigos exibem o aviso “Crédito da imagem em verificação”.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-merriweather font-semibold text-foreground md:text-2xl">Encontrou uma imagem sua?</h2>
                    <p>
                        Se você é o autor, fotógrafo, titular dos direitos ou conhece a origem de uma imagem publicada no site, envie uma mensagem para <a className="font-semibold text-primary underline" href="mailto:contato@anhanga.tur.br">contato@anhanga.tur.br</a>.
                    </p>
                    <p>
                        Para agilizar a análise, inclua o endereço da página, a imagem em questão, a forma correta de atribuição e, se possível, um link para a publicação original ou para a licença aplicável.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-merriweather font-semibold text-foreground md:text-2xl">O que fazemos após o contato</h2>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>verificamos a autoria e as informações fornecidas;</li>
                        <li>corrigimos o crédito quando a autorização de uso estiver confirmada;</li>
                        <li>incluímos a licença ou a fonte original quando isso fizer parte das condições de uso;</li>
                        <li>removemos ou substituímos a imagem quando a publicação não puder ser regularizada.</li>
                    </ul>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm leading-relaxed">
                    <p>
                        Este canal é destinado a questões de autoria e crédito de imagens. Para assuntos relacionados a dados pessoais, consulte a <a className="font-semibold text-primary underline" href="/politica-privacidade/">Política de Privacidade</a>.
                    </p>
                </section>
            </article>
        </div>
    </>
);

export default ImageCredits;
