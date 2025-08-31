let ALL_QUESTIONS = [];
const quizArea = document.getElementById('quizArea');
const scoreArea = document.getElementById('scoreArea');
const statusBox = document.getElementById('status');
const btnStart = document.getElementById('btnStart');
const btnSubmit = document.getElementById('btnSubmit');
const btnReset = document.getElementById('btnReset');
const btnResetTotals = document.getElementById('btnResetTotals');

// KPI elements
const kpiCorrect = document.getElementById('kpiCorrect');
const kpiWrong = document.getElementById('kpiWrong');
const kpiAcc = document.getElementById('kpiAcc');
const domainTable = document.getElementById('domainTable');

// -------- Persistência do placar (localStorage) ----------
const STORAGE_KEY = 'capm_scoreboard_v1';
function loadTotals(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {
      correct: 0, wrong: 0,
      byDomain: { I:{c:0,w:0}, II:{c:0,w:0}, III:{c:0,w:0}, IV:{c:0,w:0} }
    };
    const obj = JSON.parse(raw);
    // sanity check
    if(!obj.byDomain) obj.byDomain = { I:{c:0,w:0}, II:{c:0,w:0}, III:{c:0,w:0}, IV:{c:0,w:0} };
    return obj;
  }catch{ return { correct:0, wrong:0, byDomain:{ I:{c:0,w:0}, II:{c:0,w:0}, III:{c:0,w:0}, IV:{c:0,w:0} } }; }
}
function saveTotals(t){ localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }
function resetTotals(){
  const zero = { correct:0, wrong:0, byDomain:{ I:{c:0,w:0}, II:{c:0,w:0}, III:{c:0,w:0}, IV:{c:0,w:0} } };
  saveTotals(zero);
  renderTotals();
}
btnResetTotals.addEventListener('click', resetTotals);

function acc(c, w){
  const tot = c + w;
  return tot ? Math.round((c / tot) * 100) + '%' : '0%';
}
function renderTotals(){
  const t = loadTotals();
  kpiCorrect.textContent = t.correct;
  kpiWrong.textContent = t.wrong;
  kpiAcc.textContent = acc(t.correct, t.wrong);
  // render table rows (I..IV)
  const rows = [
    ['I. Fundamentals', 'I'],
    ['II. Predictive', 'II'],
    ['III. Agile', 'III'],
    ['IV. Business Analysis', 'IV'],
  ];
  domainTable.innerHTML = rows.map(([label, key]) => {
    const c = t.byDomain[key]?.c || 0;
    const w = t.byDomain[key]?.w || 0;
    return `<tr><td>${label}</td><td>${c}</td><td>${w}</td><td>${acc(c,w)}</td></tr>`;
  }).join('');
}
renderTotals();

// ---------- Classificação de domínio (se não houver tags) ----------
function classifyDomainFromText(text){
  const s = text.toLowerCase();
  const hasAny = (arr)=>arr.some(k=>s.includes(k));

  const AGILE = ['agile','scrum','sprint','kanban','product owner','scrum master','retrospective','backlog','user story','story points','velocity','increment'];
  const BA = ['requirement','requirements','acceptance criteria','business case','value','benefit','traceability','elicitation','use case'];
  const PRED = ['wbs','work breakdown structure','network diagram','critical path','float','lead','lag','baseline','schedule baseline','cost baseline','procurement','contract','earned value','evm','cpi','spi','eac','etc','vac'];

  if (hasAny(AGILE)) return 'III';
  if (hasAny(BA)) return 'IV';
  if (hasAny(PRED)) return 'II';
  return 'I';
}
function getDomainForQuestion(q){
  if (q.tags && q.tags.length && ['I','II','III','IV'].includes(q.tags[0])) return q.tags[0];
  // infer using heuristic on text + options
  const hay = (q.text + ' ' + (q.options||[]).join(' '));
  return classifyDomainFromText(hay);
}

// ---------- Carregar banco ----------
function setStatus(msg){ statusBox.textContent = msg || ''; }
function shuffle(arr){ for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

async function loadQuestions(){
  try{
    const res = await fetch('questions.json', { cache: 'no-store' });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    ALL_QUESTIONS = await res.json();
    setStatus(`Banco carregado: ${ALL_QUESTIONS.length} questões.`);
  }catch(e){
    setStatus('Erro ao carregar questions.json. Verifique se o arquivo está na raiz e acessível.');
    console.error(e);
  }
}

// ---------- Filtros e render ----------
function filterQuestions(domain, keywords){
  let items = ALL_QUESTIONS.slice();
  if (domain && domain !== 'all'){
    items = items.filter(q => {
      const d = getDomainForQuestion(q);
      return d === domain;
    });
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
    const domain = getDomainForQuestion(q);
    const domainLabel = domain ? `<span class="pill">Domínio ${domain}</span>` : '';
    div.innerHTML = `<h3>${idx+1}. ${q.text}</h3>${domainLabel}` + q.options.map((opt, i)=> 
      `<label class="option"><input type="radio" name="q${idx}" value="${i}"/> ${opt}</label>`
    ).join('');
    quizArea.appendChild(div);
  });
}

// ---------- Correção e atualização do placar ----------
function grade(questions){
  let score = 0;
  const nodes = quizArea.querySelectorAll('.question');
  const t = loadTotals(); // acumulador global

  nodes.forEach((node, idx) => {
    const q = questions[idx];
    const domain = getDomainForQuestion(q); // I/II/III/IV (inferido ou tag)
    const selected = node.querySelector(`input[name="q${idx}"]:checked`);
    const result = document.createElement('div');
    const isCorrect = selected && parseInt(selected.value,10) === q.answer;

    if (isCorrect){
      score++;
      result.className = 'result correct';
      result.innerHTML = `✔ Correto` + (q.explanation ? `<br>${q.explanation}` : '');
      t.correct += 1;
      (t.byDomain[domain] ||= {c:0,w:0}).c += 1;
    } else {
      result.className = 'result incorrect';
      const correct = q.options[q.answer];
      result.innerHTML = `✘ ${selected ? 'Errado' : 'Não respondida'}<br><strong>Correta:</strong> ${correct}` + (q.explanation ? `<br>${q.explanation}` : '');
      t.wrong += 1;
      (t.byDomain[domain] ||= {c:0,w:0}).w += 1;
    }
    node.appendChild(result);
  });

  saveTotals(t);
  renderTotals();

  scoreArea.style.display = 'block';
  scoreArea.innerHTML = `<div class="score">Pontuação desta rodada: ${score} / ${questions.length}</div>`;
}

// ---------- Fluxo ----------
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
