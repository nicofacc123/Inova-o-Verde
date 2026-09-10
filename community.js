// ===========================================
// FIREBASE
// ===========================================

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs
}
from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ===========================================
// CONFIGURAÇÃO DO SEU FIREBASE
// ===========================================

const firebaseConfig = {
  apiKey: "AIzaSyAiBmXnCxsFyWEvJxE5LZydQSvCahoWRn0",
  authDomain: "inovacaoverde-8dec8.firebaseapp.com",
  projectId: "inovacaoverde-8dec8",
  storageBucket: "inovacaoverde-8dec8.firebasestorage.app",
  messagingSenderId: "673592779541",
  appId: "1:673592779541:web:b03bf46dba419c180bbf1c",
  measurementId: "G-P4PW6FNLDT"
};



// Inicializa Firebase

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ===========================================
// ELEMENTOS
// ===========================================

const areaAuth =
  document.getElementById("area-auth");

const usuarioLogado =
  document.getElementById("usuario-logado");

const criarPublicacao =
  document.getElementById("criar-publicacao");

const nomeUsuario =
  document.getElementById("nome-usuario");

const mensagem =
  document.getElementById("comunidade-mensagem");

const feed =
  document.getElementById("feed-comunidade");

const postTipo =
  document.getElementById("post-tipo");

const campoLocal =
  document.getElementById("campo-local");

const postLocal =
  document.getElementById("post-local");

const postTexto =
  document.getElementById("post-texto");

const contadorTexto =
  document.getElementById("contador-texto");


// ===========================================
// MENSAGEM
// ===========================================

function mostrarMensagem(texto, tipo = "sucesso") {

  mensagem.textContent = texto;

  mensagem.className =
    `mensagem-comunidade mensagem-${tipo}`;

  setTimeout(() => {

    mensagem.textContent = "";

    mensagem.className = "";

  }, 4000);

}


// ===========================================
// CADASTRO
// ===========================================

document
  .getElementById("form-cadastro")
  .addEventListener("submit", async (event) => {

    event.preventDefault();

    const nome =
      document
        .getElementById("cadastro-nome")
        .value
        .trim();

    const email =
      document
        .getElementById("cadastro-email")
        .value
        .trim();

    const senha =
      document
        .getElementById("cadastro-senha")
        .value;

    try {

      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          email,
          senha
        );

      await updateProfile(
        credencial.user,
        {
          displayName: nome
        }
      );

      mostrarMensagem(
        "Conta criada com sucesso! 🌱"
      );

      event.target.reset();

    }

    catch (erro) {

      console.error(erro);

      let texto =
        "Não foi possível criar a conta.";

      if (
        erro.code ===
        "auth/email-already-in-use"
      ) {

        texto =
          "Este e-mail já possui uma conta.";

      }

      else if (
        erro.code ===
        "auth/invalid-email"
      ) {

        texto =
          "Digite um e-mail válido.";

      }

      else if (
        erro.code ===
        "auth/weak-password"
      ) {

        texto =
          "A senha precisa ter pelo menos 6 caracteres.";

      }

      mostrarMensagem(
        texto,
        "erro"
      );

    }

  });


// ===========================================
// LOGIN
// ===========================================

document
  .getElementById("form-login")
  .addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
      document
        .getElementById("login-email")
        .value
        .trim();

    const senha =
      document
        .getElementById("login-senha")
        .value;

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        senha
      );

      mostrarMensagem(
        "Login realizado com sucesso!"
      );

      event.target.reset();

    }

    catch (erro) {

      console.error(erro);

      mostrarMensagem(
        "E-mail ou senha incorretos.",
        "erro"
      );

    }

  });


// ===========================================
// SAIR
// ===========================================

document
  .getElementById("btn-sair")
  .addEventListener("click", async () => {

    await signOut(auth);

    mostrarMensagem(
      "Você saiu da sua conta."
    );

  });


// ===========================================
// OBSERVA LOGIN
// ===========================================

onAuthStateChanged(
  auth,
  (usuario) => {

    if (usuario) {

      areaAuth.hidden = true;

      usuarioLogado.hidden = false;

      criarPublicacao.hidden = false;

      nomeUsuario.textContent =
        usuario.displayName ||
        usuario.email;

    }

    else {

      areaAuth.hidden = false;

      usuarioLogado.hidden = true;

      criarPublicacao.hidden = true;

    }

  }
);


// ===========================================
// MOSTRAR CAMPO DE LOCALIZAÇÃO
// ===========================================

postTipo.addEventListener(
  "change",
  () => {

    const denunciarLixo =
      postTipo.value === "lixo";

    campoLocal.hidden =
      !denunciarLixo;

    postLocal.required =
      denunciarLixo;

  }
);


// ===========================================
// CONTADOR DE TEXTO
// ===========================================

postTexto.addEventListener(
  "input",
  () => {

    contadorTexto.textContent =
      `${postTexto.value.length} / 1500`;

  }
);


// ===========================================
// NOVA PUBLICAÇÃO
// ===========================================

document
  .getElementById("form-publicacao")
  .addEventListener("submit", async (event) => {

    event.preventDefault();

    const usuario =
      auth.currentUser;

    if (!usuario) {

      mostrarMensagem(
        "Entre na sua conta para publicar.",
        "erro"
      );

      return;

    }


    const tipo =
      postTipo.value;

    const titulo =
      document
        .getElementById("post-titulo")
        .value
        .trim();

    const texto =
      postTexto.value.trim();

    const local =
      postLocal.value.trim();


    if (!titulo || !texto) {

      mostrarMensagem(
        "Preencha título e conteúdo.",
        "erro"
      );

      return;

    }


    if (
      tipo === "lixo" &&
      !local
    ) {

      mostrarMensagem(
        "Informe pelo menos o bairro e a cidade.",
        "erro"
      );

      return;

    }


    try {

      await addDoc(
        collection(db, "posts"),
        {

          uid:
            usuario.uid,

          autor:
            usuario.displayName ||
            "Usuário",

          tipo:
            tipo,

          titulo:
            titulo,

          texto:
            texto,

          local:
            tipo === "lixo"
              ? local
              : "",

          criadoEm:
            serverTimestamp()

        }
      );


      mostrarMensagem(
        "Publicação enviada! 🌱"
      );


      event.target.reset();

      campoLocal.hidden = true;

      contadorTexto.textContent =
        "0 / 1500";

    }

    catch (erro) {

      console.error(erro);

      mostrarMensagem(
        "Não foi possível publicar.",
        "erro"
      );

    }

  });


// ===========================================
// FILTROS
// ===========================================

let filtroAtual = "todos";

let postsSalvos = [];


document
  .querySelectorAll(".filtro-post")
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".filtro-post")
          .forEach(btn =>
            btn.classList.remove("ativo")
          );

        botao.classList.add("ativo");

        filtroAtual =
          botao.dataset.filter;

        renderizarPosts();

      }
    );

  });


// ===========================================
// FIRESTORE EM TEMPO REAL
// ===========================================

const consultaPosts =
  query(
    collection(db, "posts"),
    orderBy("criadoEm", "desc")
  );


onSnapshot(
  consultaPosts,
  (snapshot) => {

    postsSalvos =
      snapshot.docs.map(documento => ({

        id:
          documento.id,

        ...documento.data()

      }));

    renderizarPosts();

  },
  (erro) => {

    console.error(erro);

    feed.textContent =
      "Não foi possível carregar as publicações.";

  }
);


// ===========================================
// RENDERIZA POSTS
// ===========================================

function renderizarPosts() {

  feed.replaceChildren();


  const postsFiltrados =
    filtroAtual === "todos"

      ? postsSalvos

      : postsSalvos.filter(
          post =>
            post.tipo === filtroAtual
        );


  if (
    postsFiltrados.length === 0
  ) {

    const vazio =
      document.createElement("div");

    vazio.className =
      "feed-vazio";

    vazio.textContent =
      "Nenhuma publicação encontrada.";

    feed.appendChild(vazio);

    return;

  }


  postsFiltrados.forEach(
    post => {

      feed.appendChild(
        criarCardPost(post)
      );

    }
  );

}


// ===========================================
// CARD
// ===========================================

function criarCardPost(post) {

  const card =
    document.createElement("article");

  card.className =
    "post-comunidade";


  // CABEÇALHO

  const cabecalho =
    document.createElement("div");

  cabecalho.className =
    "post-cabecalho";


  const avatar =
    document.createElement("div");

  avatar.className =
    "post-avatar";

  avatar.textContent =
    (post.autor || "U")
      .charAt(0)
      .toUpperCase();


  const autorArea =
    document.createElement("div");

  autorArea.className =
    "post-autor";


  const autor =
    document.createElement("strong");

  autor.textContent =
    post.autor ||
    "Usuário";


  const data =
    document.createElement("span");

  data.className =
    "post-data";

  data.textContent =
    formatarData(
      post.criadoEm
    );


  autorArea.append(
    autor,
    data
  );


  cabecalho.append(
    avatar,
    autorArea
  );


  // TIPO

  const tipo =
    document.createElement("span");

  tipo.className =
    "post-tipo";

  tipo.textContent =
    nomeTipo(post.tipo);


  // TÍTULO

  const titulo =
    document.createElement("h4");

  titulo.textContent =
    post.titulo;


  // TEXTO

  const texto =
    document.createElement("div");

  texto.className =
    "post-texto";

  texto.textContent =
    post.texto;


  card.append(
    cabecalho,
    tipo,
    titulo,
    texto
  );


  // LOCAL

  if (
    post.tipo === "lixo" &&
    post.local
  ) {

    const local =
      document.createElement("div");

    local.className =
      "post-local";

    local.textContent =
      `📍 ${post.local}`;

    card.appendChild(local);

  }


  // AÇÕES

  const acoes =
    document.createElement("div");

  acoes.className =
    "post-acoes";


  const comentar =
    document.createElement("button");

  comentar.className =
    "btn-comentar";

  comentar.textContent =
    "💬 Comentários";


  acoes.appendChild(
    comentar
  );

  card.appendChild(
    acoes
  );


  // ÁREA DE COMENTÁRIOS

  const areaComentarios =
    document.createElement("div");

  areaComentarios.className =
    "area-comentarios";

  areaComentarios.hidden =
    true;


  const lista =
    document.createElement("div");

  lista.className =
    "lista-comentarios";


  areaComentarios.appendChild(
    lista
  );


  comentar.addEventListener(
    "click",
    async () => {

      areaComentarios.hidden =
        !areaComentarios.hidden;

      if (
        !areaComentarios.hidden
      ) {

        await carregarComentarios(
          post.id,
          lista
        );

      }

    }
  );


  // SE ESTIVER LOGADO,
  // MOSTRA CAMPO PARA COMENTAR

  if (
    auth.currentUser
  ) {

    const formulario =
      document.createElement("form");

    formulario.className =
      "form-comentario";


    const input =
      document.createElement("input");

    input.type = "text";

    input.maxLength = 500;

    input.placeholder =
      "Escreva um comentário...";

    input.required = true;


    const botao =
      document.createElement("button");

    botao.type = "submit";

    botao.textContent =
      "Enviar";


    formulario.append(
      input,
      botao
    );


    formulario.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        const usuario =
          auth.currentUser;

        if (!usuario) {

          mostrarMensagem(
            "Entre para comentar.",
            "erro"
          );

          return;

        }


        const comentario =
          input.value.trim();


        if (!comentario) {
          return;
        }


        try {

          await addDoc(

            collection(
              db,
              "posts",
              post.id,
              "comentarios"
            ),

            {

              uid:
                usuario.uid,

              autor:
                usuario.displayName ||
                "Usuário",

              texto:
                comentario,

              criadoEm:
                serverTimestamp()

            }

          );


          input.value = "";


          await carregarComentarios(
            post.id,
            lista
          );

        }

        catch (erro) {

          console.error(erro);

          mostrarMensagem(
            "Não foi possível comentar.",
            "erro"
          );

        }

      }
    );


    areaComentarios.appendChild(
      formulario
    );

  }


  card.appendChild(
    areaComentarios
  );


  return card;

}


// ===========================================
// CARREGAR COMENTÁRIOS
// ===========================================

async function carregarComentarios(
  postId,
  elemento
) {

  elemento.replaceChildren();


  const carregando =
    document.createElement("span");

  carregando.textContent =
    "Carregando comentários...";

  elemento.appendChild(
    carregando
  );


  try {

    const consulta =
      query(

        collection(
          db,
          "posts",
          postId,
          "comentarios"
        ),

        orderBy(
          "criadoEm",
          "asc"
        )

      );


    const resultado =
      await getDocs(
        consulta
      );


    elemento.replaceChildren();


    if (resultado.empty) {

      const vazio =
        document.createElement("span");

      vazio.textContent =
        "Nenhum comentário ainda.";

      elemento.appendChild(
        vazio
      );

      return;

    }


    resultado.forEach(
      documento => {

        const comentario =
          documento.data();


        const caixa =
          document.createElement("div");

        caixa.className =
          "comentario";


        const nome =
          document.createElement("strong");

        nome.textContent =
          comentario.autor ||
          "Usuário";


        const texto =
          document.createElement("span");

        texto.textContent =
          `: ${comentario.texto}`;


        caixa.append(
          nome,
          texto
        );


        elemento.appendChild(
          caixa
        );

      }
    );

  }

  catch (erro) {

    console.error(erro);

    elemento.textContent =
      "Erro ao carregar comentários.";

  }

}


// ===========================================
// NOMES DOS TIPOS
// ===========================================

function nomeTipo(tipo) {

  const tipos = {

    ideia:
      "💡 Ideia sustentável",

    discussao:
      "💬 Discussão",

    lixo:
      "🗑️ Problema ambiental"

  };


  return tipos[tipo] ||
    "🌱 Publicação";

}


// ===========================================
// DATA
// ===========================================

function formatarData(timestamp) {

  if (
    !timestamp ||
    !timestamp.toDate
  ) {

    return "Agora";

  }


  const data =
    timestamp.toDate();


  return data.toLocaleString(
    "pt-BR",
    {

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit"

    }
  );

}