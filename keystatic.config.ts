import { config, fields, collection } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';

export default config({
  storage: {
    kind: 'github',
    repo: {
      owner: 'felipewilliam2',
      name: 'AV-SITE',
    },
  },

  collections: {
    blogPosts: collection({
      label: 'Posts do Blog',
      slugField: 'title',
      path: 'content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Título',
            validation: { isRequired: true },
          },
        }),

        excerpt: fields.text({
          label: 'Resumo',
          description: 'Máx. 160 caracteres — usado no meta description e nos cards.',
          multiline: true,
          validation: { isRequired: true, length: { max: 160 } },
        }),

        date: fields.date({
          label: 'Data de Publicação',
          validation: { isRequired: true },
        }),

        author: fields.select({
          label: 'Autor',
          options: [
            { label: 'Equipe Anhangá', value: 'equipe-anhanga' },
            { label: 'Ana Souza', value: 'ana-souza' },
            { label: 'Rafa Tech', value: 'rafa-tech' },
            { label: 'Chef Luigi', value: 'luigi' },
            { label: 'Mariana S.', value: 'mariana' },
            { label: 'Carlos Viajante', value: 'carlos' },
          ],
          defaultValue: 'equipe-anhanga',
        }),

        category: fields.select({
          label: 'Categoria',
          options: [
            { label: 'Dicas de Viagem', value: 'Dicas de Viagem' },
            { label: 'Destinos', value: 'Destinos' },
            { label: 'Planejamento', value: 'Planejamento' },
            { label: 'Gastronomia', value: 'Gastronomia' },
            { label: 'Disney', value: 'Disney' },
            { label: 'Europa', value: 'Europa' },
            { label: 'América do Norte', value: 'América do Norte' },
            { label: 'Cruzeiros', value: 'Cruzeiros' },
          ],
          defaultValue: 'Dicas de Viagem',
        }),

        image: fields.text({
          label: 'URL da Imagem de Capa',
          description: 'URL absoluta (https://...). Recomendado: 1200x675px.',
          validation: { isRequired: true },
        }),

        featured: fields.checkbox({
          label: 'Post em Destaque',
          description: 'Se marcado, aparece em destaque no BlogList.',
          defaultValue: false,
        }),

        historicalNotice: fields.text({
          label: 'Aviso Histórico',
          description: 'Se preenchido, exibe um aviso no topo do post indicando que o conteúdo é histórico.',
          multiline: true,
        }),

        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: (props) => props.value || 'Tag',
          }
        ),

        seoTitle: fields.text({
          label: 'Título SEO (opcional)',
          description: 'Se preenchido, substitui o título na tag title.',
        }),

        seoDescription: fields.text({
          label: 'Meta Description SEO (opcional)',
          description: 'Se preenchido, substitui o excerpt na meta description.',
          multiline: true,
        }),

        content: fields.mdx({
          label: 'Conteúdo',
          components: {
            ChatCTA: block({
              label: 'Chat CTA',
              schema: {
                destino: fields.text({
                  label: 'Destino',
                  description: 'Ex.: "Orlando", "Paris". Personaliza a mensagem do botão.',
                }),
                mensagem: fields.text({
                  label: 'Mensagem personalizada (opcional)',
                  multiline: true,
                }),
                label: fields.text({
                  label: 'Texto do botão (opcional)',
                }),
              },
            }),
          },
        }),
      },
    }),
  },
});
