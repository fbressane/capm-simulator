let ALL_QUESTIONS = [];
const quizArea = document.getElementById('quizArea');
const scoreArea = document.getElementById('scoreArea');
const statusBox = document.getElementById('status');
const btnStart = document.getElementById('btnStart');
const btnSubmit = document.getElementById('btnSubmit');
const btnReset = document.getElementById('btnReset');

function setStatus(msg){ statusBox.textContent = msg || ''; }

function shuffle(arr){ for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

async function loadQuestions(){
  try{
    const res = await fetch('questions.json', { cache: 'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    ALL_QUESTIONS = await res.json();
    setStatus(`Banco carregado: ${ALL_QUESTIONS.length} questões.`);
  }catch(e){
    setStatus('Erro ao carregar questions.json.');
    console.error(e);
  }
}

function filterQuestions(domain, keywords){
  let items = ALL_QUESTIONS.slice();
  if (domain && domain !== 'all'){
    items = items.filter(q => (q.tags||[]).includes(domain));
  }
  if (keywords && keywords.trim().length){
    const k = keywords.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    items = items.filter(q => {
      const hay = (q.text + ' ' + q.options.join(' ')).toLowerCase();
      return k.every(token => hay.includes(token));
    });
  }
  return items;
}

function renderQuiz(questions){
  quizArea.innerHTML = '';
  questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.className = 'question';
    const domainLabel = q.tags && q.tags[0] ? `<span class="pill">Domínio ${q.tags[0]}</span>` : '';
    div.innerHTML = `<h3>${idx+1}. ${q.text}</h3>${domainLabel}` + q.options.map((opt, i)=> 
      `<label class="option"><input type="radio" name="q${idx}" value="${i}"/> ${opt}</label>`
    ).join('');
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
      result.innerHTML = `✔ Correto` + (q.explanation ? `<br>${q.explanation}` : '');
    } else {
      result.className = 'result incorrect';
      const correct = q.options[q.answer];
      result.innerHTML = `✘ ${selected ? 'Errado' : 'Não respondida'}<br><strong>Correta:</strong> ${correct}` + (q.explanation ? `<br>${q.explanation}` : '');
    }
    node.appendChild(result);
  });
  scoreArea.style.display = 'block';
  scoreArea.innerHTML = `<div class="score">Pontuação: ${score} / ${questions.length}</div>`;
}

let CURRENT = [];

btnStart.addEventListener('click', () => {
  if(!ALL_QUESTIONS.length){ setStatus('Banco não carregado.'); return; }
  const domain = document.getElementById('domain').value;
  const qty = Math.max(2, Math.min(50, parseInt(document.getElementById('qty').value,10) || 10)); // mínimo 2
  const keywords = document.getElementById('keywords').value;
  let pool = filterQuestions(domain, keywords);
  if (pool.length === 0){
    quizArea.innerHTML = '<p class="muted">Nenhuma questão encontrada com esses filtros.</p>';
    btnSubmit.disabled = true; btnReset.disabled = true;
    scoreArea.style.display = 'none'; scoreArea.innerHTML = '';
    setStatus('0 questões encontradas para os filtros aplicados.');
    return;
  }
  pool = shuffle(pool);
  const take = Math.min(qty, pool.length);
  CURRENT = pool.slice(0, take);
  renderQuiz(CURRENT);
  btnSubmit.disabled = false; btnReset.disabled = false;
  scoreArea.style.display = 'none'; scoreArea.innerHTML = '';
  setStatus(`Encontradas ${pool.length} questões. Exibindo ${take}.`);
});

btnSubmit.addEventListener('click', () => {
  if (CURRENT.length) grade(CURRENT);
});

btnReset.addEventListener('click', () => {
  quizArea.innerHTML = '';
  CURRENT = [];
  btnSubmit.disabled = true; btnReset.disabled = true;
  scoreArea.style.display = 'none'; scoreArea.innerHTML = '';
  setStatus('');
});

loadQuestions();
