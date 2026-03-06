# Guia de Integração: Chatbot Anhangá via Deep-link

Este guia descreve como integrar CTAs de blogs externos ou outras stacks com o chatbot da Anhangá Viagens, permitindo abertura automática do chat e preenchimento de mensagens contextuais.

## 🔗 Estrutura do Deep-link

Para disparar o chatbot, o link deve apontar para a homepage da Anhangá com parâmetros específicos na query string.

**URL Base:** `https://www.anhanga.tur.br/`

### Parâmetros Suportados

| Parâmetro | Obrigatório | Descrição |
| :--- | :--- | :--- |
| `chat=1` | **Sim** | Ativa a abertura automática da gaveta do chat. |
| `m` ou `message` | Não | Define uma mensagem inicial personalizada que será enviada pelo usuário. |
| `destino` | Não | Atalho para roteiros. Gera a mensagem: "Olá! Gostaria de um roteiro personalizado para [destino]." |

---

## 🛠️ Exemplos de Uso

### 1. CTA Genérico (Apenas abrir chat)
`https://www.anhanga.tur.br/?chat=1`

### 2. CTA com Mensagem Contextual
`https://www.anhanga.tur.br/?chat=1&m=Olá! Li o post sobre o Lollapalooza e quero saber mais sobre os pacotes.`

### 3. CTA para Destino Específico
`https://www.anhanga.tur.br/?chat=1&destino=Orlando`

---

## 🎨 Snippet de Componente (HTML/CSS)

Abaixo, um exemplo de snippet que a equipe do blog pode utilizar para manter a identidade visual.

### HTML
```html
<a href="https://www.anhanga.tur.br/?chat=1&destino=Orlando" class="anhanga-chat-cta">
  <span class="anhanga-cta-icon">🧭</span>
  <span class="anhanga-cta-text">Planejar Roteiro com IA</span>
</a>
```

### CSS (Sugestão de Estilo)
```css
.anhanga-chat-cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background-color: #FF6B35; /* Brand Vibrant */
  color: #ffffff !important;
  text-decoration: none !important;
  padding: 16px 32px;
  border-radius: 16px;
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.25);
  border: none;
}

.anhanga-chat-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(255, 107, 53, 0.4);
  background-color: #e85a2a;
}

.anhanga-cta-icon {
  font-size: 20px;
}

@media (max-width: 640px) {
  .anhanga-chat-cta {
    width: 100%;
    justify-content: center;
    padding: 14px 24px;
    font-size: 14px;
  }
}
```

---

## 💡 Melhores Práticas

1. **Contexto:** Use o parâmetro `m` para citar o artigo que o usuário está lendo. Isso ajuda nossa IA e os consultores a entenderem o interesse inicial.
2. **Posicionamento:** Insira o CTA após parágrafos de alta intenção (ex: logo após descrever um destino ou preço).
3. **UTMs:** Você pode combinar estes parâmetros com UTMs padrão (`utm_source`, `utm_medium`, etc.) para manter o rastreamento de atribuição.
   - Ex: `https://www.anhanga.tur.br/?chat=1&destino=Orlando&utm_source=blog&utm_medium=cta_post`
