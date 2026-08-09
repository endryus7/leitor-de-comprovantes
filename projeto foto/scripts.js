let pedido = `
Analise a imagem deste comprovante de compra.

Responda em UMA ÚNICA LINHA.

A resposta deve seguir EXATAMENTE este formato:

EMOJI|ESTABELECIMENTO|PRODUTO|VALOR|PRODUTO|VALOR|TOTAL

IMPORTANTE:

- O primeiro caractere da resposta DEVE ser um dos emojis abaixo.
- NÃO coloque nenhuma letra, número ou outro caractere antes do emoji.
- Depois do primeiro | coloque SOMENTE o nome do estabelecimento.
- Depois coloque cada produto e seu valor em pares separados por |.
- O ÚLTIMO valor deve ser o TOTAL pago.
- Não escreva R$ nos valores.
- Use ponto como separador decimal.
- Sempre use duas casas decimais.
- Não escreva explicações.
- Não use markdown.
- Não use negrito.
- Não coloque quebras de linha.

Categorias:

🛒 Mercado
🚗 Transporte
🍔 Comida
💊 Saúde
🎉 Lazer
🏠 Casa
💸 Outros

Exemplo:

🍔|Padaria Pão Quente|Pão|5.00|Leite|4.50|9.50

Outro exemplo:

🛒|Supermercado Exemplo|Arroz|25.90|Leite|5.50|31.40

Se não conseguir identificar um produto, NÃO invente o nome.

Se o comprovante tiver desconto, considere o valor efetivamente pago no total.

Confira o TOTAL diretamente no comprovante.
`;

async function lerFoto() {

  const foto = document.querySelector(".foto").files[0];

  if (!foto) {
    return;
  }

  try {

    console.log("Lendo comprovante...");

    const resposta = await puter.ai.chat(pedido, foto);

    const texto = resposta.message.content.trim();

    console.log("Resposta da IA:", texto);

    criarGasto(texto);

  } catch (erro) {

    console.error("Erro ao ler comprovante:", erro);

    alert("Não foi possível ler o comprovante.");

  }

  // Permite selecionar a mesma foto novamente
  document.querySelector(".foto").value = "";

}

let totalGasto = 0;
let quantidadeComprovantes = 0;

async function criarGasto(texto) {

  const partes = texto.split("|");

  if (partes.length < 4) {

    console.error("Resposta inválida:", texto);

    alert("A IA não conseguiu interpretar o comprovante.");

    return;
  }

  // IDENTIFICAR CATEGORIA
  const categorias = [
    "🛒",
    "🚗",
    "🍔",
    "💊",
    "🎉",
    "🏠",
    "💸"
  ];

  let emoji = partes[0].trim();

  // Se a IA colocou alguma coisa antes do emoji,
  // encontramos o emoji correto.
  const emojiEncontrado = categorias.find(e =>
    texto.includes(e)
  );

  if (emojiEncontrado) {
    emoji = emojiEncontrado;
  } else {
    emoji = "💸";
  }

  // ESTABELECIMENTO
  let estabelecimento = partes[1].trim();

  // Remove possíveis emojis ou caracteres estranhos
  estabelecimento = estabelecimento
    .replace(/^[^a-zA-ZÀ-ÿ0-9]+/, "")
    .trim();

  
  // TOTAL
  const ultimo = partes[partes.length - 1]
    .replace(",", ".")
    .trim();

  const total = parseFloat(ultimo);

  if (isNaN(total)) {

    console.error("Total inválido:", ultimo);

    alert("Não consegui identificar o valor total.");

    return;
  }

  // PRODUTOS
  let produtosHTML = "";

  // Começa no índice 2
  // e termina antes do último elemento
  for (let i = 2; i < partes.length - 1; i += 2) {

    const nome = partes[i]?.trim();

    const valorTexto = partes[i + 1]?.trim();

    if (!nome || !valorTexto) {
      continue;
    }

    const valor = parseFloat(
      valorTexto.replace(",", ".")
    );

    if (isNaN(valor)) {
      continue;
    }

    produtosHTML += `
      <div class="produto">

        <span>${nome}</span>

        <strong>
          R$ ${valor.toFixed(2).replace(".", ",")}
        </strong>

      </div>
    `;
  }

  // ID ÚNICO
  const id = "gasto-" + Date.now();

  // CARD
  const card = `
    <div
      class="gasto"
      id="${id}"
      data-valor="${total}"
    >

      <div class="gasto-topo">

        <div class="estabelecimento">

          <span class="categoria">
            ${emoji}
          </span>

          <span>
            ${estabelecimento}
          </span>

        </div>

        <div class="valor-total">

          R$ ${total.toFixed(2).replace(".", ",")}

        </div>

      </div>

      <div class="produtos">

        ${produtosHTML}

      </div>

      <button
        class="excluir"
        onclick="excluirGasto('${id}')"
      >
        🗑️ Excluir comprovante
      </button>

    </div>
  `;

  // Colocar no início da lista
  document
    .querySelector(".lista")
    .insertAdjacentHTML(
      "afterbegin",
      card
    );

  // ATUALIZAR TOTAL
  totalGasto += total;

  quantidadeComprovantes++;

  atualizarResumo();
}

// Excluir gasto
function excluirGasto(id) {

  const card = document.getElementById(id);

  if (!card) {
    return;
  }

  // Pegar o valor salvo no card
  const valor = parseFloat(
    card.dataset.valor
  );

  // Tirar do total
  totalGasto -= valor;

  // Evitar pequenos erros de casas decimais
  totalGasto = Math.max(0, totalGasto);

  // Diminuir quantidade
  quantidadeComprovantes--;

  // Remover card
  card.remove();

  // Atualizar tela
  atualizarResumo();
}

// Atualizar resumo
function atualizarResumo() {

  document.querySelector("#totalGasto").textContent =
    `R$ ${totalGasto.toFixed(2).replace(".", ",")}`;

  document.querySelector("#contador").textContent =
    `${quantidadeComprovantes} ${
      quantidadeComprovantes === 1
        ? "comprovante lido"
        : "comprovantes lidos"
    }`;
}
