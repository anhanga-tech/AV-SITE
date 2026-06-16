import { Seo } from "@/components/Seo";
import { BreadcrumbSchema } from "@/components/schemas/BreadcrumbSchema";
import { WebPageSchema } from "@/components/schemas/WebPageSchema";
import {
    PrivacySection1DisposicoesGerais, PrivacySection2Definicoes, PrivacySection3Categorias,
    PrivacySection4MetodosColeta, PrivacySection5FinalidadesBases, PrivacySection6Compartilhamento,
    PrivacySection7Armazenamento, PrivacySection8DireitosTitulares, PrivacySection9Cookies,
    PrivacySection10TransferenciaInternacional, PrivacySection11Seguranca, PrivacySection12Encarregado,
    PrivacySection13Alteracoes, PrivacySection14Canais, PrivacySection15DisposicoesFinais,
} from "@/components/privacy";

const CANONICAL = "https://www.anhanga.tur.br/politica-privacidade/";
const DESCRIPTION = "Política de Privacidade e Proteção de Dados da Anhangá Turismo: coleta, tratamento, armazenamento e direitos dos titulares.";
const UPDATED = "10 de junho de 2026";
const UPDATED_ISO = "2026-06-10";

const Privacy = () => (
    <>
        <Seo title="Política de Privacidade | Anhangá Viagens" description={DESCRIPTION} canonical={CANONICAL} />
        <BreadcrumbSchema items={[{ name: "Home", item: "https://www.anhanga.tur.br/" }, { name: "Política de Privacidade", item: CANONICAL }]} />
        <div className="container mx-auto px-4 py-10">
            <header className="mb-8 text-center">
                <h1 className="text-3xl md:text-4xl font-merriweather font-bold">Política de Privacidade e Proteção de Dados Pessoais</h1>
                <p className="mt-2 text-sm md:text-base text-muted-foreground font-inter">Última atualização: {UPDATED}</p>
            </header>
            <article className="max-w-3xl mx-auto space-y-6">
                <PrivacySection1DisposicoesGerais />
                <PrivacySection2Definicoes />
                <PrivacySection3Categorias />
                <PrivacySection4MetodosColeta />
                <PrivacySection5FinalidadesBases />
                <PrivacySection6Compartilhamento />
                <PrivacySection7Armazenamento />
                <PrivacySection8DireitosTitulares />
                <PrivacySection9Cookies />
                <PrivacySection10TransferenciaInternacional />
                <PrivacySection11Seguranca />
                <PrivacySection12Encarregado />
                <PrivacySection13Alteracoes />
                <PrivacySection14Canais />
                <PrivacySection15DisposicoesFinais />
            </article>
        </div>
        <WebPageSchema name="Política de Privacidade - Anhangá Turismo" url={CANONICAL} description={DESCRIPTION} dateModified={UPDATED_ISO} />
    </>
);

export default Privacy;
