# CLAUDE.md

Este repositório contém o site institucional (raiz) e o jogo **Orpheus: Song of Olympus** em `jogos/olympus/`.

- **Antes de qualquer coisa, leia `ORPHEUS_MEMORIA_COMPLETA.md` (arquivo mestre com TUDO do projeto).** Resumo alternativo: `jogos/olympus/CONTEXTO.md` (história, estado atual, arquitetura, contrato de sprites, planos do AutoSprite e do Google Flow, ferramentas de teste e preferências do autor).
- Especificação de arte: `jogos/olympus/docs/ART_SPEC.md`. Prompts de cenários do Google Flow: `jogos/olympus/docs/PROMPTS_FLOW_CENARIOS.md`.
- Depois de mudar o jogo, rode `cd jogos/olympus/tools && node regressao.js` (instale antes: `npm install && npx playwright install chromium`).
- Converse com o autor (Júlio) em português do Brasil; textos do jogo em inglês.
- O servidor MCP do AutoSprite está em `.mcp.json` e lê a chave da variável de ambiente `AUTOSPRITE_API_KEY`. Nunca grave chaves no repositório.
