// Detecção de FAQ visível no corpo MDX de um post. Roda só em build (lib/blog-manifest.ts):
// o runtime do cliente nunca recebe o markdown bruto, só o flag derivado `faqMissingFromBody`.

// Heading de FAQ em H2/H3 do markdown: "Perguntas Frequentes" (com sufixos como "(FAQ)" ou
// "sobre viagem corporativa") ou "FAQ". Comparado sem acento e sem diferenciar caixa.
const FAQ_MARKDOWN_HEADING = /^ {0,3}#{2,3}[ \t]+(?:perguntas[ \t]+(?:mais[ \t]+)?frequentes|faq)\b/m;
const FAQ_JSX_HEADING = /<h[23]\b[^>]*>\s*(?:perguntas\s+(?:mais\s+)?frequentes|faq)\b/;

// Remove blocos de código cercados: um "## Perguntas Frequentes" exibido como exemplo de
// código não é um heading renderizado.
function stripFencedCode(markdown: string): string {
  return markdown.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[`~]*[ \t]*$|(?![\s\S]))/gm, '');
}

export function hasVisibleFaqHeading(markdown: string): boolean {
  const normalized = stripFencedCode(markdown)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  return FAQ_MARKDOWN_HEADING.test(normalized) || FAQ_JSX_HEADING.test(normalized);
}
