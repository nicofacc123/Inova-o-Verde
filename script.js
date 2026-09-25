document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img").forEach(img => {
    img.addEventListener("error", () => {
      img.classList.add("image-error");
    });
  });

  // Abre diretamente a seção indicada na URL, caso exista.
  const hash = window.location.hash.replace("#", "");
  if (hash && document.getElementById(hash)?.classList.contains("page")) {
    showPage(hash, false);
  } else {
    showPage("home", false);
  }
});

function showPage(pageId, updateHash = true) {
  const target = document.getElementById(pageId);
  if (!target) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });
  target.classList.add("active");

  document.querySelectorAll("nav a").forEach(a => {
    const active = a.dataset.page === pageId;
    a.classList.toggle("active-tab", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  if (updateHash) {
    history.replaceState(null, "", `#${pageId}`);
  }

  closeMobileMenu();

  const navHeight = document.querySelector(".nav-shell")?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 24;
  const reduzirMovimento =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 720px)").matches;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: reduzirMovimento ? "auto" : "smooth"
  });
}

const MOBILE_MENU_BREAKPOINT = 860;

function atualizarAlturaMenuMobile() {
  const nav = document.getElementById("site-nav");
  const shell = document.querySelector(".nav-shell");
  if (!nav || !shell) return;

  const viewportHeight =
    window.visualViewport?.height ||
    window.innerHeight ||
    document.documentElement.clientHeight;

  const shellRect = shell.getBoundingClientRect();
  const espacoAbaixo = Math.max(
    160,
    Math.floor(viewportHeight - shellRect.bottom)
  );

  nav.style.setProperty("--menu-mobile-max-height", `${espacoAbaixo}px`);
}

function setMobileMenu(open) {
  const nav = document.getElementById("site-nav");
  const button = document.querySelector(".menu-toggle");
  if (!nav || !button) return;

  const shouldOpen =
    Boolean(open) &&
    window.matchMedia(`(max-width: ${MOBILE_MENU_BREAKPOINT}px)`).matches;

  if (shouldOpen) {
    atualizarAlturaMenuMobile();
  }

  nav.classList.toggle("open", shouldOpen);
  button.classList.toggle("open", shouldOpen);
  button.setAttribute("aria-expanded", String(shouldOpen));
  button.setAttribute("aria-label", shouldOpen ? "Fechar menu" : "Abrir menu");
  document.body.classList.toggle("menu-mobile-aberto", shouldOpen);

  if (shouldOpen) {
    const painel = document.getElementById("notificacoes-painel");
    const sino = document.getElementById("notificacoes-botao");

    if (painel) painel.hidden = true;
    sino?.setAttribute("aria-expanded", "false");
  }
}

function toggleMenu() {
  const nav = document.getElementById("site-nav");
  if (!nav) return;
  setMobileMenu(!nav.classList.contains("open"));
}

function closeMobileMenu() {
  setMobileMenu(false);
}


/* Menu mobile: fecha fora, no Escape, ao ampliar a tela e ao abrir notificações. */
document.addEventListener("click", event => {
  const nav = document.getElementById("site-nav");
  const button = document.querySelector(".menu-toggle");

  if (!nav?.classList.contains("open") || !button) return;
  if (nav.contains(event.target) || button.contains(event.target)) return;

  closeMobileMenu();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobileMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > MOBILE_MENU_BREAKPOINT) {
    closeMobileMenu();
    return;
  }

  if (document.getElementById("site-nav")?.classList.contains("open")) {
    atualizarAlturaMenuMobile();
  }
}, { passive: true });

window.visualViewport?.addEventListener("resize", () => {
  if (document.getElementById("site-nav")?.classList.contains("open")) {
    atualizarAlturaMenuMobile();
  }
}, { passive: true });

document.getElementById("notificacoes-botao")?.addEventListener(
  "click",
  closeMobileMenu,
  true
);

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function toggleFlashcard(card) {
  const virado = card.classList.toggle("virado");
  card.setAttribute("aria-pressed", String(virado));
}

const quizQuestions = [
  // Perguntas que já existiam no site
  {
    q: "O que é economia circular?",
    options: [
      "Modelo de reduzir, reutilizar e reciclar recursos",
      "Economia que cresce em círculo",
      "Só vender produtos circulares"
    ],
    answer: 0
  },
  {
    q: "Qual vantagem dos blocos de plástico reciclado?",
    options: [
      "São mais leves e reduzem custos de transporte",
      "Nunca quebram",
      "Não precisam de mão de obra"
    ],
    answer: 0
  },
  {
    q: "O que empreendedores sustentáveis priorizam?",
    options: [
      "Lucro acima de tudo",
      "Impacto social e ambiental além do lucro",
      "Evitar tecnologia"
    ],
    answer: 1
  },
  {
    q: "Qual benefício da agricultura urbana?",
    options: [
      "Mais alimentos locais e frescos",
      "Aumenta emissão de CO2",
      "Acaba com áreas verdes"
    ],
    answer: 0
  },
  {
    q: "Por que o bambu é considerado sustentável?",
    options: [
      "Cresce rápido e se regenera facilmente",
      "Não precisa de água",
      "É mais caro que madeira"
    ],
    answer: 0
  },
  {
    q: "Qual dessas é uma fonte de energia renovável?",
    options: [
      "Carvão mineral",
      "Energia das ondas",
      "Petróleo"
    ],
    answer: 1
  },
  {
    q: "Qual é o principal objetivo da coleta seletiva?",
    options: [
      "Separar os resíduos para facilitar a reciclagem",
      "Deixar o lixo mais bonito",
      "Acabar com o uso de sacolas plásticas"
    ],
    answer: 0
  },
  {
    q: "O que significa o princípio dos 3Rs?",
    options: [
      "Reduzir, Reutilizar e Reciclar",
      "Reparar, Recarregar e Recriar",
      "Revisar, Reduzir e Renovar"
    ],
    answer: 0
  },
  {
    q: "Qual dessas energias NÃO é renovável?",
    options: [
      "Solar",
      "Petróleo",
      "Eólica"
    ],
    answer: 1
  },
  {
    q: "O que é compostagem?",
    options: [
      "Transformar restos orgânicos em adubo",
      "Reutilizar garrafas de plástico",
      "Produzir energia a partir de carvão"
    ],
    answer: 0
  },
  {
    q: "Por que plantar árvores ajuda o planeta?",
    options: [
      "Elas absorvem gás carbônico (CO₂)",
      "Elas produzem mais plástico",
      "Elas gastam muita água"
    ],
    answer: 0
  },
  {
    q: "Qual país é conhecido por reciclar mais de 90% do seu lixo?",
    options: [
      "Brasil",
      "Japão",
      "Suécia"
    ],
    answer: 2
  },

  // Novas perguntas
  {
    q: "O que significa empreender de forma sustentável?",
    options: [
      "Buscar apenas o lucro.",
      "Equilibrar crescimento econômico, meio ambiente e bem-estar social.",
      "Aumentar o consumo de recursos naturais.",
      "Evitar qualquer tipo de inovação."
    ],
    answer: 1
  },
  {
    q: "Qual prática ajuda a reduzir o uso de plástico e papel?",
    options: [
      "Utilizar alternativas digitais e reutilizáveis.",
      "Usar mais produtos descartáveis.",
      "Aumentar o consumo de papel.",
      "Jogar materiais recicláveis no lixo comum."
    ],
    answer: 0
  },
  {
    q: "O que são embalagens sustentáveis?",
    options: [
      "Embalagens feitas exclusivamente de plástico.",
      "Embalagens que não podem ser recicladas.",
      "Opções recicláveis ou biodegradáveis.",
      "Embalagens usadas apenas para aumentar o consumo."
    ],
    answer: 2
  },
  {
    q: "Qual é uma vantagem de utilizar fornecedores locais?",
    options: [
      "Aumentar a distância do transporte.",
      "Aumentar a poluição.",
      "Diminuir a economia regional.",
      "Valorizar a economia regional e reduzir a poluição do transporte."
    ],
    answer: 3
  },
  {
    q: "Qual atitude ajuda a economizar energia e água?",
    options: [
      "Deixar equipamentos ligados o tempo todo.",
      "Usar lâmpadas LED e reaproveitar água da chuva.",
      "Desperdiçar água.",
      "Aumentar o consumo de energia."
    ],
    answer: 1
  },
  {
    q: "O que a educação ambiental pode ensinar?",
    options: [
      "Práticas sustentáveis para colaboradores e clientes.",
      "Formas de aumentar o desperdício.",
      "Como evitar a reciclagem.",
      "Como aumentar o consumo de recursos."
    ],
    answer: 0
  },
  {
    q: "Qual prática faz parte da gestão de resíduos?",
    options: [
      "Misturar todos os tipos de lixo.",
      "Jogar resíduos em rios.",
      "Implementar coleta seletiva e compostagem.",
      "Aumentar a quantidade de lixo produzido."
    ],
    answer: 2
  },
  {
    q: "O que é economia circular?",
    options: [
      "Descartar produtos rapidamente.",
      "Reutilizar e transformar materiais para diminuir desperdícios.",
      "Usar recursos naturais sem preocupação.",
      "Evitar a reciclagem."
    ],
    answer: 1
  },
  {
    q: "Em que os blocos feitos com plástico podem ser utilizados?",
    options: [
      "Somente para fabricar alimentos.",
      "Apenas para produzir papel.",
      "Para substituir computadores.",
      "Como materiais de construção."
    ],
    answer: 3
  },
  {
    q: "Quem criou uma tecnologia para tratar água de cisterna usando luz solar?",
    options: [
      "Anna Luísa Beserra Santos.",
      "Fatemah Alzelzela.",
      "Nzambi Matee.",
      "Lefteris Arapakis."
    ],
    answer: 0
  },
  {
    q: "Qual empresa foi fundada por Anna Luísa Beserra Santos?",
    options: [
      "Eco Star.",
      "Enaleia.",
      "Safe Drinking Water For All (SDW).",
      "Gjenje Makers."
    ],
    answer: 2
  },
  {
    q: "O que a organização Eco Star faz?",
    options: [
      "Produz veículos.",
      "Coleta e recicla resíduos.",
      "Fabrica computadores.",
      "Produz combustíveis."
    ],
    answer: 1
  },
  {
    q: "Qual era um dos objetivos de Fatemah Alzelzela?",
    options: [
      "Aumentar a produção de lixo.",
      "Incentivar o uso de plástico descartável.",
      "Reduzir a reciclagem.",
      "Promover a gestão sustentável de resíduos."
    ],
    answer: 3
  },
  {
    q: "O que Lefteris Arapakis percebeu nas redes de pesca?",
    options: [
      "Elas estavam coletando mais plástico do que peixe.",
      "Elas não coletavam nenhum resíduo.",
      "Elas estavam capturando somente peixes grandes.",
      "Elas não precisavam ser utilizadas."
    ],
    answer: 0
  },
  {
    q: "O que a Enaleia ensina aos pescadores?",
    options: [
      "A fabricar barcos.",
      "A produzir combustível.",
      "A pescar resíduos plásticos e levá-los para reciclagem.",
      "A aumentar a quantidade de plástico no mar."
    ],
    answer: 2
  },
  {
    q: "Quem criou uma máquina que mistura plástico e areia?",
    options: [
      "Anna Luísa Beserra Santos.",
      "Nzambi Matee.",
      "Fatemah Alzelzela.",
      "Lefteris Arapakis."
    ],
    answer: 1
  },
  {
    q: "O que é produzido com plástico e areia no projeto de Nzambi Matee?",
    options: [
      "Tijolos/blocos para construção.",
      "Garrafas de vidro.",
      "Papel reciclado.",
      "Painéis solares."
    ],
    answer: 0
  },
  {
    q: "Aproximadamente quantos blocos a empresa de Nzambi Matee fabrica por dia?",
    options: [
      "150.",
      "500.",
      "1.500.",
      "15.000."
    ],
    answer: 2
  },
  {
    q: "Por que a colaboração é importante no empreendedorismo sustentável?",
    options: [
      "Porque impede a troca de ideias.",
      "Porque permite compartilhar ideias, recursos e experiências.",
      "Porque aumenta o desperdício.",
      "Porque diminui o apoio entre empreendedores."
    ],
    answer: 1
  },
  {
    q: "Qual é uma consequência da colaboração entre empreendedores e comunidades?",
    options: [
      "Aumento da poluição.",
      "Maior desperdício de recursos.",
      "Redução das práticas sustentáveis.",
      "Uma economia local mais forte e uma produção mais sustentável."
    ],
    answer: 3
  }
];

const QUIZ_QUESTION_COUNT = 10;
let activeQuizQuestions = [];

let currentQuestion = 0;
let score = 0;
let answered = false;

function updateTracker() {
  document.getElementById("score-tracker").innerText =
    `Questão ${currentQuestion + 1} de ${activeQuizQuestions.length} • Pontos: ${score}`;
}

function startQuiz() {
  currentQuestion = 0;
  score = 0;
  answered = false;

  // Cada tentativa recebe 10 perguntas diferentes, escolhidas aleatoriamente.
  activeQuizQuestions = shuffleArray([...quizQuestions])
    .slice(0, Math.min(QUIZ_QUESTION_COUNT, quizQuestions.length));

  document.getElementById("quiz-start").hidden = true;
  document.getElementById("quiz-result").hidden = true;
  document.getElementById("quiz-question").hidden = false;
  showQuestion();
}

function showQuestion() {
  answered = false;
  updateTracker();

  const q = activeQuizQuestions[currentQuestion];
  document.getElementById("q-text").innerText = q.q;

  let optsWithIndex = q.options.map((o, i) => ({ text: o, index: i }));
  optsWithIndex = shuffleArray(optsWithIndex);
  const correctIndexAfterShuffle = optsWithIndex.findIndex(opt => opt.index === q.answer);
  const opts = document.getElementById("q-options");
  opts.innerHTML = "";

  optsWithIndex.forEach((opt, pos) => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerText = opt.text;
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");

    const select = () => selectOption(pos, correctIndexAfterShuffle);
    div.onclick = select;
    div.onkeydown = event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    };

    opts.appendChild(div);
  });

  document.getElementById("next-btn").hidden = true;
  document.getElementById("finish-btn").hidden = true;
}

function selectOption(i, correctIndex) {
  if (answered) return;
  answered = true;

  const opts = document.querySelectorAll("#q-options .option");
  opts.forEach((el, idx) => {
    el.style.pointerEvents = "none";
    el.setAttribute("tabindex", "-1");
    if (idx === correctIndex) el.classList.add("correct");
    if (idx === i && idx !== correctIndex) el.classList.add("wrong");
  });

  if (i === correctIndex) score++;
  updateTracker();

  setTimeout(() => {
    if (currentQuestion < activeQuizQuestions.length - 1) {
      currentQuestion++;
      showQuestion();
    } else {
      finishQuiz();
    }
  }, 700);
}

function nextQuestion() {
  currentQuestion++;
  showQuestion();
}

function finishQuiz() {
  document.getElementById("quiz-question").hidden = true;
  document.getElementById("quiz-result").hidden = false;

  const text = document.getElementById("result-text");
  text.innerHTML = `Você acertou <strong>${score}</strong> de <strong>${activeQuizQuestions.length}</strong> perguntas. `;

  if (score === activeQuizQuestions.length) text.innerHTML += "Perfeito!";
  else if (score >= Math.ceil(activeQuizQuestions.length / 2)) text.innerHTML += "Muito bem!";
  else text.innerHTML += "Continue estudando e tente novamente.";
}

function resetQuiz() {
  activeQuizQuestions = [];
  document.getElementById("quiz-result").hidden = true;
  document.getElementById("quiz-question").hidden = true;
  document.getElementById("quiz-start").hidden = false;
}

function filtrarCasos(filtro, botao) {
  const casos = document.querySelectorAll("#lista-casos .caso-sucesso");
  const botoes = document.querySelectorAll(".filtro-caso");
  const mensagemVazia = document.getElementById("sem-casos");
  let quantidadeVisivel = 0;

  casos.forEach(caso => {
    const tipo = caso.dataset.tipo;
    const regiao = caso.dataset.regiao;

    const mostrar =
      filtro === "todos" ||
      (filtro === "brasil" && tipo === "brasil") ||
      filtro === tipo ||
      filtro === regiao;

    caso.hidden = !mostrar;
    if (mostrar) quantidadeVisivel++;
  });

  botoes.forEach(btn => {
    btn.classList.remove("ativo");
    btn.setAttribute("aria-pressed", "false");
  });

  if (botao) {
    botao.classList.add("ativo");
    botao.setAttribute("aria-pressed", "true");
  }

  mensagemVazia.hidden = quantidadeVisivel !== 0;
}
