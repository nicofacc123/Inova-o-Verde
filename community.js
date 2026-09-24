// Comunidade - Firebase Authentication + Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
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
// Administradores
// O ID apenas escolhe a conta interna. A senha NÃO fica no código.
// -------------------------------
const ADMIN_LOGIN_MAP = {
  "NV-R9Y8J9": { email: "admin.nicolas@inovacaoverde.app", nome: "Nícolas" },
  "RL-RLXVN9": { email: "admin.rillary@inovacaoverde.app", nome: "Rillary" },
  "IS-V58L38": { email: "admin.ismael@inovacaoverde.app", nome: "Ismael" }
};

const ADMIN_EMAILS = new Set(
  Object.values(ADMIN_LOGIN_MAP).map(admin => admin.email.toLowerCase())
);

function obterAdminAtual(usuario = auth.currentUser) {
  if (!usuario?.email) return null;
  const email = usuario.email.toLowerCase();
  if (!ADMIN_EMAILS.has(email)) return null;

  const entrada = Object.entries(ADMIN_LOGIN_MAP)
    .find(([, admin]) => admin.email.toLowerCase() === email);

  if (!entrada) return null;
  return { id: entrada[0], ...entrada[1], uid: usuario.uid };
}

function usuarioEhAdmin(usuario = auth.currentUser) {
  return Boolean(obterAdminAtual(usuario));
}


// -------------------------------
// Elementos
// -------------------------------
const areaAuth = document.getElementById("area-auth");
const painelCadastro = document.getElementById("painel-cadastro");
const painelLogin = document.getElementById("painel-login");
const tabCadastro = document.getElementById("tab-cadastro");
const tabLogin = document.getElementById("tab-login");
const usuarioLogado = document.getElementById("usuario-logado");
const publicacaoLauncher = document.getElementById("publicacao-launcher");
const btnPublicacaoPlus = document.getElementById("btn-publicacao-plus");
const btnNovaPublicacao = document.getElementById("btn-nova-publicacao");
const btnCancelarPublicacao = document.getElementById("btn-cancelar-publicacao");
const criarPublicacao = document.getElementById("criar-publicacao");
const nomeUsuario = document.getElementById("nome-usuario");
const mensagem = document.getElementById("comunidade-mensagem");
const feed = document.getElementById("feed-comunidade");
const postTexto = document.getElementById("post-texto");
const contadorTexto = document.getElementById("contador-texto");
const btnPublicar = document.getElementById("btn-publicar");
const postImagemInput = document.getElementById("post-imagem");
const postImagemPreview = document.getElementById("post-imagem-preview");
const postImagemPreviewImg = document.getElementById("post-imagem-preview-img");
const postImagemRemover = document.getElementById("post-imagem-remover");

let ordenacaoAtual = "recentes";
let postsSalvos = [];
let unsubscribeReacoes = [];
let unsubscribeContagemComentarios = [];
const estatisticasPosts = new Map();
const comentariosAbertos = new Map();

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

  tabCadastro.classList.toggle("ativo", cadastro);
  tabLogin.classList.toggle("ativo", !cadastro);

  tabCadastro.setAttribute("aria-selected", String(cadastro));
  tabLogin.setAttribute("aria-selected", String(!cadastro));
}

tabCadastro.addEventListener("click", () => mostrarPainelAuth("cadastro"));
tabLogin.addEventListener("click", () => mostrarPainelAuth("login"));

document.getElementById("ir-login").addEventListener("click", () => mostrarPainelAuth("login"));
document.getElementById("ir-cadastro").addEventListener("click", () => mostrarPainelAuth("cadastro"));


// -------------------------------
// Cadastro
// -------------------------------
document.getElementById("form-cadastro").addEventListener("submit", async (event) => {
  event.preventDefault();

  const nome = document.getElementById("cadastro-nome").value.trim();
  const email = document.getElementById("cadastro-email").value.trim();
  const senha = document.getElementById("cadastro-senha").value;

  try {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(credencial.user, { displayName: nome });
    atualizarInterfaceUsuario(credencial.user);
    event.target.reset();
    mostrarMensagem("Conta criada com sucesso! Agora você já pode publicar, comentar e votar. 🌱");
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    const mensagens = {
      "auth/email-already-in-use": "Este e-mail já possui uma conta. Faça login.",
      "auth/invalid-email": "Digite um e-mail válido.",
      "auth/weak-password": "Escolha uma senha mais forte.",
      "auth/operation-not-allowed": "O login por e-mail e senha não está ativado no Firebase.",
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
    atualizarInterfaceUsuario(credencial.user);
    event.target.reset();
    mostrarMensagem("Login realizado com sucesso!");
  } catch (erro) {
    console.error("Erro no login:", erro);
    mostrarMensagem("E-mail ou senha incorretos.", "erro");
  }
});


// -------------------------------
// Sessão
// -------------------------------
document.getElementById("btn-sair").addEventListener("click", async () => {
  await signOut(auth);
  mostrarPainelAuth("cadastro");
  mostrarMensagem("Você saiu da sua conta.");
});

onAuthStateChanged(auth, usuario => {
  atualizarInterfaceUsuario(usuario);
  atualizarPainelAdmin(usuario);

  // Recalcula os botões de excluir/remover nos comentários que já estavam abertos.
  window.setTimeout(() => {
    comentariosAbertos.forEach((elemento, postId) => {
      if (elemento?.isConnected) carregarComentarios(postId, elemento);
      else comentariosAbertos.delete(postId);
    });
  }, 0);
});

function atualizarInterfaceUsuario(usuario) {
  if (!usuario) {
    areaAuth.hidden = false;
    usuarioLogado.hidden = true;
    publicacaoLauncher.hidden = false;
    btnNovaPublicacao.hidden = true;
    criarPublicacao.hidden = true;
    btnPublicacaoPlus.setAttribute("aria-expanded", "false");
    mostrarPainelAuth("cadastro");
  } else {
    areaAuth.hidden = true;
    usuarioLogado.hidden = false;
    publicacaoLauncher.hidden = false;
    btnNovaPublicacao.hidden = true;
    criarPublicacao.hidden = true;
    btnPublicacaoPlus.setAttribute("aria-expanded", "false");
    nomeUsuario.textContent = usuario.displayName || usuario.email || "Usuário";
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
  return true;
}

function fecharCriacaoPublicacao() {
  criarPublicacao.hidden = true;
  btnNovaPublicacao.hidden = true;
  btnPublicacaoPlus.setAttribute("aria-expanded", "false");
}

btnPublicacaoPlus.addEventListener("click", () => {
  if (!usuarioPodeInteragir()) return;

  if (!criarPublicacao.hidden) {
    criarPublicacao.hidden = true;
    btnNovaPublicacao.hidden = false;
    btnPublicacaoPlus.setAttribute("aria-expanded", "true");
    return;
  }

  const mostrarOpcao = btnNovaPublicacao.hidden;
  btnNovaPublicacao.hidden = !mostrarOpcao;
  btnPublicacaoPlus.setAttribute("aria-expanded", String(mostrarOpcao));
});

btnNovaPublicacao.addEventListener("click", () => {
  if (!usuarioPodeInteragir()) return;
  btnNovaPublicacao.hidden = true;
  criarPublicacao.hidden = false;
  btnPublicacaoPlus.setAttribute("aria-expanded", "true");
  document.getElementById("post-titulo").focus();
});

btnCancelarPublicacao.addEventListener("click", () => {
  document.getElementById("form-publicacao").reset();
  contadorTexto.textContent = "0 / 1500";
  postImagemPreview.hidden = true;
  postImagemPreviewImg.removeAttribute("src");
  fecharCriacaoPublicacao();
});


// -------------------------------
// Imagens sem Firebase Storage
// A foto é reprocessada no navegador e salva como JPEG leve no Firestore.
// -------------------------------
const LIMITE_IMAGEM_DATA_URL = 280000;
const LIMITE_ARQUIVO_ORIGINAL = 12 * 1024 * 1024;

function lerArquivoComoDataURL(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(arquivo);
  });
}

function carregarImagem(dataUrl) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error("Formato de imagem inválido."));
    imagem.src = dataUrl;
  });
}

async function comprimirImagem(arquivo) {
  if (!arquivo) return "";
  if (!arquivo.type?.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem.");
  }
  if (arquivo.size > LIMITE_ARQUIVO_ORIGINAL) {
    throw new Error("A imagem original deve ter no máximo 12 MB.");
  }

  const original = await lerArquivoComoDataURL(arquivo);
  const imagem = await carregarImagem(original);

  let largura = imagem.naturalWidth || imagem.width;
  let altura = imagem.naturalHeight || imagem.height;
  const maxLado = 1280;
  const escalaInicial = Math.min(1, maxLado / Math.max(largura, altura));
  largura = Math.max(1, Math.round(largura * escalaInicial));
  altura = Math.max(1, Math.round(altura * escalaInicial));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a imagem.");

  let resultado = "";
  let qualidade = 0.78;

  for (let tentativa = 0; tentativa < 12; tentativa++) {
    canvas.width = largura;
    canvas.height = altura;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(imagem, 0, 0, largura, altura);

    resultado = canvas.toDataURL("image/jpeg", qualidade);
    if (resultado.length <= LIMITE_IMAGEM_DATA_URL) return resultado;

    if (qualidade > 0.48) {
      qualidade -= 0.08;
    } else {
      largura = Math.max(480, Math.round(largura * 0.82));
      altura = Math.max(360, Math.round(altura * 0.82));
      qualidade = 0.62;
    }
  }

  if (resultado.length > LIMITE_IMAGEM_DATA_URL) {
    throw new Error("A imagem ficou grande demais mesmo após a compressão. Escolha outra imagem.");
  }
  return resultado;
}

function configurarPreviewImagem(input, caixa, imagem, remover) {
  if (!input || !caixa || !imagem || !remover) return;

  input.addEventListener("change", async () => {
    const arquivo = input.files?.[0];
    if (!arquivo) {
      caixa.hidden = true;
      imagem.removeAttribute("src");
      return;
    }

    try {
      const dataUrl = await lerArquivoComoDataURL(arquivo);
      imagem.src = dataUrl;
      caixa.hidden = false;
    } catch {
      input.value = "";
      caixa.hidden = true;
    }
  });

  remover.addEventListener("click", () => {
    input.value = "";
    imagem.removeAttribute("src");
    caixa.hidden = true;
  });
}

configurarPreviewImagem(postImagemInput, postImagemPreview, postImagemPreviewImg, postImagemRemover);

// -------------------------------
// Nova publicação
// -------------------------------
postTexto.addEventListener("input", () => {
  contadorTexto.textContent = `${postTexto.value.length} / 1500`;
});

document.getElementById("form-publicacao").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!usuarioPodeInteragir()) return;

  const usuario = auth.currentUser;
  const titulo = document.getElementById("post-titulo").value.trim();
  const texto = postTexto.value.trim();
  const arquivoImagem = postImagemInput?.files?.[0] || null;

  if (!titulo || !texto) {
    mostrarMensagem("Preencha título e conteúdo.", "erro");
    return;
  }

  try {
    btnPublicar.disabled = true;
    btnPublicar.textContent = arquivoImagem ? "Preparando imagem…" : "Publicando…";

    const imagem = arquivoImagem ? await comprimirImagem(arquivoImagem) : "";
    btnPublicar.textContent = "Publicando…";

    await addDoc(collection(db, "posts"), {
      uid: usuario.uid,
      autor: usuario.displayName || "Usuário",
      titulo,
      texto,
      imagem,
      criadoEm: serverTimestamp()
    });

    event.target.reset();
    contadorTexto.textContent = "0 / 1500";
    postImagemPreview.hidden = true;
    postImagemPreviewImg.removeAttribute("src");
    fecharCriacaoPublicacao();
    mostrarMensagem("Publicação enviada! 🌱");
  } catch (erro) {
    console.error("Erro ao publicar:", erro);
    const detalhe = erro?.message && !erro?.code ? erro.message : (erro.code || "erro");
    mostrarMensagem(`Não foi possível publicar (${detalhe}).`, "erro", 9000);
  } finally {
    btnPublicar.disabled = false;
    btnPublicar.textContent = "Publicar";
  }
});

// -------------------------------
// Ordenação do feed
// -------------------------------
document.querySelectorAll(".filtro-post").forEach(botao => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".filtro-post").forEach(btn => btn.classList.remove("ativo"));
    botao.classList.add("ativo");
    ordenacaoAtual = botao.dataset.order || "recentes";
    atualizarTextoOrdenacao();
    reordenarCards();
  });
});

function atualizarTextoOrdenacao() {
  const nota = document.getElementById("feed-order-note");
  if (!nota) return;
  nota.textContent = {
    recentes: "Mais recentes primeiro",
    populares: "Mais populares primeiro",
    comentados: "Mais comentados primeiro"
  }[ordenacaoAtual] || "Mais recentes primeiro";
}

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
  comentariosAbertos.clear();
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

function reordenarCards() {
  if (!feed) return;

  const cards = [...feed.querySelectorAll(".post-comunidade")];
  cards.sort((a, b) => {
    const criadoA = Number(a.dataset.criado || 0);
    const criadoB = Number(b.dataset.criado || 0);
    const scoreA = Number(a.dataset.score || 0);
    const scoreB = Number(b.dataset.score || 0);
    const comentariosA = Number(a.dataset.comentarios || 0);
    const comentariosB = Number(b.dataset.comentarios || 0);

    if (ordenacaoAtual === "populares") {
      const popularidadeA = scoreA + comentariosA;
      const popularidadeB = scoreB + comentariosB;
      if (popularidadeB !== popularidadeA) return popularidadeB - popularidadeA;
      if (scoreB !== scoreA) return scoreB - scoreA;
      if (comentariosB !== comentariosA) return comentariosB - comentariosA;
      return criadoB - criadoA;
    }

    if (ordenacaoAtual === "comentados") {
      if (comentariosB !== comentariosA) return comentariosB - comentariosA;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return criadoB - criadoA;
    }

    return criadoB - criadoA;
  });

  cards.forEach(card => feed.appendChild(card));
}

function renderizarPosts() {
  if (!feed) return;
  limparListenersFeed();
  feed.replaceChildren();

  const posts = [...postsSalvos];

  if (posts.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "feed-vazio";
    vazio.textContent = "Nenhuma publicação encontrada.";
    feed.appendChild(vazio);
    atualizarTextoOrdenacao();
    return;
  }

  posts.sort((a, b) => {
    const ea = obterEstatisticas(a.id);
    const eb = obterEstatisticas(b.id);
    const criadoA = a.criadoEm?.toMillis?.() || 0;
    const criadoB = b.criadoEm?.toMillis?.() || 0;

    if (ordenacaoAtual === "populares") {
      const popularidadeA = ea.score + ea.comentarios;
      const popularidadeB = eb.score + eb.comentarios;
      if (popularidadeB !== popularidadeA) return popularidadeB - popularidadeA;
      if (eb.score !== ea.score) return eb.score - ea.score;
      if (eb.comentarios !== ea.comentarios) return eb.comentarios - ea.comentarios;
      return criadoB - criadoA;
    }

    if (ordenacaoAtual === "comentados") {
      if (eb.comentarios !== ea.comentarios) return eb.comentarios - ea.comentarios;
      if (eb.score !== ea.score) return eb.score - ea.score;
      return criadoB - criadoA;
    }

    return criadoB - criadoA;
  });

  posts.forEach(post => feed.appendChild(criarCardPost(post)));
  atualizarTextoOrdenacao();
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

  const titulo = document.createElement("h4");
  titulo.textContent = post.titulo || "Sem título";

  const texto = document.createElement("div");
  texto.className = "post-texto";
  texto.textContent = post.texto || "";

  card.append(cabecalho, titulo);


  card.appendChild(texto);

  if (post.imagem) {
    const miniatura = document.createElement("button");
    miniatura.type = "button";
    miniatura.className = "post-imagem-miniatura";
    miniatura.setAttribute("aria-label", "Ampliar imagem da publicação");

    const imagemPost = document.createElement("img");
    imagemPost.className = "post-imagem";
    imagemPost.src = post.imagem;
    imagemPost.alt = `Imagem da publicação: ${post.titulo || "publicação"}`;
    imagemPost.loading = "lazy";

    miniatura.appendChild(imagemPost);
    miniatura.addEventListener("click", () => abrirImagemAmpliada(
      post.imagem,
      post.titulo || "Imagem da publicação"
    ));

    card.appendChild(miniatura);
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

    if (!areaComentarios.hidden) {
      comentariosAbertos.set(post.id, lista);
      await carregarComentarios(post.id, lista);
    } else {
      comentariosAbertos.delete(post.id);
    }
  });

  if (auth.currentUser) {
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
    aviso.textContent = "Faça login para comentar.";
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

    reordenarCards();
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
    reordenarCards();
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

let menuComentarioAberto = null;

document.addEventListener("click", () => {
  if (!menuComentarioAberto) return;
  menuComentarioAberto.hidden = true;
  const botao = menuComentarioAberto.parentElement?.querySelector(".comentario-menu-botao");
  botao?.setAttribute("aria-expanded", "false");
  menuComentarioAberto = null;
});

async function carregarComentarios(postId, elemento) {
  elemento.textContent = "Carregando comentários...";

  try {
    // Sem orderBy: assim comentários antigos continuam aparecendo mesmo se algum
    // documento não tiver o campo criadoEm.
    const resultado = await getDocs(collection(db, "posts", postId, "comentarios"));
    const itens = resultado.docs.map(item => ({ ref: item, dados: item.data() }));

    itens.sort((a, b) => {
      const ta = a.dados.criadoEm?.toMillis?.() || 0;
      const tb = b.dados.criadoEm?.toMillis?.() || 0;
      return ta - tb;
    });

    elemento.replaceChildren();

    if (itens.length === 0) {
      const vazio = document.createElement("span");
      vazio.className = "comentarios-vazio";
      vazio.textContent = "Nenhum comentário ainda.";
      elemento.appendChild(vazio);
      return;
    }

    const usuarioAtual = auth.currentUser;
    const ehAdminAtual = usuarioEhAdmin(usuarioAtual);
    const uidAtual = String(usuarioAtual?.uid || "");

    itens.forEach(({ ref: item, dados: comentario }) => {
      const caixa = document.createElement("div");
      caixa.className = "comentario";

      const conteudo = document.createElement("div");
      conteudo.className = "comentario-conteudo";

      const nome = document.createElement("strong");
      nome.textContent = comentario.autor || "Usuário";

      const corpo = document.createElement("div");
      corpo.className = "comentario-texto";
      corpo.textContent = comentario.texto || "";

      conteudo.append(nome, corpo);
      caixa.appendChild(conteudo);

      const uidComentario = String(comentario.uid || "");
      const ehDono = Boolean(uidAtual && uidComentario && uidAtual === uidComentario);

      const menuWrap = document.createElement("div");
      menuWrap.className = "comentario-menu-wrap";

      const menuBotao = document.createElement("button");
      menuBotao.type = "button";
      menuBotao.className = "comentario-menu-botao";
      menuBotao.textContent = "•••";
      menuBotao.setAttribute("aria-label", "Opções do comentário");
      menuBotao.setAttribute("aria-expanded", "false");

      const menu = document.createElement("div");
      menu.className = "comentario-menu";
      menu.hidden = true;

      menuBotao.addEventListener("click", event => {
        event.stopPropagation();

        if (menuComentarioAberto && menuComentarioAberto !== menu) {
          menuComentarioAberto.hidden = true;
          menuComentarioAberto.parentElement
            ?.querySelector(".comentario-menu-botao")
            ?.setAttribute("aria-expanded", "false");
        }

        const abrir = menu.hidden;
        menu.hidden = !abrir;
        menuBotao.setAttribute("aria-expanded", String(abrir));
        menuComentarioAberto = abrir ? menu : null;
      });

      menu.addEventListener("click", event => event.stopPropagation());

      if (ehAdminAtual || ehDono) {
        const excluir = document.createElement("button");
        excluir.type = "button";
        excluir.className = "comentario-menu-item comentario-menu-excluir";
        excluir.textContent = "Excluir";

        excluir.addEventListener("click", async () => {
          menu.hidden = true;
          menuComentarioAberto = null;
          menuBotao.setAttribute("aria-expanded", "false");

          if (!window.confirm(ehAdminAtual && !ehDono
            ? "Excluir este comentário?"
            : "Excluir seu comentário?")) return;

          try {
            await deleteDoc(doc(db, "posts", postId, "comentarios", item.id));
            await carregarComentarios(postId, elemento);
            mostrarMensagem("Comentário excluído.");
          } catch (erro) {
            console.error("Erro ao excluir comentário:", erro);
            mostrarMensagem(`Não foi possível excluir (${erro.code || "erro"}).`, "erro", 8000);
          }
        });

        menu.appendChild(excluir);
      } else {
        const denunciar = document.createElement("button");
        denunciar.type = "button";
        denunciar.className = "comentario-menu-item comentario-menu-denunciar";
        denunciar.textContent = "Denunciar";

        denunciar.addEventListener("click", async () => {
          menu.hidden = true;
          menuComentarioAberto = null;
          menuBotao.setAttribute("aria-expanded", "false");

          if (!auth.currentUser) {
            mostrarPainelAuth("login");
            areaAuth.hidden = false;
            mostrarMensagem("Faça login para denunciar um comentário.", "aviso", 7000);
            areaAuth.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }

          try {
            const usuario = auth.currentUser;
            await setDoc(
              doc(db, "posts", postId, "comentarios", item.id, "denuncias", usuario.uid),
              {
                uid: usuario.uid,
                postId,
                comentarioId: item.id,
                criadoEm: serverTimestamp()
              }
            );
            mostrarMensagem("Comentário denunciado.");
          } catch (erro) {
            console.error("Erro ao denunciar comentário:", erro);
            mostrarMensagem(`Não foi possível denunciar (${erro.code || "erro"}).`, "erro", 8000);
          }
        });

        menu.appendChild(denunciar);
      }

      menuWrap.append(menuBotao, menu);
      caixa.appendChild(menuWrap);
      elemento.appendChild(caixa);
    });
  } catch (erro) {
    console.error("Erro ao carregar comentários:", erro);
    elemento.textContent = "Erro ao carregar comentários.";
  }
}


function abrirImagemAmpliada(src, titulo = "Imagem") {
  let overlay = document.getElementById("imagem-ampliada-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "imagem-ampliada-overlay";
    overlay.className = "imagem-ampliada-overlay";
    overlay.hidden = true;

    const conteudo = document.createElement("div");
    conteudo.className = "imagem-ampliada-conteudo";

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "imagem-ampliada-fechar";
    fechar.textContent = "×";
    fechar.setAttribute("aria-label", "Fechar imagem");

    const img = document.createElement("img");
    img.id = "imagem-ampliada-img";
    img.alt = "";

    conteudo.append(fechar, img);
    overlay.appendChild(conteudo);
    document.body.appendChild(overlay);

    fechar.addEventListener("click", () => {
      overlay.hidden = true;
      document.body.classList.remove("imagem-ampliada-aberta");
    });

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        overlay.hidden = true;
        document.body.classList.remove("imagem-ampliada-aberta");
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !overlay.hidden) {
        overlay.hidden = true;
        document.body.classList.remove("imagem-ampliada-aberta");
      }
    });
  }

  const img = overlay.querySelector("#imagem-ampliada-img");
  img.src = src;
  img.alt = titulo;

  overlay.hidden = false;
  document.body.classList.add("imagem-ampliada-aberta");
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


// ============================================================
// NOTÍCIAS + PAINEL ADMINISTRATIVO
// ============================================================

const noticiasFeed = document.getElementById("noticias-feed");
const adminModal = document.getElementById("admin-modal");
const adminTrigger = document.getElementById("admin-secret-trigger");
const adminFechar = document.getElementById("admin-fechar");
const adminLoginArea = document.getElementById("admin-login-area");
const adminTools = document.getElementById("admin-tools");
const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginMsg = document.getElementById("admin-login-msg");
const adminToolsMsg = document.getElementById("admin-tools-msg");
const adminNome = document.getElementById("admin-nome");
const adminNoticiaForm = document.getElementById("admin-noticia-form");
const adminNoticiasList = document.getElementById("admin-noticias-list");
const btnPublicarNoticia = document.getElementById("btn-publicar-noticia");
const noticiaImagemInput = document.getElementById("noticia-imagem");
const noticiaImagemPreview = document.getElementById("noticia-imagem-preview");
const noticiaImagemPreviewImg = document.getElementById("noticia-imagem-preview-img");
const noticiaImagemRemover = document.getElementById("noticia-imagem-remover");
const adminSair = document.getElementById("admin-sair");

configurarPreviewImagem(noticiaImagemInput, noticiaImagemPreview, noticiaImagemPreviewImg, noticiaImagemRemover);

let noticiasSalvas = [];
let adminContagemCliques = 0;
let adminResetCliquesTimer = null;
let adminModalAberto = false;

function abrirAdminModal() {
  if (!adminModal) return;
  adminModal.hidden = false;
  adminModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("admin-modal-aberto");
  adminModalAberto = true;
  atualizarPainelAdmin(auth.currentUser);

  window.setTimeout(() => {
    if (usuarioEhAdmin()) {
      document.getElementById("noticia-titulo")?.focus();
    } else {
      document.getElementById("admin-id")?.focus();
    }
  }, 30);
}

function fecharAdminModal() {
  if (!adminModal) return;
  adminModal.hidden = true;
  adminModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("admin-modal-aberto");
  adminModalAberto = false;
  if (adminLoginMsg) adminLoginMsg.textContent = "";
  if (adminToolsMsg) adminToolsMsg.textContent = "";
}

function registrarCliqueAdmin(event) {
  // Evita seleção de texto, propagação do clique e fechamento acidental
  // do painel no mesmo gesto que o abriu.
  event?.preventDefault();
  event?.stopPropagation();

  if (adminModalAberto) return;

  adminContagemCliques += 1;

  if (adminResetCliquesTimer) {
    window.clearTimeout(adminResetCliquesTimer);
  }

  // Se demorar mais de 3 segundos entre a sequência, recomeça.
  adminResetCliquesTimer = window.setTimeout(() => {
    adminContagemCliques = 0;
    adminResetCliquesTimer = null;
  }, 3000);

  if (adminContagemCliques >= 5) {
    adminContagemCliques = 0;
    if (adminResetCliquesTimer) {
      window.clearTimeout(adminResetCliquesTimer);
      adminResetCliquesTimer = null;
    }

    abrirAdminModal();
  }
}

adminTrigger?.addEventListener("click", registrarCliqueAdmin);
adminTrigger?.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    registrarCliqueAdmin(event);
  }
});

adminFechar?.addEventListener("click", event => {
  event.stopPropagation();
  fecharAdminModal();
});

// O painel NÃO fecha ao clicar no fundo. Isso evita que o quinto clique
// usado para abrir o acesso seja interpretado como um clique de fechamento.

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && adminModalAberto) fecharAdminModal();
});

function atualizarPainelAdmin(usuario) {
  if (!adminLoginArea || !adminTools) return;

  const admin = obterAdminAtual(usuario);
  const estaLogadoComoAdmin = Boolean(admin);

  adminLoginArea.hidden = estaLogadoComoAdmin;
  adminTools.hidden = !estaLogadoComoAdmin;

  if (estaLogadoComoAdmin) {
    adminNome.textContent = `Painel de ${admin.nome}`;
    renderizarAdminNoticias();
  } else {
    adminNome.textContent = "Painel administrativo";
  }
}

adminLoginForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const idDigitado = document.getElementById("admin-id").value.trim().toUpperCase();
  const senha = document.getElementById("admin-senha").value;
  const admin = ADMIN_LOGIN_MAP[idDigitado];

  if (!admin) {
    adminLoginMsg.textContent = "ID de administrador inválido.";
    adminLoginMsg.className = "admin-msg erro";
    return;
  }

  adminLoginMsg.textContent = "Entrando...";
  adminLoginMsg.className = "admin-msg";

  try {
    const credencial = await signInWithEmailAndPassword(auth, admin.email, senha);

    if (!usuarioEhAdmin(credencial.user)) {
      await signOut(auth);
      throw new Error("Conta sem permissão administrativa.");
    }

    event.target.reset();
    adminLoginMsg.textContent = "";
    atualizarPainelAdmin(credencial.user);
  } catch (erro) {
    console.error("Erro no login administrativo:", erro);
    adminLoginMsg.textContent = "ID ou senha de administrador incorretos.";
    adminLoginMsg.className = "admin-msg erro";
  }
});

adminSair?.addEventListener("click", async () => {
  await signOut(auth);
  atualizarPainelAdmin(null);
  if (adminLoginMsg) {
    adminLoginMsg.textContent = "Sessão administrativa encerrada.";
    adminLoginMsg.className = "admin-msg";
  }
});

adminNoticiaForm?.addEventListener("submit", async event => {
  event.preventDefault();

  const admin = obterAdminAtual();
  if (!admin) {
    adminToolsMsg.textContent = "Sua sessão administrativa expirou. Entre novamente.";
    adminToolsMsg.className = "admin-msg erro";
    return;
  }

  const titulo = document.getElementById("noticia-titulo").value.trim();
  const texto = document.getElementById("noticia-texto").value.trim();
  let link = document.getElementById("noticia-link").value.trim();
  const arquivoImagem = noticiaImagemInput?.files?.[0] || null;

  if (!titulo || !texto) return;

  if (link && !/^https?:\/\//i.test(link)) {
    adminToolsMsg.textContent = "O link precisa começar com http:// ou https://.";
    adminToolsMsg.className = "admin-msg erro";
    return;
  }

  try {
    btnPublicarNoticia.disabled = true;
    btnPublicarNoticia.textContent = arquivoImagem ? "Preparando imagem..." : "Publicando...";

    const imagem = arquivoImagem ? await comprimirImagem(arquivoImagem) : "";
    btnPublicarNoticia.textContent = "Publicando...";

    await addDoc(collection(db, "noticias"), {
      titulo,
      texto,
      link,
      imagem,
      autor: admin.nome,
      criadoEm: serverTimestamp()
    });

    event.target.reset();
    if (noticiaImagemPreview) noticiaImagemPreview.hidden = true;
    if (noticiaImagemPreviewImg) noticiaImagemPreviewImg.removeAttribute("src");
    adminToolsMsg.textContent = "Notícia publicada com sucesso.";
    adminToolsMsg.className = "admin-msg sucesso";
  } catch (erro) {
    console.error("Erro ao publicar notícia:", erro);
    const detalhe = erro?.message && !erro?.code ? erro.message : (erro.code || "erro");
    adminToolsMsg.textContent = `Não foi possível publicar a notícia (${detalhe}).`;
    adminToolsMsg.className = "admin-msg erro";
  } finally {
    btnPublicarNoticia.disabled = false;
    btnPublicarNoticia.textContent = "Publicar notícia";
  }
});

const consultaNoticias = query(collection(db, "noticias"), orderBy("criadoEm", "desc"));

onSnapshot(consultaNoticias, snapshot => {
  noticiasSalvas = snapshot.docs.map(item => ({
    id: item.id,
    ...item.data()
  }));

  renderizarNoticias();
  renderizarAdminNoticias();
}, erro => {
  console.error("Erro ao carregar notícias:", erro);
  if (noticiasFeed) {
    noticiasFeed.replaceChildren();
    const erroEl = document.createElement("div");
    erroEl.className = "noticias-vazio";
    erroEl.textContent = "Não foi possível carregar as notícias.";
    noticiasFeed.appendChild(erroEl);
  }
});

function renderizarNoticias() {
  if (!noticiasFeed) return;
  noticiasFeed.replaceChildren();

  if (!noticiasSalvas.length) {
    const vazio = document.createElement("div");
    vazio.className = "noticias-vazio";
    vazio.textContent = "Ainda não há notícias publicadas.";
    noticiasFeed.appendChild(vazio);
    return;
  }

  noticiasSalvas.slice(0, 6).forEach(noticia => {
    const card = document.createElement("article");
    card.className = "noticia-card";

    const topo = document.createElement("div");
    topo.className = "noticia-meta";

    const autor = document.createElement("span");
    autor.textContent = noticia.autor ? `Por ${noticia.autor}` : "Equipe Inovação Verde";

    const data = document.createElement("span");
    data.textContent = formatarData(noticia.criadoEm);

    topo.append(autor, data);

    if (noticia.imagem) {
      const imagem = document.createElement("img");
      imagem.className = "noticia-imagem";
      imagem.src = noticia.imagem;
      imagem.alt = `Imagem da notícia: ${noticia.titulo || "notícia"}`;
      imagem.loading = "lazy";
      card.append(topo, imagem);
    } else {
      card.appendChild(topo);
    }

    const titulo = document.createElement("h3");
    titulo.textContent = noticia.titulo || "Notícia";

    const texto = document.createElement("p");
    texto.textContent = noticia.texto || "";

    card.append(titulo, texto);

    if (noticia.link) {
      const link = document.createElement("a");
      link.href = noticia.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Ver fonte →";
      link.className = "noticia-link";
      card.appendChild(link);
    }

    noticiasFeed.appendChild(card);
  });
}

function renderizarAdminNoticias() {
  if (!adminNoticiasList) return;
  adminNoticiasList.replaceChildren();

  if (!usuarioEhAdmin()) {
    const aviso = document.createElement("p");
    aviso.textContent = "Entre como administrador para gerenciar notícias.";
    adminNoticiasList.appendChild(aviso);
    return;
  }

  if (!noticiasSalvas.length) {
    const vazio = document.createElement("p");
    vazio.textContent = "Nenhuma notícia publicada.";
    adminNoticiasList.appendChild(vazio);
    return;
  }

  noticiasSalvas.forEach(noticia => {
    const linha = document.createElement("div");
    linha.className = "admin-noticia-item";

    const info = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.textContent = noticia.titulo || "Notícia";
    const meta = document.createElement("small");
    meta.textContent = `${noticia.autor || "Equipe"} • ${formatarData(noticia.criadoEm)}`;
    info.append(titulo, meta);

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "btn-admin-remover";
    remover.textContent = "Excluir";

    remover.addEventListener("click", async () => {
      if (!window.confirm(`Excluir a notícia "${noticia.titulo || "Notícia"}"?`)) return;

      remover.disabled = true;
      try {
        await deleteDoc(doc(db, "noticias", noticia.id));
        adminToolsMsg.textContent = "Notícia excluída.";
        adminToolsMsg.className = "admin-msg sucesso";
      } catch (erro) {
        console.error("Erro ao excluir notícia:", erro);
        adminToolsMsg.textContent = `Não foi possível excluir a notícia (${erro.code || "erro"}).`;
        adminToolsMsg.className = "admin-msg erro";
        remover.disabled = false;
      }
    });

    linha.append(info, remover);
    adminNoticiasList.appendChild(linha);
  });
}

