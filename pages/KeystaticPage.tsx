import { Keystatic } from '@keystatic/core/ui';
import type { Config } from '@keystatic/core';
import keystatic from '../keystatic.config';

// Admin UI do Keystatic — sem Header/Footer/AIChat do site principal
// Acessível em /keystatic (autenticação via GitHub OAuth)
export default function KeystaticPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Keystatic config={keystatic as unknown as Config} />;
}
