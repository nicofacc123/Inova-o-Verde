// Comunidade - Firebase Authentication + Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  reload
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAiBmXnCxsFyWEvJxE5LZydQSvCahoWRn0",
  authDomain: "inovacaoverde-8dec8.firebaseapp.com",
  projectId: "inovacaoverde-8dec8",
  storageBucket: "inovacaoverde-8dec8.firebasestorage.app",
  messagingSenderId: "673592779541",
  appId: "1:673592779541:web:b03bf46dba419c180bbf1c",
  measurementId: "G-P4PW6FNLDT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
auth.languageCode = "pt-BR";

// -------------------------------
// Elementos
// -------------------------------
const areaAuth = document.getElementById("area-auth");
const painelCadastro = document.getElementById("painel-cadastro");
const painelLogin = document.getElementById("painel-login");
const usuarioLogado = document.getElementById("usuario-logado");
const criarPublicacao = document.getElementById("criar-publicacao");
const verificacaoEmail = document.getElementById("verificacao-email");
const emailVerificacao = document.getElementById("email-verificacao");
const nomeUsuario = document.getElementById("nome-usuario");
const mensagem = document.getElementById("comunidade-mensagem");
const feed = document.getElementById("feed-comunidade");
const postTipo = document.getElementById("post-tipo");
const campoLocal = document.getElementById("campo-local");
const postLocal = document.getElementById("post-local");
const postTexto = document.getElementById("post-texto");
const contadorTexto = document.getElementById("contador-texto");

let filtroAtual = "todos";
let postsSalvos = [];
let unsubscribeReacoes = [];
let unsubscribeContagemComentarios = [];
const estatisticasPosts = new Map();

function mostrarMensagem(texto, tipo = "sucesso", tempo = 5000) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem-comunidade mensagem-${tipo}`;
  if (tempo) {
    window.setTimeout(() => {
      if (mensagem.textContent === texto) {
        mensagem.textContent = "";
        mensagem.className = "";
      }
    }, tempo);
  }
}

function mostrarPainelAuth(modo) {
  const cadastro = modo === "cadastro";
  painelCadastro.hidden = !cadastro;
  painelLogin.hidden = cadastro;
}

document.getElementById("ir-login").addEventListener("click", () => mostrarPainelAuth("login"));
document.getElementById("ir-cadastro").addEventListener("click", () => mostrarPainelAuth("cadastro"));

function urlRetornoVerificacao() {
  return `${window.location.origin}${window.location.pathname}#comunidade`;
}

async function enviarVerificacao(usuario) {
  await sendEmailVerification(usuario, {
    url: urlRetornoVerificacao(),
    handleCodeInApp: false
  });
}

// -------------------------------
// Cadastro + verificação de e-mail
// -------------------------------
document.getElementById("form-cadastro").addEventListener("submit", async (event) => {
  event.preventDefault();

  const nome = document.getElementById("cadastro-nome").value.trim();
  const email = document.getElementById("cadastro-email").value.trim();
  const senha = document.getElementById("cadastro-senha").value;

  try {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(credencial.user, { displayName: nome });
    await enviarVerificacao(credencial.user);
    atualizarInterfaceUsuario(credencial.user);
    event.target.reset();
    mostrarMensagem("Conta criada! Enviamos um e-mail de verificação. Abra sua caixa de entrada e confirme o endereço.");
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    const mensagens = {
      "auth/email-already-in-use": "Este e-mail já possui uma conta. Faça login.",
      "auth/invalid-email": "Digite um e-mail válido.",
      "auth/weak-password": "Escolha uma senha mais forte.",
      "auth/operation-not-allowed": "O login por e-mail e senha não está ativado no Firebase.",
      "auth/unauthorized-continue-uri": "O domínio do site ainda não está autorizado no Firebase Authentication.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente novamente.",
      "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente."
    };
    mostrarMensagem(mensagens[erro.code] || `Não foi possível criar a conta (${erro.code || "erro desconhecido"}).`, "erro", 8000);
  }
});

// -------------------------------
// Login
// -------------------------------
document.getElementById("form-login").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;

  try {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    await reload(credencial.user);
    atualizarInterfaceUsuario(credencial.user);
    event.target.reset();

    if (credencial.user.emailVerified) {
      mostrarMensagem("Login realizado com sucesso!");
    } else {
      mostrarMensagem("Login realizado. Verifique seu e-mail para poder publicar, comentar e votar.", "aviso", 8000);
    }
  } catch (erro) {
    console.error("Erro no login:", erro);
    mostrarMensagem("E-mail ou senha incorretos.", "erro");
  }
});

// -------------------------------
// Verificação
// -------------------------------
document.getElementById("btn-reenviar-verificacao").addEventListener("click", async () => {
  const usuario = auth.currentUser;
  if (!usuario) return;

  try {
    await enviarVerificacao(usuario);
    mostrarMensagem("E-mail de verificação reenviado. Confira também a caixa de spam.");
  } catch (erro) {
    console.error("Erro ao reenviar verificação:", erro);
    const texto = erro.code === "auth/too-many-requests"
      ? "Você solicitou muitos e-mails em pouco tempo. Tente novamente mais tarde."
      : `Não foi possível reenviar o e-mail (${erro.code || "erro"}).`;
    mostrarMensagem(texto, "erro", 8000);
  }
});

document.getElementById("btn-ja-verifiquei").addEventListener("click", async () => {
  await conferirVerificacao(true);
});

async function conferirVerificacao(mostrarRetorno = false) {
  const usuario = auth.currentUser;
  if (!usuario) return false;

  try {
    await reload(usuario);

    if (usuario.emailVerified) {
      // Atualiza o token para as regras do Firestore também enxergarem email_verified=true.
      await usuario.getIdToken(true);
      atualizarInterfaceUsuario(usuario);
      if (mostrarRetorno) mostrarMensagem("E-mail verificado! Agora você pode participar da comunidade. ✅");
      return true;
    }

    if (mostrarRetorno) mostrarMensagem("O e-mail ainda não aparece como verificado. Clique no link que chegou na sua caixa de entrada e tente novamente.", "aviso", 8000);
    return false;
  } catch (erro) {
    console.error("Erro ao conferir verificação:", erro);
    if (mostrarRetorno) mostrarMensagem("Não foi possível conferir a verificação agora.", "erro");
    return false;
  }
}

window.addEventListener("focus", () => {
  if (auth.currentUser && !auth.currentUser.emailVerified) conferirVerificacao(false);
});

// -------------------------------
// Sessão
// -------------------------------
document.getElementById("btn-sair").addEventListener("click", async () => {
  await signOut(auth);
  mostrarPainelAuth("login");
  mostrarMensagem("Você saiu da sua conta.");
});

onAuthStateChanged(auth, async (usuario) => {
  if (usuario) {
    try { await reload(usuario); } catch (_) {}
  }
  atualizarInterfaceUsuario(usuario);
});

function atualizarInterfaceUsuario(usuario) {
  if (!usuario) {
    areaAuth.hidden = false;
    usuarioLogado.hidden = true;
    verificacaoEmail.hidden = true;
    criarPublicacao.hidden = true;
  } else {
    areaAuth.hidden = true;
    usuarioLogado.hidden = false;
    nomeUsuario.textContent = usuario.displayName || usuario.email || "Usuário";
    emailVerificacao.textContent = usuario.email || "seu e-mail";

    const verificado = usuario.emailVerified === true;
    verificacaoEmail.hidden = verificado;
    criarPublicacao.hidden = !verificado;
  }

  renderizarPosts();
}

function usuarioPodeInteragir() {
  const usuario = auth.currentUser;
  if (!usuario) {
    mostrarPainelAuth("login");
    areaAuth.hidden = false;
    mostrarMensagem("Faça login para participar da comunidade.", "aviso");
    areaAuth.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  if (!usuario.emailVerified) {
    verificacaoEmail.hidden = false;
    mostrarMensagem("Verifique seu e-mail antes de publicar, comentar ou votar.", "aviso", 7000);
    verificacaoEmail.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  return true;
}

// -------------------------------
// Nova publicação
// -------------------------------
postTipo.addEventListener("change", () => {
  const lixo = postTipo.value === "lixo";
  campoLocal.hidden = !lixo;
  postLocal.required = lixo;
});

postTexto.addEventListener("input", () => {
  contadorTexto.textContent = `${postTexto.value.length} / 1500`;
});

document.getElementById("form-publicacao").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!usuarioPodeInteragir()) return;

  const usuario = auth.currentUser;
  const tipo = postTipo.value;
  const titulo = document.getElementById("post-titulo").value.trim();
  const texto = postTexto.value.trim();
  const local = postLocal.value.trim();

  if (!titulo || !texto) return mostrarMensagem("Preencha título e conteúdo.", "erro");
  if (tipo === "lixo" && !local) return mostrarMensagem("Informe pelo menos o bairro e a cidade.", "erro");

  try {
    await addDoc(collection(db, "posts"), {
      uid: usuario.uid,
      autor: usuario.displayName || "Usuário",
      tipo,
      titulo,
      texto,
      local: tipo === "lixo" ? local : "",
      criadoEm: serverTimestamp()
    });

    event.target.reset();
    campoLocal.hidden = true;
    contadorTexto.textContent = "0 / 1500";
    mostrarMensagem("Publicação enviada! 🌱");
  } catch (erro) {
    console.error("Erro ao publicar:", erro);
    mostrarMensagem(`Não foi possível publicar (${erro.code || "erro"}).`, "erro", 8000);
  }
});

// -------------------------------
// Filtros
// -------------------------------
document.querySelectorAll(".filtro-post").forEach(botao => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".filtro-post").forEach(btn => btn.classList.remove("ativo"));
    botao.classList.add("ativo");
    filtroAtual = botao.dataset.filter;
    renderizarPosts();
  });
});

// -------------------------------
// Feed em tempo real
// -------------------------------
const consultaPosts = query(collection(db, "posts"), orderBy("criadoEm", "desc"));

onSnapshot(consultaPosts, snapshot => {
  postsSalvos = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  renderizarPosts();
}, erro => {
  console.error("Erro ao carregar feed:", erro);
  feed.textContent = `Não foi possível carregar as publicações (${erro.code || "erro"}).`;
});

function limparListenersFeed() {
  unsubscribeReacoes.forEach(unsubscribe => unsubscribe());
  unsubscribeReacoes = [];
  unsubscribeContagemComentarios.forEach(unsubscribe => unsubscribe());
  unsubscribeContagemComentarios = [];
}

function obterEstatisticas(postId) {
  if (!estatisticasPosts.has(postId)) {
    estatisticasPosts.set(postId, {
      likes: 0,
      dislikes: 0,
      score: 0,
      comentarios: 0
    });
  }
  return estatisticasPosts.get(postId);
}

function popularidadeDoCard(card) {
  const score = Number(card.dataset.score || 0);
  const comentarios = Number(card.dataset.comentarios || 0);
  // Relevância simples e transparente: saldo de votos + número de comentários.
  return score + comentarios;
}

function reordenarCardsPorPopularidade() {
  if (!feed) return;

  const cards = [...feed.querySelectorAll('.post-comunidade')];
  cards.sort((a, b) => {
    const popularidadeA = popularidadeDoCard(a);
    const popularidadeB = popularidadeDoCard(b);

    if (popularidadeB !== popularidadeA) return popularidadeB - popularidadeA;

    const scoreA = Number(a.dataset.score || 0);
    const scoreB = Number(b.dataset.score || 0);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const comentariosA = Number(a.dataset.comentarios || 0);
    const comentariosB = Number(b.dataset.comentarios || 0);
    if (comentariosB !== comentariosA) return comentariosB - comentariosA;

    return Number(b.dataset.criado || 0) - Number(a.dataset.criado || 0);
  });

  cards.forEach(card => feed.appendChild(card));
}

function renderizarPosts() {
  if (!feed) return;
  limparListenersFeed();
  feed.replaceChildren();

  const posts = filtroAtual === "todos"
    ? [...postsSalvos]
    : postsSalvos.filter(post => post.tipo === filtroAtual);

  if (posts.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "feed-vazio";
    vazio.textContent = "Nenhuma publicação encontrada.";
    feed.appendChild(vazio);
    return;
  }

  // Usa as estatísticas que já conhecemos para evitar que o feed pule sem necessidade.
  posts.sort((a, b) => {
    const ea = obterEstatisticas(a.id);
    const eb = obterEstatisticas(b.id);
    const pa = ea.score + ea.comentarios;
    const pb = eb.score + eb.comentarios;
    if (pb !== pa) return pb - pa;
    if (eb.score !== ea.score) return eb.score - ea.score;
    if (eb.comentarios !== ea.comentarios) return eb.comentarios - ea.comentarios;
    const da = a.criadoEm?.toMillis?.() || 0;
    const db = b.criadoEm?.toMillis?.() || 0;
    return db - da;
  });

  posts.forEach(post => feed.appendChild(criarCardPost(post)));
}

function criarCardPost(post) {
  const card = document.createElement("article");
  card.className = "post-comunidade";
  card.dataset.minhaReacao = "";

  const stats = obterEstatisticas(post.id);
  card.dataset.score = String(stats.score);
  card.dataset.comentarios = String(stats.comentarios);
  card.dataset.criado = String(post.criadoEm?.toMillis?.() || Date.now());

  const cabecalho = document.createElement("div");
  cabecalho.className = "post-cabecalho";

  const avatar = document.createElement("div");
  avatar.className = "post-avatar";
  avatar.textContent = (post.autor || "U").charAt(0).toUpperCase();

  const autorArea = document.createElement("div");
  autorArea.className = "post-autor";
  const autor = document.createElement("strong");
  autor.textContent = post.autor || "Usuário";
  const data = document.createElement("span");
  data.className = "post-data";
  data.textContent = formatarData(post.criadoEm);
  autorArea.append(autor, data);
  cabecalho.append(avatar, autorArea);

  const tipo = document.createElement("span");
  tipo.className = "post-tipo";
  tipo.textContent = nomeTipo(post.tipo);

  const titulo = document.createElement("h4");
  titulo.textContent = post.titulo || "Sem título";

  const texto = document.createElement("div");
  texto.className = "post-texto";
  texto.textContent = post.texto || "";

  card.append(cabecalho, tipo, titulo, texto);

  if (post.tipo === "lixo" && post.local) {
    const local = document.createElement("div");
    local.className = "post-local";
    local.textContent = `📍 ${post.local}`;
    card.appendChild(local);
  }

  // VOTAÇÃO ESTILO REDDIT + COMENTÁRIOS
  const acoes = document.createElement("div");
  acoes.className = "post-acoes";

  const votacao = criarControleVotacao();

  const btnComentar = document.createElement("button");
  btnComentar.type = "button";
  btnComentar.className = "btn-comentar";
  btnComentar.setAttribute("aria-expanded", "false");

  const iconeComentario = document.createElement("span");
  iconeComentario.textContent = "💬";
  const textoComentario = document.createElement("span");
  textoComentario.textContent = "Comentários";
  const contadorComentarios = document.createElement("span");
  contadorComentarios.className = "comentarios-contador";
  contadorComentarios.textContent = String(stats.comentarios);
  btnComentar.append(iconeComentario, textoComentario, contadorComentarios);

  acoes.append(votacao.container, btnComentar);
  card.appendChild(acoes);

  votacao.cima.addEventListener("click", () => registrarReacao(post.id, "like", card));
  votacao.baixo.addEventListener("click", () => registrarReacao(post.id, "dislike", card));
  observarReacoes(post.id, card, votacao);
  observarContagemComentarios(post.id, card, contadorComentarios);

  const areaComentarios = document.createElement("div");
  areaComentarios.className = "area-comentarios";
  areaComentarios.hidden = true;
  const lista = document.createElement("div");
  lista.className = "lista-comentarios";
  areaComentarios.appendChild(lista);

  btnComentar.addEventListener("click", async () => {
    areaComentarios.hidden = !areaComentarios.hidden;
    btnComentar.setAttribute("aria-expanded", String(!areaComentarios.hidden));
    if (!areaComentarios.hidden) await carregarComentarios(post.id, lista);
  });

  if (auth.currentUser?.emailVerified) {
    const formulario = document.createElement("form");
    formulario.className = "form-comentario";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 500;
    input.placeholder = "Escreva um comentário...";
    input.required = true;
    const botao = document.createElement("button");
    botao.type = "submit";
    botao.textContent = "Enviar";
    formulario.append(input, botao);

    formulario.addEventListener("submit", async event => {
      event.preventDefault();
      if (!usuarioPodeInteragir()) return;
      const comentario = input.value.trim();
      if (!comentario) return;

      try {
        const usuario = auth.currentUser;
        await addDoc(collection(db, "posts", post.id, "comentarios"), {
          uid: usuario.uid,
          autor: usuario.displayName || "Usuário",
          texto: comentario,
          criadoEm: serverTimestamp()
        });
        input.value = "";
        await carregarComentarios(post.id, lista);
      } catch (erro) {
        console.error("Erro ao comentar:", erro);
        mostrarMensagem(`Não foi possível comentar (${erro.code || "erro"}).`, "erro", 8000);
      }
    });

    areaComentarios.appendChild(formulario);
  } else {
    const aviso = document.createElement("p");
    aviso.className = "comentario-bloqueado";
    aviso.textContent = auth.currentUser
      ? "Verifique seu e-mail para comentar."
      : "Faça login e verifique seu e-mail para comentar.";
    areaComentarios.appendChild(aviso);
  }

  card.appendChild(areaComentarios);
  return card;
}

function criarControleVotacao() {
  const container = document.createElement("div");
  container.className = "controle-votos";
  container.setAttribute("aria-label", "Votação da publicação");

  const cima = document.createElement("button");
  cima.type = "button";
  cima.className = "botao-voto voto-cima";
  cima.setAttribute("aria-label", "Votar positivo");
  cima.setAttribute("aria-pressed", "false");

  const setaCima = document.createElement("span");
  setaCima.className = "icone-voto";
  setaCima.textContent = "▲";

  const contadorLikes = document.createElement("span");
  contadorLikes.className = "contador-voto contador-like";
  contadorLikes.textContent = "0";

  cima.append(setaCima, contadorLikes);

  const separador = document.createElement("span");
  separador.className = "separador-votos";
  separador.setAttribute("aria-hidden", "true");

  const baixo = document.createElement("button");
  baixo.type = "button";
  baixo.className = "botao-voto voto-baixo";
  baixo.setAttribute("aria-label", "Votar negativo");
  baixo.setAttribute("aria-pressed", "false");

  const setaBaixo = document.createElement("span");
  setaBaixo.className = "icone-voto";
  setaBaixo.textContent = "▼";

  const contadorDislikes = document.createElement("span");
  contadorDislikes.className = "contador-voto contador-dislike";
  contadorDislikes.textContent = "0";

  baixo.append(setaBaixo, contadorDislikes);

  container.append(cima, separador, baixo);
  return { container, cima, baixo, contadorLikes, contadorDislikes };
}

function observarReacoes(postId, card, votacao) {
  const ref = collection(db, "posts", postId, "reacoes");
  const unsubscribe = onSnapshot(ref, snapshot => {
    let likes = 0;
    let dislikes = 0;
    let minhaReacao = "";
    const uid = auth.currentUser?.uid;

    snapshot.forEach(item => {
      const reacao = item.data();
      if (reacao.tipo === "like") likes++;
      if (reacao.tipo === "dislike") dislikes++;
      if (uid && item.id === uid) minhaReacao = reacao.tipo;
    });

    const score = likes - dislikes;
    const stats = obterEstatisticas(postId);
    stats.likes = likes;
    stats.dislikes = dislikes;
    stats.score = score;

    votacao.contadorLikes.textContent = String(likes);
    votacao.contadorDislikes.textContent = String(dislikes);
    votacao.cima.title = `${likes} voto(s) positivo(s)`;
    votacao.baixo.title = `${dislikes} voto(s) negativo(s)`;
    card.dataset.score = String(score);
    card.dataset.minhaReacao = minhaReacao;

    votacao.cima.classList.toggle("ativo", minhaReacao === "like");
    votacao.baixo.classList.toggle("ativo", minhaReacao === "dislike");
    votacao.cima.setAttribute("aria-pressed", String(minhaReacao === "like"));
    votacao.baixo.setAttribute("aria-pressed", String(minhaReacao === "dislike"));

    reordenarCardsPorPopularidade();
  }, erro => console.error("Erro ao carregar reações:", erro));

  unsubscribeReacoes.push(unsubscribe);
}

function observarContagemComentarios(postId, card, contador) {
  const ref = collection(db, "posts", postId, "comentarios");
  const unsubscribe = onSnapshot(ref, snapshot => {
    const total = snapshot.size;
    const stats = obterEstatisticas(postId);
    stats.comentarios = total;
    contador.textContent = String(total);
    card.dataset.comentarios = String(total);
    reordenarCardsPorPopularidade();
  }, erro => console.error("Erro ao contar comentários:", erro));

  unsubscribeContagemComentarios.push(unsubscribe);
}

async function registrarReacao(postId, tipo, card) {
  if (!usuarioPodeInteragir()) return;

  const usuario = auth.currentUser;
  const ref = doc(db, "posts", postId, "reacoes", usuario.uid);
  const atual = card.dataset.minhaReacao || "";

  try {
    if (atual === tipo) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        uid: usuario.uid,
        tipo,
        criadoEm: serverTimestamp()
      });
    }
  } catch (erro) {
    console.error("Erro na reação:", erro);
    mostrarMensagem(`Não foi possível registrar seu voto (${erro.code || "erro"}).`, "erro", 8000);
  }
}

async function carregarComentarios(postId, elemento) {
  elemento.textContent = "Carregando comentários...";

  try {
    const consulta = query(
      collection(db, "posts", postId, "comentarios"),
      orderBy("criadoEm", "asc")
    );
    const resultado = await getDocs(consulta);
    elemento.replaceChildren();

    if (resultado.empty) {
      const vazio = document.createElement("span");
      vazio.textContent = "Nenhum comentário ainda.";
      elemento.appendChild(vazio);
      return;
    }

    resultado.forEach(item => {
      const comentario = item.data();
      const caixa = document.createElement("div");
      caixa.className = "comentario";
      const nome = document.createElement("strong");
      nome.textContent = comentario.autor || "Usuário";
      const corpo = document.createElement("span");
      corpo.textContent = `: ${comentario.texto || ""}`;
      caixa.append(nome, corpo);
      elemento.appendChild(caixa);
    });
  } catch (erro) {
    console.error("Erro ao carregar comentários:", erro);
    elemento.textContent = "Erro ao carregar comentários.";
  }
}

function nomeTipo(tipo) {
  return {
    ideia: "💡 Ideia sustentável",
    discussao: "💬 Discussão",
    lixo: "🗑️ Problema ambiental"
  }[tipo] || "🌱 Publicação";
}

function formatarData(timestamp) {
  if (!timestamp?.toDate) return "Agora";
  return timestamp.toDate().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
