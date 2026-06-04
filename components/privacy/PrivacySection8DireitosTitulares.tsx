export function PrivacySection8DireitosTitulares() {
    return (
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
                    <a href="mailto:privacidade@anhanga.tur.br" className="text-primary underline"> privacidade@anhanga.tur.br</a>.
                    Para instruções detalhadas sobre exclusão de dados, consulte a página{" "}
                    <a href="/exclusao-de-dados/" className="text-primary underline">Instruções de Exclusão de Dados</a>.</p>
                <p><strong>Prazo de Resposta:</strong> 15 (quinze) dias corridos, prorrogáveis por igual período mediante justificativa expressa.</p>
            </div>
        </section>
    );
}
