# Biblioteca — Next.js

```powershell
npm install
npm run dev
```

Acesse `http://localhost:3000`. O servidor API deve funcionar em `http://localhost:3001`. Opcionalmente crie `.env.local` contendo `API_URL=http://localhost:3001/v1`.

As chamadas do navegador usam `/api/*` no servidor Next, que encaminha ao Express. Access token e refresh token são guardados em cookies **httpOnly / SameSite=Lax**; não são expostos a JavaScript do navegador. Após 401 o proxy Next renova o par de tokens uma vez e repete a chamada. Chamadas simultâneas compartilham uma Promise de refresh no mesmo processo. Essa coordenação é local ao processo; para implantação com múltiplas instâncias precisaria de armazenamento distribuído ou outra estratégia. Em produção, habilite HTTPS e proteção contra CSRF adequada às políticas de cookies.

Tela de login, dashboard, cadastros de categorias/autores/livros/leitores/atendentes, consulta de empréstimos, devolução, filtros e relatórios. Admin pode gerenciar cadastros administrativos e ver relatórios; atendente gerencia leitores e empréstimos.

**Atenção:** não confunda `http://localhost:3000` (site) com `http://localhost:3001` (API). Não guarde `.env.local` nem senhas no Git.
