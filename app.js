let ALL_QUESTIONS = [];
const quizArea = document.getElementById('quizArea');
const scoreArea = document.getElementById('scoreArea');
const btnStart = document.getElementById('btnStart');
const btnSubmit = document.getElementById('btnSubmit');
const btnReset = document.getElementById('btnReset');

function shuffle(arr){ for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

async function loadQuestions(){
  const res = await fetch('questions.json');
  ALL_QUESTIONS = await res.json();
}

function filterQuestions(category, keywords){
  let items = ALL_QUESTIONS.slice();
  if (category && category !== 'all'){
    items = items.filter(q => (q.tags||[]).includes(category));
  }
  if (keywords && keywords.trim().length){
    const k = keywords.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    items = items.filter(q => {
      const hay = (q.text + ' ' + q.options.join(' ') + ' ' + (q.tags||[]).join(' ')).toLowerCase();
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
    div.innerHTML = `<h3>${idx+1}. ${q.text}</h3>` + q.options.map((opt, i)=> 
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
      result.innerHTML = `✔ Correto<br>${q.explanation}`;
    } else {
      result.className = 'result incorrect';
      const correct = q.options[q.answer];
      result.innerHTML = `✘ ${selected ? 'Errado' : 'Não respondida'}<br><strong>Correta:</strong> ${correct}<br>${q.explanation}`;
    }
    node.appendChild(result);
  });
  scoreArea.style.display = 'block';
  scoreArea.innerHTML = `<div class="score">Pontuação: ${score} / ${questions.length}</div>`;
}

let CURRENT = [];

btnStart.addEventListener('click', () => {
  const category = document.getElementById('category').value;
  const qty = Math.max(5, Math.min(30, parseInt(document.getElementById('qty').value,10) || 10));
  const keywords = document.getElementById('keywords').value;
  let pool = filterQuestions(category, keywords);
  if (pool.length === 0){
    quizArea.innerHTML = '<p class="muted">Nenhuma questão encontrada com esses filtros. Tente reduzir o filtro ou trocar a categoria.</p>';
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

btnSubmit.addEventListener('click', () => {
  if (CURRENT.length) grade(CURRENT);
});

btnReset.addEventListener('click', () => {
  quizArea.innerHTML = '';
  CURRENT = [];
  btnSubmit.disabled = true; btnReset.disabled = true;
  scoreArea.style.display = 'none'; scoreArea.innerHTML = '';
});

loadQuestions();
