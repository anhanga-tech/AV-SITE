/**
 * The visible text of a server-rendered page, for assertions that should not
 * depend on markup: no `<style>`, tags as spaces, entities decoded, and
 * whitespace collapsed (`\s` includes the no-break space Intl puts after "R$").
 */
export function pageText(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}
