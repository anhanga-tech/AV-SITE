
export interface Author {
    id: string;
    name: string;
    role: string;
    bio: string;
    image?: string;
    social?: {
        instagram?: string;
        linkedin?: string;
    };
}

export const AUTHORS: Record<string, Author> = {
    "ana-souza": {
        id: "ana-souza",
        name: "Ana Souza",
        role: "Dicas de Expert",
        bio: "Especialista em roteiros para a Disney e apaixonada por transformar viagens em família em momentos mágicos.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
        social: {
            instagram: "https://www.instagram.com/anhangaviagens"
        }
    },
    "rafa-tech": {
        id: "rafa-tech",
        name: "Rafa Tech",
        role: "Especialista em Planejamento",
        bio: "Entusiasta de tecnologia e organização, focado em tornar cada etapa da viagem mais eficiente e tranquila.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    "luigi": {
        id: "luigi",
        name: "Chef Luigi",
        role: "Crítico Gastronômico",
        bio: "Viajante incansável em busca dos melhores sabores do mundo, da alta gastronomia à comida de rua.",
        image: "https://images.unsplash.com/photo-1583394238182-6f71f3ef0864?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    "mariana": {
        id: "mariana",
        name: "Mariana S.",
        role: "Consultora de Viagens Românticas",
        bio: "Especialista em destinos de luxo e roteiros personalizados para casais em busca de momentos únicos.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    "carlos": {
        id: "carlos",
        name: "Carlos Viajante",
        role: "Explorador Cultural",
        bio: "Curioso por natureza, adora descobrir as histórias e tradições por trás de cada destino icônico.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
    },
    "equipe-anhanga": {
        id: "equipe-anhanga",
        name: "Equipe Anhangá",
        role: "Especialistas em Viagens",
        bio: "Nossa equipe de especialistas compartilha as melhores dicas coletivas para sua próxima aventura.",
        image: "https://www.anhanga.tur.br/logo.png"
    }
};

export interface BlogPost {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    date: string;
    author: string; // Mantido para compatibilidade simples em alguns lugares
    authorId?: string; // Link para o objeto Author
    isFeatured?: boolean;
    color: string;
    rotate: string;
}

export const BLOG_POSTS: BlogPost[] = [
    {
        id: 1,
        slug: "5-segredos-da-disney-que-ninguem-conta",
        title: "5 Segredos da Disney que Ninguém Conta",
        excerpt: "Descubra como furar filas legalmente, onde encontrar os personagens raros e os melhores snacks escondidos nos parques.",
        content: `
            <p>Já imaginou descobrir detalhes sobre a Disney que a maioria dos visitantes nunca percebe? Aqueles truques escondidos que tornam a experiência ainda mais mágica – mas que ficam guardados a sete chaves?</p>

            <p>Depois de anos planejando viagens para Orlando e conversando com famílias que voltaram encantadas (e outras nem tanto), reunimos aqui <strong>5 segredos que fazem toda a diferença na sua experiência nos parques</strong>. Prepare-se para ver a Casa do Mickey com outros olhos.</p>

            <h3>1. Existe um "Melhor Horário Secreto" para Cada Atração</h3>
            <p>Todo mundo sabe que chegar cedo nos parques é importante. Mas o que poucos sabem é que cada atração tem seu próprio padrão de filas ao longo do dia – e não é o que você imagina.</p>
            <p>Por exemplo: enquanto todo mundo corre para o <em>Seven Dwarfs Mine Train</em> na abertura do Magic Kingdom, atrações como <em>Space Mountain</em> ficam praticamente vazias na primeira hora. E sabe aquele horário do almoço (12h-14h) que parece movimentado? É quando várias montanhas-russas têm as menores esperas do dia.</p>
            <p><strong>O segredo:</strong> existe um fluxo inverso. Quando a maioria vai comer, vá para as atrações. Quando todo mundo volta das refeições (por volta das 15h), aproveite para almoçar com calma.</p>

            <h3>2. Os "Rider Switch" Salvam Famílias com Crianças Pequenas</h3>
            <p>Aqui vai um recurso pouco divulgado que muda completamente o jogo para quem viaja com crianças de diferentes idades: o <strong>Rider Switch</strong> (ou Rider Swap).</p>
            <p>Funciona assim: sua família tem um bebê que não pode ir na montanha-russa e uma criança maior que está doida para ir. Em vez de só um adulto ir e o outro ficar de fora, ambos os adultos podem aproveitar a atração sem pegar fila duas vezes.</p>
            <p>Um adulto vai com a criança maior enquanto o outro fica com o bebê. Quando terminam, trocam – e o segundo adulto entra direto pela fila expressa, sem esperar tudo de novo.</p>
            <p><strong>Por que ninguém conta?</strong> Porque você precisa avisar o cast member na entrada da atração. Não é automático, não está em todo lugar com destaque. Mas funciona em praticamente todas as atrações com restrição de altura.</p>

            <h3>3. Existem Banheiros Secretos (e Muito Mais Vazios)</h3>
            <p>Os banheiros próximos às atrações principais vivem lotados. Mas a Disney tem dezenas de banheiros "escondidos" estrategicamente espalhados – longe das áreas de maior movimento.</p>
            <p>No Magic Kingdom, por exemplo, tem um banheiro super tranquilo entre a Tomorrowland e a Fantasyland, perto do <em>Carousel of Progress</em>. No Epcot, os banheiros do pavilhão do Japão costumam estar sempre vazios (e são lindos, por sinal).</p>
            <p><strong>A dica de ouro:</strong> baixe o aplicativo <em>My Disney Experience</em> e ative a localização. Ele mostra TODOS os banheiros do parque, não só os óbvios. Pode economizar 15-20 minutos preciosos do seu dia.</p>

            <h3>4. A Disney Oferece Água Gelada Gratuita em Qualquer Lanchonete</h3>
            <p>Com o calor da Flórida, você vai gastar uma fortuna em água, certo? Errado.</p>
            <p>Pouquíssima gente sabe, mas qualquer ponto de alimentação da Disney é obrigado a fornecer um copo de água gelada gratuitamente se você pedir. Não precisa comprar nada. É só chegar no balcão e pedir <em>"a cup of ice water, please"</em>.</p>
            <p>Claro, é um copo descartável pequeno, não uma garrafa. Mas você pode encher quantas vezes quiser, em qualquer lugar. Se quiser otimizar ainda mais, leve uma garrafinha vazia na mochila e vá enchendo ao longo do dia.</p>
            <p><strong>Economia estimada:</strong> cerca de US$ 40-60 por família de 4 pessoas em um dia de parque.</p>

            <h3>5. Tem um "Clube Secreto" no Magic Kingdom Que Poucos Conhecem</h3>
            <p>Esse é para quem quer se sentir parte de algo exclusivo: o <strong>Club 33</strong>. Inspirado no lendário clube privado da Disneyland na Califórnia, existe uma versão em Orlando que não é divulgada abertamente.</p>
            <p>Fica escondido em uma área discreta do Magic Kingdom, acessível apenas para membros (e sim, a anuidade é bem salgada – algo na casa das dezenas de milhares de dólares). Mas aqui vai o segredo que você PODE aproveitar: algumas agências de viagens especializadas conseguem acesso a experiências VIP similares, como tours guiados privativos que te levam a áreas restritas dos bastidores.</p>
            <p>Não é o Club 33 em si, mas te dá aquele gostinho de exclusividade – conhecer os túneis subterrâneos chamados "utilidors", ver onde os personagens se preparam, entender como a mágica acontece.</p>

            <h3>A Verdadeira Magia Está no Planejamento</h3>
            <p>Esses segredos todos têm algo em comum: fazem diferença quando você sabe utilizá-los no momento certo. Não adianta saber do Rider Switch se você não avisar o cast member. Não adianta conhecer banheiros alternativos se você está sem o mapa na hora do aperto.</p>
            <p>A Disney é incrível sozinha, mas com planejamento estratégico ela se transforma em uma experiência inesquecível. E a diferença entre uma viagem boa e uma viagem perfeita está justamente nesses detalhes que ninguém conta.</p>

            <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-8">
                <p class="font-bold text-brand-dark mb-2">Quer descobrir ainda mais segredos para aproveitar Orlando ao máximo?</p>
                <p class="mb-0">Entre em contato e solicite um orçamento personalizado para sua viagem. Vamos transformar seus dias nos parques em memórias que vão durar para sempre – com toda a magia e nenhum estresse.</p>
            </div>
        `,
        image: "https://cdn1.parksmedia.wdprapps.disney.com/resize/mwImage/1/1300/544/75/vision-dam/digital/parks-platform/parks-global-assets/disney-world/events/holiday/entertainment/MKDecor2_0109ZL_0316SD_R3_xak-16x9.jpg?2025-06-09T20:18:33+00:00",
        category: "Dicas de Expert",
        date: "12 Dez, 2025",
        author: "Ana Souza",
        authorId: "ana-souza",
        isFeatured: true,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        rotate: "rotate-0"
    },
    {
        id: 2,
        slug: "malas-de-mao-o-guia-definitivo",
        title: "Malas de Mão: O Guia Definitivo",
        excerpt: "Aprenda a viajar leve sem esquecer nada. Checklist completo para não pagar despacho.",
        content: `
            <p>Você já passou por aquele momento de pânico no check-in quando a atendente pede para colocar sua mala na balança? Ou ficou observando aquele passageiro que despachou três malas enquanto você conseguiu viajar uma semana inteira só com bagagem de mão?</p>
            <p>Dominar a arte de viajar com mala de mão não é apenas economia. É sobre liberdade, praticidade e aquela sensação incrível de sair do avião e ir direto para o seu destino sem ficar esperando na esteira de bagagens.</p>

            <h3>O Que Realmente Conta Como Mala de Mão?</h3>
            <p>Cada companhia aérea tem suas próprias regras, e elas são levadas a sério.</p>
            <ul>
                <li><strong>Dimensões padrão:</strong> A maioria aceita até 55cm x 35cm x 25cm. Mas atenção: low-cost como Ryanair e EasyJet são mais rigorosas (40cm x 20cm x 25cm).</li>
                <li><strong>Peso máximo:</strong> Geralmente entre 7kg e 10kg. LATAM, Gol e Azul permitem 10kg. American Airlines não tem limite específico de peso, apenas dimensão.</li>
                <li><strong>Item pessoal adicional:</strong> Quase todas permitem uma bolsa, mochila pequena ou pasta de notebook que caiba embaixo do assento.</li>
            </ul>
            <p><strong>Dica de ouro:</strong> Se está no limite do peso, use sua roupa mais pesada no dia do voo (jaqueta, tênis). Parece óbvio, mas funciona.</p>

            <h3>Como Escolher a Mala Perfeita</h3>
            <ul>
                <li><strong>Material:</strong> Rígidas (policarbonato) protegem melhor. De tecido (nylon) são mais leves e flexíveis.</li>
                <li><strong>Rodas:</strong> Quatro rodas giratórias são mais manobráveis. Duas rodas duram mais.</li>
                <li><strong>Peso vazio:</strong> Procure opções entre 2kg e 2,5kg. Uma mala de 3,5kg te deixa com apenas 6,5kg para suas coisas.</li>
                <li><strong>Marcas confiáveis:</strong> Samsonite, American Tourister, Victorinox, Delsey, Track&Field, Sestini.</li>
            </ul>

            <h3>A Arte de Fazer as Malas</h3>
            <ul>
                <li><strong>Método do rolinho:</strong> Enrole as roupas em vez de dobrar. Economiza espaço e evita vincos.</li>
                <li><strong>Cubo organizador:</strong> Esses cubos de tecido transformam caos em ordem. Um para roupa limpa, outro para suja, um para íntimas.</li>
                <li><strong>Regra 5-4-3-2-1:</strong> Para uma semana: 5 conjuntos de roupa íntima, 4 partes de cima, 3 partes de baixo, 2 pares de sapato, 1 chapéu/acessório.</li>
                <li><strong>Aproveite todo espaço:</strong> Meias dentro dos sapatos. Cintos contornando a parte interna. Itens pequenos nos cantinhos.</li>
                <li><strong>Vista as peças maiores:</strong> Jaqueta, casaco, bota pesada no dia do voo.</li>
            </ul>

            <h3>O Que Levar (e o Que Deixar)</h3>
            <p><strong>Essenciais:</strong></p>
            <ul>
                <li>Documentos e dinheiro</li>
                <li>Medicamentos de uso contínuo</li>
                <li>Uma muda de roupa completa</li>
                <li>Carregadores</li>
                <li>Higiene em embalagens de até 100ml</li>
            </ul>
            <p><strong>Deixe em casa:</strong></p>
            <ul>
                <li>Secador e chapinha (hotéis fornecem)</li>
                <li>Mais de dois pares de sapato</li>
                <li>Toalhas</li>
                <li>"Caso eu precise" que nunca usa</li>
            </ul>
            <p><strong>Líquidos:</strong> Máximo 100ml por frasco, todos em saco plástico transparente de 1 litro.</p>
            <p><strong>Truque:</strong> Use versões sólidas. Shampoo em barra, sabonete, desodorante stick não contam como líquido.</p>

            <h3>Viagens Mais Longas</h3>
            <ul>
                <li><strong>Lave roupa:</strong> Hotéis têm lavanderia. Airbnbs têm máquina. Ou lave na pia à noite.</li>
                <li><strong>Compre no destino:</strong> Às vezes sai mais barato que pagar bagagem despachada.</li>
                <li><strong>Tecidos inteligentes:</strong> Poliéster e nylon secam rápido e não amassam. Uniqlo, Decathlon e Columbia têm ótimas opções.</li>
                <li><strong>Looks versáteis:</strong> Uma calça jeans + cinco blusas = looks diferentes todos os dias.</li>
            </ul>

            <h3>Erros Que Você Deve Evitar</h3>
            <ul>
                <li><strong>Confiar que "vai caber":</strong> Meça e pese antes de sair de casa.</li>
                <li><strong>Esquecer de verificar conexões:</strong> Companhias diferentes podem ter regras diferentes.</li>
                <li><strong>Colocar itens proibidos:</strong> Objetos cortantes, líquidos acima de 100ml, isqueiros serão confiscados.</li>
                <li><strong>Não deixar espaço para compras:</strong> Reserve um pouco ou leve uma sacola dobrável extra.</li>
            </ul>

            <h3>Orlando com Mala de Mão</h3>
            <p>Muita gente acha impossível por causa das compras. A verdade? Vá só com bagagem de mão e volte com mala despachada cheia de presentes.</p>
            <p>A maioria das companhias permite despachar só na volta. Vai leve, compra uma mala nos outlets (ou usa sacolas das lojas) e despacha no retorno.</p>
            <p>Para famílias com crianças, leve o essencial e compre fraldas e lenços em farmácias como Walgreens e CVS que estão em cada esquina.</p>

            <h3>Benefícios Reais</h3>
            <ul>
                <li><strong>Agilidade:</strong> Saia do avião direto para o transfer. Sem espera, sem risco de extravio.</li>
                <li><strong>Mobilidade:</strong> Muito mais fácil em transportes públicos, escadas, ruas de pedra.</li>
                <li><strong>Menos estresse:</strong> Não se preocupe se sua mala vai chegar ou ficar perdida.</li>
                <li><strong>Conexões curtas:</strong> Com uma hora de conexão, você pega o próximo voo tranquilamente.</li>
            </ul>

            <h3>Liberdade Começa na Bagagem</h3>
            <p>Viajar com mala de mão é uma mentalidade. É valorizar experiências acima de pertences. É mobilidade, simplicidade e aproveitar cada minuto sem se preocupar com bagagem.</p>
            <p>No começo pode parecer desafiador. Mas depois da primeira vez, você nunca mais vai querer viajar de outro jeito.</p>
            <p>Menos peso nas costas, mais leveza na viagem.</p>

            <div class="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 mt-8">
                <p class="font-bold text-emerald-800 mb-2">Planejando sua próxima aventura?</p>
                <p class="mb-0 text-emerald-700">Entre em contato e solicite um orçamento personalizado. Vamos ajudar você a organizar cada detalhe da sua viagem, transformando sua experiência em memórias inesquecíveis.</p>
            </div>
        `,
        image: "https://images.pexels.com/photos/9185786/pexels-photo-9185786.jpeg",
        category: "Planejamento",
        date: "05 Nov, 2025",
        author: "Rafa Tech",
        authorId: "rafa-tech",
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        rotate: "-rotate-2"
    },
    {
        id: 3,
        slug: "europa-gastronomica-roteiro-italia",
        title: "Europa Gastronômica: Roteiro Itália",
        excerpt: "De Roma a Florença: onde comer a verdadeira pasta carbonara e os melhores gelatos.",
        content: `
            <p>A Itália não é apenas um destino. É uma experiência sensorial que começa nos aromas das ruas, passa pelos sabores que explodem na boca e termina nas memórias que você vai carregar para sempre.</p>
            <p>Se você é daqueles que acredita que viajar é também mergulhar na cultura local através da comida, prepare-se. Este roteiro foi pensado para quem quer muito mais do que conhecer pontos turísticos: quer sentar à mesa, brindar com um vinho local e entender por que a culinária italiana conquistou o mundo inteiro.</p>

            <h3>Por Que a Itália é o Paraíso dos Amantes da Gastronomia</h3>
            <p>Cada região italiana tem sua personalidade culinária única. No norte, risotos cremosos e polentas reconfortantes. No centro, massas frescas e molhos de tomate que parecem simples, mas escondem séculos de tradição. No sul, frutos do mar fresquíssimos e pizzas que redefinem tudo o que você achava que sabia sobre pizza.</p>
            <p>E tem mais: a Itália leva a comida tão a sério que cada cidade, cada vilarejo, tem pratos que só existem ali. Você não encontra o verdadeiro carbonara fora de Roma. A lasanha alla bolognese de verdade só em Bolonha. E não ouse pedir cappuccino depois das 11h da manhã se não quiser receber aquele olhar de reprovação do barista.</p>
            <p>A verdade? Você pode até tentar replicar essas receitas em casa depois. Mas nunca vai ter o mesmo gosto. Porque falta o sol da Toscana, a brisa do Mediterrâneo e aquele jeitinho italiano de transformar ingredientes simples em algo extraordinário.</p>

            <h3>Roteiro de 10 Dias: Do Norte ao Sul Italiano</h3>

            <h4>Dias 1 e 2: Milão (Lombardia)</h4>
            <p>Comece sua jornada gastronômica na capital da moda, mas não se engane: Milão também é uma potência culinária.</p>
            <p><strong>Experiências imperdíveis:</strong></p>
            <ul>
                <li>Risoto alla milanese em um restaurante tradicional (dica: peça o ossobuco para acompanhar)</li>
                <li>Aperitivo no bairro <strong>Navigli</strong> ao entardecer, aquela tradição milanesa de petiscos que viram quase um jantar</li>
                <li>Panettone artesanal direto da fonte (sim, é de Milão e não tem nada a ver com aqueles industrializados do supermercado)</li>
            </ul>
            <p><strong>Onde comer:</strong> <strong>Trattoria Milanese</strong> para autenticidade ou <strong>Luini</strong> para experimentar o melhor panzerotto da cidade.</p>

            <h4>Dias 3 e 4: Bolonha (Emilia-Romagna)</h4>
            <p>Se Milão é sofisticada, Bolonha é pura alma. Conhecida como "La Grassa" (a gorda), essa cidade respira gastronomia.</p>
            <p><strong>Experiências imperdíveis:</strong></p>
            <ul>
                <li>Aula de culinária para aprender a fazer tortellini do zero (suas mãos vão doer, mas vale cada segundo)</li>
                <li>Almoço em uma osteria local com tagliatelle al ragù (nunca, jamais, chame de "spaghetti bolognese")</li>
                <li>Tour pelo <strong>Mercato di Mezzo</strong> provando queijos, presuntos e vinhos da região</li>
            </ul>
            <p><em>Curiosidade: O ragù bolonhese tem uma receita oficial registrada em cartório desde 1982. Sério.</em></p>

            <h4>Dias 5 e 6: Florença (Toscana)</h4>
            <p>A Toscana inteira merece um roteiro só dela, mas Florença é a porta de entrada perfeita para essa região incrível.</p>
            <p><strong>Experiências imperdíveis:</strong></p>
            <ul>
                <li>Bistecca alla fiorentina de pelo menos 1kg em uma trattoria tradicional (vem mal passada, é a regra)</li>
                <li>Visita a vinícolas da região do <strong>Chianti</strong> com degustação de vinhos e azeites</li>
                <li>Gelato artesanal na <strong>Gelateria dei Neri</strong> (prepare-se para fila, mas é rápida)</li>
            </ul>
            <p><strong>Dica especial:</strong> Reserve uma tarde para um passeio gastronômico guiado pelo <strong>Mercado Central</strong>. Você vai provar coisas que nem sabia que existiam.</p>

            <h4>Dias 7 e 8: Roma (Lazio)</h4>
            <p>A cidade eterna tem tesouros culinários em cada esquina. E não, não estamos falando de restaurantes turísticos perto do <strong>Coliseu</strong>.</p>
            <p><strong>Experiências imperdíveis:</strong></p>
            <ul>
                <li>Os "quatro pratos de massa" romanos: carbonara, amatriciana, cacio e pepe e gricia (escolha um por refeição ou teste todos em porções menores)</li>
                <li>Pizza al taglio no bairro <strong>Testaccio</strong></li>
                <li>Supplì (bolinho de arroz frito com mussarela derretida) como entrada</li>
            </ul>
            <p><strong>Erro que você NÃO pode cometer:</strong> Pedir fettuccine alfredo. Esse prato não existe na Itália tradicional. Foi criado para turistas americanos.</p>

            <h4>Dias 9 e 10: Nápoles (Campania)</h4>
            <p>Termine sua jornada onde a pizza nasceu. E prepare-se para nunca mais olhar para pizza da mesma forma.</p>
            <p><strong>Experiências imperdíveis:</strong></p>
            <ul>
                <li>Pizza napoletana de verdade na <strong>Pizzeria da Michele</strong> ou <strong>L'Antica Pizzeria da Attilio</strong></li>
                <li>Sfogliatella fresca em uma pasticceria de bairro pela manhã</li>
                <li>Café expresso de pé no balcão (como os napolitanos fazem)</li>
            </ul>
            <p><strong>Bônus:</strong> Se tiver um dia extra, pegue um trem para a <strong>Costa Amalfitana</strong> e prove frutos do mar fresquíssimos com vista para o mar. Impossível descrever.</p>

            <h3>Dicas Práticas para Aproveitar ao Máximo</h3>
            <p><strong>Sobre horários:</strong> Os italianos levam as refeições muito a sério. Almoço entre 12h30 e 14h30. Jantar nunca antes das 19h30 (e geralmente só depois das 20h). Respeite esses horários para encontrar restaurantes abertos e cheios de locais.</p>
            <p><strong>Sobre reservas:</strong> Restaurantes tradicionais e pequenos enchem rápido. Reserve com pelo menos 2 ou 3 dias de antecedência. Às vezes é possível ligar no mesmo dia pela manhã.</p>
            <p><strong>Sobre gorjetas:</strong> O "coperto" (couvert) já vem na conta. Gorjeta não é obrigatória, mas arredondar a conta ou deixar 5 a 10% é bem visto em serviços excepcionais.</p>
            <p><strong>Sobre idioma:</strong> Cardápios em inglês existem em lugares turísticos, mas os melhores restaurantes têm menu só em italiano. Use o Google Tradutor ou peça ajuda ao garçom. Eles adoram explicar os pratos.</p>

            <h3>O Que Levar na Mala (Além de Roupas)</h3>
            <p>Espaço na bagagem. Você vai querer trazer azeites, vinhos, queijos curados, massas artesanais, trufas… A lista não tem fim.</p>
            <p>E calçados confortáveis. Você vai andar muito entre uma refeição e outra. As melhores descobertas gastronômicas estão escondidas em ruelas estreitas, longe das rotas turísticas óbvias.</p>

            <h3>A Verdadeira Essência da Gastronomia Italiana</h3>
            <p>No final das contas, a culinária italiana não é sobre ingredientes exóticos ou técnicas complexas. É sobre respeito ao produto, à tradição e ao momento de sentar à mesa.</p>
            <p>É sobre aquela nonna de 80 anos que ainda faz massa fresca todo domingo. Sobre o padeiro que acorda às 4h da manhã para ter pão quentinho. Sobre famílias inteiras reunidas em volta de uma mesa simples, mas farta de amor e sabor.</p>
            <p>Quando você entende isso, cada refeição na Itália se transforma em algo muito maior que comida. Vira conexão, história, memória afetiva.</p>

            <div class="bg-green-50 p-6 rounded-2xl border border-green-100 mt-8">
                <p class="font-bold text-green-800 mb-2">Pronto para viver essa experiência?</p>
                <p class="mb-0 text-green-700">Entre em contato e solicite um orçamento personalizado para seu roteiro gastronômico pela Itália. Vamos planejar cada detalhe para que sua viagem seja tão inesquecível quanto deliciosa.</p>
            </div>
        `,
        image: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Gastronomia",
        date: "28 Out, 2025",
        author: "Chef Luigi",
        authorId: "luigi",
        color: "text-green-600 bg-green-50 border-green-200",
        rotate: "rotate-2"
    },
    {
        id: 4,
        slug: "lua-de-mel-nas-maldivas",
        title: "Lua de Mel nas Maldivas",
        excerpt: "Quanto custa? Qual a melhor época? Vale a pena o All-Inclusive? Respondemos tudo.",
        content: `
            <p>Imagine acordar em uma cabana sobre águas cristalinas tão azuis que parecem irreais. Abrir a porta do quarto e mergulhar direto no oceano Índico. Tomar café da manhã flutuante enquanto peixes coloridos nadam ao redor. Assistir ao pôr do sol mais lindo da sua vida, só vocês dois, sem ninguém por perto.</p>

            <p>As Maldivas não são apenas um destino de lua de mel. São o cenário perfeito para começar uma nova história juntos, cercados por uma beleza natural que tira o fôlego a cada segundo.</p>

            <p>Se você está planejando a viagem mais especial da sua vida, este guia vai te mostrar tudo o que você precisa saber para transformar sua lua de mel em uma experiência inesquecível.</p>

            <h3>Por Que as Maldivas São o Destino Perfeito Para Lua de Mel</h3>
            <ul>
                <li><strong>Privacidade absoluta:</strong> Cada resort ocupa uma ilha inteira. Isso significa que você não vai dividir espaço com multidões de turistas. É só vocês dois, areia branca e mar turquesa.</li>
                <li><strong>Beleza incomparável:</strong> As Maldivas têm alguns dos cenários mais fotografados do mundo. Águas tão claras que você vê o fundo a metros de profundidade. Vida marinha vibrante. Praias desertas que parecem ter sido feitas sob medida para o momento de vocês.</li>
                <li><strong>Experiências únicas:</strong> Jantar em uma mesa no meio do oceano. Mergulhar com tubarões-baleia. Spa flutuante. Banho de espuma na banheira com vista para o infinito. Cada detalhe é pensado para criar memórias eternas.</li>
                <li><strong>Romantismo natural:</strong> Não precisa forçar nada. O ambiente já entrega toda a atmosfera romântica que vocês merecem.</li>
            </ul>

            <h3>Quando Ir: Escolhendo a Época Perfeita</h3>
            <ul>
                <li><strong>Melhor período (dezembro a abril):</strong> Tempo seco, sol quase garantido, mar calmo e cristalino. É alta temporada, então os preços sobem, mas a experiência compensa cada centavo.</li>
                <li><strong>Período intermediário (maio e novembro):</strong> Ainda dá para pegar dias lindos, com preços um pouco melhores. Pode chover ocasionalmente, mas geralmente são chuvas rápidas.</li>
                <li><strong>Evite (junho a outubro):</strong> Temporada de monções. Chuvas mais frequentes e mar agitado podem comprometer passeios e mergulhos.</li>
            </ul>
            <p><strong>Dica:</strong> Se você está se casando no Brasil entre novembro e março, as Maldivas encaixam perfeitamente como destino de lua de mel logo após a cerimônia.</p>

            <h3>Escolhendo o Resort Ideal</h3>
            <p>Existem mais de 150 resorts nas Maldivas. Cada um com sua personalidade. Aqui estão os estilos principais para você escolher o que combina mais com vocês:</p>
            <ul>
                <li><strong>Luxo máximo (US$ 1.500+ por noite):</strong> Soneva Jani, St. Regis Maldives, Conrad Maldives. Overwater villas gigantes, piscina privativa, mordomo pessoal, gastronomia premiada.</li>
                <li><strong>Luxo acessível (US$ 800 a 1.500 por noite):</strong> Anantara Dhigu, Coco Bodu Hithi, Velassaru. Excelente custo-benefício, bangalôs lindos, ótima estrutura.</li>
                <li><strong>Romântico e intimista (US$ 600 a 1.000 por noite):</strong> Baros Maldives, Lily Beach, Constance Moofushi. Resorts menores, mais exclusivos, perfeitos para quem quer sossego total.</li>
            </ul>

            <p><strong>Critérios para escolher:</strong></p>
            <ul>
                <li>Prefere overwater villa (sobre a água) ou beach villa (na areia)?</li>
                <li>All-inclusive ou meia pensão com jantares especiais à la carte?</li>
                <li>Quer ilha pequena e íntima ou resort grande com várias opções de restaurante?</li>
                <li>Prefere acesso direto ao recife de coral ou praia paradisíaca?</li>
            </ul>

            <h3>O Que Fazer na Lua de Mel</h3>
            <ul>
                <li><strong>Mergulho e snorkel:</strong> As Maldivas têm alguns dos melhores pontos de mergulho do mundo. Você vai nadar com tartarugas, arraias-manta, tubarões de recife e milhares de peixes tropicais. Mesmo quem nunca mergulhou consegue fazer snorkel tranquilamente.</li>
                <li><strong>Passeio de barco ao pôr do sol:</strong> Navegue em um dhoni tradicional (barco maldivo) ou em um iate privativo enquanto o sol se põe no horizonte. Muitos resorts servem champanhe durante o passeio.</li>
                <li><strong>Jantar privativo:</strong> Mesa montada na praia, sob as estrelas, com chef preparando menu especial só para vocês. Ou jantar flutuante no meio do oceano. Ou ainda no sandbank, um banco de areia no meio do nada.</li>
                <li><strong>Spa para casal:</strong> Tratamentos com vista para o mar, massagens sincronizadas, banhos relaxantes. Puro momento zen a dois.</li>
                <li><strong>Excursão para ilha local:</strong> Conhecer vilarejos maldivos, entender a cultura, comprar artesanato. Contraste interessante com o luxo do resort.</li>
                <li><strong>Pesca noturna:</strong> Tradição local. Pescar à noite e o chef do resort prepara seu peixe para o jantar no dia seguinte.</li>
            </ul>

            <h3>Roteiro Sugestivo de 7 Dias</h3>
            <ul>
                <li><strong>Dias 1 e 2: Chegada e Adaptação</strong><br>Chegue, instale-se na villa, explore o resort com calma. Aproveite a praia privativa, faça snorkel no recife da casa, jante no restaurante principal.</li>
                <li><strong>Dias 3 e 4: Experiências Aquáticas</strong><br>Mergulho ou snorkel guiado. Passeio de caiaque. Stand-up paddle ao amanhecer. Aproveite o dia todo dentro e ao redor da água.</li>
                <li><strong>Dia 5: Relaxamento Total</strong><br>Spa pela manhã. Almoço na villa. Tarde lendo na rede sobre a água. Jantar privativo na praia.</li>
                <li><strong>Dia 6: Aventura</strong><br>Excursão para ilha habitada ou passeio de barco para ver golfinhos. Pesca ao entardecer. Jantar especial no restaurante subaquático (se o resort tiver).</li>
                <li><strong>Dia 7: Despedida</strong><br>Último mergulho de manhã. Café da manhã especial. Aproveite cada minuto antes do transfer para o aeroporto.</li>
            </ul>

            <h3>Dicas Práticas</h3>
            <ul>
                <li><strong>Documentos:</strong> Brasileiros não precisam de visto para até 30 dias. Apenas passaporte válido.</li>
                <li><strong>Voos:</strong> Não há voos diretos do Brasil. Conexões em Dubai (Emirates), Doha (Qatar), ou Istambul (Turkish) são as mais comuns. Tempo total de viagem: 20 a 24 horas.</li>
                <li><strong>Transfer para o resort:</strong> Pode ser de lancha rápida (15 min a 1h30) ou hidroavião (voos panorâmicos incríveis, mas só operam durante o dia). Alguns resorts incluem o transfer, outros cobram à parte.</li>
                <li><strong>Moeda:</strong> Rufiyaa maldiva, mas dólar americano é amplamente aceito. Leve cartão de crédito internacional.</li>
                <li><strong>Idioma:</strong> Dhivehi é o idioma local, mas todos os resorts falam inglês fluentemente.</li>
                <li><strong>Internet:</strong> A maioria dos resorts oferece Wi-Fi, mas pode ser lento. Aproveite para desconectar de verdade.</li>
                <li><strong>Gorjetas:</strong> Normalmente já incluídas na conta (taxa de serviço de 10%). Gorjeta extra é opcional, mas bem-vinda.</li>
            </ul>

            <h3>O Que Levar na Mala</h3>
            <p><strong>Não esqueça:</strong></p>
            <ul>
                <li>Protetor solar (muito protetor solar, de preferência biodegradável)</li>
                <li>Roupa de banho (pelo menos 3 peças para revezar)</li>
                <li>Roupas leves e confortáveis</li>
                <li>Um look mais arrumado para jantares especiais</li>
                <li>Câmera à prova d'água ou GoPro</li>
                <li>Máscara e snorkel próprios (se preferir, mas resorts fornecem)</li>
                <li>Repelente</li>
                <li>Medicamentos pessoais</li>
                <li>Adaptador universal de tomada</li>
            </ul>
            <p><strong>O que NÃO precisa levar:</strong> Secador, chapinha, chinelos (resort fornece tudo). E esqueça sapatos fechados, você vai viver de chinelo ou descalço.</p>

            <h3>Investimento: Quanto Custa Esse Sonho</h3>
            <p>Uma lua de mel de 7 dias nas Maldivas para um casal geralmente fica entre:</p>
            <ul>
                <li><strong>Econômico:</strong> US$ 8.000 a 12.000 (resort 4 estrelas, meia pensão, voos em classe econômica)</li>
                <li><strong>Confortável:</strong> US$ 15.000 a 25.000 (resort 5 estrelas, all-inclusive, voos em executiva ou econômica premium)</li>
                <li><strong>Luxo:</strong> US$ 30.000+ (resort 5 estrelas deluxe, overwater villa top, experiências exclusivas, voos primeira classe)</li>
            </ul>
            <p><em>Valores incluem passagens aéreas, hospedagem, refeições conforme plano escolhido e transfer. Não incluem passeios extras, spa e compras.</em></p>

            <h3>Vale Cada Centavo?</h3>
            <p>Lua de mel é um momento único. Não vai se repetir. E as Maldivas entregam uma experiência que nenhum outro destino consegue replicar.</p>
            <p>É acordar e dormir ouvindo o mar. É nadar em águas que parecem piscina natural. É ter privacidade absoluta para curtir esse momento só de vocês. É voltar para casa com histórias que vão contar para os filhos e netos.</p>
            <p>Não é só uma viagem. É o começo da vida de casados em um dos lugares mais lindos do planeta.</p>

            <div class="bg-pink-50 p-6 rounded-2xl border border-pink-100 mt-8">
                <p class="font-bold text-pink-800 mb-2">Pronto para transformar sua lua de mel em realidade?</p>
                <p class="mb-0 text-pink-700">Entre em contato e solicite um orçamento personalizado. Vamos planejar cada detalhe para que vocês vivam a experiência mais romântica e inesquecível das suas vidas. Porque momentos assim merecem ser perfeitos.</p>
            </div>
        `,
        image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Romance",
        date: "15 Set, 2025",
        author: "Mariana S.",
        authorId: "mariana",
        color: "text-pink-600 bg-pink-50 border-pink-200",
        rotate: "-rotate-1"
    },
    {
        id: 5,
        slug: "nova-york-no-natal",
        title: "Nova York no Natal",
        excerpt: "O guia completo para ver as luzes de Dyker Heights e patinar no Central Park.",
        content: `
            <p>Existe algo no ar de Nova York durante o Natal que não dá para explicar. Talvez seja a neve caindo suavemente sobre a Central Park. Ou as vitrines da Fifth Avenue transformadas em verdadeiras obras de arte. Ou ainda aquele cheiro de castanhas assadas misturado com chocolate quente que invade as esquinas.</p>
            <p>A verdade é que Nova York no Natal não é apenas um destino. É uma experiência que parece ter saído direto de um filme romântico, daqueles que você assiste repetidamente todo dezembro.</p>
            <p>Se você sempre sonhou em viver esse momento mágico, este roteiro foi feito para você.</p>

            <h3>Por Que Nova York no Natal é Tão Especial</h3>
            <p>Entre meados de novembro e início de janeiro, a cidade que nunca dorme se transforma completamente. Luzes piscam em cada quarteirão. Árvores de Natal gigantes aparecem em pontos icônicos. Pistas de patinação no gelo surgem no meio de arranha-céus.</p>
            <p>Mas o que realmente torna essa época única é a energia contagiante. Novaiorquinos correndo com sacolas de presentes. Turistas encantados fotografando tudo. Coros cantando canções natalinas nas estações de metrô. É impossível não se deixar envolver pela magia.</p>
            <p><strong>Melhor período:</strong> Final de novembro (após o Thanksgiving) até primeira semana de janeiro. Evite 24 e 25 de dezembro se quiser encontrar lojas e atrações abertas.</p>

            <h3>Roteiro de 5 Dias: Do Clássico ao Inesquecível</h3>

            <h4>Dia 1: Rockefeller Center e Fifth Avenue</h4>
            <p>Comece pelo cartão postal mais famoso do Natal nova-iorquino: a árvore do Rockefeller Center. Com mais de 22 metros de altura e milhares de luzes LED, ela é acesa oficialmente no início de dezembro em uma cerimônia transmitida ao vivo.</p>
            <p>Logo ao lado, a pista de patinação no gelo do Rockefeller Center espera por você. Sim, vai estar lotada. Sim, você provavelmente vai cair. Mas a experiência de patinar ali com os prédios ao redor iluminados não tem preço.</p>
            <p><strong>Depois da patinação:</strong> Caminhe pela Fifth Avenue admirando as vitrines das grandes lojas. Saks Fifth Avenue, Bergdorf Goodman, Tiffany & Co. Cada uma cria displays temáticos elaboradíssimos que valem a visita mesmo se você não for comprar nada.</p>
            <p><strong>Onde comer:</strong> Almoce no The Smith (perto do Lincoln Center) ou no Shake Shack para um hambúrguer clássico americano.</p>

            <h4>Dia 2: Bryant Park e Compras Natalinas</h4>
            <p>Bryant Park se transforma no Winter Village, um mercado de Natal gratuito com mais de 170 quiosques vendendo artesanato, decorações, comidas e bebidas quentes.</p>
            <p>A pista de patinação aqui é gratuita (você paga apenas o aluguel dos patins). Menos turística que a do Rockefeller, mas igualmente charmosa.</p>
            <p><strong>Aproveitando o dia:</strong> Visite a New York Public Library logo ao lado. Se tiver sorte e estiver nevando, a fachada com leões cobertos de neve é de tirar o fôlego.</p>
            <p>À tarde, explore as lojas de departamento. Macy's Herald Square tem vitrines animadas e uma seção inteira dedicada ao Natal.</p>
            <p><strong>Não perca:</strong> O espetáculo de luzes e música na fachada da Saks Fifth Avenue todas as noites (geralmente a cada 10 minutos após o anoitecer).</p>

            <h4>Dia 3: Central Park Nevado e Upper West Side</h4>
            <p>Acorde cedo e vá para a Central Park. Com sorte, você vai encontrar o parque coberto de neve, criando cenários dignos de filme.</p>
            <p><strong>Pontos imperdíveis:</strong></p>
            <ul>
                <li>Bethesda Fountain congelada</li>
                <li>Bow Bridge com vista para os prédios nevados</li>
                <li>The Mall, aquela alameda arborizada que fica mágica no inverno</li>
            </ul>
            <p>Se estiver muito frio, faça uma pausa no Loeb Boathouse para um chocolate quente com vista para o lago.</p>
            <p><strong>Final de tarde:</strong> Visite o American Museum of Natural History (sim, aquele do filme "Uma Noite no Museu"). A árvore de Natal do hall principal e as decorações natalinas valem a visita.</p>
            <p><strong>Jantar especial:</strong> Reserve no Tavern on the Green, restaurante dentro da Central Park com decoração natalina extravagante.</p>

            <h4>Dia 4: Brooklyn e DUMBO no Natal</h4>
            <p>Atravesse a Brooklyn Bridge a pé pela manhã. A vista de Manhattan com possíveis flocos de neve caindo é inesquecível.</p>
            <p>Do outro lado, explore o bairro DUMBO (Down Under the Manhattan Bridge Overpass). As ruas de paralelepípedos decoradas para o Natal têm um charme especial.</p>
            <p><strong>Experiências locais:</strong></p>
            <ul>
                <li>Brooklyn Flea Market (aos finais de semana)</li>
                <li>Chocolate quente na Jacques Torres Chocolate</li>
                <li>Passeio pelo Brooklyn Bridge Park com vista para o skyline</li>
            </ul>
            <p><strong>À noite:</strong> Volte para Manhattan e assista a um show da Broadway. "O Quebra-Nozes" no Lincoln Center é tradição natalina, mas qualquer musical transforma a noite em algo especial.</p>

            <h4>Dia 5: Compras de Última Hora e Despedida</h4>
            <p>Use a manhã para compras finais ou visitar pontos que ficaram pendentes.</p>
            <p><strong>Sugestões:</strong></p>
            <ul>
                <li>Century 21 para descontos em marcas famosas</li>
                <li>Chelsea Market para souvenirs gourmet</li>
                <li>Strand Book Store para livros únicos</li>
            </ul>
            <p><strong>Última experiência mágica:</strong> Termine o dia no Top of the Rock (observatório do Rockefeller Center) ao pôr do sol. Ver a cidade acender suas luzes natalinas de cima é o encerramento perfeito.</p>

            <h3>Experiências Extras Que Valem a Pena</h3>
            <ul>
                <li><strong>Radio City Music Hall:</strong> O espetáculo "Christmas Spectacular" com as Rockettes é tradição desde 1933.</li>
                <li><strong>Dyker Heights no Brooklyn:</strong> Bairro residencial onde moradores competem para ver quem faz a decoração natalina mais extravagante. Parece um filme, mas é real.</li>
                <li><strong>Grand Central Terminal:</strong> A estação decorada para o Natal, com árvore feita de cristais Swarovski, é linda e gratuita.</li>
                <li><strong>SoHo e Greenwich Village:</strong> Ruas arborizadas com luzes natalinas criam atmosfera intimista e romântica.</li>
            </ul>

            <h3>Dicas Práticas Para Aproveitar ao Máximo</h3>
            <ul>
                <li><strong>Clima:</strong> Prepare-se para temperaturas entre -5°C e 5°C. Neve é comum, mas não garantida. Leve casaco pesado, luvas, gorro e cachecol.</li>
                <li><strong>Ingressos antecipados:</strong> Broadway, patinação no Rockefeller e shows vendem rápido. Compre com pelo menos 2 semanas de antecedência.</li>
                <li><strong>Transporte:</strong> Metrô funciona 24h e é a forma mais prática de se locomover. Compre o MetroCard ilimitado de 7 dias.</li>
                <li><strong>Restaurantes:</strong> Reserve com antecedência, especialmente para jantares. Dezembro é alta temporada e lugares populares lotam.</li>
                <li><strong>Orçamento:</strong> Nova York no Natal não é barata. Preveja pelo menos US$ 200 por dia por pessoa (sem contar hotel e passagem) para aproveitar bem.</li>
            </ul>

            <h3>O Que Levar na Mala</h3>
            <p>Além das roupas de frio óbvias, não esqueça:</p>
            <ul>
                <li>Bateria portátil (celular descarrega rápido no frio)</li>
                <li>Mochila confortável para carregar compras</li>
                <li>Garrafa térmica para bebidas quentes</li>
                <li>Protetor labial (lábios ressecam muito)</li>
                <li>Calçados impermeáveis e antiderrapantes</li>
            </ul>

            <h3>A Magia Que Você Leva Para Casa</h3>
            <p>No final, não são só as fotos perfeitas ou os presentes comprados que ficam. É o sabor daquele chocolate quente tomado debaixo de neve. O brilho nos olhos de quem patina pela primeira vez. A sensação de estar dentro de um cenário natalino que você só via em filmes.</p>
            <p>Nova York no Natal mexe com algo dentro da gente. Te faz acreditar em magia novamente, nem que seja só por alguns dias.</p>

            <div class="bg-red-50 p-6 rounded-2xl border border-red-100 mt-8">
                <p class="font-bold text-red-800 mb-2">Pronto para viver essa experiência inesquecível?</p>
                <p class="mb-0 text-red-700">Entre em contato e solicite um orçamento personalizado para sua viagem a Nova York no Natal. Vamos planejar cada detalhe para que você volte com memórias que vão durar para sempre.</p>
            </div>
        `,
        image: "https://images.pexels.com/photos/35584616/pexels-photo-35584616.jpeg",
        category: "Sazonal",
        date: "10 Aug, 2025",
        author: "Carlos Viajante",
        authorId: "carlos",
        color: "text-red-600 bg-red-50 border-red-200",
        rotate: "rotate-1"
    },
    {
        id: 6,
        slug: "guia-definitivo-sobrevivencia-festivais",
        title: "Guia Definitivo de Sobrevivência em Festivais: Como Curtir Cada Momento como um Pro",
        excerpt: "Estratégias práticas, dicas de alimentação e o kit de sobrevivência essencial para aproveitar seu festival ao máximo.",
        content: `
            <p>Se você está se preparando para viver a energia de um grande festival, sabe que a experiência vai muito além dos shows. É uma maratona de música, movimento, emoções e descobertas. E contar com um bom planejamento faz toda a diferença para aproveitar tudo ao máximo. Pensando nisso, reunimos aqui um guia completo com estratégias práticas, dicas inteligentes e truques que realmente funcionam para tornar sua jornada mais leve, segura e inesquecível.</p>

            <p>Seja seu primeiro festival ou o décimo, este artigo foi feito para garantir que você chegue preparado e volte com memórias incríveis.</p>

            <h3>Planejamento é tudo (e economiza sua energia)</h3>
            <p>Ir para um festival sem um plano é como entrar em um labirinto no escuro. A experiência pode ser divertida, mas você aumenta (e muito) suas chances de perder shows importantes ou se cansar antes da hora.</p>
            <p>Antes de sair de casa, analise o mapa oficial do evento para entender onde ficam palcos, banheiros, áreas de alimentação e pontos de hidratação. Monte sua própria "rota estratégica", priorizando shows que você realmente não quer perder. Inclua pausas estratégicas para descanso, porque festivais podem durar o dia inteiro. E sempre estabeleça um ponto de encontro caso você ou o grupo se separem. Isso acontece MUITO.</p>
            <p>Esse planejamento simples economiza tempo, energia e evita estresse durante o festival.</p>

            <h3>Alimentação e energia: o combustível da sua experiência</h3>
            <p>Para aproveitar o festival do início ao fim, seu corpo precisa estar do seu lado. Isso significa comer bem antes de sair de casa, beber água constantemente, alternar momentos de movimento e descanso, e evitar longos períodos sem se alimentar.</p>
            <p>Carregar snacks rápidos também ajuda: barras de cereal, castanhas e frutas desidratadas são pequenos aliados que mantêm sua energia sempre estável. E muitas vezes salvam sua noite quando as filas de comida estão extensas.</p>

            <h3>O que levar: o kit de sobrevivência ideal</h3>
            <p>A mochila certa pode transformar sua experiência. Aqui está uma lista simples e funcional do essencial:</p>
            <ul>
                <li><strong>Proteção:</strong> Capa de chuva ou poncho, protetor solar e óculos de sol.</li>
                <li><strong>Hidratação:</strong> Garrafa d'água dobrável (se permitida no evento).</li>
                <li><strong>Tecnologia:</strong> Powerbank carregado (essencial!).</li>
                <li><strong>Acesso:</strong> Documento e ingresso em formato digital (salve offline!).</li>
                <li><strong>Conforto:</strong> Tênis confortável (esqueça sapato novo!) e tapa-ouvido ou protetor auricular.</li>
            </ul>
            <p>Tenha sempre o essencial. Nada mais, nada menos.</p>

            <h3>Dicas extras para uma experiência incrível</h3>
            <p>Aqui vão truques que somente quem já viveu muitos festivais conhece:</p>
            <ul>
                <li><strong>Chegue cedo</strong> para garantir lugares melhores em shows muito disputados.</li>
                <li><strong>Roupas leves</strong> e que permitam mobilidade são fundamentais.</li>
                <li><strong>Evite as laterais</strong> dos palcos se não quiser ficar apertado; procure regiões centrais para facilitar a locomoção entre palcos.</li>
                <li><strong>Baixe o app oficial</strong> para acompanhar horários atualizados em tempo real.</li>
            </ul>
            <p>Pequenos ajustes fazem uma grande diferença no seu dia.</p>

            <h3>A experiência começa bem antes do primeiro show</h3>
            <p>Com o preparo certo, qualquer festival se transforma em uma experiência memorável, da primeira música ao último acorde. E se você quiser aproveitar tudo isso com ainda mais tranquilidade, conforto e segurança, a Anhangá Viagens pode montar todo o seu pacote: ingressos, hospedagem, transporte e suporte completo antes, durante e depois do evento.</p>

            <div class="bg-orange-50 p-6 rounded-2xl border border-orange-100 mt-8">
                <p class="font-bold text-orange-800 mb-2">Quer viver seu próximo festival sem dor de cabeça?</p>
                <p class="mb-0 text-orange-700">Fale agora com a equipe da Anhangá Viagens e receba um orçamento personalizado, feito para o seu estilo e seu roteiro. <a href="https://wa.me/551152833309" target="_blank" rel="noopener noreferrer" class="font-bold underline hover:text-orange-900">Clique aqui para conversar</a> e começar o planejamento do seu festival dos sonhos.</p>
            </div>
        `,
        image: "https://images.pexels.com/photos/1306791/pexels-photo-1306791.jpeg",
        category: "Festivais",
        date: "24 Jan, 2026",
        author: "Equipe Anhangá",
        authorId: "equipe-anhanga",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        rotate: "rotate-1"
    }
];
