// Mora fora de TrustSeals.tsx para manter aquele arquivo exportando só o componente — exports
// não-componente quebram o Fast Refresh (react-doctor/only-export-components), mesmo motivo
// documentado em linkIcons.ts.
//
// Sem contagem quando `totalReviews` é 0/ausente: "Nota 5.0 · 0 avaliações" soa pior que omitir
// o número, e o dado já nasce assim quando o fetch não encontrou avaliações públicas.
export function formatReviewCountLabel(totalReviews: number): string | null {
    if (totalReviews <= 0) return null;
    return `${totalReviews} avaliaç${totalReviews === 1 ? 'ão' : 'ões'}`;
}
