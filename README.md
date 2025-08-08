# CAPM Simulator – Domínios (GitHub Pages)

Esta versão classifica automaticamente cada questão em um dos 4 domínios do ECO:

- **I**: Project Management Fundamentals and Core Concepts (36%)
- **II**: Predictive, Plan‑Based Methodologies (17%)
- **III**: Agile Frameworks/Methodologies (20%)
- **IV**: Business Analysis Frameworks (27%)

## Como publicar no GitHub Pages
1. Crie um repositório (ex.: `capm-simulator-domains`).
2. Envie os arquivos: `index.html`, `app.js`, `questions.json`, `README.md`.
3. Em **Settings → Pages**: *Deploy from a branch*, `main`, pasta `/`.
4. Aguarde 1–2 minutos e acesse `https://SEU-USUARIO.github.io/capm-simulator-domains/`.

## Observações
- O arquivo `questions.json` foi gerado a partir do seu Excel, com **437 questões**.
- A atribuição de domínio é feita por **palavras‑chave** (heurística). Você pode editar perguntas e domínios diretamente no `questions.json`.
- Para geração dinâmica por prompt, adicione um backend (Workers/Functions) e troque o `fetch()`.
