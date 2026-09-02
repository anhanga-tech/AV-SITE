export function PrivacySection7Armazenamento() {
    return (
        <section id="armazenamento" className="space-y-2">
            <h2 className="text-xl md:text-2xl font-merriweather font-semibold">7. Armazenamento e Retenção de Dados</h2>
            <div className="space-y-2 font-inter text-muted-foreground">
                <h3 className="font-merriweather font-semibold">7.1 Períodos de Retenção</h3>
                <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Dados de contato e relacionamento:</strong> 5 (cinco) anos após a última interação</li>
                    <li><strong>Dados de navegação (analytics):</strong> até 14 (quatorze) meses, conforme a configuração de retenção do Google Analytics 4</li>
                    <li><strong>Cookie de atribuição:</strong> o cookie próprio <code>anhanga_ga_cid</code>, quando criado, pode permanecer por até 2 (dois) anos; o identificador é pseudonimizado e pode ser registrado no CRM quando o titular envia um formulário</li>
                    <li><strong>Cookie de campanha:</strong> o cookie <code>tracking_data</code> permanece por até 30 (trinta) dias</li>
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
    );
}
