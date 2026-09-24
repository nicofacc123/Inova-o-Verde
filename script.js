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

function toggleMenu(button) {
  const nav = document.getElementById("site-nav");
  const open = nav.classList.toggle("open");
  button.classList.toggle("open", open);
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

function closeMobileMenu() {
  const nav = document.getElementById("site-nav");
  const button = document.querySelector(".menu-toggle");
  if (!nav || !button) return;

  nav.classList.remove("open");
  button.classList.remove("open");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Abrir menu");
}

// Fecha o menu mobile imediatamente ao escolher uma página.
document.querySelectorAll("#site-nav a").forEach(link => {
  link.addEventListener("click", () => {
    closeMobileMenu();
  });
});

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
    options: ["Carvão mineral", "Energia das ondas", "Petróleo"],
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
    options: ["Solar", "Petróleo", "Eólica"],
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
    options: ["Brasil", "Japão", "Suécia"],
    answer: 2
  }
];

let currentQuestion = 0;
let score = 0;
let answered = false;

function updateTracker() {
  document.getElementById("score-tracker").innerText =
    `Questão ${currentQuestion + 1} de ${quizQuestions.length} • Pontos: ${score}`;
}

function startQuiz() {
  currentQuestion = 0;
  score = 0;
  answered = false;

  document.getElementById("quiz-start").hidden = true;
  document.getElementById("quiz-result").hidden = true;
  document.getElementById("quiz-question").hidden = false;
  showQuestion();
}

function showQuestion() {
  answered = false;
  updateTracker();

  const q = quizQuestions[currentQuestion];
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
    if (currentQuestion < quizQuestions.length - 1) {
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
  text.innerHTML = `Você acertou <strong>${score}</strong> de <strong>${quizQuestions.length}</strong> perguntas. `;

  if (score === quizQuestions.length) text.innerHTML += "Perfeito!";
  else if (score >= Math.ceil(quizQuestions.length / 2)) text.innerHTML += "Muito bem!";
  else text.innerHTML += "Continue estudando e tente novamente.";
}

function resetQuiz() {
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
