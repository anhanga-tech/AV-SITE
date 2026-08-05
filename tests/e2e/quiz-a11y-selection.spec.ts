import { expect, test } from '@playwright/test';

/**
 * Contrato de acessibilidade da tela de perguntas do quiz: o estado de escolha
 * precisa chegar à árvore de acessibilidade (antes vivia só na classe CSS
 * `is-selected` e num ✓ `aria-hidden`), e o botão "Próxima" desabilitado
 * precisa dizer o que falta em vez de mostrar "0 escolhidos".
 */
test.describe('Quiz — estado de seleção acessível', () => {
    test('expõe aria-pressed nas opções e explica o botão desabilitado', async ({ page }) => {
        await page.goto('/quiz');
        await page.getByRole('button', { name: /bora começar/i }).click();

        // Q1 é múltipla escolha: nada selecionado ainda.
        const europa = page.getByRole('button', { name: /Europa/ });
        await expect(europa).toHaveAttribute('aria-pressed', 'false');

        const next = page.getByRole('button', { name: /Próxima/ });
        await expect(next).toBeDisabled();
        await expect(page.getByText('Escolha ao menos uma opção')).toBeVisible();

        await europa.click();

        await expect(europa).toHaveAttribute('aria-pressed', 'true');
        await expect(next).toBeEnabled();
        await expect(page.getByText('1 escolhido')).toBeVisible();

        // Desmarcar volta os dois estados juntos.
        await europa.click();
        await expect(europa).toHaveAttribute('aria-pressed', 'false');
        await expect(next).toBeDisabled();

        // A barra de progresso tem nome acessível próprio.
        await expect(page.getByRole('progressbar', { name: 'Pergunta 1 de 6' })).toBeVisible();
    });
});
