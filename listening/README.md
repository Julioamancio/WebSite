# Listening Tests B2 – 3ª Etapa

Webtest interativo com as provas de Listening/Reading (B2) da 3ª etapa.

| Série | Prova | Turmas |
|---|---|---|
| 1ª Série | Tipo A | FG |
| 1ª Série | Tipo B | ABC |
| 1ª Série | Tipo C | DE |
| 2ª Série | Tipo A | CDE |
| 2ª Série | Tipo B | AB |

## Como abrir

- **Online (GitHub Pages):** `https://<usuario>.github.io/WebSite/listening/`
- **No computador:** abra `listening/index.html` no navegador.

## Recursos

- **Modo Prova:** o áudio toca sem opção de avançar ou voltar e a correção aparece só no final.
- **Modo Estudo:** a correção e a explicação aparecem logo após cada resposta. O áudio tem controles livres (−10 s, +10 s e velocidade) e a transcrição fica disponível.
- Nota de 0 a 10 (Q1: 5 × 0,6 · Q2: 5 × 0,6 · Q3: 5 × 0,8), gabarito, explicação e transcrição.
- Correção das lacunas: não diferencia maiúsculas de minúsculas, aceita as variações do gabarito (ex.: `(the) gardens`, `5 a.m.`, `2,400`) e pequenos erros de grafia. Palavras parecidas com outro sentido (ex.: `diving` × `driving`, `dairy` × `diary`) são recusadas.
- As respostas ficam salvas no navegador; a prova continua de onde parou.

## Áudios

Os MP3 tocam direto do Google Drive (pasta compartilhada com "qualquer pessoa com o link").
Para funcionar sem depender do Drive, copie os MP3 para `listening/audio/` com estes nomes:

| Arquivo no Drive | Nome em `listening/audio/` |
|---|---|
| QUESTION 1 - TIPO A (FG).mp3 | `1s-fg-q1.mp3` |
| QUESTION 2 - TIPO A (FG).mp3 | `1s-fg-q2.mp3` |
| QUESTION 1 - TIPO B (ABC).mp3 | `1s-abc-q1.mp3` |
| QUESTION 2 - TIPO B (ABC).mp3 | `1s-abc-q2.mp3` |
| QUESTION 1 - TIPO C (DE).mp3 | `1s-de-q1.mp3` |
| QUESTION 2 - TIPO C (DE).mp3 | `1s-de-q2.mp3` |
| QUESTION 1 - TIPO A (CDE).mp3 | `2s-cde-q1.mp3` |
| QUESTION 2 - TIPO A (CDE).mp3 | `2s-cde-q2.mp3` |
| QUESTION 1 - TIPO B (AB).mp3 | `2s-ab-q1.mp3` |
| QUESTION 2 - TIPO B (AB).mp3 | `2s-ab-q2.mp3` |

Ordem que o player usa: arquivo local → Google Drive → player incorporado do Drive.

## Editar questões

Todo o conteúdo (enunciados, alternativas, gabarito, explicações, textos e transcrições) está em `js/data.js`.

> Atenção: o gabarito fica no código da página. Serve para estudo e simulado, mas não é seguro para uma avaliação valendo nota.
