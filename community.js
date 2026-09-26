
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
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
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  runTransaction
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


const areaAuth = document.getElementById("area-auth");
const comunidadeTopoAuth = document.getElementById("comunidade-topo-auth");
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
const cadastroErro = document.getElementById("cadastro-erro");
const loginErro = document.getElementById("login-erro");
const postImagemInput = document.getElementById("post-imagem");
const postImagemPreview = document.getElementById("post-imagem-preview");
const postImagemPreviewImg = document.getElementById("post-imagem-preview-img");
const postImagemRemover = document.getElementById("post-imagem-remover");
const notificacoesWrap = document.getElementById("notificacoes-wrap");
const notificacoesBotao = document.getElementById("notificacoes-botao");
const notificacoesBadge = document.getElementById("notificacoes-badge");
const notificacoesPainel = document.getElementById("notificacoes-painel");
const notificacoesLista = document.getElementById("notificacoes-lista");
const notificacoesMarcarLidas = document.getElementById("notificacoes-marcar-lidas");
const perfilAtalho = document.getElementById("perfil-atalho");
const perfilAtalhoImg = document.getElementById("perfil-atalho-img");
const perfilAtalhoInicial = document.getElementById("perfil-atalho-inicial");
const perfilDeslogado = document.getElementById("perfil-deslogado");
const perfilConteudo = document.getElementById("perfil-conteudo");
const perfilIrLogin = document.getElementById("perfil-ir-login");
const perfilFotoAtual = document.getElementById("perfil-foto-atual");
const perfilInicialGrande = document.getElementById("perfil-inicial-grande");
const perfilNomeExibicao = document.getElementById("perfil-nome-exibicao");
const perfilUsernameExibicao = document.getElementById("perfil-username-exibicao");
const perfilEmail = document.getElementById("perfil-email");
const perfilSeloAdmin = document.getElementById("perfil-selo-admin");
const formPerfil = document.getElementById("form-perfil");
const perfilNomeInput = document.getElementById("perfil-nome");
const perfilUsuarioInput = document.getElementById("perfil-usuario");
const perfilFotoInput = document.getElementById("perfil-foto-input");
const perfilFotoPreview = document.getElementById("perfil-foto-preview");
const perfilFotoPreviewImg = document.getElementById("perfil-foto-preview-img");
const perfilRemoverFoto = document.getElementById("perfil-remover-foto");
const btnSalvarPerfil = document.getElementById("btn-salvar-perfil");
const perfilMensagem = document.getElementById("perfil-mensagem");
const cadastroUsuarioInput = document.getElementById("cadastro-nome");
function forcarUsernameMinusculo(input) {
  if (!input) return;
  input.addEventListener("input", () => {
    const inicio = input.selectionStart;
    const fim = input.selectionEnd;
    const valorMinusculo = input.value.toLowerCase();
    if (input.value !== valorMinusculo) {
      input.value = valorMinusculo;
      try {
        input.setSelectionRange(inicio, fim);
      } catch {}
    }
  });
}
forcarUsernameMinusculo(cadastroUsuarioInput);
forcarUsernameMinusculo(perfilUsuarioInput);

let ordenacaoAtual = "recentes";
let postsSalvos = [];
let unsubscribeReacoes = [];
let unsubscribeContagemComentarios = [];
const estatisticasPosts = new Map();
const comentariosAbertos = new Map();
const comentariosPrincipaisPorPost = new Map();
const respostasPorComentario = new Map();
const versaoContagemComentarios = new Map();
let renderPostsRaf = 0;
let reordenarCardsRaf = 0;
const perfisUsuarios = new Map();
let perfilAtual = null;
let fotoPerfilPendente = undefined;
let notificacoesAtuais = [];
let unsubscribeNotificacoes = null;
const unsubscribeCurtidasItens = new Map();
const adminUidsPublicos = new Set();

function executarQuandoLivre(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => callback(), { timeout: 700 });
    return;
  }
  window.setTimeout(callback, 40);
}
function proximoFrame() {
  return new Promise(resolve => {
    window.requestAnimationFrame(() => resolve());
  });
}
function agendarRenderPosts() {
  if (renderPostsRaf) return;
  renderPostsRaf = window.requestAnimationFrame(() => {
    renderPostsRaf = 0;
    renderizarPosts();
  });
}
function agendarReordenacao() {
  if (reordenarCardsRaf) return;
  reordenarCardsRaf = window.requestAnimationFrame(() => {
    reordenarCardsRaf = 0;
    reordenarCards();
  });
}
function chaveResposta(postId, comentarioId) {
  return `${postId}:${comentarioId}`;
}
function uidEhAdminPublico(uid) {
  return Boolean(uid && adminUidsPublicos.has(String(uid)));
}
function criarSeloVerificado() {
  const selo = document.createElement("img");
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1D9BF0" d="M12 1.8l2.07 1.75 2.69-.2 1.04 2.5 2.38 1.27-.6 2.63L21 12l-1.42 2.25.6 2.63-2.38 1.27-1.04 2.5-2.69-.2L12 22.2l-2.07-1.75-2.69.2-1.04-2.5-2.38-1.27.6-2.63L3 12l1.42-2.25-.6-2.63L6.2 5.85l1.04-2.5 2.69.2L12 1.8z"/><path fill="#fff" d="M10.55 16.3 6.9 12.65l1.45-1.45 2.2 2.2 5.1-5.1 1.45 1.45-6.55 6.55z"/></svg>';
  selo.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  selo.className = "selo-admin-verificado";
  selo.alt = "Verificado";
  selo.title = "Administrador verificado";
  return selo;
}
function criarNomeComSelo(nome, verificado = false, tag = "span") {
  const linha = document.createElement(tag);
  linha.className = "nome-com-verificado";
  const texto = document.createElement("span");
  texto.textContent = nome || "Usuário";
  linha.appendChild(texto);
  if (verificado) {
    linha.appendChild(criarSeloVerificado());
  }
  return linha;
}

function normalizarUsername(valor) {
  return String(valor || "").trim().toLowerCase();
}
function usernameValido(valor) {
  return /^[a-z0-9._-]{3,24}$/.test(String(valor || "").trim());
}
function usernameReservadoParaAdmin(usernameKey) {
  return ["nicolas", "rillary", "ismael"].includes(usernameKey);
}
function obterPerfil(uid) {
  return uid ? (perfisUsuarios.get(String(uid)) || null) : null;
}
function obterNomePorUid(uid, fallback = "Usuário") {
  const perfil = obterPerfil(uid);
  return perfil?.nome || perfil?.username || fallback || "Usuário";
}
function obterUsernamePorUid(uid, fallback = "") {
  const perfil = obterPerfil(uid);
  return perfil?.username || fallback || "";
}
function obterFotoPorUid(uid) {
  return obterPerfil(uid)?.foto || "";
}
function obterNomePerfilAtual() {
  return perfilAtual?.nome || perfilAtual?.username || auth.currentUser?.displayName || "Usuário";
}
function obterUsernameAtual() {
  return perfilAtual?.username || "";
}
function aplicarAvatar(container, uid, fallbackNome = "Usuário") {
  if (!container) return;
  container.replaceChildren();
  const foto = obterFotoPorUid(uid);
  if (foto) {
    const img = document.createElement("img");
    img.src = foto;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    container.appendChild(img);
    container.classList.add("tem-foto");
  } else {
    container.classList.remove("tem-foto");
    container.textContent = (obterNomePorUid(uid, fallbackNome).charAt(0) || "U").toUpperCase();
  }
}
function definirImagemOuInicial(img, inicial, foto, nome = "Usuário") {
  if (!img || !inicial) return;
  if (foto) {
    img.src = foto;
    img.hidden = false;
    inicial.hidden = true;
  } else {
    img.removeAttribute("src");
    img.hidden = true;
    inicial.hidden = false;
    inicial.textContent = (String(nome || "U").charAt(0) || "U").toUpperCase();
  }
}
function mensagemPerfil(texto = "", tipo = "") {
  if (!perfilMensagem) return;
  perfilMensagem.textContent = texto;
  perfilMensagem.className = `perfil-mensagem${tipo ? ` perfil-mensagem-${tipo}` : ""}`;
}
async function salvarPerfilNoFirestore(usuario, nomePerfil, username, foto) {
  if (!usuario) throw new Error("Faça login novamente.");
  const nomeLimpo = String(nomePerfil || "").trim();
  const usernameLimpo = normalizarUsername(username);
  const usernameKey = usernameLimpo;
  if (!nomeLimpo || nomeLimpo.length > 40) {
    const erro = new Error("Digite um nome de perfil com até 40 caracteres.");
    erro.codigoPerfil = "nome-invalido";
    throw erro;
  }
  if (!usernameValido(usernameLimpo)) {
    const erro = new Error("Use de 3 a 24 caracteres, somente letras minúsculas, números, ponto, _ ou -.");
    erro.codigoPerfil = "username-invalido";
    throw erro;
  }
  if (usernameReservadoParaAdmin(usernameKey) && !usuarioEhAdmin(usuario)) {
    const erro = new Error("Esse nome de usuário está reservado.");
    erro.codigoPerfil = "username-reservado";
    throw erro;
  }
  const usuarioRef = doc(db, "usuarios", usuario.uid);
  const novoUsernameRef = doc(db, "usernames", usernameKey);
  await runTransaction(db, async transaction => {
    const usuarioSnap = await transaction.get(usuarioRef);
    const usernameSnap = await transaction.get(novoUsernameRef);
    const perfilAnterior = usuarioSnap.exists() ? usuarioSnap.data() : null;
    const usernameKeyAnterior = perfilAnterior?.usernameKey || "";
    let usernameAnteriorRef = null;
    let usernameAnteriorSnap = null;
    if (usernameKeyAnterior && usernameKeyAnterior !== usernameKey) {
      usernameAnteriorRef = doc(db, "usernames", usernameKeyAnterior);
      usernameAnteriorSnap = await transaction.get(usernameAnteriorRef);
    }
    if (usernameSnap.exists() && usernameSnap.data()?.uid !== usuario.uid) {
      const erro = new Error("Esse nome de usuário já está em uso.");
      erro.codigoPerfil = "username-em-uso";
      throw erro;
    }
    if (!usernameSnap.exists()) {
      transaction.set(novoUsernameRef, {
        uid: usuario.uid,
        criadoEm: serverTimestamp()
      });
    }
    const dadosPerfil = {
      nome: nomeLimpo,
      username: usernameLimpo,
      usernameKey,
      foto: String(foto || ""),
      atualizadoEm: serverTimestamp()
    };
    if (!usuarioSnap.exists()) {
      dadosPerfil.criadoEm = serverTimestamp();
    }
    transaction.set(usuarioRef, dadosPerfil, { merge: true });
    if (
      usernameAnteriorRef &&
      usernameAnteriorSnap?.exists() &&
      usernameAnteriorSnap.data()?.uid === usuario.uid
    ) {
      transaction.delete(usernameAnteriorRef);
    }
  });
  await updateProfile(usuario, { displayName: nomeLimpo });
  return {
    nome: nomeLimpo,
    username: usernameLimpo,
    usernameKey,
    foto: String(foto || "")
  };
}
async function garantirPerfilAdmin(usuario) {
  const admin = obterAdminAtual(usuario);
  if (!admin || !usuario) return null;
  const base = admin.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9._-]/g, "");
  for (const candidato of [base, `${base}.admin`]) {
    try {
      await salvarPerfilNoFirestore(usuario, admin.nome, candidato, "");
      const snap = await getDoc(doc(db, "usuarios", usuario.uid));
      return snap.exists() ? { uid: usuario.uid, ...snap.data() } : null;
    } catch (erro) {
      if (erro?.codigoPerfil !== "username-em-uso") throw erro;
    }
  }
  return null;
}
async function carregarPerfilAtual(usuario) {
  perfilAtual = null;
  fotoPerfilPendente = undefined;
  if (!usuario) {
    atualizarInterfacePerfil(null);
    return;
  }
  try {
    let snap = await getDoc(doc(db, "usuarios", usuario.uid));
    if (!snap.exists() && usuarioEhAdmin(usuario)) {
      await garantirPerfilAdmin(usuario);
      snap = await getDoc(doc(db, "usuarios", usuario.uid));
    }
    if (snap.exists()) {
      perfilAtual = { uid: usuario.uid, ...snap.data() };
      perfisUsuarios.set(usuario.uid, perfilAtual);
    }
  } catch (erro) {
    console.error("Erro ao carregar perfil:", erro);
  }
  atualizarInterfacePerfil(usuario);
}
function atualizarInterfacePerfil(usuario = auth.currentUser) {
  const logado = Boolean(usuario);
  if (perfilAtalho) perfilAtalho.hidden = !logado;
  if (notificacoesWrap) {
    notificacoesWrap.hidden = !logado;
    notificacoesWrap.style.display = logado ? "block" : "none";
  }
  if (perfilDeslogado) perfilDeslogado.hidden = logado;
  if (perfilConteudo) perfilConteudo.hidden = !logado;
  if (!logado) {
    if (perfilAtalhoImg) perfilAtalhoImg.hidden = true;
    if (perfilAtalhoInicial) {
      perfilAtalhoInicial.hidden = false;
      perfilAtalhoInicial.textContent = "U";
    }
    return;
  }
  const perfil = perfilAtual || obterPerfil(usuario.uid);
  const nome = perfil?.nome || perfil?.username || usuario.displayName || "Usuário";
  const username = perfil?.username || "";
  const foto = perfil?.foto || "";
  definirImagemOuInicial(perfilAtalhoImg, perfilAtalhoInicial, foto, nome);
  definirImagemOuInicial(perfilFotoAtual, perfilInicialGrande, foto, nome);
  if (perfilNomeExibicao) perfilNomeExibicao.textContent = nome;
  if (perfilUsernameExibicao) {
    perfilUsernameExibicao.textContent = username ? `@${username}` : "@usuario";
  }
  if (perfilEmail) perfilEmail.textContent = usuario.email || "";
  if (perfilNomeInput) perfilNomeInput.value = nome;
  if (perfilUsuarioInput) perfilUsuarioInput.value = username;
  if (perfilSeloAdmin) {
    perfilSeloAdmin.replaceChildren();
    if (usuarioEhAdmin(usuario)) {
      perfilSeloAdmin.appendChild(criarSeloVerificado());
    }
  }
}

function idNotificacao(...partes) {
  return partes
    .filter(Boolean)
    .map(parte => String(parte).replaceAll("/", "_"))
    .join("--");
}
async function criarNotificacao({
  destinatarioUid,
  tipo,
  postId = "",
  comentarioId = "",
  respostaId = "",
  eventoId = ""
}) {
  const usuario = auth.currentUser;
  if (
    !usuario?.uid ||
    !destinatarioUid ||
    destinatarioUid === usuario.uid
  ) {
    return;
  }
  const id = eventoId || idNotificacao(
    tipo,
    postId,
    comentarioId,
    respostaId,
    usuario.uid
  );
  await setDoc(
    doc(db, "notificacoes", destinatarioUid, "itens", id),
    {
      destinatarioUid,
      atorUid: usuario.uid,
      tipo,
      postId: String(postId || ""),
      comentarioId: String(comentarioId || ""),
      respostaId: String(respostaId || ""),
      lida: false,
      criadoEm: serverTimestamp()
    }
  );
}
async function removerNotificacao(destinatarioUid, notificacaoId) {
  if (!auth.currentUser?.uid || !destinatarioUid || !notificacaoId) return;
  try {
    await deleteDoc(
      doc(
        db,
        "notificacoes",
        destinatarioUid,
        "itens",
        notificacaoId
      )
    );
  } catch (erro) {
    if (erro?.code !== "permission-denied") {
      console.error("Erro ao remover notificação:", erro);
    }
  }
}
function textoDaNotificacao(notificacao) {
  const nomeAtor = obterNomePorUid(
    notificacao.atorUid,
    "Alguém"
  );
  if (notificacao.tipo === "aviso_admin") {
    const titulo = notificacao.titulo || "Aviso da equipe";
    const texto = notificacao.texto || "";
    return texto ? `${titulo}: ${texto}` : titulo;
  }
  const textos = {
    curtida_post: `${nomeAtor} curtiu sua publicação.`,
    comentario_post: `${nomeAtor} comentou na sua publicação.`,
    resposta_comentario: `${nomeAtor} respondeu seu comentário.`,
    curtida_comentario: `${nomeAtor} curtiu seu comentário.`,
    curtida_resposta: `${nomeAtor} curtiu sua resposta.`
  };
  return textos[notificacao.tipo] || `${nomeAtor} interagiu com você.`;
}
function abrirDestinoNotificacao(notificacao) {
  notificacoesPainel.hidden = true;
  notificacoesBotao.setAttribute("aria-expanded", "false");
  if (notificacao.tipo === "aviso_admin" && !notificacao.postId) {
    return;
  }
  window.showPage?.("comunidade");
  window.setTimeout(() => {
    const card = document.getElementById(`post-${notificacao.postId}`);
    if (!card) return;
    card.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    card.classList.add("post-destaque-notificacao");
    window.setTimeout(
      () => card.classList.remove("post-destaque-notificacao"),
      1800
    );
  }, 120);
}
function renderizarNotificacoes() {
  if (!notificacoesLista) return;
  notificacoesLista.replaceChildren();
  const ordenadas = [...notificacoesAtuais]
    .sort((a, b) => {
      const ta = a.criadoEm?.toMillis?.() || 0;
      const tb = b.criadoEm?.toMillis?.() || 0;
      return tb - ta;
    })
    .slice(0, 40);
  const naoLidas = ordenadas.filter(item => !item.lida).length;
  if (notificacoesBadge) {
    notificacoesBadge.hidden = naoLidas === 0;
    notificacoesBadge.textContent = naoLidas > 99 ? "99+" : String(naoLidas);
  }
  if (ordenadas.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "notificacoes-vazio";
    vazio.textContent = "Nenhuma notificação ainda.";
    notificacoesLista.appendChild(vazio);
    return;
  }
  ordenadas.forEach(notificacao => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "notificacao-item";
    item.classList.toggle("nao-lida", !notificacao.lida);
    const avatar = document.createElement("div");
    avatar.className = "notificacao-avatar";
    aplicarAvatar(
      avatar,
      notificacao.atorUid,
      obterNomePorUid(notificacao.atorUid, "U")
    );
    const conteudo = document.createElement("div");
    conteudo.className = "notificacao-conteudo";
    const texto = document.createElement("div");
    texto.className = "notificacao-texto";
    texto.textContent = textoDaNotificacao(notificacao);
    const data = document.createElement("span");
    data.className = "notificacao-data";
    data.textContent = formatarData(notificacao.criadoEm);
    conteudo.append(texto, data);
    if (!notificacao.lida) {
      const ponto = document.createElement("span");
      ponto.className = "notificacao-ponto";
      ponto.setAttribute("aria-label", "Não lida");
      item.append(avatar, conteudo, ponto);
    } else {
      item.append(avatar, conteudo);
    }
    item.addEventListener("click", async () => {
      if (!notificacao.lida && auth.currentUser) {
        try {
          await setDoc(
            doc(
              db,
              "notificacoes",
              auth.currentUser.uid,
              "itens",
              notificacao.id
            ),
            { lida: true },
            { merge: true }
          );
        } catch (erro) {
          console.error("Erro ao marcar notificação como lida:", erro);
        }
      }
      abrirDestinoNotificacao(notificacao);
    });
    notificacoesLista.appendChild(item);
  });
}
function iniciarNotificacoes(usuario) {
  if (unsubscribeNotificacoes) {
    unsubscribeNotificacoes();
    unsubscribeNotificacoes = null;
  }
  notificacoesAtuais = [];
  if (!usuario?.uid) {
    if (notificacoesWrap) {
      notificacoesWrap.hidden = true;
      notificacoesWrap.style.display = "none";
    }
    if (notificacoesPainel) notificacoesPainel.hidden = true;
    if (notificacoesBadge) notificacoesBadge.hidden = true;
    renderizarNotificacoes();
    return;
  }
  if (notificacoesWrap) {
    notificacoesWrap.hidden = false;
    notificacoesWrap.style.display = "block";
  }
  unsubscribeNotificacoes = onSnapshot(
    collection(db, "notificacoes", usuario.uid, "itens"),
    snapshot => {
      notificacoesAtuais = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      renderizarNotificacoes();
    },
    erro => console.error("Erro ao carregar notificações:", erro)
  );
}
async function marcarTodasNotificacoesComoLidas() {
  const usuario = auth.currentUser;
  if (!usuario?.uid) return;
  const pendentes = notificacoesAtuais.filter(item => !item.lida);
  await Promise.all(
    pendentes.map(item =>
      setDoc(
        doc(
          db,
          "notificacoes",
          usuario.uid,
          "itens",
          item.id
        ),
        { lida: true },
        { merge: true }
      )
    )
  );
}
function limparListenersCurtidasDoPost(postId) {
  const prefixo = `${postId}:`;
  [...unsubscribeCurtidasItens.entries()].forEach(([chave, unsubscribe]) => {
    if (!chave.startsWith(prefixo)) return;
    unsubscribe();
    unsubscribeCurtidasItens.delete(chave);
  });
}
function observarCurtidasItem(chave, colecaoCurtidas, botao, contador) {
  const anterior = unsubscribeCurtidasItens.get(chave);
  if (anterior) anterior();
  const unsubscribe = onSnapshot(
    colecaoCurtidas,
    snapshot => {
      const uid = auth.currentUser?.uid || "";
      const curtido = Boolean(uid && snapshot.docs.some(item => item.id === uid));
      botao.dataset.curtido = String(curtido);
      botao.classList.toggle("ativo", curtido);
      botao.setAttribute("aria-pressed", String(curtido));
      const icone = botao.querySelector(".curtida-icone");
      if (icone) icone.textContent = curtido ? "♥" : "♡";
      contador.textContent = String(snapshot.size);
    },
    erro => console.error("Erro ao carregar curtidas:", erro)
  );
  unsubscribeCurtidasItens.set(chave, unsubscribe);
}
function criarBotaoCurtirItem() {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-curtir-comentario";
  botao.dataset.curtido = "false";
  botao.setAttribute("aria-pressed", "false");
  const icone = document.createElement("span");
  icone.className = "curtida-icone";
  icone.textContent = "♡";
  const texto = document.createElement("span");
  texto.textContent = "Curtir";
  const contador = document.createElement("span");
  contador.className = "curtida-contador";
  contador.textContent = "0";
  botao.append(icone, texto, contador);
  return { botao, contador };
}
async function alternarCurtidaItem({
  botao,
  refCurtida,
  donoUid,
  tipoNotificacao,
  postId,
  comentarioId = "",
  respostaId = "",
  notificacaoId
}) {
  if (!usuarioPodeInteragir()) return;
  const usuario = auth.currentUser;
  const curtido = botao.dataset.curtido === "true";
  try {
    if (curtido) {
      await deleteDoc(refCurtida);
      await removerNotificacao(donoUid, notificacaoId);
      return;
    }
    await setDoc(refCurtida, {
      uid: usuario.uid,
      criadoEm: serverTimestamp()
    });
    await criarNotificacao({
      destinatarioUid: donoUid,
      tipo: tipoNotificacao,
      postId,
      comentarioId,
      respostaId,
      eventoId: notificacaoId
    });
  } catch (erro) {
    console.error("Erro ao curtir:", erro);
    mostrarMensagem(
      `Não foi possível curtir (${erro.code || "erro"}).`,
      "erro",
      8000
    );
  }
}
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
  if (cadastroErro) cadastroErro.textContent = "";
  if (loginErro) loginErro.textContent = "";
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


document.getElementById("form-cadastro").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (cadastroErro) cadastroErro.textContent = "";
  const nomePerfil = document.getElementById("cadastro-perfil-nome").value.trim();
  const username = document.getElementById("cadastro-nome").value.trim();
  const usernameKey = normalizarUsername(username);
  const email = document.getElementById("cadastro-email").value.trim();
  const senha = document.getElementById("cadastro-senha").value;
  if (!nomePerfil || nomePerfil.length > 40) {
    cadastroErro.textContent = "Digite um nome de perfil com até 40 caracteres.";
    return;
  }
  if (!usernameValido(username)) {
    cadastroErro.textContent = "Use de 3 a 24 caracteres, somente letras minúsculas, números, ponto, _ ou -.";
    return;
  }
  if (usernameReservadoParaAdmin(usernameKey)) {
    cadastroErro.textContent = "Esse nome de usuário está reservado.";
    return;
  }
  try {
    const usernameExistente = await getDoc(doc(db, "usernames", usernameKey));
    if (usernameExistente.exists()) {
      cadastroErro.textContent = "Esse nome de usuário já está em uso.";
      return;
    }
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    try {
      await salvarPerfilNoFirestore(credencial.user, nomePerfil, username, "");
    } catch (erroPerfil) {
      try { await deleteUser(credencial.user); } catch (erroExcluirConta) { console.error("Erro ao desfazer cadastro:", erroExcluirConta); }
      throw erroPerfil;
    }
    await carregarPerfilAtual(credencial.user);
    atualizarInterfaceUsuario(credencial.user);
    event.target.reset();
    cadastroErro.textContent = "";
    mostrarMensagem("Conta criada com sucesso! 🌱");
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    if (erro?.codigoPerfil === "username-em-uso") return cadastroErro.textContent = "Esse nome de usuário já está em uso.";
    if (erro?.codigoPerfil === "username-reservado") return cadastroErro.textContent = "Esse nome de usuário está reservado.";
    const mensagens = {
      "auth/email-already-in-use": "Este e-mail já possui uma conta. Faça login.",
      "auth/invalid-email": "Digite um e-mail válido.",
      "auth/weak-password": "Escolha uma senha mais forte.",
      "auth/operation-not-allowed": "O login por e-mail e senha não está ativado no Firebase.",
      "auth/too-many-requests": "Muitas tentativas. Tente novamente depois.",
      "auth/network-request-failed": "Falha de conexão. Verifique sua internet."
    };
    cadastroErro.textContent = mensagens[erro.code] || erro?.message || "Não foi possível criar a conta.";
  }
});


document.getElementById("form-login").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (loginErro) loginErro.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  try {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    atualizarInterfaceUsuario(credencial.user);
    event.target.reset();
    if (loginErro) loginErro.textContent = "";
    mostrarMensagem("Login realizado com sucesso!");
  } catch (erro) {
    console.error("Erro no login:", erro);
    if (loginErro) {
      loginErro.textContent = "Usuário ou senha incorretos.";
    }
  }
});

function posicionarPainelNotificacoesMobile() {
  if (!notificacoesPainel) return;
  if (window.innerWidth > 860) {
    notificacoesPainel.style.removeProperty("--notifications-top");
    notificacoesPainel.style.removeProperty("--notifications-height");
    return;
  }
  const navShell = document.querySelector(".nav-shell");
  if (!navShell) return;
  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop || 0;
  const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
  const top = Math.min(viewportBottom, Math.max(viewportTop, Math.round(navShell.getBoundingClientRect().bottom)));
  notificacoesPainel.style.setProperty("--notifications-top", `${top}px`);
  notificacoesPainel.style.setProperty("--notifications-height", `${Math.max(0, Math.floor(viewportBottom - top - 8))}px`);
}
notificacoesBotao?.addEventListener("click", event => {
  event.stopPropagation();
  const abrir = notificacoesPainel.hidden;
  if (abrir) {
    posicionarPainelNotificacoesMobile();
  }
  notificacoesPainel.hidden = !abrir;
  notificacoesBotao.setAttribute("aria-expanded", String(abrir));
});
notificacoesPainel?.addEventListener("click", event => {
  event.stopPropagation();
});
function atualizarPosicaoNotificacoesAbertas() {
  if (
    notificacoesPainel &&
    !notificacoesPainel.hidden
  ) {
    posicionarPainelNotificacoesMobile();
  }
}
window.addEventListener(
  "scroll",
  atualizarPosicaoNotificacoesAbertas,
  { passive: true }
);
window.addEventListener(
  "resize",
  atualizarPosicaoNotificacoesAbertas,
  { passive: true }
);
window.visualViewport?.addEventListener(
  "resize",
  atualizarPosicaoNotificacoesAbertas,
  { passive: true }
);
window.visualViewport?.addEventListener(
  "scroll",
  atualizarPosicaoNotificacoesAbertas,
  { passive: true }
);
notificacoesMarcarLidas?.addEventListener("click", async event => {
  event.stopPropagation();
  try {
    await marcarTodasNotificacoesComoLidas();
  } catch (erro) {
    console.error("Erro ao marcar notificações:", erro);
  }
});
document.addEventListener("click", event => {
  if (
    !notificacoesPainel ||
    notificacoesPainel.hidden ||
    notificacoesWrap?.contains(event.target)
  ) {
    return;
  }
  notificacoesPainel.hidden = true;
  notificacoesBotao?.setAttribute("aria-expanded", "false");
});


document.getElementById("btn-sair").addEventListener("click", async () => {
  await signOut(auth);
  mostrarPainelAuth("cadastro");
  mostrarMensagem("Você saiu da sua conta.");
});
onAuthStateChanged(auth, async usuario => {
  await carregarPerfilAtual(usuario);
  atualizarInterfaceUsuario(usuario);
  atualizarPainelAdmin(usuario);
  iniciarNotificacoes(usuario);
  const adminAtual = obterAdminAtual(usuario);
  if (adminAtual && usuario?.uid) {
    try {
      await setDoc(doc(db, "adminsPublicos", usuario.uid), { nome: adminAtual.nome, atualizadoEm: serverTimestamp() }, { merge: true });
    } catch (erro) {
      console.error("Erro ao registrar administrador verificado:", erro);
    }
  }
  window.setTimeout(() => {
    comentariosAbertos.forEach((elemento, postId) => {
      if (elemento?.isConnected) carregarComentarios(postId, elemento);
      else comentariosAbertos.delete(postId);
    });
  }, 0);
});
function atualizarInterfaceUsuario(usuario) {
  if (comunidadeTopoAuth) {
    comunidadeTopoAuth.hidden = Boolean(usuario);
  }
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
    nomeUsuario.replaceChildren();
    const identidadeLogada = document.createElement("span");
    identidadeLogada.className = "usuario-logado-identidade";
    const linhaNome = document.createElement("span");
    linhaNome.className = "usuario-logado-nome-linha";
    const nomeLogado = document.createElement("span");
    nomeLogado.className = "usuario-logado-nome";
    nomeLogado.textContent = obterNomePorUid(
      usuario.uid,
      usuario.displayName || usuario.email || "Usuário"
    );
    linhaNome.appendChild(nomeLogado);
    if (usuarioEhAdmin(usuario)) {
      linhaNome.appendChild(criarSeloVerificado());
    }
    const usernameLogado = document.createElement("span");
    usernameLogado.className = "usuario-logado-username";
    const handle = obterUsernamePorUid(usuario.uid, perfilAtual?.username || "");
    usernameLogado.textContent = handle ? `@${handle}` : "";
    identidadeLogada.append(linhaNome, usernameLogado);
    nomeUsuario.appendChild(identidadeLogada);
  }
  atualizarInterfacePerfil(usuario);
  agendarRenderPosts();
}

onSnapshot(collection(db, "usuarios"), snapshot => {
  perfisUsuarios.clear();
  snapshot.forEach(item => perfisUsuarios.set(item.id, { uid: item.id, ...item.data() }));
  if (auth.currentUser) {
    const atual = perfisUsuarios.get(auth.currentUser.uid);
    if (atual) perfilAtual = atual;
  }
  atualizarInterfacePerfil(auth.currentUser);
  renderizarNotificacoes();
  agendarRenderPosts();
  comentariosAbertos.forEach((elemento, postId) => {
    if (elemento?.isConnected) carregarComentarios(postId, elemento);
  });
}, erro => console.error("Erro ao carregar perfis:", erro));

onSnapshot(collection(db, "adminsPublicos"), snapshot => {
  adminUidsPublicos.clear();
  snapshot.forEach(item => adminUidsPublicos.add(item.id));
  agendarRenderPosts();
  comentariosAbertos.forEach((elemento, postId) => {
    if (elemento?.isConnected) carregarComentarios(postId, elemento);
  });
}, erro => {
  console.error("Erro ao carregar administradores verificados:", erro);
});
function usuarioPodeInteragir() {
  const usuario = auth.currentUser;
  if (!usuario) {
    mostrarPainelAuth("login");
    areaAuth.hidden = false;
    mostrarMensagem("Faça login para participar da comunidade.", "aviso");
    areaAuth.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  if (!perfilAtual?.usernameKey) {
    mensagemPerfil("Escolha um nome de usuário para continuar.", "erro");
    window.showPage?.("perfil");
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
async function comprimirFotoPerfil(arquivo) {
  if (!arquivo) return "";
  if (!arquivo.type?.startsWith("image/")) throw new Error("Escolha uma imagem.");
  if (arquivo.size > LIMITE_ARQUIVO_ORIGINAL) throw new Error("A imagem deve ter no máximo 12 MB.");
  const original = await lerArquivoComoDataURL(arquivo);
  const imagem = await carregarImagem(original);
  const iw = imagem.naturalWidth || imagem.width;
  const ih = imagem.naturalHeight || imagem.height;
  const lado = Math.min(iw, ih);
  const ox = Math.max(0, (iw - lado) / 2);
  const oy = Math.max(0, (ih - lado) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = 240; canvas.height = 240;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Não foi possível preparar a foto.");
  ctx.fillStyle = "#fff"; ctx.fillRect(0,0,240,240);
  ctx.drawImage(imagem, ox, oy, lado, lado, 0, 0, 240, 240);
  let qualidade = .82;
  let resultado = canvas.toDataURL("image/jpeg", qualidade);
  while (resultado.length > 80000 && qualidade > .42) {
    qualidade -= .08;
    resultado = canvas.toDataURL("image/jpeg", qualidade);
  }
  if (resultado.length > 80000) throw new Error("Escolha uma foto menor.");
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
perfilIrLogin?.addEventListener("click", () => {
  window.showPage?.("comunidade");
  mostrarPainelAuth("login");
  areaAuth.hidden = false;
  areaAuth.scrollIntoView({ behavior: "smooth", block: "center" });
});
perfilFotoInput?.addEventListener("change", async () => {
  const arquivo = perfilFotoInput.files?.[0];
  if (!arquivo) {
    fotoPerfilPendente = undefined;
    perfilFotoPreview.hidden = true;
    perfilFotoPreviewImg.removeAttribute("src");
    return;
  }
  try {
    mensagemPerfil("");
    fotoPerfilPendente = await comprimirFotoPerfil(arquivo);
    perfilFotoPreviewImg.src = fotoPerfilPendente;
    perfilFotoPreview.hidden = false;
  } catch (erro) {
    perfilFotoInput.value = "";
    fotoPerfilPendente = undefined;
    perfilFotoPreview.hidden = true;
    mensagemPerfil(erro.message || "Não foi possível preparar a foto.", "erro");
  }
});
perfilRemoverFoto?.addEventListener("click", () => {
  fotoPerfilPendente = "";
  perfilFotoInput.value = "";
  perfilFotoPreview.hidden = true;
  perfilFotoPreviewImg.removeAttribute("src");
  mensagemPerfil("A foto será removida quando você salvar.");
});
formPerfil?.addEventListener("submit", async event => {
  event.preventDefault();
  const usuario = auth.currentUser;
  if (!usuario) return mensagemPerfil("Faça login novamente.", "erro");
  const nomePerfil = perfilNomeInput.value.trim();
  const username = perfilUsuarioInput.value.trim();
  if (!nomePerfil || nomePerfil.length > 40) {
    return mensagemPerfil("Digite um nome de perfil com até 40 caracteres.", "erro");
  }
  if (!usernameValido(username)) {
    return mensagemPerfil("Use de 3 a 24 caracteres, somente letras minúsculas, números, ponto, _ ou -.", "erro");
  }
  const fotoFinal = fotoPerfilPendente === undefined
    ? (perfilAtual?.foto || "")
    : fotoPerfilPendente;
  try {
    btnSalvarPerfil.disabled = true;
    btnSalvarPerfil.textContent = "Salvando...";
    mensagemPerfil("");
    await salvarPerfilNoFirestore(usuario, nomePerfil, username, fotoFinal);
    await carregarPerfilAtual(usuario);
    fotoPerfilPendente = undefined;
    perfilFotoInput.value = "";
    perfilFotoPreview.hidden = true;
    perfilFotoPreviewImg.removeAttribute("src");
    mensagemPerfil("Perfil atualizado.", "sucesso");
  } catch (erro) {
    console.error("Erro ao salvar perfil:", erro);
    if (erro?.codigoPerfil === "username-em-uso") mensagemPerfil("Esse nome de usuário já está em uso.", "erro");
    else if (erro?.codigoPerfil === "username-reservado") mensagemPerfil("Esse nome de usuário está reservado.", "erro");
    else mensagemPerfil(erro?.message || "Não foi possível salvar o perfil.", "erro");
  } finally {
    btnSalvarPerfil.disabled = false;
    btnSalvarPerfil.textContent = "Salvar alterações";
  }
});


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
      autor: obterNomePerfilAtual(),
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


const filtrosComunidade = document.querySelector(".filtros-comunidade");
filtrosComunidade?.addEventListener("click", event => {
  const botao = event.target.closest(".filtro-post");
  if (!botao || !filtrosComunidade.contains(botao)) return;
  document.querySelectorAll(".filtro-post").forEach(btn => {
    btn.classList.toggle("ativo", btn === botao);
  });
  ordenacaoAtual = botao.dataset.order || "recentes";
  
  reordenarCards();
});


const consultaPosts = query(collection(db, "posts"), orderBy("criadoEm", "desc"));
onSnapshot(consultaPosts, snapshot => {
  postsSalvos = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
  agendarRenderPosts();
}, erro => {
  console.error("Erro ao carregar feed:", erro);
  feed.textContent = `Não foi possível carregar as publicações (${erro.code || "erro"}).`;
});
function limparListenersFeed() {
  unsubscribeReacoes.forEach(unsubscribe => unsubscribe());
  unsubscribeReacoes = [];
  unsubscribeContagemComentarios.forEach(unsubscribe => unsubscribe());
  unsubscribeContagemComentarios = [];
  comentariosPrincipaisPorPost.clear();
  respostasPorComentario.clear();
  versaoContagemComentarios.clear();
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
    const likesA = Number(a.dataset.likes || 0);
    const likesB = Number(b.dataset.likes || 0);
    const comentariosA = Number(a.dataset.comentarios || 0);
    const comentariosB = Number(b.dataset.comentarios || 0);
    if (ordenacaoAtual === "populares") {
      const popularidadeA = likesA + comentariosA;
      const popularidadeB = likesB + comentariosB;
      if (popularidadeB !== popularidadeA) {
        return popularidadeB - popularidadeA;
      }
      if (likesB !== likesA) return likesB - likesA;
      if (comentariosB !== comentariosA) {
        return comentariosB - comentariosA;
      }
      return criadoB - criadoA;
    }
    if (ordenacaoAtual === "curtidos") {
      if (likesB !== likesA) return likesB - likesA;
      
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
      return;
  }
  posts.sort((a, b) => {
    const ea = obterEstatisticas(a.id);
    const eb = obterEstatisticas(b.id);
    const criadoA = a.criadoEm?.toMillis?.() || 0;
    const criadoB = b.criadoEm?.toMillis?.() || 0;
    if (ordenacaoAtual === "populares") {
      const popularidadeA = ea.likes + ea.comentarios;
      const popularidadeB = eb.likes + eb.comentarios;
      if (popularidadeB !== popularidadeA) {
        return popularidadeB - popularidadeA;
      }
      if (eb.likes !== ea.likes) return eb.likes - ea.likes;
      if (eb.comentarios !== ea.comentarios) {
        return eb.comentarios - ea.comentarios;
      }
      return criadoB - criadoA;
    }
    if (ordenacaoAtual === "curtidos") {
      if (eb.likes !== ea.likes) return eb.likes - ea.likes;
      return criadoB - criadoA;
    }
    return criadoB - criadoA;
  });
  posts.forEach(post => feed.appendChild(criarCardPost(post)));
}
function criarCardPost(post) {
  const card = document.createElement("article");
  card.className = "post-comunidade";
  card.id = `post-${post.id}`;
  card.dataset.postUid = post.uid || "";
  card.dataset.minhaReacao = "";
  const stats = obterEstatisticas(post.id);
  card.dataset.likes = String(stats.likes);
  card.dataset.score = String(stats.score);
  card.dataset.comentarios = String(stats.comentarios);
  card.dataset.criado = String(post.criadoEm?.toMillis?.() || Date.now());
  const cabecalho = document.createElement("div");
  cabecalho.className = "post-cabecalho";
  const avatar = document.createElement("div");
  avatar.className = "post-avatar";
  aplicarAvatar(avatar, post.uid, post.autor || "Usuário");
  const autorArea = document.createElement("div");
  autorArea.className = "post-autor";
  const autorLinha = document.createElement("div");
  autorLinha.className = "post-autor-linha";
  const autor = document.createElement("strong");
  autor.textContent = obterNomePorUid(post.uid, post.autor || "Usuário");
  autorLinha.appendChild(autor);
  if (uidEhAdminPublico(post.uid)) {
    autorLinha.appendChild(criarSeloVerificado());
  }
  const usernameAutor = document.createElement("span");
  usernameAutor.className = "post-username";
  const usernamePost = obterUsernamePorUid(post.uid, "");
  usernameAutor.textContent = usernamePost ? `@${usernamePost}` : "";
  const data = document.createElement("span");
  data.className = "post-data";
  data.textContent = formatarData(post.criadoEm);
  autorArea.append(autorLinha, usernameAutor, data);
  cabecalho.append(avatar, autorArea);
  
  const postMenuWrap = document.createElement("div");
  postMenuWrap.className = "post-menu-wrap";
  const postMenuBotao = document.createElement("button");
  postMenuBotao.type = "button";
  postMenuBotao.className = "post-menu-botao";
  postMenuBotao.textContent = "•••";
  postMenuBotao.setAttribute("aria-label", "Opções da publicação");
  postMenuBotao.setAttribute("aria-expanded", "false");
  const postMenu = document.createElement("div");
  postMenu.className = "post-menu";
  postMenu.hidden = true;
  postMenuBotao.addEventListener("click", event => {
    event.stopPropagation();
    document.querySelectorAll(".post-menu").forEach(outro => {
      if (outro !== postMenu) {
        outro.hidden = true;
        outro.parentElement
          ?.querySelector(".post-menu-botao")
          ?.setAttribute("aria-expanded", "false");
      }
    });
    const abrir = postMenu.hidden;
    postMenu.hidden = !abrir;
    postMenuBotao.setAttribute("aria-expanded", String(abrir));
  });
  postMenu.addEventListener("click", event => event.stopPropagation());
  const usuarioPostAtual = auth.currentUser;
  const ehDonoPost = Boolean(
    usuarioPostAtual?.uid &&
    post.uid &&
    usuarioPostAtual.uid === post.uid
  );
  const ehAdminPost = usuarioEhAdmin(usuarioPostAtual);
  if (ehDonoPost || ehAdminPost) {
    const excluirPost = document.createElement("button");
    excluirPost.type = "button";
    excluirPost.className = "post-menu-item post-menu-excluir";
    excluirPost.textContent = "Excluir";
    excluirPost.addEventListener("click", async () => {
      postMenu.hidden = true;
      postMenuBotao.setAttribute("aria-expanded", "false");
      const textoConfirmacao = ehAdminPost && !ehDonoPost
        ? "Excluir esta publicação como administrador?"
        : "Excluir sua publicação?";
      if (!window.confirm(textoConfirmacao)) return;
      try {
        await deleteDoc(doc(db, "posts", post.id));
        mostrarMensagem("Publicação excluída.");
      } catch (erro) {
        console.error("Erro ao excluir publicação:", erro);
        mostrarMensagem(
          `Não foi possível excluir (${erro.code || "erro"}).`,
          "erro",
          8000
        );
      }
    });
    postMenu.appendChild(excluirPost);
  } else {
    const denunciarPost = document.createElement("button");
    denunciarPost.type = "button";
    denunciarPost.className = "post-menu-item post-menu-denunciar";
    denunciarPost.textContent = "Denunciar";
    denunciarPost.addEventListener("click", async () => {
      postMenu.hidden = true;
      postMenuBotao.setAttribute("aria-expanded", "false");
      if (!auth.currentUser) {
        mostrarPainelAuth("login");
        areaAuth.hidden = false;
        mostrarMensagem("Faça login para denunciar uma publicação.", "aviso", 7000);
        areaAuth.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      try {
        const usuario = auth.currentUser;
        await setDoc(
          doc(db, "posts", post.id, "denuncias", usuario.uid),
          {
            uid: usuario.uid,
            postId: post.id,
            criadoEm: serverTimestamp()
          }
        );
        mostrarMensagem("Publicação denunciada.");
      } catch (erro) {
        console.error("Erro ao denunciar publicação:", erro);
        mostrarMensagem(
          `Não foi possível denunciar (${erro.code || "erro"}).`,
          "erro",
          8000
        );
      }
    });
    postMenu.appendChild(denunciarPost);
  }
  postMenuWrap.append(postMenuBotao, postMenu);
  cabecalho.appendChild(postMenuWrap);
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
    imagemPost.decoding = "async";
    miniatura.appendChild(imagemPost);
    miniatura.addEventListener("click", () => abrirImagemAmpliada(
      post.imagem,
      post.titulo || "Imagem da publicação"
    ));
    card.appendChild(miniatura);
  }

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
        const comentarioRef = await addDoc(
          collection(db, "posts", post.id, "comentarios"),
          {
            uid: usuario.uid,
            autor: obterNomePerfilAtual(),
            texto: comentario,
            criadoEm: serverTimestamp()
          }
        );
        await criarNotificacao({
          destinatarioUid: post.uid || "",
          tipo: "comentario_post",
          postId: post.id,
          comentarioId: comentarioRef.id,
          eventoId: idNotificacao(
            "comentario-post",
            post.id,
            comentarioRef.id
          )
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
    card.dataset.likes = String(likes);
    card.dataset.score = String(score);
    card.dataset.minhaReacao = minhaReacao;
    votacao.cima.classList.toggle("ativo", minhaReacao === "like");
    votacao.baixo.classList.toggle("ativo", minhaReacao === "dislike");
    votacao.cima.setAttribute("aria-pressed", String(minhaReacao === "like"));
    votacao.baixo.setAttribute("aria-pressed", String(minhaReacao === "dislike"));
    agendarReordenacao();
  }, erro => console.error("Erro ao carregar reações:", erro));
  unsubscribeReacoes.push(unsubscribe);
}
function aplicarContagemComentarios(postId, card, contador) {
  const principais = comentariosPrincipaisPorPost.get(postId) || 0;
  let respostas = 0;
  const prefixo = `${postId}:`;
  respostasPorComentario.forEach((quantidade, chave) => {
    if (chave.startsWith(prefixo)) respostas += quantidade;
  });
  const total = principais + respostas;
  const stats = obterEstatisticas(postId);
  stats.comentarios = total;
  contador.textContent = String(total);
  contador.title = `${total} comentário(s), incluindo respostas`;
  card.dataset.comentarios = String(total);
  agendarReordenacao();
}
async function recontarRespostasPost(postId, comentariosDocs, versao, card, contador) {
  for (let indice = 0; indice < comentariosDocs.length; indice++) {
    if (versaoContagemComentarios.get(postId) !== versao) return;
    const comentarioId = comentariosDocs[indice].id;
    const chave = chaveResposta(postId, comentarioId);
    try {
      const snapshot = await getDocs(
        collection(
          db,
          "posts",
          postId,
          "comentarios",
          comentarioId,
          "respostas"
        )
      );
      respostasPorComentario.set(chave, snapshot.size);
    } catch (erro) {
      console.error("Erro ao contar respostas:", erro);
      respostasPorComentario.set(chave, 0);
    }
    
    if (indice % 3 === 2) {
      await proximoFrame();
    }
  }
  if (versaoContagemComentarios.get(postId) === versao) {
    aplicarContagemComentarios(postId, card, contador);
  }
}
function atualizarContagemComentariosPost(postId) {
  const card = document.getElementById(`post-${postId}`);
  const contador = card?.querySelector(".comentarios-contador");
  if (!card || !contador) return;
  const versao = (versaoContagemComentarios.get(postId) || 0) + 1;
  versaoContagemComentarios.set(postId, versao);
  executarQuandoLivre(async () => {
    try {
      const comentariosSnapshot = await getDocs(
        collection(db, "posts", postId, "comentarios")
      );
      if (versaoContagemComentarios.get(postId) !== versao) return;
      comentariosPrincipaisPorPost.set(postId, comentariosSnapshot.size);
      const idsAtuais = new Set(
        comentariosSnapshot.docs.map(item => chaveResposta(postId, item.id))
      );
      [...respostasPorComentario.keys()].forEach(chave => {
        if (chave.startsWith(`${postId}:`) && !idsAtuais.has(chave)) {
          respostasPorComentario.delete(chave);
        }
      });
      aplicarContagemComentarios(postId, card, contador);
      await recontarRespostasPost(
        postId,
        comentariosSnapshot.docs,
        versao,
        card,
        contador
      );
    } catch (erro) {
      console.error("Erro ao atualizar contagem de comentários:", erro);
    }
  });
}
function observarContagemComentarios(postId, card, contador) {
  const comentariosRef = collection(db, "posts", postId, "comentarios");
  const unsubscribe = onSnapshot(
    comentariosRef,
    snapshot => {
      const versao = (versaoContagemComentarios.get(postId) || 0) + 1;
      versaoContagemComentarios.set(postId, versao);
      comentariosPrincipaisPorPost.set(postId, snapshot.size);
      const idsAtuais = new Set(
        snapshot.docs.map(item => chaveResposta(postId, item.id))
      );
      [...respostasPorComentario.keys()].forEach(chave => {
        if (chave.startsWith(`${postId}:`) && !idsAtuais.has(chave)) {
          respostasPorComentario.delete(chave);
        }
      });
      
      aplicarContagemComentarios(postId, card, contador);
      
      executarQuandoLivre(() => {
        recontarRespostasPost(
          postId,
          snapshot.docs,
          versao,
          card,
          contador
        );
      });
    },
    erro => console.error("Erro ao contar comentários:", erro)
  );
  unsubscribeContagemComentarios.push(unsubscribe);
}
async function registrarReacao(postId, tipo, card) {
  if (!usuarioPodeInteragir()) return;
  const usuario = auth.currentUser;
  const ref = doc(db, "posts", postId, "reacoes", usuario.uid);
  const atual = card.dataset.minhaReacao || "";
  const donoPostUid = card.dataset.postUid || "";
  const notifId = idNotificacao(
    "curtida-post",
    postId,
    usuario.uid
  );
  try {
    if (atual === tipo) {
      await deleteDoc(ref);
      if (tipo === "like") {
        await removerNotificacao(donoPostUid, notifId);
      }
      return;
    }
    await setDoc(ref, {
      uid: usuario.uid,
      tipo,
      criadoEm: serverTimestamp()
    });
    if (tipo === "like") {
      await criarNotificacao({
        destinatarioUid: donoPostUid,
        tipo: "curtida_post",
        postId,
        eventoId: notifId
      });
    } else if (atual === "like") {
      await removerNotificacao(donoPostUid, notifId);
    }
  } catch (erro) {
    console.error("Erro na reação:", erro);
    mostrarMensagem(
      `Não foi possível registrar seu voto (${erro.code || "erro"}).`,
      "erro",
      8000
    );
  }
}
let menuComentarioAberto = null;
document.addEventListener("click", () => {
  document.querySelectorAll(".post-menu").forEach(menu => {
    menu.hidden = true;
    menu.parentElement
      ?.querySelector(".post-menu-botao")
      ?.setAttribute("aria-expanded", "false");
  });
  if (!menuComentarioAberto) return;
  menuComentarioAberto.hidden = true;
  const botao = menuComentarioAberto.parentElement?.querySelector(".comentario-menu-botao");
  botao?.setAttribute("aria-expanded", "false");
  menuComentarioAberto = null;
});
function configurarMenuComentario(menu, botao) {
  botao.addEventListener("click", event => {
    event.stopPropagation();
    if (menuComentarioAberto && menuComentarioAberto !== menu) {
      menuComentarioAberto.hidden = true;
      menuComentarioAberto.parentElement
        ?.querySelector(".comentario-menu-botao")
        ?.setAttribute("aria-expanded", "false");
    }
    const abrir = menu.hidden;
    menu.hidden = !abrir;
    botao.setAttribute("aria-expanded", String(abrir));
    menuComentarioAberto = abrir ? menu : null;
  });
  menu.addEventListener("click", event => event.stopPropagation());
}
function criarMenuResposta(postId, comentarioId, respostaId, respostaUid, recarregar) {
  const usuarioAtual = auth.currentUser;
  const ehAdminAtual = usuarioEhAdmin(usuarioAtual);
  const ehDono = Boolean(
    usuarioAtual?.uid &&
    respostaUid &&
    String(usuarioAtual.uid) === String(respostaUid)
  );
  const wrap = document.createElement("div");
  wrap.className = "comentario-menu-wrap resposta-menu-wrap";
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "comentario-menu-botao";
  botao.textContent = "•••";
  botao.setAttribute("aria-label", "Opções da resposta");
  botao.setAttribute("aria-expanded", "false");
  const menu = document.createElement("div");
  menu.className = "comentario-menu";
  menu.hidden = true;
  configurarMenuComentario(menu, botao);
  if (ehAdminAtual || ehDono) {
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "comentario-menu-item comentario-menu-excluir";
    excluir.textContent = "Excluir";
    excluir.addEventListener("click", async () => {
      menu.hidden = true;
      menuComentarioAberto = null;
      botao.setAttribute("aria-expanded", "false");
      if (!window.confirm("Excluir esta resposta?")) return;
      try {
        await deleteDoc(
          doc(
            db,
            "posts",
            postId,
            "comentarios",
            comentarioId,
            "respostas",
            respostaId
          )
        );
        await recarregar();
        atualizarContagemComentariosPost(postId);
        mostrarMensagem("Resposta excluída.");
      } catch (erro) {
        console.error("Erro ao excluir resposta:", erro);
        mostrarMensagem(
          `Não foi possível excluir (${erro.code || "erro"}).`,
          "erro",
          8000
        );
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
      botao.setAttribute("aria-expanded", "false");
      if (!auth.currentUser) {
        mostrarPainelAuth("login");
        areaAuth.hidden = false;
        mostrarMensagem("Faça login para denunciar uma resposta.", "aviso", 7000);
        areaAuth.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      try {
        const usuario = auth.currentUser;
        await setDoc(
          doc(
            db,
            "posts",
            postId,
            "comentarios",
            comentarioId,
            "respostas",
            respostaId,
            "denuncias",
            usuario.uid
          ),
          {
            uid: usuario.uid,
            postId,
            comentarioId,
            respostaId,
            criadoEm: serverTimestamp()
          }
        );
        mostrarMensagem("Resposta denunciada.");
      } catch (erro) {
        console.error("Erro ao denunciar resposta:", erro);
        mostrarMensagem(
          `Não foi possível denunciar (${erro.code || "erro"}).`,
          "erro",
          8000
        );
      }
    });
    menu.appendChild(denunciar);
  }
  wrap.append(botao, menu);
  return wrap;
}
async function carregarRespostasDoComentario(
  postId,
  comentarioId,
  elemento,
  abrirFormularioResposta
) {
  elemento.replaceChildren();
  try {
    const resultado = await getDocs(
      collection(
        db,
        "posts",
        postId,
        "comentarios",
        comentarioId,
        "respostas"
      )
    );
    respostasPorComentario.set(
      chaveResposta(postId, comentarioId),
      resultado.size
    );
    const respostas = resultado.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));
    respostas.sort((a, b) => {
      const ta = a.criadoEm?.toMillis?.() || 0;
      const tb = b.criadoEm?.toMillis?.() || 0;
      return ta - tb;
    });
    elemento.hidden = respostas.length === 0;
    respostas.forEach(resposta => {
      const caixa = document.createElement("div");
      caixa.className = "comentario resposta-comentario";
      const avatar = document.createElement("div");
      avatar.className = "comentario-avatar resposta-avatar";
      aplicarAvatar(avatar, resposta.uid, resposta.autor || "Usuário");
      const conteudo = document.createElement("div");
      conteudo.className = "comentario-conteudo";
      const nomeLinha = document.createElement("div");
      nomeLinha.className = "comentario-nome-linha";
      const nome = document.createElement("strong");
      nome.textContent = obterNomePorUid(
        resposta.uid,
        resposta.autor || "Usuário"
      );
      nomeLinha.appendChild(nome);
      if (uidEhAdminPublico(resposta.uid)) {
        nomeLinha.appendChild(criarSeloVerificado());
      }
      const username = document.createElement("div");
      username.className = "comentario-username";
      const handle = obterUsernamePorUid(resposta.uid, "");
      username.textContent = handle ? `@${handle}` : "";
      const texto = document.createElement("div");
      texto.className = "comentario-texto resposta-texto";
      if (resposta.respondendoA) {
        const mencao = document.createElement("span");
        mencao.className = "resposta-mencao";
        mencao.textContent = `@${resposta.respondendoA} `;
        texto.appendChild(mencao);
      }
      texto.appendChild(document.createTextNode(resposta.texto || ""));
      const acoesResposta = document.createElement("div");
      acoesResposta.className =
        "comentario-acoes-inline resposta-acoes-inline";
      const curtidaResposta = criarBotaoCurtirItem();
      
      const responderResposta = document.createElement("button");
      responderResposta.type = "button";
      responderResposta.className =
        "btn-responder-comentario btn-responder-resposta";
      responderResposta.textContent = "Responder";
      responderResposta.addEventListener("click", () => {
        if (!usuarioPodeInteragir()) return;
        abrirFormularioResposta?.({
          uid: resposta.uid || "",
          handle: obterUsernamePorUid(resposta.uid, ""),
          nome: obterNomePorUid(
            resposta.uid,
            resposta.autor || "Usuário"
          ),
          ehResposta: true
        });
      });
      acoesResposta.append(
        curtidaResposta.botao,
        responderResposta
      );
      conteudo.append(
        nomeLinha,
        username,
        texto,
        acoesResposta
      );
      caixa.append(avatar, conteudo);
      const curtidasRespostaRef = collection(
        db,
        "posts",
        postId,
        "comentarios",
        comentarioId,
        "respostas",
        resposta.id,
        "curtidas"
      );
      const chaveCurtidaResposta =
        `${postId}:resposta:${comentarioId}:${resposta.id}`;
      observarCurtidasItem(
        chaveCurtidaResposta,
        curtidasRespostaRef,
        curtidaResposta.botao,
        curtidaResposta.contador
      );
      curtidaResposta.botao.addEventListener("click", () => {
        const usuario = auth.currentUser;
        if (!usuario) {
          usuarioPodeInteragir();
          return;
        }
        alternarCurtidaItem({
          botao: curtidaResposta.botao,
          refCurtida: doc(
            db,
            "posts",
            postId,
            "comentarios",
            comentarioId,
            "respostas",
            resposta.id,
            "curtidas",
            usuario.uid
          ),
          donoUid: resposta.uid || "",
          tipoNotificacao: "curtida_resposta",
          postId,
          comentarioId,
          respostaId: resposta.id,
          notificacaoId: idNotificacao(
            "curtida-resposta",
            postId,
            comentarioId,
            resposta.id,
            usuario.uid
          )
        });
      });
      caixa.appendChild(
        criarMenuResposta(
          postId,
          comentarioId,
          resposta.id,
          resposta.uid,
          () => carregarRespostasDoComentario(
            postId,
            comentarioId,
            elemento,
            abrirFormularioResposta
          )
        )
      );
      elemento.appendChild(caixa);
    });
  } catch (erro) {
    console.error("Erro ao carregar respostas:", erro);
    elemento.hidden = false;
    elemento.textContent = "Erro ao carregar respostas.";
  }
}
async function carregarComentarios(postId, elemento) {
  limparListenersCurtidasDoPost(postId);
  elemento.textContent = "Carregando comentários...";
  try {
    const resultado = await getDocs(
      collection(db, "posts", postId, "comentarios")
    );
    const itens = resultado.docs.map(item => ({
      ref: item,
      dados: item.data()
    }));
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
      const bloco = document.createElement("div");
      bloco.className = "comentario-bloco";
      const caixa = document.createElement("div");
      caixa.className = "comentario comentario-principal";
      const avatar = document.createElement("div");
      avatar.className = "comentario-avatar";
      aplicarAvatar(avatar, comentario.uid, comentario.autor || "Usuário");
      const conteudo = document.createElement("div");
      conteudo.className = "comentario-conteudo";
      const nomeLinha = document.createElement("div");
      nomeLinha.className = "comentario-nome-linha";
      const nome = document.createElement("strong");
      nome.textContent = obterNomePorUid(
        comentario.uid,
        comentario.autor || "Usuário"
      );
      nomeLinha.appendChild(nome);
      if (uidEhAdminPublico(comentario.uid)) {
        nomeLinha.appendChild(criarSeloVerificado());
      }
      const username = document.createElement("div");
      username.className = "comentario-username";
      const handleComentario = obterUsernamePorUid(comentario.uid, "");
      username.textContent = handleComentario ? `@${handleComentario}` : "";
      const corpo = document.createElement("div");
      corpo.className = "comentario-texto";
      corpo.textContent = comentario.texto || "";
      const acoesComentario = document.createElement("div");
      acoesComentario.className = "comentario-acoes-inline";
      const curtidaComentario = criarBotaoCurtirItem();
      const responder = document.createElement("button");
      responder.type = "button";
      responder.className = "btn-responder-comentario";
      responder.textContent = "Responder";
      acoesComentario.append(
        curtidaComentario.botao,
        responder
      );
      conteudo.append(
        nomeLinha,
        username,
        corpo,
        acoesComentario
      );
      caixa.append(avatar, conteudo);
      const curtidasComentarioRef = collection(
        db,
        "posts",
        postId,
        "comentarios",
        item.id,
        "curtidas"
      );
      const chaveCurtidaComentario = `${postId}:comentario:${item.id}`;
      observarCurtidasItem(
        chaveCurtidaComentario,
        curtidasComentarioRef,
        curtidaComentario.botao,
        curtidaComentario.contador
      );
      curtidaComentario.botao.addEventListener("click", () => {
        const usuario = auth.currentUser;
        if (!usuario) {
          usuarioPodeInteragir();
          return;
        }
        alternarCurtidaItem({
          botao: curtidaComentario.botao,
          refCurtida: doc(
            db,
            "posts",
            postId,
            "comentarios",
            item.id,
            "curtidas",
            usuario.uid
          ),
          donoUid: comentario.uid || "",
          tipoNotificacao: "curtida_comentario",
          postId,
          comentarioId: item.id,
          notificacaoId: idNotificacao(
            "curtida-comentario",
            postId,
            item.id,
            usuario.uid
          )
        });
      });
      const uidComentario = String(comentario.uid || "");
      const ehDono = Boolean(
        uidAtual &&
        uidComentario &&
        uidAtual === uidComentario
      );
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
      configurarMenuComentario(menu, menuBotao);
      if (ehAdminAtual || ehDono) {
        const excluir = document.createElement("button");
        excluir.type = "button";
        excluir.className = "comentario-menu-item comentario-menu-excluir";
        excluir.textContent = "Excluir";
        excluir.addEventListener("click", async () => {
          menu.hidden = true;
          menuComentarioAberto = null;
          menuBotao.setAttribute("aria-expanded", "false");
          if (!window.confirm("Excluir este comentário?")) return;
          try {
            await deleteDoc(
              doc(db, "posts", postId, "comentarios", item.id)
            );
            await carregarComentarios(postId, elemento);
            mostrarMensagem("Comentário excluído.");
          } catch (erro) {
            console.error("Erro ao excluir comentário:", erro);
            mostrarMensagem(
              `Não foi possível excluir (${erro.code || "erro"}).`,
              "erro",
              8000
            );
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
            mostrarMensagem(
              "Faça login para denunciar um comentário.",
              "aviso",
              7000
            );
            areaAuth.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
            return;
          }
          try {
            const usuario = auth.currentUser;
            await setDoc(
              doc(
                db,
                "posts",
                postId,
                "comentarios",
                item.id,
                "denuncias",
                usuario.uid
              ),
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
            mostrarMensagem(
              `Não foi possível denunciar (${erro.code || "erro"}).`,
              "erro",
              8000
            );
          }
        });
        menu.appendChild(denunciar);
      }
      menuWrap.append(menuBotao, menu);
      caixa.appendChild(menuWrap);
      const formResposta = document.createElement("form");
      formResposta.className = "form-resposta-comentario";
      formResposta.hidden = true;
      const alvo = document.createElement("div");
      alvo.className = "resposta-alvo";
      alvo.textContent = handleComentario
        ? `Respondendo a @${handleComentario}`
        : `Respondendo a ${comentario.autor || "Usuário"}`;
      const linhaResposta = document.createElement("div");
      linhaResposta.className = "resposta-linha";
      const inputResposta = document.createElement("input");
      inputResposta.type = "text";
      inputResposta.maxLength = 500;
      inputResposta.placeholder = "Escreva sua resposta";
      inputResposta.required = true;
      const enviar = document.createElement("button");
      enviar.type = "submit";
      enviar.textContent = "Responder";
      const cancelar = document.createElement("button");
      cancelar.type = "button";
      cancelar.className = "btn-cancelar-resposta";
      cancelar.textContent = "Cancelar";
      linhaResposta.append(inputResposta, enviar, cancelar);
      formResposta.append(alvo, linhaResposta);
      let alvoRespostaUid = comentario.uid || "";
      let alvoRespostaHandle = handleComentario || "";
      let alvoRespostaNome = obterNomePorUid(
        comentario.uid,
        comentario.autor || "Usuário"
      );
      let alvoEhResposta = false;
      function abrirFormularioResposta({
        uid = "",
        handle = "",
        nome = "Usuário",
        ehResposta = false
      } = {}) {
        if (!usuarioPodeInteragir()) return;
        alvoRespostaUid = uid;
        alvoRespostaHandle = handle;
        alvoRespostaNome = nome || "Usuário";
        alvoEhResposta = Boolean(ehResposta);
        elemento
          .querySelectorAll(".form-resposta-comentario")
          .forEach(form => {
            if (form !== formResposta) form.hidden = true;
          });
        alvo.textContent = alvoRespostaHandle
          ? `Respondendo a @${alvoRespostaHandle}`
          : `Respondendo a ${alvoRespostaNome}`;
        formResposta.hidden = false;
        inputResposta.focus();
      }
      responder.addEventListener("click", () => {
        abrirFormularioResposta({
          uid: comentario.uid || "",
          handle: handleComentario || "",
          nome: obterNomePorUid(
            comentario.uid,
            comentario.autor || "Usuário"
          ),
          ehResposta: false
        });
      });
      cancelar.addEventListener("click", () => {
        formResposta.hidden = true;
        inputResposta.value = "";
      });
      const listaRespostas = document.createElement("div");
      listaRespostas.className = "lista-respostas-comentario";
      listaRespostas.hidden = true;
      formResposta.addEventListener("submit", async event => {
        event.preventDefault();
        if (!usuarioPodeInteragir()) return;
        const textoResposta = inputResposta.value.trim();
        if (!textoResposta) return;
        try {
          const usuario = auth.currentUser;
          const respostaRef = await addDoc(
            collection(
              db,
              "posts",
              postId,
              "comentarios",
              item.id,
              "respostas"
            ),
            {
              uid: usuario.uid,
              autor: obterNomePerfilAtual(),
              texto: textoResposta,
              respondendoUid: alvoRespostaUid,
              respondendoA: alvoEhResposta ? alvoRespostaHandle : "",
              criadoEm: serverTimestamp()
            }
          );
          await criarNotificacao({
            destinatarioUid: alvoRespostaUid,
            tipo: "resposta_comentario",
            postId,
            comentarioId: item.id,
            respostaId: respostaRef.id,
            eventoId: idNotificacao(
              "resposta",
              postId,
              item.id,
              respostaRef.id
            )
          });
          inputResposta.value = "";
          formResposta.hidden = true;
          await carregarRespostasDoComentario(
            postId,
            item.id,
            listaRespostas,
            abrirFormularioResposta
          );
          atualizarContagemComentariosPost(postId);
          mostrarMensagem("Resposta enviada.");
        } catch (erro) {
          console.error("Erro ao responder comentário:", erro);
          mostrarMensagem(
            `Não foi possível responder (${erro.code || "erro"}).`,
            "erro",
            8000
          );
        }
      });
      bloco.append(caixa, formResposta, listaRespostas);
      elemento.appendChild(bloco);
      carregarRespostasDoComentario(
        postId,
        item.id,
        listaRespostas,
        abrirFormularioResposta
      );
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
const adminAtualizar = document.getElementById("admin-atualizar");
const adminMenuItens = [...document.querySelectorAll(".admin-menu-item")];
const adminViews = [...document.querySelectorAll(".admin-view")];
const adminDashboardStatus = document.getElementById("admin-dashboard-status");
const adminMetricaUsuarios = document.getElementById("admin-metrica-usuarios");
const adminMetricaPublicacoes = document.getElementById("admin-metrica-publicacoes");
const adminMetricaComentarios = document.getElementById("admin-metrica-comentarios");
const adminMetricaCurtidas = document.getElementById("admin-metrica-curtidas");
const adminMetricaDenuncias = document.getElementById("admin-metrica-denuncias");
const adminUsuariosAtivos = document.getElementById("admin-usuarios-ativos");
const adminDenunciasResumo = document.getElementById("admin-denuncias-resumo");
const adminPublicacoesBusca = document.getElementById("admin-publicacoes-busca");
const adminPublicacoesList = document.getElementById("admin-publicacoes-list");
const adminDenunciasList = document.getElementById("admin-denuncias-list");
const adminUsuariosBusca = document.getElementById("admin-usuarios-busca");
const adminUsuariosList = document.getElementById("admin-usuarios-list");
const adminTabDenuncias = document.getElementById("admin-tab-denuncias");
const adminNotificacaoForm = document.getElementById("admin-notificacao-form");
const adminNotificacaoDestinatario = document.getElementById("admin-notificacao-destinatario");
const adminNotificacaoTitulo = document.getElementById("admin-notificacao-titulo");
const adminNotificacaoTexto = document.getElementById("admin-notificacao-texto");
const adminNotificacaoContador = document.getElementById("admin-notificacao-contador");
const adminNotificacaoEnviar = document.getElementById("admin-notificacao-enviar");
const adminNotificacaoMsg = document.getElementById("admin-notificacao-msg");
configurarPreviewImagem(noticiaImagemInput, noticiaImagemPreview, noticiaImagemPreviewImg, noticiaImagemRemover);
let noticiasSalvas = [];
let adminContagemCliques = 0;
let adminResetCliquesTimer = null;
let adminModalAberto = false;
let adminTabAtual = "dashboard";
let adminCarregandoDados = false;
let adminDenunciasCarregadas = false;
let adminDadosCache = {
  publicacoes: [],
  denuncias: [],
  usuarios: [],
  resumo: {
    usuarios: 0,
    publicacoes: 0,
    comentarios: 0,
    curtidas: 0,
    denuncias: null
  }
};

function adminTextoSeguro(valor, fallback = "") {
  const texto = String(valor ?? "").trim();
  return texto || fallback;
}
function adminResumoTexto(texto, limite = 180) {
  const limpo = adminTextoSeguro(texto);
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limite - 1)}…`;
}
function adminAtivarTab(tab) {
  adminTabAtual = tab || "dashboard";
  adminMenuItens.forEach(botao => {
    const ativo = botao.dataset.adminTab === adminTabAtual;
    botao.classList.toggle("ativo", ativo);
  });
  adminViews.forEach(view => {
    view.hidden = view.id !== `admin-view-${adminTabAtual}`;
  });
  carregarAdminAba(adminTabAtual);
}
function adminCriarChip(texto, alerta = false) {
  const chip = document.createElement("span");
  chip.className = alerta
    ? "admin-chip admin-chip-alerta"
    : "admin-chip";
  chip.textContent = texto;
  return chip;
}
function adminBotao(texto, classe = "") {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  if (classe) botao.classList.add(classe);
  return botao;
}
function adminAbrirPost(postId) {
  fecharAdminModal();
  window.showPage?.("comunidade");
  window.setTimeout(() => {
    const card = document.getElementById(`post-${postId}`);
    if (!card) {
      mostrarMensagem("A publicação não está mais disponível.", "aviso");
      return;
    }
    card.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    card.classList.add("post-destaque-notificacao");
    window.setTimeout(
      () => card.classList.remove("post-destaque-notificacao"),
      1800
    );
  }, 150);
}
function adminPerfilLabel(uid) {
  const perfil = obterPerfil(uid);
  const nome = perfil?.nome || "Usuário";
  const username = perfil?.username ? `@${perfil.username}` : "";
  return { nome, username };
}
function renderizarAdminDashboard() {
  const resumo = adminDadosCache.resumo;
  if (adminMetricaUsuarios) {
    adminMetricaUsuarios.textContent = String(resumo.usuarios || 0);
  }
  if (adminMetricaPublicacoes) {
    adminMetricaPublicacoes.textContent = String(resumo.publicacoes || 0);
  }
  if (adminMetricaComentarios) {
    adminMetricaComentarios.textContent = String(resumo.comentarios || 0);
  }
  if (adminMetricaCurtidas) {
    adminMetricaCurtidas.textContent = String(resumo.curtidas || 0);
  }
  if (adminMetricaDenuncias) {
    adminMetricaDenuncias.textContent =
      resumo.denuncias === null ? "…" : String(resumo.denuncias);
  }
  if (adminTabDenuncias) {
    adminTabDenuncias.textContent = resumo.denuncias
      ? `Denúncias (${resumo.denuncias})`
      : "Denúncias";
    adminTabDenuncias.classList.toggle(
      "tem-alerta",
      Boolean(resumo.denuncias)
    );
  }
  if (adminDashboardStatus) {
    adminDashboardStatus.textContent = "Dados do feed";
  }
  if (adminUsuariosAtivos) {
    adminUsuariosAtivos.replaceChildren();
    const ativos = [...adminDadosCache.usuarios]
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 5);
    if (!ativos.length) {
      const vazio = document.createElement("p");
      vazio.textContent = "Nenhum usuário encontrado.";
      adminUsuariosAtivos.appendChild(vazio);
    }
    ativos.forEach(usuario => {
      const linha = document.createElement("div");
      linha.className = "admin-ranking-item";
      const identidade = document.createElement("div");
      identidade.className = "admin-ranking-identidade";
      const nome = document.createElement("strong");
      nome.textContent = usuario.nome;
      const handle = document.createElement("span");
      handle.textContent = usuario.username
        ? `@${usuario.username}`
        : "Sem nome de usuário";
      identidade.append(nome, handle);
      const numero = document.createElement("span");
      numero.className = "admin-ranking-numero";
      numero.textContent =
        usuario.posts === 1
          ? "1 publicação"
          : `${usuario.posts} publicações`;
      linha.append(identidade, numero);
      adminUsuariosAtivos.appendChild(linha);
    });
  }
  if (adminDenunciasResumo) {
    adminDenunciasResumo.replaceChildren();
    if (!adminDenunciasCarregadas) {
      const aviso = document.createElement("p");
      aviso.textContent = "Abra a aba Denúncias para carregar a moderação.";
      adminDenunciasResumo.appendChild(aviso);
      return;
    }
    const ultimas = [...adminDadosCache.denuncias]
      .sort((a, b) => b.criadoMs - a.criadoMs)
      .slice(0, 5);
    if (!ultimas.length) {
      const vazio = document.createElement("p");
      vazio.textContent = "Nenhuma denúncia pendente.";
      adminDenunciasResumo.appendChild(vazio);
    }
    ultimas.forEach(denuncia => {
      const linha = document.createElement("button");
      linha.type = "button";
      linha.className = "admin-resumo-denuncia";
      const info = document.createElement("div");
      info.className = "admin-ranking-identidade";
      const titulo = document.createElement("strong");
      titulo.textContent = denuncia.tipoLabel;
      const meta = document.createElement("small");
      meta.textContent = `${denuncia.denuncianteNome} • ${formatarData(denuncia.criadoEm)}`;
      info.append(titulo, meta);
      const abrir = document.createElement("span");
      abrir.className = "admin-ranking-numero";
      abrir.textContent = "Ver";
      linha.append(info, abrir);
      linha.addEventListener("click", () => adminAtivarTab("denuncias"));
      adminDenunciasResumo.appendChild(linha);
    });
  }
}
function renderizarAdminPublicacoes() {
  if (!adminPublicacoesList) return;
  const termo = (adminPublicacoesBusca?.value || "")
    .trim()
    .toLowerCase();
  const itens = adminDadosCache.publicacoes.filter(post => {
    if (!termo) return true;
    const perfil = adminPerfilLabel(post.uid);
    const campo = [
      post.titulo,
      post.texto,
      perfil.nome,
      perfil.username
    ].join(" ").toLowerCase();
    return campo.includes(termo.replace(/^@/, ""));
  });
  adminPublicacoesList.replaceChildren();
  if (!itens.length) {
    const vazio = document.createElement("p");
    vazio.textContent = "Nenhuma publicação encontrada.";
    adminPublicacoesList.appendChild(vazio);
    return;
  }
  itens.forEach(post => {
    const item = document.createElement("article");
    item.className = "admin-item";
    const topo = document.createElement("div");
    topo.className = "admin-item-topo";
    const identidade = document.createElement("div");
    identidade.className = "admin-item-identidade";
    const titulo = document.createElement("strong");
    titulo.textContent = post.titulo || "Publicação";
    const perfil = adminPerfilLabel(post.uid);
    const meta = document.createElement("small");
    meta.textContent = `${perfil.nome}${perfil.username ? ` • ${perfil.username}` : ""} • ${formatarData(post.criadoEm)}`;
    identidade.append(titulo, meta);
    const acoes = document.createElement("div");
    acoes.className = "admin-item-acoes";
    const ver = adminBotao("Ver no feed");
    ver.addEventListener("click", () => adminAbrirPost(post.id));
    const excluir = adminBotao("Excluir", "admin-acao-perigo");
    excluir.addEventListener("click", async () => {
      if (!window.confirm(`Excluir a publicação "${post.titulo || "Publicação"}"?`)) {
        return;
      }
      excluir.disabled = true;
      try {
        await deleteDoc(doc(db, "posts", post.id));
        adminToolsMsg.textContent = "Publicação excluída.";
        adminToolsMsg.className = "admin-msg sucesso";
        adminDadosCache.publicacoes = adminDadosCache.publicacoes.filter(
          item => item.id !== post.id
        );
        renderizarAdminPublicacoes();
      } catch (erro) {
        console.error("Erro ao excluir publicação no painel:", erro);
        adminToolsMsg.textContent =
          `Não foi possível excluir (${erro.code || "erro"}).`;
        adminToolsMsg.className = "admin-msg erro";
        excluir.disabled = false;
      }
    });
    acoes.append(ver, excluir);
    topo.append(identidade, acoes);
    const texto = document.createElement("p");
    texto.className = "admin-item-texto";
    texto.textContent = adminResumoTexto(post.texto, 220);
    const chips = document.createElement("div");
    chips.className = "admin-item-meta";
    chips.append(
      adminCriarChip(`${post.likes} curtidas`),
      adminCriarChip(`${post.comentarios} comentários`),
      adminCriarChip(
        `${post.denuncias} denúncias`,
        post.denuncias > 0
      )
    );
    item.append(topo, texto, chips);
    adminPublicacoesList.appendChild(item);
  });
}
function renderizarAdminUsuarios() {
  if (!adminUsuariosList) return;
  const termo = (adminUsuariosBusca?.value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const usuarios = adminDadosCache.usuarios
    .filter(usuario => {
      if (!termo) return true;
      return `${usuario.nome} ${usuario.username}`
        .toLowerCase()
        .includes(termo);
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  adminUsuariosList.replaceChildren();
  if (!usuarios.length) {
    const vazio = document.createElement("p");
    vazio.textContent = "Nenhum usuário encontrado.";
    adminUsuariosList.appendChild(vazio);
    return;
  }
  usuarios.forEach(usuario => {
    const item = document.createElement("article");
    item.className = "admin-item";
    const topo = document.createElement("div");
    topo.className = "admin-item-topo";
    const identidade = document.createElement("div");
    identidade.className = "admin-item-identidade";
    const nome = document.createElement("strong");
    nome.textContent = usuario.nome;
    const meta = document.createElement("small");
    meta.textContent = usuario.username
      ? `@${usuario.username}`
      : "Sem nome de usuário";
    identidade.append(nome, meta);
    const acoes = document.createElement("div");
    acoes.className = "admin-item-acoes";
    const verPosts = adminBotao("Ver publicações");
    verPosts.addEventListener("click", () => {
      if (adminPublicacoesBusca) {
        adminPublicacoesBusca.value = usuario.username
          ? `@${usuario.username}`
          : usuario.nome;
      }
      renderizarAdminPublicacoes();
      adminAtivarTab("publicacoes");
    });
    const notificar = adminBotao("Notificar");
    notificar.addEventListener("click", () => {
      if (adminNotificacaoDestinatario) {
        adminNotificacaoDestinatario.value = usuario.uid;
      }
      adminAtivarTab("notificacoes");
      adminNotificacaoTitulo?.focus();
    });
    acoes.append(verPosts, notificar);
    topo.append(identidade, acoes);
    const chips = document.createElement("div");
    chips.className = "admin-item-meta";
    chips.append(
      adminCriarChip(
        usuario.posts === 1
          ? "1 publicação"
          : `${usuario.posts} publicações`
      ),
      adminCriarChip("Perfil cadastrado")
    );
    item.append(topo, chips);
    adminUsuariosList.appendChild(item);
  });
}
function removerDenunciaAdminDoCache(denuncia) {
  adminDadosCache.denuncias = adminDadosCache.denuncias.filter(
    item => item.reportRef?.path !== denuncia.reportRef?.path
  );
  adminDadosCache.resumo.denuncias = adminDadosCache.denuncias.length;
  prepararAdminDadosLeves();
  renderizarAdminDenuncias();
  renderizarAdminDashboard();
  if (adminTabAtual === "publicacoes") {
    renderizarAdminPublicacoes();
  }
}
function renderizarAdminDenuncias() {
  if (!adminDenunciasList) return;
  const denuncias = [...adminDadosCache.denuncias]
    .sort((a, b) => b.criadoMs - a.criadoMs);
  adminDenunciasList.replaceChildren();
  if (!denuncias.length) {
    const vazio = document.createElement("p");
    vazio.textContent = "Nenhuma denúncia pendente.";
    adminDenunciasList.appendChild(vazio);
    return;
  }
  denuncias.forEach(denuncia => {
    const item = document.createElement("article");
    item.className = "admin-item";
    const tipo = document.createElement("span");
    tipo.className = "admin-denuncia-tipo";
    tipo.textContent = denuncia.tipoLabel;
    const topo = document.createElement("div");
    topo.className = "admin-item-topo";
    const identidade = document.createElement("div");
    identidade.className = "admin-item-identidade";
    const titulo = document.createElement("strong");
    titulo.textContent = denuncia.autorConteudo;
    const meta = document.createElement("small");
    meta.textContent =
      `Denunciado por ${denuncia.denuncianteNome}${denuncia.denuncianteUsername ? ` (@${denuncia.denuncianteUsername})` : ""} • ${formatarData(denuncia.criadoEm)}`;
    identidade.append(titulo, meta);
    topo.appendChild(identidade);
    const texto = document.createElement("p");
    texto.className = "admin-item-texto";
    texto.textContent = adminResumoTexto(denuncia.textoConteudo, 260);
    const acoes = document.createElement("div");
    acoes.className = "admin-item-acoes";
    const ver = adminBotao("Ver publicação");
    ver.addEventListener("click", () => adminAbrirPost(denuncia.postId));
    const ignorar = adminBotao("Ignorar denúncia");
    ignorar.addEventListener("click", async () => {
      ignorar.disabled = true;
      try {
        await deleteDoc(denuncia.reportRef);
        adminToolsMsg.textContent = "Denúncia marcada como resolvida.";
        adminToolsMsg.className = "admin-msg sucesso";
        removerDenunciaAdminDoCache(denuncia);
      } catch (erro) {
        console.error("Erro ao resolver denúncia:", erro);
        adminToolsMsg.textContent =
          `Não foi possível resolver (${erro.code || "erro"}).`;
        adminToolsMsg.className = "admin-msg erro";
        ignorar.disabled = false;
      }
    });
    const excluir = adminBotao("Excluir conteúdo", "admin-acao-perigo");
    excluir.addEventListener("click", async () => {
      if (!window.confirm("Excluir o conteúdo denunciado?")) return;
      excluir.disabled = true;
      try {
        await deleteDoc(denuncia.reportRef);
        await deleteDoc(denuncia.contentRef);
        adminToolsMsg.textContent = "Conteúdo denunciado excluído.";
        adminToolsMsg.className = "admin-msg sucesso";
        removerDenunciaAdminDoCache(denuncia);
      } catch (erro) {
        console.error("Erro ao excluir conteúdo denunciado:", erro);
        adminToolsMsg.textContent =
          `Não foi possível excluir (${erro.code || "erro"}).`;
        adminToolsMsg.className = "admin-msg erro";
        excluir.disabled = false;
      }
    });
    acoes.append(ver, ignorar, excluir);
    item.append(tipo, topo, texto, acoes);
    adminDenunciasList.appendChild(item);
  });
}
function atualizarDestinatariosNotificacaoAdmin() {
  if (!adminNotificacaoDestinatario) return;
  const valorAnterior = adminNotificacaoDestinatario.value || "todos";
  adminNotificacaoDestinatario.replaceChildren();
  const todos = document.createElement("option");
  todos.value = "todos";
  todos.textContent = "Todos os usuários";
  adminNotificacaoDestinatario.appendChild(todos);
  [...adminDadosCache.usuarios]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .forEach(usuario => {
      const option = document.createElement("option");
      option.value = usuario.uid;
      option.textContent = usuario.username
        ? `${usuario.nome} (@${usuario.username})`
        : usuario.nome;
      adminNotificacaoDestinatario.appendChild(option);
    });
  const existe = [...adminNotificacaoDestinatario.options]
    .some(option => option.value === valorAnterior);
  adminNotificacaoDestinatario.value = existe
    ? valorAnterior
    : "todos";
}
function prepararAdminDadosLeves() {
  const denunciasPorPost = new Map();
  adminDadosCache.denuncias.forEach(denuncia => {
    if (!denuncia.postId) return;
    denunciasPorPost.set(
      denuncia.postId,
      (denunciasPorPost.get(denuncia.postId) || 0) + 1
    );
  });
  adminDadosCache.publicacoes = [...postsSalvos]
    .map(post => {
      const stats = obterEstatisticas(post.id);
      return {
        ...post,
        likes: Number(stats.likes || 0),
        comentarios: Number(stats.comentarios || 0),
        denuncias: Number(denunciasPorPost.get(post.id) || 0)
      };
    })
    .sort((a, b) => {
      const ta = a.criadoEm?.toMillis?.() || 0;
      const tb = b.criadoEm?.toMillis?.() || 0;
      return tb - ta;
    });
  const postsPorUsuario = new Map();
  postsSalvos.forEach(post => {
    if (!post.uid) return;
    postsPorUsuario.set(
      post.uid,
      (postsPorUsuario.get(post.uid) || 0) + 1
    );
  });
  adminDadosCache.usuarios = [...perfisUsuarios.values()].map(perfil => ({
    uid: perfil.uid,
    nome: perfil.nome || "Usuário",
    username: perfil.username || "",
    foto: perfil.foto || "",
    posts: Number(postsPorUsuario.get(perfil.uid) || 0),
    comentarios: 0,
    curtidasRecebidas: 0,
    atividade: Number(postsPorUsuario.get(perfil.uid) || 0)
  }));
  adminDadosCache.resumo.usuarios = adminDadosCache.usuarios.length;
  adminDadosCache.resumo.publicacoes = postsSalvos.length;
  adminDadosCache.resumo.comentarios = [...estatisticasPosts.values()]
    .reduce((total, stats) => total + Number(stats.comentarios || 0), 0);
  adminDadosCache.resumo.curtidas = [...estatisticasPosts.values()]
    .reduce((total, stats) => total + Number(stats.likes || 0), 0);
  if (adminDenunciasCarregadas) {
    adminDadosCache.resumo.denuncias = adminDadosCache.denuncias.length;
  }
}
async function carregarDenunciasAdmin(forcar = false) {
  if (adminDenunciasCarregadas && !forcar) {
    renderizarAdminDenuncias();
    return;
  }
  if (adminDenunciasList) {
    adminDenunciasList.replaceChildren();
    const carregando = document.createElement("p");
    carregando.textContent = "Carregando denúncias...";
    adminDenunciasList.appendChild(carregando);
  }
  const denuncias = [];
  try {
    for (let indicePost = 0; indicePost < postsSalvos.length; indicePost++) {
      const post = postsSalvos[indicePost];
      const [denunciasPost, comentarios] = await Promise.all([
        getDocs(collection(db, "posts", post.id, "denuncias")),
        getDocs(collection(db, "posts", post.id, "comentarios"))
      ]);
      denunciasPost.forEach(reportDoc => {
        const report = reportDoc.data();
        const denunciante = adminPerfilLabel(report.uid);
        denuncias.push({
          tipo: "post",
          tipoLabel: "Publicação denunciada",
          postId: post.id,
          comentarioId: "",
          respostaId: "",
          reportId: reportDoc.id,
          reportRef: reportDoc.ref,
          contentRef: doc(db, "posts", post.id),
          criadoEm: report.criadoEm,
          criadoMs: report.criadoEm?.toMillis?.() || 0,
          denuncianteNome: denunciante.nome,
          denuncianteUsername: denunciante.username,
          autorConteudo: adminPerfilLabel(post.uid).nome,
          textoConteudo:
            `${post.titulo || "Publicação"} — ${post.texto || ""}`
        });
      });
      for (const comentarioDoc of comentarios.docs) {
        const comentario = comentarioDoc.data();
        const [denunciasComentario, respostas] = await Promise.all([
          getDocs(
            collection(
              db,
              "posts",
              post.id,
              "comentarios",
              comentarioDoc.id,
              "denuncias"
            )
          ),
          getDocs(
            collection(
              db,
              "posts",
              post.id,
              "comentarios",
              comentarioDoc.id,
              "respostas"
            )
          )
        ]);
        denunciasComentario.forEach(reportDoc => {
          const report = reportDoc.data();
          const denunciante = adminPerfilLabel(report.uid);
          denuncias.push({
            tipo: "comentario",
            tipoLabel: "Comentário denunciado",
            postId: post.id,
            comentarioId: comentarioDoc.id,
            respostaId: "",
            reportId: reportDoc.id,
            reportRef: reportDoc.ref,
            contentRef: doc(
              db,
              "posts",
              post.id,
              "comentarios",
              comentarioDoc.id
            ),
            criadoEm: report.criadoEm,
            criadoMs: report.criadoEm?.toMillis?.() || 0,
            denuncianteNome: denunciante.nome,
            denuncianteUsername: denunciante.username,
            autorConteudo: adminPerfilLabel(comentario.uid).nome,
            textoConteudo: comentario.texto || "Comentário"
          });
        });
        for (const respostaDoc of respostas.docs) {
          const resposta = respostaDoc.data();
          const denunciasResposta = await getDocs(
            collection(
              db,
              "posts",
              post.id,
              "comentarios",
              comentarioDoc.id,
              "respostas",
              respostaDoc.id,
              "denuncias"
            )
          );
          denunciasResposta.forEach(reportDoc => {
            const report = reportDoc.data();
            const denunciante = adminPerfilLabel(report.uid);
            denuncias.push({
              tipo: "resposta",
              tipoLabel: "Resposta denunciada",
              postId: post.id,
              comentarioId: comentarioDoc.id,
              respostaId: respostaDoc.id,
              reportId: reportDoc.id,
              reportRef: reportDoc.ref,
              contentRef: doc(
                db,
                "posts",
                post.id,
                "comentarios",
                comentarioDoc.id,
                "respostas",
                respostaDoc.id
              ),
              criadoEm: report.criadoEm,
              criadoMs: report.criadoEm?.toMillis?.() || 0,
              denuncianteNome: denunciante.nome,
              denuncianteUsername: denunciante.username,
              autorConteudo: adminPerfilLabel(resposta.uid).nome,
              textoConteudo: resposta.texto || "Resposta"
            });
          });
        }
      }
      
      if (indicePost % 2 === 1) {
        await proximoFrame();
      }
    }
    adminDadosCache.denuncias = denuncias;
    adminDenunciasCarregadas = true;
    prepararAdminDadosLeves();
    renderizarAdminDenuncias();
    renderizarAdminDashboard();
    if (adminTabAtual === "publicacoes") {
      renderizarAdminPublicacoes();
    }
  } catch (erro) {
    console.error("Erro ao carregar denúncias:", erro);
    if (adminDenunciasList) {
      adminDenunciasList.replaceChildren();
      const falha = document.createElement("p");
      falha.textContent =
        `Não foi possível carregar as denúncias (${erro.code || "erro"}).`;
      adminDenunciasList.appendChild(falha);
    }
  }
}
async function carregarAdminAba(tab, forcar = false) {
  if (!usuarioEhAdmin()) return;
  prepararAdminDadosLeves();
  if (tab === "dashboard") {
    renderizarAdminDashboard();
    return;
  }
  if (tab === "publicacoes") {
    renderizarAdminPublicacoes();
    return;
  }
  if (tab === "usuarios") {
    renderizarAdminUsuarios();
    return;
  }
  if (tab === "denuncias") {
    await carregarDenunciasAdmin(forcar);
    return;
  }
  if (tab === "noticias") {
    renderizarAdminNoticias();
    return;
  }
  if (tab === "notificacoes") {
    atualizarDestinatariosNotificacaoAdmin();
  }
}
async function carregarAdminDados() {
  if (!usuarioEhAdmin() || adminCarregandoDados) return;
  adminCarregandoDados = true;
  if (adminAtualizar) {
    adminAtualizar.disabled = true;
    adminAtualizar.textContent = "Atualizando...";
  }
  try {
    await carregarAdminAba(adminTabAtual, true);
  } finally {
    adminCarregandoDados = false;
    if (adminAtualizar) {
      adminAtualizar.disabled = false;
      adminAtualizar.textContent = "Atualizar dados";
    }
  }
}
async function enviarNotificacaoAdmin({
  destinatarioUid,
  titulo,
  texto,
  eventoId
}) {
  const admin = obterAdminAtual();
  if (!admin || !destinatarioUid || destinatarioUid === admin.uid) {
    return false;
  }
  await setDoc(
    doc(
      db,
      "notificacoes",
      destinatarioUid,
      "itens",
      eventoId
    ),
    {
      destinatarioUid,
      atorUid: admin.uid,
      tipo: "aviso_admin",
      postId: "",
      comentarioId: "",
      respostaId: "",
      titulo,
      texto,
      lida: false,
      criadoEm: serverTimestamp()
    }
  );
  return true;
}
adminMenuItens.forEach(botao => {
  botao.addEventListener("click", () => {
    adminAtivarTab(botao.dataset.adminTab);
  });
});
adminAtualizar?.addEventListener("click", () => {
  carregarAdminDados();
});
adminPublicacoesBusca?.addEventListener("input", () => {
  renderizarAdminPublicacoes();
});
adminUsuariosBusca?.addEventListener("input", () => {
  renderizarAdminUsuarios();
});
adminNotificacaoTexto?.addEventListener("input", () => {
  if (adminNotificacaoContador) {
    adminNotificacaoContador.textContent =
      `${adminNotificacaoTexto.value.length} / 240`;
  }
});
adminNotificacaoForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const admin = obterAdminAtual();
  if (!admin) {
    adminNotificacaoMsg.textContent =
      "Sua sessão administrativa expirou.";
    adminNotificacaoMsg.className = "admin-msg erro";
    return;
  }
  const alvo = adminNotificacaoDestinatario.value;
  const titulo = adminNotificacaoTitulo.value.trim();
  const texto = adminNotificacaoTexto.value.trim();
  if (!titulo || !texto) return;
  let destinatarios = [];
  if (alvo === "todos") {
    destinatarios = adminDadosCache.usuarios
      .map(usuario => usuario.uid)
      .filter(uid => uid && uid !== admin.uid);
  } else {
    destinatarios = [alvo].filter(
      uid => uid && uid !== admin.uid
    );
  }
  if (!destinatarios.length) {
    adminNotificacaoMsg.textContent =
      "Nenhum destinatário disponível.";
    adminNotificacaoMsg.className = "admin-msg erro";
    return;
  }
  const eventoId = idNotificacao(
    "aviso-admin",
    Date.now(),
    admin.uid
  );
  try {
    adminNotificacaoEnviar.disabled = true;
    adminNotificacaoEnviar.textContent = "Enviando...";
    adminNotificacaoMsg.textContent = "";
    let enviados = 0;
    for (const uid of destinatarios) {
      const enviado = await enviarNotificacaoAdmin({
        destinatarioUid: uid,
        titulo,
        texto,
        eventoId
      });
      if (enviado) enviados += 1;
    }
    event.target.reset();
    adminNotificacaoDestinatario.value = "todos";
    adminNotificacaoContador.textContent = "0 / 240";
    adminNotificacaoMsg.textContent =
      enviados === 1
        ? "Notificação enviada para 1 usuário."
        : `Notificação enviada para ${enviados} usuários.`;
    adminNotificacaoMsg.className = "admin-msg sucesso";
  } catch (erro) {
    console.error("Erro ao enviar notificação administrativa:", erro);
    adminNotificacaoMsg.textContent =
      `Não foi possível enviar (${erro.code || "erro"}).`;
    adminNotificacaoMsg.className = "admin-msg erro";
  } finally {
    adminNotificacaoEnviar.disabled = false;
    adminNotificacaoEnviar.textContent = "Enviar notificação";
  }
});

function abrirAdminModal() {
  if (!adminModal) return;
  adminModal.hidden = false;
  adminModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("admin-modal-aberto");
  adminModalAberto = true;
  atualizarPainelAdmin(auth.currentUser);
  window.setTimeout(() => {
    if (usuarioEhAdmin()) {
      document.querySelector('[data-admin-tab="dashboard"]')?.focus();
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
  
  event?.preventDefault();
  event?.stopPropagation();
  if (adminModalAberto) return;
  adminContagemCliques += 1;
  if (adminResetCliquesTimer) {
    window.clearTimeout(adminResetCliquesTimer);
  }
  
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
    adminNome.replaceChildren();
    const textoPainel = document.createElement("span");
    textoPainel.textContent = `Painel de ${admin.nome}`;
    adminNome.append(textoPainel, criarSeloVerificado());
    adminNome.classList.add("admin-nome-verificado");
    adminAtivarTab(adminTabAtual);
    renderizarAdminNoticias();
  } else {
    adminNome.textContent = "Painel administrativo";
    adminNome.classList.remove("admin-nome-verificado");
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
    autor.className = "noticia-autor-verificado";
    const prefixoAutor = document.createElement("span");
    prefixoAutor.textContent = noticia.autor ? `Por ${noticia.autor}` : "Equipe Inovação Verde";
    autor.append(prefixoAutor, criarSeloVerificado());
    const data = document.createElement("span");
    data.textContent = formatarData(noticia.criadoEm);
    topo.append(autor, data);
    if (noticia.imagem) {
      const imagem = document.createElement("img");
      imagem.className = "noticia-imagem";
      imagem.src = noticia.imagem;
      imagem.alt = `Imagem da notícia: ${noticia.titulo || "notícia"}`;
      imagem.loading = "lazy";
      imagem.decoding = "async";
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

