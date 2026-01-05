## Partes Articuladas da Nave

A nave é composta por 4 partes articuladas principais:

- **2 asas** (esquerda e direita): criadas pela função `makeWing`, cada uma adicionada como grupo articulado ao corpo principal.
- **2 motores** (esquerdo e direito): criados pela função `createEngine`, também adicionados como grupos separados.

Essas partes podem ser manipuladas independentemente, permitindo movimentos e animações específicas para cada componente.

# Explicação do Código — nave_espaço

## index.html

Arquivo principal da interface. Responsável por estruturar a página, carregar os scripts (`main.js`) e os estilos (`style.css`).

## main.js

Contém toda a lógica do projeto:

- **Configuração inicial:** Criação do canvas, definição de variáveis globais e carregamento de recursos (imagens, planets, etc.).
- **Função de loop:** Função chamada repetidamente (ex: `draw` ou `update`) para atualizar e desenhar a cena.
- **Desenho de objetos:** Funções para desenhar a nave, obstáculos, fundo, efeitos visuais, etc.
- **Controle do jogador:** Gerencia entradas do teclado para mover a nave ou interagir com o ambiente.
- **Colisões:** Lógica para detectar colisões entre a nave e obstáculos ou outros elementos.
- **Pontuação e estados do jogo:** Controle de score, game over, reinício, níveis, etc.

**O que foi usado:**

- JavaScript puro (Vanilla JS) para toda a lógica do jogo.
- API Canvas 2D do HTML5 para desenhar gráficos e sprites.
- Manipulação de eventos de teclado com `addEventListener` para controlar a nave.
- Estruturas condicionais e funções para lógica de colisão, pontuação e estados do jogo.

## style.css

Define o visual da aplicação, incluindo posicionamento, cores, animações e transições dos elementos da interface e do jogo.

**O que foi usado:**

- CSS3 para estilização dos elementos da página e do canvas.
- Propriedades de layout (flex, margin, padding) para posicionamento.
- Cores, fontes e possíveis animações para melhorar a experiência visual.

## images/

Pasta com imagens utilizadas no projeto(texturas planetas e fundo).
