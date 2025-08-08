# Simulador CAPM – GitHub Pages (estático)

Este projeto é um **simulador estático** (sem backend) para rodar no GitHub Pages.
- Carrega um banco local `questions.json`
- Permite filtrar por **categoria** e **palavra-chave**
- Mostra **explicações** ao corrigir
- Sem dependências externas

## Como publicar no GitHub Pages
1. Crie um repositório no GitHub (ex.: `capm-simulator`).
2. Envie estes arquivos: `index.html`, `app.js`, `questions.json` e este `README.md`.
3. No repositório, vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e o diretório `/ (root)`. Salve.
6. Aguarde 1–2 minutos e acesse: `https://seuusuario.github.io/capm-simulator/`.

## Evolução: geração dinâmica via API
- GitHub Pages é estático. Para usar **prompt livre** e gerar questões novas a cada uso:
  - Crie um pequeno backend (Cloudflare Workers, Netlify Functions, Vercel) que receba o prompt, chame a API da OpenAI e retorne JSON padronizado.
  - Ajuste o `app.js` para fazer `fetch()` do seu endpoint em vez de `questions.json`.
- Assim sua **API key** fica protegida (nunca exponha no front-end).

Boa prática: manter no repositório uma pasta `/static` com bancos temáticos (Agile, EVM, etc.).
