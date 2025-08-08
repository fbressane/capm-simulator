// app.js (versão debug/robusta)

let ALL_QUESTIONS = [];
let CURRENT = [];

const quizArea   = document.getElementById('quizArea');
const scoreArea  = document.getElementById('scoreArea');
const btnStart   = document.getElementById('btnStart');
const btnSubmit  = document.getElementById('btnSubmit');
const btnReset   = document.getElementById('btnReset');

function uiError(msg){
  const box = document.createElement('div');
  box.style.background = '#fee2e2';
  box.style.border = '1px solid #fecaca';
  box.style.color = '#7f1d1d';
  box.style.padding = '12px';
  box.style.borderRadius = '10px';
  box.style.margin = '12px 0';
  box.textContent = msg;
  quizArea.prepend(box);
}

function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadQuestions(){
  try {
    // tenta pelo caminho padrão
    let res = await fetch('questions.json', { cache: 'no-store' });
    if(!res.ok){
      // fallback relativo
      res = await fetch('./questions.json', { cache: 'no-store' });
    }
    if(!res.ok) throw new Error(`HTTP ${res.status} ao carregar questions.json`);

    const data = await res.json();
    if(!Array.isArray(data) || data.length === 0){
      throw new Error('questions.json vazio ou formato inesperado (esperado: array de objetos)');
    }
    ALL_QUESTIONS = data;
    console.log('Carregado:', ALL_QUESTIONS.length, 'questões');
  } catch (err) {
    console.error(err);
    uiError('Erro ao carregar questions.json. Confirme se o arquivo está na raiz e acessível via /questions.json.');
  }
}

function filterQuestions(domain, keywords){
  let items = ALL_QUESTIONS.slice();

  // filtro por domínio (I, II, III, IV)
  if (domain && domain !== 'all'){
    items = items.filter(q => Array.isArray(q.tags) && q.tags.includes(domain));
  }

  // filtro por palavras‑chave (separadas por vírgula)
  if (keywords && keywords.trim().length){
    const tokens = keywords.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    items = items.filter(q => {
      const hay = (String(q.text) + ' ' + (q.options||[]).join(' ')).toLowerCase();
      return tokens.every(t => hay.includes(t));
    });
  }
  return items;
}

function renderQuiz(questions){
  quizArea.innerHTML = '';
  questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'question';
    const domainLabel = (q.tags && q.tags[0]) ? `<span class="pill">Domínio ${q.tags[0]}</span>` : '';
    const opts = (q.options || []).map((opt, i) =>
      `<label class="option"><input type="radio" name="q${idx}" value="${i}"> ${opt}</label>`
    ).join('');
    div.innerHTML = `<h3>${idx+1}. ${q.text}</h3>${domainLabel}${opts}`;
    quizArea.appendChild(div);
  });
}

function grade(questions){
  let score = 0;
  const nodes = quizArea.querySelectorAll('.question');
  nodes.forEach((node, idx) => {
    const q = questions[idx];
    const selected = node.querySelector(`input[name="q${idx}"]:checked`);
    const result = document.createElement('div');
    if (selected && parseInt(selected.value,10) === q.answer){
      score++;
      result.className = 'result correct';
      result.innerHTML = `✔ Correto`;
    } else {
      result.className = 'result incorrect';
      const correct = q.options[q.answer];
      result.innerHTML = `✘ ${selected ? 'Errado' : 'Não respondida'}<br><strong>Correta:</strong> ${correct}`;
    }
    node.appendChild(result);
  });
  scoreArea.style.display = 'block';
  scoreArea.innerHTML = `<div class="score">Pontuação: ${score} / ${questions.length}</div>`;
}

function getVal(id, fallback=null){
  const el = document.getElementById(id);
  return el ? el.value : fallback;
}

function initHandlers(){
  btnStart?.addEventListener('click', () => {
    if(!ALL_QUESTIONS.length){
      uiError('Banco de questões não carregado. Veja erros acima.');
      return;
    }
    const domain   = getVal('domain', 'all');          // se não existir, usa 'all'
    const qtyInput = parseInt(getVal('qty', '15'), 10);
    const qty      = Math.max(5, Math.min(50, isNaN(qtyInput) ? 15 : qtyInput));
    const keywords = getVal('keywords', '');

    let pool = filterQuestions(domain, keywords);
    if (pool.length === 0){
      quizArea.innerHTML = '<p class="muted">Nenhuma questão encontrada com esses filtros. Tente outro domínio ou remova as palavras‑chave.</p>';
      btnSubmit.disabled = true; btnReset.disabled = true;
      scoreArea.style.display = 'none'; scoreArea.innerHTML = '';
      return;
    }
    pool = shuffle(pool);
    CURRENT = pool.slice(0, qty);
    renderQuiz(CURRENT);
    btnSubmit.disabled = false; btnReset.disabled = false;
    scoreArea.style.display = 'none'; scoreArea.innerHTML = '';
  });

  btnSubmit?.addEventListener('click', () => {
    if (CURRENT.length) grade(CURRENT);
  });

  btnReset?.addEventListener('click', () => {
    quizArea.innerHTML = '';
    CURRENT = [];
    btnSubmit.disabled = true; btnReset.disabled = true;
    scoreArea.style.display = 'none'; scoreArea.innerHTML = '';
  });
}

// Garante execução após carregar script/DOM
document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  initHandlers();
});
