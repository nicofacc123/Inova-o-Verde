// Tema independente do login; a escolha manual tem prioridade sobre o sistema.
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
let preferredTheme = null;
try {
  const saved = localStorage.getItem('inovacao-verde-theme');
  if (saved === 'light' || saved === 'dark') preferredTheme = saved;
} catch (_) {}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.getElementById('theme-toggle');
  if (button) {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.title = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';
  }
}
function toggleTheme() {
  preferredTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(preferredTheme);
  try { localStorage.setItem('inovacao-verde-theme', preferredTheme); } catch (_) {}
}
function syncSystemTheme(event) {
  if (!preferredTheme) applyTheme(event.matches ? 'dark' : 'light');
}
if (themeMedia.addEventListener) themeMedia.addEventListener('change', syncSystemTheme);
else if (themeMedia.addListener) themeMedia.addListener(syncSystemTheme);
applyTheme(preferredTheme || (themeMedia.matches ? 'dark' : 'light'));

const MOBILE_MENU_BREAKPOINT = 860;

function closeNotifications(restoreFocus = false) {
  const panel = document.getElementById("notificacoes-painel");
  const button = document.getElementById("notificacoes-botao");
  const wasOpen = panel && !panel.hidden;
  if (panel) panel.hidden = true;
  button?.setAttribute("aria-expanded", "false");
  syncMobilePanels();
  if (restoreFocus && wasOpen) button?.focus({ preventScroll: true });
}

function syncMobilePanels() {
  const mobile = window.matchMedia(`(max-width: ${MOBILE_MENU_BREAKPOINT}px)`).matches;
  const menuOpen = document.getElementById("site-nav")?.classList.contains("open");
  const panel = document.getElementById("notificacoes-painel");
  const open = Boolean(mobile && (menuOpen || (panel && !panel.hidden)));
  const backdrop = document.getElementById("mobile-backdrop");
  if (backdrop) backdrop.hidden = !open;
  document.body.classList.toggle("mobile-panel-open", open);
}

function closeMobilePanels(restoreFocus = false) {
  const menuOpen = document.getElementById("site-nav")?.classList.contains("open");
  closeMobileMenu();
  closeNotifications(restoreFocus);
  if (restoreFocus && menuOpen) document.querySelector(".menu-toggle")?.focus({ preventScroll: true });
}

function showPage(pageId, updateHash = true, scroll = true) {
  const target = document.getElementById(pageId);
  if (!target?.classList.contains("page")) return;
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page === target));
  document.querySelectorAll("#site-nav a").forEach(a => {
    const active = a.dataset.page === pageId;
    a.classList.toggle("active-tab", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
    if (active) document.getElementById("mobile-page-label").textContent = a.textContent;
  });
  if (pageId === "perfil") document.getElementById("mobile-page-label").textContent = "Meu perfil";
  if (updateHash && window.location.hash !== `#${pageId}`) history.pushState(null, "", `#${pageId}`);
  closeMobilePanels();
  if (!scroll) return;
  const navHeight = document.querySelector(".nav-shell")?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth <= MOBILE_MENU_BREAKPOINT;
  window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  const heading = target.querySelector("h2");
  heading?.setAttribute("tabindex", "-1");
  heading?.focus({ preventScroll: true });
}

function atualizarAlturaMenuMobile() {
  const nav = document.getElementById("site-nav");
  const shell = document.querySelector(".nav-shell");
  if (!nav || !shell) return;
  const viewport = window.visualViewport;
  const bottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight);
  nav.style.setProperty("--menu-mobile-max-height", `${Math.max(0, Math.floor(bottom - shell.getBoundingClientRect().bottom - 8))}px`);
}

function setMobileMenu(open) {
  const nav = document.getElementById("site-nav");
  const button = document.querySelector(".menu-toggle");
  if (!nav || !button) return;
  const shouldOpen = Boolean(open) && window.innerWidth <= MOBILE_MENU_BREAKPOINT;
  if (shouldOpen) { closeNotifications(); atualizarAlturaMenuMobile(); }
  nav.classList.toggle("open", shouldOpen);
  button.classList.toggle("open", shouldOpen);
  button.setAttribute("aria-expanded", String(shouldOpen));
  button.setAttribute("aria-label", shouldOpen ? "Fechar menu" : "Abrir menu");
  document.body.classList.toggle("menu-mobile-aberto", shouldOpen);
  syncMobilePanels();
}
function toggleMenu() { setMobileMenu(!document.getElementById("site-nav")?.classList.contains("open")); }
function closeMobileMenu() { setMobileMenu(false); }

function scrollToLearningBlock(id) {
  if (window.innerWidth <= MOBILE_MENU_BREAKPOINT) document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "auto" });
}

function restorePageFromHash() {
  const id = window.location.hash.slice(1) || "home";
  const target = document.getElementById(id);
  if (target?.classList.contains("page") && !target.classList.contains("active")) showPage(id, false);
}

window.addEventListener("popstate", restorePageFromHash);
window.addEventListener("hashchange", restorePageFromHash);
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img").forEach(img => img.addEventListener("error", () => img.classList.add("image-error")));
  const id = window.location.hash.slice(1);
  const valid = document.getElementById(id)?.classList.contains("page");
  showPage(valid ? id : "home", false, Boolean(valid));
});
document.getElementById("site-nav")?.addEventListener("click", event => {
  const link = event.target.closest("a[data-page]");
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
  event.preventDefault();
  showPage(link.dataset.page);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobilePanels(true);
});
document.addEventListener("click", event => {
  if (!document.getElementById("site-nav")?.classList.contains("open")) return;
  if (!event.target.closest("#site-nav, .menu-toggle")) closeMobileMenu();
});
function resizeMobileNavigation() {
  if (window.innerWidth > MOBILE_MENU_BREAKPOINT) closeMobileMenu();
  else if (document.getElementById("site-nav")?.classList.contains("open")) atualizarAlturaMenuMobile();
  syncMobilePanels();
}
window.addEventListener("resize", resizeMobileNavigation, { passive: true });
window.visualViewport?.addEventListener("resize", resizeMobileNavigation, { passive: true });
document.getElementById("notificacoes-botao")?.addEventListener("click", closeMobileMenu, true);
const notificationsPanel = document.getElementById("notificacoes-painel");
if (notificationsPanel) new MutationObserver(syncMobilePanels).observe(notificationsPanel, { attributes: true, attributeFilter: ["hidden"] });

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const flashcardDeck = [
  {
    "topic": "Plástico reciclado",
    "question": "O que pode ser feito com plástico reciclado?",
    "title": "Novos produtos",
    "answer": "O plástico reciclado pode virar novos objetos e, em processos específicos, blocos para construção."
  },
  {
    "topic": "Tecnologia limpa",
    "question": "Como a energia solar pode ajudar no tratamento da água?",
    "title": "Energia a favor da água",
    "answer": "Tecnologias específicas usam a energia do sol para tratar a água. Apenas deixar a água ao sol não garante que ela seja potável."
  },
  {
    "topic": "Economia circular",
    "question": "O que acontece na economia circular?",
    "title": "Os materiais continuam em uso",
    "answer": "Produtos são mantidos, consertados e reutilizados. A reciclagem permite que materiais voltem ao ciclo produtivo."
  },
  {
    "topic": "Economia local",
    "question": "Por que escolher fornecedores locais?",
    "title": "Apoio à região",
    "answer": "A compra local fortalece a economia regional e pode reduzir distâncias de transporte e suas emissões."
  },
  {
    "topic": "Uso consciente",
    "question": "Como economizar água e energia no dia a dia?",
    "title": "Evite desperdícios",
    "answer": "Apague luzes desnecessárias, use lâmpadas LED e conserte vazamentos. Água da chuva pode ser aproveitada para usos não potáveis."
  },
  {
    "topic": "Gestão de resíduos",
    "question": "O que uma boa gestão de resíduos pode incluir?",
    "title": "Reduzir, separar e destinar",
    "answer": "Evite gerar resíduos, separe os recicláveis e destine os orgânicos à compostagem quando possível."
  },
  {
    "topic": "Empreendedorismo",
    "question": "O que significa empreender de forma sustentável?",
    "title": "Equilibrar três dimensões",
    "answer": "Buscar viabilidade econômica considerando também os impactos ambientais e o bem-estar das pessoas."
  },
  {
    "topic": "Os 3 Rs",
    "question": "Quais são os três Rs da sustentabilidade?",
    "title": "Reduzir, reutilizar e reciclar",
    "answer": "Reduza o consumo e o desperdício; reutilize o que ainda serve; encaminhe materiais para reciclagem."
  },
  {
    "topic": "Consumo consciente",
    "question": "Qual é a primeira pergunta antes de comprar algo?",
    "title": "Eu realmente preciso disso?",
    "answer": "Avalie a necessidade, a durabilidade e a possibilidade de consertar, compartilhar ou reutilizar algo que já existe."
  },
  {
    "topic": "Menos descartáveis",
    "question": "Como reduzir o uso de plástico e papel?",
    "title": "Troque hábitos",
    "answer": "Use garrafas e sacolas reutilizáveis, evite embalagens desnecessárias e prefira documentos digitais quando fizer sentido."
  },
  {
    "topic": "Embalagens",
    "question": "Uma embalagem reciclável será sempre reciclada?",
    "title": "Depende da destinação",
    "answer": "Ela precisa ser separada e aceita pelo sistema de coleta e reciclagem disponível na região."
  },
  {
    "topic": "Reutilização",
    "question": "Qual é a diferença entre reutilizar e reciclar?",
    "title": "Novo uso ou transformação",
    "answer": "Reutilizar é usar novamente, como reaproveitar um pote. Reciclar envolve transformar o material em matéria-prima ou outro produto."
  },
  {
    "topic": "Coleta seletiva",
    "question": "Por que separar os resíduos?",
    "title": "Facilitar o aproveitamento",
    "answer": "Separar os materiais ajuda a evitar contaminação e facilita o trabalho de coleta, triagem e reciclagem."
  },
  {
    "topic": "Compostagem",
    "question": "O que é compostagem?",
    "title": "Resíduos orgânicos viram composto",
    "answer": "É a decomposição controlada de materiais orgânicos, como restos vegetais, para produzir um composto que pode melhorar o solo."
  },
  {
    "topic": "Desperdício de alimentos",
    "question": "Como evitar jogar comida fora?",
    "title": "Planeje e aproveite",
    "answer": "Planeje compras, armazene corretamente e priorize os alimentos que precisam ser consumidos primeiro."
  },
  {
    "topic": "Energia renovável",
    "question": "O que caracteriza uma fonte de energia renovável?",
    "title": "Reposição por processos naturais",
    "answer": "O sol e o vento são exemplos. Renovável não significa ausência de impactos: produção e instalação também precisam ser avaliadas."
  },
  {
    "topic": "Eficiência energética",
    "question": "O que significa usar energia com eficiência?",
    "title": "Mesmo serviço, menos consumo",
    "answer": "É realizar uma tarefa usando menos energia, como iluminar um ambiente com equipamentos mais eficientes."
  },
  {
    "topic": "Água",
    "question": "Por que consertar um pequeno vazamento faz diferença?",
    "title": "O desperdício se acumula",
    "answer": "Mesmo uma perda pequena, quando contínua, pode desperdiçar muita água ao longo dos dias."
  },
  {
    "topic": "Educação ambiental",
    "question": "O que a educação ambiental ensina em uma empresa?",
    "title": "Transformar conhecimento em prática",
    "answer": "Ajuda colaboradores e clientes a entender impactos e adotar atitudes como reduzir desperdícios e separar resíduos."
  },
  {
    "topic": "Colaboração",
    "question": "Por que empreendedores e comunidades devem colaborar?",
    "title": "Somar conhecimentos e recursos",
    "answer": "A troca de experiências ajuda a encontrar soluções adequadas à realidade local e a fortalecer iniciativas sustentáveis."
  },
  {
    "topic": "Reparo",
    "question": "Por que consertar antes de substituir?",
    "title": "Prolongar a vida útil",
    "answer": "Quando o reparo é viável e seguro, ele evita descarte precoce e reduz a necessidade de fabricar um novo produto."
  },
  {
    "topic": "Logística reversa",
    "question": "O que é logística reversa?",
    "title": "O produto faz o caminho de volta",
    "answer": "É o retorno de produtos e materiais após o uso para reaproveitamento ou destinação adequada, por canais de recebimento."
  },
  {
    "topic": "Lixo eletrônico",
    "question": "Onde descartar aparelhos eletrônicos sem uso?",
    "title": "Em pontos de recebimento adequados",
    "answer": "Procure programas de devolução ou coleta de eletrônicos na sua região. Apague seus dados pessoais antes de entregar o aparelho."
  },
  {
    "topic": "Medir para melhorar",
    "question": "Como saber se uma ação sustentável está funcionando?",
    "title": "Acompanhe os resultados",
    "answer": "Compare indicadores antes e depois, como consumo de água, gasto de energia e quantidade de resíduos gerados."
  }
];

let currentFlashcard = 0;
let flashcardIsFlipped = false;

function setFlashcardSide(flipped) {
  flashcardIsFlipped = flipped;
  const card = document.getElementById("study-card");
  card.classList.toggle("is-flipped", flipped);
  card.setAttribute("aria-pressed", String(flipped));
  const item = flashcardDeck[currentFlashcard];
  card.setAttribute("aria-label", flipped
    ? `${item.title}. ${item.answer} Toque para ver a pergunta.`
    : `${item.question} Toque para ver a resposta.`);
  document.getElementById("study-front").setAttribute("aria-hidden", String(flipped));
  document.getElementById("study-back").setAttribute("aria-hidden", String(!flipped));
  document.getElementById("study-flip").textContent = flipped ? "Ver pergunta" : "Ver resposta";
}

function renderFlashcard() {
  const item = flashcardDeck[currentFlashcard];
  const card = document.getElementById("study-card");
  // Troca de cartão sempre começa pela pergunta, sem exibir o verso anterior.
  card.classList.add("is-changing");
  setFlashcardSide(false);
  document.getElementById("study-topic").textContent = item.topic;
  document.getElementById("study-question").textContent = item.question;
  document.getElementById("study-answer-title").textContent = item.title;
  document.getElementById("study-answer").textContent = item.answer;
  document.getElementById("study-counter").textContent = `Cartão ${currentFlashcard + 1} de ${flashcardDeck.length}`;
  const progress = document.getElementById("study-progress");
  progress.max = flashcardDeck.length;
  progress.value = currentFlashcard + 1;
  document.getElementById("study-prev").disabled = currentFlashcard === 0;
  document.getElementById("study-next").textContent = currentFlashcard === flashcardDeck.length - 1 ? "Concluir ✓" : "Próximo →";
  void card.offsetWidth;
  card.classList.remove("is-changing");
}

function startFlashcards() {
  currentFlashcard = 0;
  document.getElementById("study-start").hidden = true;
  document.getElementById("study-end").hidden = true;
  document.getElementById("study-session").hidden = false;
  renderFlashcard();
  scrollToLearningBlock("study-session");
  document.getElementById("study-card").focus({ preventScroll: true });
}

function flipFlashcard() {
  if (document.getElementById("study-session").hidden) return;
  setFlashcardSide(!flashcardIsFlipped);
}

function moveFlashcard(direction) {
  if (document.getElementById("study-session").hidden || ![-1, 1].includes(direction)) return;
  const next = currentFlashcard + direction;
  if (next < 0) return;
  if (next >= flashcardDeck.length) {
    document.getElementById("study-session").hidden = true;
    document.getElementById("study-end").hidden = false;
    document.getElementById("study-restart").focus({ preventScroll: true });
    return;
  }
  currentFlashcard = next;
  renderFlashcard();
  scrollToLearningBlock("study-session");
  document.getElementById("study-card").focus({ preventScroll: true });
}

function closeFlashcards() {
  document.getElementById("study-session").hidden = true;
  document.getElementById("study-end").hidden = true;
  document.getElementById("study-start").hidden = false;
  document.getElementById("study-start-button").focus({ preventScroll: true });
}

const quizQuestions = [
  // Banco de perguntas: cada rodada sorteia 10 sem repetição.
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

  // Perguntas sobre as boas práticas e os casos de sucesso do projeto
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
let quizAdvanceTimer = null;
const QUIZ_ADVANCE_DELAY = 1500;

function updateTracker() {
  document.getElementById("score-tracker").innerText =
    `Questão ${currentQuestion + 1} de ${activeQuizQuestions.length} • Pontos: ${score}`;
}

function startQuiz() {
  clearTimeout(quizAdvanceTimer);
  quizAdvanceTimer = null;
  currentQuestion = 0;
  score = 0;
  answered = false;

  // Sorteia uma cópia do banco: não repete perguntas na mesma rodada.
  // Entre rodadas, algumas perguntas podem aparecer novamente.
  activeQuizQuestions = shuffleArray([...quizQuestions])
    .slice(0, Math.min(QUIZ_QUESTION_COUNT, quizQuestions.length));

  document.getElementById("quiz-start").hidden = true;
  document.getElementById("quiz-result").hidden = true;
  document.getElementById("quiz-question").hidden = false;
  showQuestion();
  scrollToLearningBlock("quiz");
}

function showQuestion() {
  answered = false;
  document.getElementById("quiz-feedback").hidden = true;
  updateTracker();

  const q = activeQuizQuestions[currentQuestion];
  document.getElementById("q-text").innerText = q.q;

  let optsWithIndex = q.options.map((o, i) => ({ text: o, index: i }));
  optsWithIndex = shuffleArray(optsWithIndex);
  const correctIndexAfterShuffle = optsWithIndex.findIndex(opt => opt.index === q.answer);
  const opts = document.getElementById("q-options");
  opts.innerHTML = "";

  optsWithIndex.forEach((opt, pos) => {
    const div = document.createElement("button");
    div.type = "button";
    div.className = "option";
    div.innerText = opt.text;

    const select = () => selectOption(pos, correctIndexAfterShuffle);
    div.onclick = select;


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
    el.disabled = true;
    if (idx === correctIndex) el.classList.add("correct");
    if (idx === i && idx !== correctIndex) el.classList.add("wrong");
  });

  if (i === correctIndex) score++;
  updateTracker();

  const feedback = document.getElementById("quiz-feedback");
  feedback.textContent = i === correctIndex
    ? "Você acertou! Avançando automaticamente…"
    : `Resposta correta: ${opts[correctIndex].innerText}`;
  feedback.hidden = false;
  document.getElementById("next-btn").hidden = true;
  document.getElementById("finish-btn").hidden = true;
  quizAdvanceTimer = setTimeout(() => {
    quizAdvanceTimer = null;
    if (currentQuestion < activeQuizQuestions.length - 1) nextQuestion();
    else finishQuiz();
  }, QUIZ_ADVANCE_DELAY);
}

function nextQuestion() {
  clearTimeout(quizAdvanceTimer);
  quizAdvanceTimer = null;
  if (!answered || currentQuestion >= activeQuizQuestions.length - 1) return;
  currentQuestion++;
  showQuestion();
  scrollToLearningBlock("quiz");
}

function finishQuiz() {
  clearTimeout(quizAdvanceTimer);
  quizAdvanceTimer = null;
  if (!answered || currentQuestion !== activeQuizQuestions.length - 1) return;
  document.getElementById("quiz-question").hidden = true;
  document.getElementById("quiz-result").hidden = false;
  const text = document.getElementById("result-text");
  text.innerHTML = `Você acertou <strong>${score}</strong> de <strong>${activeQuizQuestions.length}</strong> perguntas. `;
  if (score === activeQuizQuestions.length) text.innerHTML += "Perfeito!";
  else if (score >= Math.ceil(activeQuizQuestions.length / 2)) text.innerHTML += "Muito bem!";
  else text.innerHTML += "Continue estudando e tente novamente.";
  scrollToLearningBlock("quiz");
}

function resetQuiz() {
  clearTimeout(quizAdvanceTimer);
  quizAdvanceTimer = null;
  currentQuestion = 0;
  score = 0;
  answered = false;
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
