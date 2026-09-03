document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img").forEach(img => {
    img.addEventListener("error", () => {
      const nome = img.src.split("/").pop(); 
    });
  });
});
  function showPage(pageId) {

    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

  
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll("nav a").forEach(a => a.classList.remove("active-tab"));
    document.querySelector(`nav a[data-page='${pageId}']`).classList.add("active-tab");
  }
  function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
const curiosidades = [
  {title:'Blocos feitos com plástico',img:'imagens/curio1.jpg',text:'Empresas transformam plástico em blocos resistentes e ecológicos.'},
  {title:'Água solar para cisternas',img:'imagens/curio2.jpg',text:'Tecnologia que usa energia solar para purificar água em regiões rurais.'},
  {title:'Economia circular',img:'imagens/curio3.jpg',text:'Modelo onde resíduos se tornam insumos de novos ciclos produtivos.'}
];

function openCurio(i){
  const c=curiosidades[i];
  document.getElementById('curio-title').innerText=c.title;
  document.getElementById('curio-img').src=c.img;
  document.getElementById('curio-text').innerText=c.text;
  document.getElementById('curio-modal').style.display='flex';
}
function closeModal(){ document.getElementById('curio-modal').style.display='none'; }


const quizQuestions = [
  {
    q: 'O que é economia circular?',
    options: [
      'Modelo de reduzir, reutilizar e reciclar recursos',
      'Economia que cresce em círculo',
      'Só vender produtos circulares'
    ],
    answer: 0
  },
  {
    q: 'Qual vantagem dos blocos de plástico reciclado?',
    options: [
      'São mais leves e reduzem custos de transporte',
      'Nunca quebram',
      'Não precisam de mão de obra'
    ],
    answer: 0
  },
  {
    q: 'O que empreendedores sustentáveis priorizam?',
    options: [
      'Lucro acima de tudo',
      'Impacto social e ambiental além do lucro',
      'Evitar tecnologia'
    ],
    answer: 1
  },
  {
    q: 'Qual benefício da agricultura urbana?',
    options: [
      'Mais alimentos locais e frescos',
      'Aumenta emissão de CO2',
      'Acaba com áreas verdes'
    ],
    answer: 0
  },
  {
    q: 'Por que o bambu é considerado sustentável?',
    options: [
      'Cresce rápido e se regenera facilmente',
      'Não precisa de água',
      'É mais caro que madeira'
    ],
    answer: 0
  },
  {
    q: 'Qual dessas é uma fonte de energia renovável?',
    options: [
      'Carvão mineral',
      'Energia das ondas',
      'Petróleo'
    ],
    answer: 1
  },
  {
  q: 'Qual é o principal objetivo da coleta seletiva?',
  options: [
    'Separar os resíduos para facilitar a reciclagem',
    'Deixar o lixo mais bonito',
    'Acabar com o uso de sacolas plásticas'
  ],
  answer: 0
},
{
  q: 'O que significa o princípio dos 3Rs?',
  options: [
    'Reduzir, Reutilizar e Reciclar',
    'Reparar, Recarregar e Recriar',
    'Revisar, Reduzir e Renovar'
  ],
  answer: 0
},
{
  q: 'Qual dessas energias NÃO é renovável?',
  options: [
    'Solar',
    'Petróleo',
    'Eólica'
  ],
  answer: 1
},
{
  q: 'O que é compostagem?',
  options: [
    'Transformar restos orgânicos em adubo',
    'Reutilizar garrafas de plástico',
    'Produzir energia a partir de carvão'
  ],
  answer: 0
},
{
  q: 'Por que plantar árvores ajuda o planeta?',
  options: [
    'Elas absorvem gás carbônico (CO₂)',
    'Elas produzem mais plástico',
    'Elas gastam muita água'
  ],
  answer: 0
},
{
  q: 'Qual país é conhecido por reciclar mais de 90% do seu lixo?',
  options: [
    'Brasil',
    'Japão',
    'Suécia'
  ],
  answer: 2
}

];

let currentQuestion=0; let score=0; let answered=false;

function updateTracker(){
  document.getElementById('score-tracker').innerText=`Questão ${currentQuestion+1} de ${quizQuestions.length} | Pontos: ${score}`;
}

function startQuiz(){
  currentQuestion=0; score=0; answered=false;
  document.getElementById('quiz-start').style.display='none';
  document.getElementById('quiz-result').style.display='none';
  document.getElementById('quiz-question').style.display='block';
  showQuestion();
}

function showQuestion(){
  answered = false; 
  updateTracker();

  const q = quizQuestions[currentQuestion];
  document.getElementById('q-text').innerText = q.q;
  let optsWithIndex = q.options.map((o, i) => ({ text: o, index: i }));
  optsWithIndex = shuffleArray(optsWithIndex);
  let correctIndexAfterShuffle = optsWithIndex.findIndex(opt => opt.index === q.answer);
  const opts = document.getElementById('q-options'); 
  opts.innerHTML = '';
  optsWithIndex.forEach((opt, pos) => {
    const div = document.createElement('div');
    div.className = 'option';
    div.innerText = opt.text;
   
    div.onclick = () => selectOption(pos, correctIndexAfterShuffle);
    opts.appendChild(div);
  });

  document.getElementById('next-btn').style.display='none';
  document.getElementById('finish-btn').style.display='none';
}
function selectOption(i, correctIndex){
  if(answered) return; 
  answered = true;

  const opts = document.querySelectorAll('#q-options .option');
  
  opts.forEach((el, idx) => {
    el.style.pointerEvents='none';
    if(idx === correctIndex) el.classList.add('correct'); // verde só no correto
    if(idx === i && idx !== correctIndex) el.classList.add('wrong'); // vermelho no errado
  });

  if(i === correctIndex) score++;
  updateTracker();

  setTimeout(() => {
    if(currentQuestion < quizQuestions.length-1){
      currentQuestion++;
      showQuestion();
    } else {
      finishQuiz();
    }
  }, 750);
}


function nextQuestion(){ currentQuestion++; showQuestion(); }

function finishQuiz(){
  document.getElementById('quiz-question').style.display='none';
  document.getElementById('quiz-result').style.display='block';
  const text=document.getElementById('result-text');
  text.innerHTML=`Você acertou <strong>${score}</strong> de <strong>${quizQuestions.length}</strong> perguntas.`;
  if(score===quizQuestions.length) text.innerHTML+=' 🔥 Perfeito!';
  else if(score>=Math.ceil(quizQuestions.length/2)) text.innerHTML+=' 👍 Muito bem!';
  else text.innerHTML+=' 🤓 Precisa estudar ';
}

function resetQuiz(){
  document.getElementById('quiz-result').style.display='none';
  document.getElementById('quiz-start').style.display='block';
}

  function showDetail(tipo) {
    const dados = {
  plastico: {
    img: "imagens/plastico.png",  
    texto: "Diminuir o consumo de plástico e papel evita resíduos e a extração excessiva de recursos naturais. Prefira alternativas digitais e materiais reutilizáveis."
  },
  embalagens: {
    img: "imagens/embalagens.jpg",  
    texto: "Escolher embalagens recicláveis ou biodegradáveis reduz a poluição e o impacto ambiental, passando uma imagem responsável para seus clientes."
  },
  fornecedores: {
    img: "imagens/fornecedores.jpeg",  
    texto: "Comprar de fornecedores da região reduz a poluição com transporte, fortalece a economia local e estimula práticas éticas e sustentáveis."
  },
  energia: {
    img: "imagens/energia.jpg",  
    texto: "Trocar lâmpadas por LED, desligar equipamentos e reaproveitar a água da chuva reduz custos e preserva recursos naturais."
  },
  educacao: {
    img: "imagens/educacao.png",  
    texto: "Ensinar e incentivar práticas sustentáveis aumenta a consciência e multiplica hábitos responsáveis dentro e fora da empresa."
  },
  residuos: {
        img: "imagens/gestao.png",  
        texto: "Implementar coleta seletiva e compostagem ajuda a reduzir o volume de lixo nos aterros e gera novos recursos como adubo."
      }
    };

    document.getElementById('imagem-pratica').src = dados[tipo].img;
    document.getElementById('texto-pratica').innerText = dados[tipo].texto;
    document.getElementById('detalhe-pratica').style.display = 'block';
  }
