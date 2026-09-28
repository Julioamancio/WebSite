/*
 * Listening Tests B2 – aplicação (sem dependências)
 * Rotas:  #/            -> lista de provas
 *         #/prova/<id>  -> tela inicial da prova / prova em andamento / resultado
 */
(function () {
  "use strict";

  var TESTS = window.LISTENING_TESTS || [];
  var LETTERS = ["A", "B", "C", "D", "E"];
  var STORE = "lt:v1:";
  var app = document.getElementById("app");

  /* ------------------------------------------------------------------
   * Armazenamento local (tudo protegido com try/catch: pode falhar em
   * janelas anônimas ou com cookies bloqueados – o app continua funcionando)
   * ------------------------------------------------------------------ */
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(STORE + key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, val) {
    try { localStorage.setItem(STORE + key, JSON.stringify(val)); } catch (e) { /* ignora */ }
  }
  function drop(key) {
    try { localStorage.removeItem(STORE + key); } catch (e) { /* ignora */ }
  }

  /* ------------------------------------------------------------------
   * Tema claro/escuro
   * ------------------------------------------------------------------ */
  (function initTheme() {
    var saved = load("theme", null);
    if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved);
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      if (!current) {
        current = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      save("theme", next);
    });
  })();

  /* ------------------------------------------------------------------
   * Utilidades
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function fmtScore(n) { return (Math.round(n * 10) / 10).toFixed(1).replace(".", ","); }
  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var mm = (h ? String(m).padStart(2, "0") : String(m)) + ":" + String(s).padStart(2, "0");
    return h ? h + ":" + mm : mm;
  }
  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }
  function qk(si, qi) { return si + "-" + qi; }
  function findTest(id) {
    for (var i = 0; i < TESTS.length; i++) if (TESTS[i].id === id) return TESTS[i];
    return null;
  }
  function countQuestions(test) {
    return test.sections.reduce(function (n, s) { return n + s.questions.length; }, 0);
  }
  function kindLabel(kind) {
    if (kind === "listening-mc") return "Listening · múltipla escolha";
    if (kind === "listening-gap") return "Listening · completar lacunas";
    return "Reading · múltipla escolha";
  }
  function toast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  /* ------------------------------------------------------------------
   * Correção
   * ------------------------------------------------------------------ */
  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[‘’`´]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!?;,]+$/, "")
      .trim();
  }
  function stripArticle(s) { return s.replace(/^(a|an|the)\s+/, ""); }
  function isWordy(s) { return /^[a-z' ]+$/.test(s); }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }

  // Resultado: { status: "correct" | "spelling" | "wrong" | "blank", ok: bool, match?: string }
  function gradeGap(q, raw) {
    var v = normalize(raw);
    if (!v) return { status: "blank", ok: false };
    var cands = [v, stripArticle(v)];
    var accept = q.accept.map(normalize);
    var reject = (q.reject || []).map(normalize);
    var i, j;
    for (i = 0; i < cands.length; i++) {
      if (accept.indexOf(cands[i]) !== -1) return { status: "correct", ok: true };
    }
    if (q.pattern) {
      try { if (new RegExp(q.pattern, "i").test(v)) return { status: "correct", ok: true }; } catch (e) { /* padrão inválido */ }
    }
    for (i = 0; i < cands.length; i++) {
      if (reject.indexOf(cands[i]) !== -1) return { status: "wrong", ok: false };
    }
    // Pequenos erros de grafia (palavra claramente reconhecível)
    for (i = 0; i < cands.length; i++) {
      if (!isWordy(cands[i])) continue;
      for (j = 0; j < accept.length; j++) {
        var a = accept[j];
        if (!isWordy(a)) continue;
        var max = a.length >= 9 ? 2 : a.length >= 5 ? 1 : 0;
        if (max && lev(cands[i], a) <= max) return { status: "spelling", ok: true, match: q.accept[j] };
      }
    }
    return { status: "wrong", ok: false };
  }
  function gradeMC(q, ans) {
    if (!ans) return { status: "blank", ok: false };
    return ans === q.answer ? { status: "correct", ok: true } : { status: "wrong", ok: false };
  }
  function grade(section, q, ans) {
    return section.kind === "listening-gap" ? gradeGap(q, ans) : gradeMC(q, ans);
  }
  function evaluate(test, st) {
    var total = 0;
    var secs = test.sections.map(function (s, si) {
      var correct = 0;
      var items = s.questions.map(function (q, qi) {
        var r = grade(s, q, st.answers[qk(si, qi)] || "");
        if (r.ok) correct++;
        return r;
      });
      var pts = correct * s.points;
      total += pts;
      return { correct: correct, n: s.questions.length, pts: pts, max: s.questions.length * s.points, items: items };
    });
    var max = test.sections.reduce(function (n, s) { return n + s.points * s.questions.length; }, 0);
    return { secs: secs, total: Math.round(total * 10) / 10, max: Math.round(max * 10) / 10 };
  }

  /* ------------------------------------------------------------------
   * Estado da prova
   * ------------------------------------------------------------------ */
  function getState(id) { return load("state:" + id, null); }
  function setState(id, st) { save("state:" + id, st); }
  function isRevealed(st, key) { return st.finished || (st.mode === "study" && !!st.checked[key]); }
  function answeredCount(test, st) {
    var n = 0;
    test.sections.forEach(function (s, si) {
      s.questions.forEach(function (q, qi) {
        if (String(st.answers[qk(si, qi)] || "").trim()) n++;
      });
    });
    return n;
  }
  function pushHistory(entry) {
    var h = load("history", []);
    if (!Array.isArray(h)) h = [];
    h.unshift(entry);
    save("history", h.slice(0, 60));
  }
  function lastResult(id) {
    var h = load("history", []);
    if (!Array.isArray(h)) return null;
    for (var i = 0; i < h.length; i++) if (h[i] && h[i].id === id) return h[i];
    return null;
  }

  /* ------------------------------------------------------------------
   * Player de áudio
   *  - tenta o MP3 local (listening/audio/…), depois o Google Drive
   *  - se nada tocar, mostra o player incorporado do Google Drive
   *  - no Modo Prova não é possível avançar/voltar nem mudar a velocidade
   * ------------------------------------------------------------------ */
  var players = [];

  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/></svg>';

  function createPlayer(section, label) {
    var a = section.audio;
    var sources = [];
    if (a.local) sources.push({ url: "audio/" + a.local, name: "arquivo local" });
    sources.push({ url: "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(a.driveId), name: "Google Drive" });
    var viewUrl = "https://drive.google.com/file/d/" + encodeURIComponent(a.driveId) + "/view";
    var previewUrl = "https://drive.google.com/file/d/" + encodeURIComponent(a.driveId) + "/preview";

    var el = document.createElement("div");
    el.className = "player";
    el.innerHTML =
      '<div class="player__row">' +
        '<button type="button" class="player__play" aria-label="Tocar áudio">' + ICON_PLAY + "</button>" +
        '<div class="player__main">' +
          '<div class="player__label">' + esc(label) + "</div>" +
          '<input class="player__range" type="range" min="0" max="1000" value="0" step="1" aria-label="Posição do áudio">' +
          '<div class="player__time"><span class="player__cur">0:00</span><span class="player__dur">' + esc(a.duration || "--:--") + "</span></div>" +
        "</div>" +
      "</div>" +
      '<div class="player__tools">' +
        '<button type="button" class="btn btn--ghost btn--sm" data-p="back">−10 s</button>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-p="fwd">+10 s</button>' +
        '<label class="muted" style="font-size:13px">Velocidade ' +
          '<select data-p="rate"><option value="0.75">0,75×</option><option value="0.9">0,9×</option><option value="1" selected>1×</option><option value="1.1">1,1×</option><option value="1.25">1,25×</option></select>' +
        "</label>" +
      "</div>" +
      '<div class="player__note"></div>' +
      '<div class="player__status" aria-live="polite"></div>' +
      '<div class="player__fallback" hidden></div>' +
      '<div class="player__links">' +
        '<a href="' + viewUrl + '" target="_blank" rel="noopener">Abrir áudio no Google Drive ↗</a>' +
        '<button type="button" class="linklike" data-p="fallback">Usar o player do Google Drive</button>' +
      "</div>";

    var audio = new Audio();
    audio.preload = "none";
    var btn = el.querySelector(".player__play");
    var range = el.querySelector(".player__range");
    var cur = el.querySelector(".player__cur");
    var dur = el.querySelector(".player__dur");
    var tools = el.querySelector(".player__tools");
    var note = el.querySelector(".player__note");
    var status = el.querySelector(".player__status");
    var fallback = el.querySelector(".player__fallback");
    var rate = el.querySelector('[data-p="rate"]');

    var idx = -1;
    var wantPlay = false;
    var free = true;
    var ended = false;
    var seeking = false;

    function setStatus(msg, isError) {
      status.textContent = msg || "";
      status.className = "player__status" + (isError ? " player__status--error" : "");
    }
    function showFallback(msg) {
      if (!fallback.firstChild) {
        fallback.innerHTML = '<iframe src="' + previewUrl + '" title="Player do Google Drive – ' + esc(label) + '" allow="autoplay" loading="lazy"></iframe>';
      }
      fallback.hidden = false;
      if (msg) setStatus(msg, true);
    }
    function nextSource() {
      idx++;
      if (idx >= sources.length) {
        wantPlay = false;
        renderBtn();
        showFallback("Não foi possível carregar o áudio neste player. Use o player do Google Drive abaixo.");
        return false;
      }
      audio.src = sources[idx].url;
      audio.load();
      return true;
    }
    function renderBtn() {
      var playing = !audio.paused && !audio.ended;
      btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      btn.setAttribute("aria-label", playing ? "Pausar áudio" : "Tocar áudio");
      btn.disabled = !free && ended;
    }
    function play() {
      if (!free && ended) return;
      players.forEach(function (p) { if (p.el !== el) p.pause(); });
      wantPlay = true;
      if (idx < 0 && !nextSource()) return;
      setStatus("Carregando…");
      var pr = audio.play();
      if (pr && pr.catch) pr.catch(function (err) {
        if (err && err.name === "NotAllowedError") { wantPlay = false; setStatus("Toque em ▶ para iniciar o áudio."); renderBtn(); }
        // outros erros são tratados pelo evento "error"
      });
    }
    function pause() { wantPlay = false; audio.pause(); }

    audio.addEventListener("error", function () {
      if (idx < 0 || idx >= sources.length) return;
      if (nextSource() && wantPlay) {
        var pr = audio.play();
        if (pr && pr.catch) pr.catch(function () { /* tratado pelo próximo "error" */ });
      }
    });
    audio.addEventListener("playing", function () {
      setStatus("");
      if (idx >= 0 && idx < sources.length) note.dataset.src = sources[idx].name;
      renderBtn();
    });
    audio.addEventListener("waiting", function () { setStatus("Carregando…"); });
    audio.addEventListener("pause", renderBtn);
    audio.addEventListener("play", renderBtn);
    audio.addEventListener("loadedmetadata", function () {
      if (isFinite(audio.duration)) dur.textContent = fmtClock(audio.duration);
    });
    audio.addEventListener("timeupdate", function () {
      cur.textContent = fmtClock(audio.currentTime);
      if (!seeking && isFinite(audio.duration) && audio.duration > 0) {
        range.value = Math.round((audio.currentTime / audio.duration) * 1000);
      }
    });
    audio.addEventListener("ended", function () {
      wantPlay = false;
      ended = true;
      if (!free) setStatus("Áudio concluído.");
      renderBtn();
    });

    btn.addEventListener("click", function () {
      if (audio.paused || audio.ended) {
        if (free && audio.ended) { audio.currentTime = 0; ended = false; }
        play();
      } else {
        pause();
      }
    });
    range.addEventListener("input", function () {
      if (!free) return;
      seeking = true;
      if (isFinite(audio.duration)) cur.textContent = fmtClock((range.value / 1000) * audio.duration);
    });
    range.addEventListener("change", function () {
      seeking = false;
      if (!free || !isFinite(audio.duration)) return;
      audio.currentTime = (range.value / 1000) * audio.duration;
      ended = false;
      renderBtn();
    });
    el.querySelector('[data-p="back"]').addEventListener("click", function () {
      if (free) audio.currentTime = Math.max(0, audio.currentTime - 10);
    });
    el.querySelector('[data-p="fwd"]').addEventListener("click", function () {
      if (free && isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    });
    rate.addEventListener("change", function () {
      if (free) audio.playbackRate = parseFloat(rate.value) || 1;
    });
    el.querySelector('[data-p="fallback"]').addEventListener("click", function () {
      pause();
      showFallback("");
      fallback.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });

    function setFree(isFree) {
      free = !!isFree;
      range.disabled = !free;
      tools.hidden = !free;
      if (!free) { audio.playbackRate = 1; rate.value = "1"; }
      note.textContent = free
        ? "Modo livre: pause, volte, avance e ajuste a velocidade à vontade."
        : "Modo prova: o arquivo já traz as instruções, 30 s de leitura e a gravação tocada duas vezes. Não é possível avançar, voltar ou mudar a velocidade.";
      renderBtn();
    }

    var api = { el: el, pause: pause, setFree: setFree, destroy: function () { pause(); audio.removeAttribute("src"); try { audio.load(); } catch (e) { /* ignora */ } } };
    return api;
  }

  function destroyPlayers() {
    players.forEach(function (p) { p.destroy(); });
    players = [];
  }

  /* ------------------------------------------------------------------
   * Tela inicial
   * ------------------------------------------------------------------ */
  function renderHome() {
    var groups = {};
    var order = [];
    TESTS.forEach(function (t) {
      if (!groups[t.serie]) { groups[t.serie] = []; order.push(t.serie); }
      groups[t.serie].push(t);
    });

    var html =
      '<div class="container">' +
        '<section class="hero">' +
          '<span class="pill">B2 · 3ª Etapa</span>' +
          "<h1>Provas de Listening &amp; Reading</h1>" +
          "<p>Escolha a sua prova, ouça os áudios, marque as respostas e veja a correção com a nota e a explicação de cada questão.</p>" +
        "</section>" +
        '<div class="how">' +
          '<div class="card how__item"><strong>1. Escolha a prova</strong><span>Pela série e pelas turmas (Tipo A, B ou C).</span></div>' +
          '<div class="card how__item"><strong>2. Ouça e responda</strong><span>Modo Prova (correção no final) ou Modo Estudo (correção imediata).</span></div>' +
          '<div class="card how__item"><strong>3. Veja a correção</strong><span>Nota de 0 a 10, gabarito, explicação e transcrição do áudio.</span></div>' +
        "</div>";

    order.forEach(function (serie) {
      html += '<h2 class="group-title">' + esc(serie) + '</h2><div class="grid">';
      groups[serie].forEach(function (t) {
        var st = getState(t.id);
        var last = lastResult(t.id);
        var inProgress = st && !st.finished;
        var action = st && st.finished ? "Ver resultado" : inProgress ? "Continuar" : "Começar";
        html +=
          '<article class="card test-card">' +
            '<div class="test-card__head"><h3>' + esc(t.tipo) + " · Turmas " + esc(t.turmas) + '</h3><span class="pill">' + esc(t.level) + "</span></div>" +
            "<ul>" +
              t.sections.map(function (s, i) {
                return "<li><b>Q" + s.number + "</b> – " + esc(kindLabel(s.kind)) + ": " + esc(t.topics[i] || "") + "</li>";
              }).join("") +
            "</ul>" +
            '<div class="test-card__last">' +
              (last
                ? "Última nota: <b>" + fmtScore(last.score) + "</b> / 10 · " + esc(last.mode === "study" ? "Modo Estudo" : "Modo Prova") + " · " + esc(fmtDate(last.date))
                : inProgress ? "Prova em andamento · " + answeredCount(t, st) + "/" + countQuestions(t) + " respondidas" : "Ainda não realizada") +
            "</div>" +
            '<div class="test-card__actions"><a class="btn" href="#/prova/' + encodeURIComponent(t.id) + '">' + action + "</a></div>" +
          "</article>";
      });
      html += "</div>";
    });
    html += "</div>";
    app.innerHTML = html;
  }

  /* ------------------------------------------------------------------
   * Tela de início da prova
   * ------------------------------------------------------------------ */
  function renderIntro(test) {
    var savedName = load("name", "");
    var rows = test.sections.map(function (s, i) {
      return "<tr><td><b>Question " + s.number + "</b></td><td>" + esc(kindLabel(s.kind)) + "<br><span class=\"muted\">" + esc(test.topics[i] || "") + "</span></td>" +
        "<td>" + s.questions.length + " × " + fmtScore(s.points) + " = " + fmtScore(s.points * s.questions.length) + "</td>" +
        "<td>" + esc(s.audio ? s.audio.duration : "—") + "</td></tr>";
    }).join("");

    app.innerHTML =
      '<div class="container">' +
        '<p><a href="#/">← Todas as provas</a></p>' +
        '<form class="card intro" id="introForm">' +
          '<span class="pill">' + esc(test.serie) + " · " + esc(test.etapa) + "</span>" +
          "<h1>Listening/Reading Test – " + esc(test.tipo) + " (" + esc(test.turmas) + ")</h1>" +
          '<p class="intro__meta">Língua Estrangeira Moderna (Inglês) · Nível ' + esc(test.level) + " · 3 questões · 15 itens · Nota máxima 10,0</p>" +
          '<table class="intro__table"><thead><tr><th>Questão</th><th>Tipo</th><th>Pontos</th><th>Áudio</th></tr></thead><tbody>' + rows + "</tbody></table>" +
          '<div class="field"><label for="studentName">Seu nome (opcional)</label>' +
            '<input class="input" id="studentName" name="studentName" type="text" maxlength="80" autocomplete="name" value="' + esc(savedName) + '" placeholder="Ex.: Maria Silva – 1ª série F"></div>' +
          '<fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:600;margin-bottom:8px">Como você quer fazer a prova?</legend>' +
          '<div class="modes">' +
            '<label class="mode"><input type="radio" name="mode" value="exam" checked><strong>Modo Prova</strong><span>Como no dia da prova: áudio sem pausas para avançar/voltar e correção só no final.</span></label>' +
            '<label class="mode"><input type="radio" name="mode" value="study"><strong>Modo Estudo</strong><span>Correção e explicação logo após cada resposta. Áudio com controles livres e transcrição.</span></label>' +
          "</div></fieldset>" +
          '<p class="muted" style="font-size:14px;margin-top:0">🎧 Use fones de ouvido. Cada áudio já traz as instruções, 30 segundos para leitura e a gravação tocada duas vezes – é só apertar ▶.</p>' +
          '<button class="btn" type="submit">Começar a prova</button>' +
        "</form>" +
      "</div>";

    document.getElementById("introForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = document.getElementById("studentName").value.trim().slice(0, 80);
      var modeEl = ev.target.querySelector('input[name="mode"]:checked');
      save("name", name);
      setState(test.id, {
        v: 1,
        mode: modeEl ? modeEl.value : "exam",
        name: name,
        answers: {},
        checked: {},
        finished: false,
        startedAt: Date.now(),
        finishedAt: null
      });
      route();
    });
  }

  /* ------------------------------------------------------------------
   * Prova
   * ------------------------------------------------------------------ */
  var ctx = null; // { test, st, timer }

  function feedbackHTML(section, q, ans, r) {
    var cls, verdict;
    if (r.status === "correct") { cls = "fb--ok"; verdict = "✓ Correto!"; }
    else if (r.status === "spelling") { cls = "fb--warn"; verdict = "✓ Aceito – pequeno erro de grafia"; }
    else if (r.status === "blank") { cls = "fb--bad"; verdict = "— Em branco"; }
    else { cls = "fb--bad"; verdict = "✗ Incorreto"; }

    var answers = "";
    if (section.kind === "listening-gap") {
      if (r.status === "spelling") {
        answers = '<p class="fb__answers"><span>Sua resposta: <b>' + esc(ans) + "</b></span><span>Grafia correta: <b>" + esc(r.match) + "</b></span></p>";
      } else if (r.status !== "correct") {
        answers = '<p class="fb__answers">' + (r.status === "wrong" ? "<span>Sua resposta: <b>" + esc(ans) + "</b></span>" : "") +
          "<span>Resposta esperada: <b>" + esc(q.answer) + "</b></span></p>";
      }
    } else if (r.status !== "correct") {
      answers = '<p class="fb__answers">' + (ans ? "<span>Sua resposta: <b>" + esc(ans) + "</b></span>" : "") +
        "<span>Resposta correta: <b>" + esc(q.answer) + "</b></span></p>";
    }
    // As explicações vêm do arquivo de dados (conteúdo do professor) e podem conter HTML simples.
    return '<div class="fb ' + cls + '" role="status"><div class="fb__verdict">' + verdict + "</div>" + answers + "<p>" + q.explanation + "</p></div>";
  }

  function questionHTML(si, qi) {
    var test = ctx.test, st = ctx.st;
    var s = test.sections[si], q = s.questions[qi];
    var key = qk(si, qi);
    var ans = st.answers[key] || "";
    var rev = isRevealed(st, key);
    var r = rev ? grade(s, q, ans) : null;
    var wrapCls = "q" + (r && r.ok ? " is-right" : "");

    if (s.kind === "listening-gap") {
      var inputCls = "gap__input";
      if (r) inputCls += r.status === "correct" ? " is-correct" : r.status === "spelling" ? " is-spelling" : " is-wrong";
      var after = s.questions[qi].after || "";
      var glue = /^[.,;:!?]/.test(after) ? "" : " ";
      return '<div class="' + wrapCls + '" id="q-' + key + '" data-key="' + key + '">' +
        '<div class="gap"><span class="q__num">' + (qi + 1) + "</span>" + esc(q.before) + " " +
          '<input class="' + inputCls + '" type="text" data-key="' + key + '" value="' + esc(ans) + '" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="60" aria-label="Resposta da lacuna ' + (qi + 1) + '"' + (rev ? " disabled" : "") + ">" +
          glue + esc(after) +
        "</div>" +
        (st.mode === "study" && !rev ? '<div class="gap__actions"><button type="button" class="btn btn--ghost btn--sm" data-action="check" data-key="' + key + '">Verificar</button></div>' : "") +
        (r ? feedbackHTML(s, q, ans, r) : "") +
      "</div>";
    }

    var opts = q.options.map(function (text, i) {
      var L = LETTERS[i];
      var cls = "opt";
      var tag = "";
      if (ans === L) cls += " is-selected";
      if (r) {
        if (L === q.answer) { cls += " is-correct"; tag = ans === L ? "✓ Sua resposta" : "✓ Correta"; }
        else if (ans === L) { cls += " is-wrong"; tag = "✗ Sua resposta"; }
      }
      return '<label class="' + cls + '">' +
        '<input type="radio" name="r-' + key + '" value="' + L + '" data-key="' + key + '"' + (ans === L ? " checked" : "") + (rev ? " disabled" : "") + ">" +
        '<span class="opt__letter">' + L + "</span>" +
        '<span class="opt__text">' + esc(text) + "</span>" +
        (tag ? '<span class="opt__tag">' + tag + "</span>" : "") +
      "</label>";
    }).join("");

    return '<div class="' + wrapCls + '" id="q-' + key + '" data-key="' + key + '">' +
      (q.context ? '<p class="q__context">' + esc(q.context) + "</p>" : "") +
      '<p class="q__stem" id="stem-' + key + '"><span class="q__num">' + (qi + 1) + "</span>" + esc(q.stem) + "</p>" +
      '<div class="opts' + (rev ? " is-locked" : "") + '" role="radiogroup" aria-labelledby="stem-' + key + '">' + opts + "</div>" +
      (r ? feedbackHTML(s, q, ans, r) : "") +
    "</div>";
  }

  function tapescriptHTML(text) {
    return text.split(/\n\s*\n/).map(function (para) {
      return "<p>" + para.split("\n").map(function (line) {
        var m = line.match(/^((?:\d+ – )?[A-Z][A-Za-z]{0,10}):\s*(.*)$/);
        return m ? "<b>" + esc(m[1]) + ":</b> " + esc(m[2]) : esc(line);
      }).join("<br>") + "</p>";
    }).join("");
  }

  function sectionScoreText(si) {
    var st = ctx.st, s = ctx.test.sections[si];
    if (st.finished) {
      var ev = evaluate(ctx.test, st).secs[si];
      return ev.correct + "/" + ev.n + " · " + fmtScore(ev.pts) + " de " + fmtScore(ev.max) + " pts";
    }
    if (st.mode === "study") {
      var done = 0, ok = 0;
      s.questions.forEach(function (q, qi) {
        var key = qk(si, qi);
        if (st.checked[key]) { done++; if (grade(s, q, st.answers[key] || "").ok) ok++; }
      });
      return done ? ok + "/" + done + " corretas" : fmtScore(s.points * s.questions.length) + " pts";
    }
    return fmtScore(s.points * s.questions.length) + " pts";
  }

  function sectionHTML(si) {
    var test = ctx.test, st = ctx.st, s = test.sections[si];
    var showScript = s.tapescript && (st.finished || st.mode === "study");
    var qs = s.questions.map(function (q, qi) { return questionHTML(si, qi); }).join("");
    var body;
    if (s.kind === "reading-mc") {
      var paras = s.passage.split(/\n\s*\n/).map(function (p, i) {
        return '<p><span class="pnum">' + (i + 1) + "</span>" + esc(p) + "</p>";
      }).join("");
      body =
        '<div class="reading">' +
          '<div class="reading__passage" tabindex="0" aria-label="Texto da Question 3">' +
            (s.passageTitle ? "<h3>" + esc(s.passageTitle) + "</h3>" : "") +
            (s.passageSubtitle ? '<p class="sub">' + esc(s.passageSubtitle) + "</p>" : "") +
            paras +
          "</div>" +
          '<div class="reading__qs">' + qs + "</div>" +
        "</div>";
    } else {
      body =
        '<div data-player="' + si + '"></div>' +
        (s.heading ? '<h3 class="gap-heading">' + esc(s.heading) + "</h3>" : "") +
        qs +
        (showScript
          ? '<details class="tapescript"><summary>Transcrição do áudio (tapescript)' + (st.finished ? "" : " – contém as respostas") + '</summary><div class="tapescript__body">' + tapescriptHTML(s.tapescript) + "</div></details>"
          : "");
    }
    return '<section class="card section" id="sec-' + si + '" aria-labelledby="sech-' + si + '">' +
      '<div class="section__head"><div><h2 id="sech-' + si + '">Question ' + s.number + "</h2>" +
        '<div class="section__kind">' + esc(kindLabel(s.kind)) + "</div></div>" +
        '<span class="section__score" id="secscore-' + si + '">' + esc(sectionScoreText(si)) + "</span></div>" +
      '<p class="section__instr">' + esc(s.instructions) + " <b>(" + fmtScore(s.points) + " × " + s.questions.length + " = " + fmtScore(s.points * s.questions.length) + ")</b></p>" +
      body +
      '<p class="section__source">' + esc(s.source) + "</p>" +
    "</section>";
  }

  function resultHTML() {
    var test = ctx.test, st = ctx.st;
    var ev = evaluate(test, st);
    var pct = Math.round((ev.total / ev.max) * 100);
    var ring = ev.total >= 7 ? "var(--ok)" : ev.total >= 5 ? "var(--warn)" : "var(--bad)";
    var msg = ev.total >= 9 ? "Excelente! 🎉" : ev.total >= 7 ? "Muito bom!" : ev.total >= 6 ? "Bom trabalho!" : ev.total >= 4 ? "Continue praticando!" : "Revise as explicações e tente de novo.";
    var totalOk = ev.secs.reduce(function (n, s) { return n + s.correct; }, 0);
    var elapsed = st.finishedAt && st.startedAt ? (st.finishedAt - st.startedAt) / 1000 : 0;

    var rows = ev.secs.map(function (s, si) {
      var sec = test.sections[si];
      var chips = s.items.map(function (r, qi) {
        var c = r.status === "correct" ? "chip--ok" : r.status === "spelling" ? "chip--warn" : "chip--bad";
        var t = r.status === "correct" ? "correta" : r.status === "spelling" ? "aceita (grafia)" : r.status === "blank" ? "em branco" : "incorreta";
        return '<button type="button" class="chip ' + c + '" data-goto="q-' + qk(si, qi) + '" aria-label="Question ' + sec.number + ", item " + (qi + 1) + ": " + t + '" title="Item ' + (qi + 1) + ": " + t + '">' + (qi + 1) + "</button>";
      }).join("");
      return "<tr><td><b>Q" + sec.number + '</b> <span class="muted">' + esc(kindLabel(sec.kind)) + '</span><div class="chips">' + chips + "</div></td>" +
        '<td class="num">' + s.correct + "/" + s.n + '</td><td class="num">' + fmtScore(s.pts) + " / " + fmtScore(s.max) + "</td></tr>";
    }).join("");

    return '<section class="card result" id="result" tabindex="-1" aria-label="Resultado">' +
      '<div class="result__top">' +
        '<div class="result__score" style="--pct:' + pct + ";--ring:" + ring + '"><div><b>' + fmtScore(ev.total) + "</b><small>de " + fmtScore(ev.max) + "</small></div></div>" +
        '<div class="result__info"><h2>' + esc(msg) + "</h2>" +
          "<p>" + (st.name ? "<b>" + esc(st.name) + "</b> · " : "") + totalOk + " de " + countQuestions(test) + " itens corretos</p>" +
          "<p>" + (st.mode === "study" ? "Modo Estudo" : "Modo Prova") + (elapsed ? " · Tempo: " + fmtClock(elapsed) : "") + (st.finishedAt ? " · " + esc(fmtDate(st.finishedAt)) : "") + "</p>" +
        "</div>" +
      "</div>" +
      '<table class="result__table"><thead><tr><th>Questão (clique no item para ver a explicação)</th><th class="num">Acertos</th><th class="num">Pontos</th></tr></thead><tbody>' + rows +
        '<tr><td><b>Total</b></td><td class="num"><b>' + totalOk + "/" + countQuestions(test) + '</b></td><td class="num"><b>' + fmtScore(ev.total) + " / " + fmtScore(ev.max) + "</b></td></tr></tbody></table>" +
      '<div class="result__actions">' +
        '<button type="button" class="btn btn--ghost" data-action="errors" aria-pressed="false">Mostrar só os erros</button>' +
        '<button type="button" class="btn btn--ghost" data-action="print">Imprimir / salvar PDF</button>' +
        '<button type="button" class="btn" data-action="restart">Refazer a prova</button>' +
        '<a class="btn btn--ghost" href="#/">Todas as provas</a>' +
      "</div>" +
    "</section>";
  }

  function barHTML() {
    var test = ctx.test;
    return '<div class="testbar"><div class="testbar__inner">' +
      '<div class="testbar__title">' + esc(test.tipo) + " · Turmas " + esc(test.turmas) + "<small>" + esc(test.serie) + " · " + (ctx.st.mode === "study" ? "Modo Estudo" : "Modo Prova") + "</small></div>" +
      '<div class="testbar__stats" id="barStats"></div>' +
      '<div class="progress" aria-hidden="true"><div class="progress__fill" id="barFill"></div></div>' +
    "</div></div>";
  }

  function updateBar() {
    if (!ctx) return;
    var stats = document.getElementById("barStats");
    var fill = document.getElementById("barFill");
    if (!stats) return;
    var test = ctx.test, st = ctx.st;
    var total = countQuestions(test);
    var answered = answeredCount(test, st);
    var parts = [];
    if (st.finished) {
      parts.push("Nota: <b>" + fmtScore(evaluate(test, st).total) + "</b> / 10");
    } else {
      parts.push("Respondidas: <b>" + answered + "/" + total + "</b>");
      if (st.mode === "study") {
        var ok = 0, done = 0;
        test.sections.forEach(function (s, si) {
          s.questions.forEach(function (q, qi) {
            var key = qk(si, qi);
            if (st.checked[key]) { done++; if (grade(s, q, st.answers[key] || "").ok) ok++; }
          });
        });
        parts.push("Acertos: <b>" + ok + "/" + done + "</b>");
      }
    }
    var end = st.finishedAt || Date.now();
    parts.push('Tempo: <b id="barTime">' + fmtClock((end - st.startedAt) / 1000) + "</b>");
    stats.innerHTML = parts.map(function (p) { return "<span>" + p + "</span>"; }).join("");
    if (fill) fill.style.width = (st.finished ? 100 : Math.round((answered / total) * 100)) + "%";
  }

  function renderTest(test, st) {
    destroyPlayers();
    if (ctx && ctx.timer) clearInterval(ctx.timer);
    ctx = { test: test, st: st, timer: null };

    var html = barHTML() + '<div class="container" id="testRoot">';
    html += '<p><a href="#/">← Todas as provas</a></p>';
    if (st.finished) html += resultHTML();
    test.sections.forEach(function (s, si) { html += sectionHTML(si); });
    if (!st.finished) {
      html += '<div class="card finish">' +
        "<p>" + (st.mode === "study"
          ? "Quando terminar, veja a nota final (itens não verificados também serão corrigidos)."
          : "Revise suas respostas antes de finalizar. Depois de corrigir, não é possível alterá-las.") + "</p>" +
        '<button type="button" class="btn" data-action="finish">' + (st.mode === "study" ? "Ver resultado final" : "Finalizar e corrigir") + "</button>" +
        ' <button type="button" class="btn btn--ghost" data-action="restart">Recomeçar</button>' +
      "</div>";
    }
    html += "</div>";
    app.innerHTML = html;

    // Players de áudio
    test.sections.forEach(function (s, si) {
      if (!s.audio) return;
      var slot = app.querySelector('[data-player="' + si + '"]');
      if (!slot) return;
      var p = createPlayer(s, "Question " + s.number + " – " + (test.topics[si] || "Áudio"));
      p.setFree(st.mode === "study" || st.finished);
      players.push(p);
      slot.replaceWith(p.el);
    });

    updateBar();
    if (!st.finished) {
      ctx.timer = setInterval(function () {
        var t = document.getElementById("barTime");
        if (t && ctx && !ctx.st.finished) t.textContent = fmtClock((Date.now() - ctx.st.startedAt) / 1000);
      }, 1000);
    }
  }

  function refreshQuestion(si, qi, focusValue) {
    var key = qk(si, qi);
    var node = document.getElementById("q-" + key);
    if (!node) return;
    var tmp = document.createElement("div");
    tmp.innerHTML = questionHTML(si, qi);
    var fresh = tmp.firstChild;
    node.replaceWith(fresh);
    var score = document.getElementById("secscore-" + si);
    if (score) score.textContent = sectionScoreText(si);
    if (focusValue) {
      var inp = fresh.querySelector('input[value="' + focusValue + '"]');
      if (inp && !inp.disabled) inp.focus();
      else {
        var fb = fresh.querySelector(".fb");
        if (fb) { fb.setAttribute("tabindex", "-1"); fb.focus({ preventScroll: true }); }
      }
    }
  }

  var saveTimer = null;
  function persistSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { if (ctx) setState(ctx.test.id, ctx.st); }, 250);
  }
  function persistNow() {
    clearTimeout(saveTimer);
    if (ctx) setState(ctx.test.id, ctx.st);
  }

  function checkGap(key) {
    if (!ctx) return;
    var st = ctx.st;
    if (!String(st.answers[key] || "").trim()) { toast("Escreva uma resposta antes de verificar."); return; }
    st.checked[key] = true;
    persistNow();
    var p = key.split("-");
    refreshQuestion(+p[0], +p[1]);
    updateBar();
  }

  function finishTest() {
    if (!ctx || ctx.st.finished) return;
    var test = ctx.test, st = ctx.st;
    var blanks = countQuestions(test) - answeredCount(test, st);
    if (blanks > 0) {
      var ok = window.confirm("Você deixou " + blanks + (blanks === 1 ? " item" : " itens") + " em branco. Deseja finalizar mesmo assim?");
      if (!ok) return;
    }
    st.finished = true;
    st.finishedAt = Date.now();
    persistNow();
    var ev = evaluate(test, st);
    pushHistory({ id: test.id, score: ev.total, date: st.finishedAt, mode: st.mode, name: st.name });
    renderTest(test, st);
    window.scrollTo(0, 0);
    var res = document.getElementById("result");
    if (res) res.focus({ preventScroll: true });
  }

  function restartTest() {
    if (!ctx) return;
    var id = ctx.test.id;
    var msg = ctx.st.finished ? "Refazer a prova? Suas respostas atuais serão apagadas (a nota continua no histórico)." : "Recomeçar a prova? Todas as respostas serão apagadas.";
    if (!window.confirm(msg)) return;
    drop("state:" + id);
    destroyPlayers();
    if (ctx.timer) clearInterval(ctx.timer);
    ctx = null;
    route();
    window.scrollTo(0, 0);
  }

  /* Eventos da prova (delegação) */
  app.addEventListener("change", function (ev) {
    var t = ev.target;
    if (!ctx || ctx.st.finished) return;
    if (t.type === "radio" && t.dataset.key) {
      var key = t.dataset.key;
      if (isRevealed(ctx.st, key)) return;
      ctx.st.answers[key] = t.value;
      if (ctx.st.mode === "study") ctx.st.checked[key] = true;
      persistNow();
      var p = key.split("-");
      refreshQuestion(+p[0], +p[1], t.value);
      updateBar();
    }
  });

  app.addEventListener("input", function (ev) {
    var t = ev.target;
    if (!ctx || ctx.st.finished) return;
    if (t.classList && t.classList.contains("gap__input") && t.dataset.key) {
      ctx.st.answers[t.dataset.key] = t.value;
      persistSoon();
      updateBar();
    }
  });

  app.addEventListener("keydown", function (ev) {
    var t = ev.target;
    if (ev.key === "Enter" && t.classList && t.classList.contains("gap__input")) {
      ev.preventDefault();
      if (ctx && ctx.st.mode === "study" && !ctx.st.finished) checkGap(t.dataset.key);
    }
  });

  app.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-action], [data-goto]");
    if (!b) return;
    if (b.dataset.goto) {
      var target = document.getElementById(b.dataset.goto);
      if (target) {
        var root = document.getElementById("testRoot");
        if (root && root.classList.contains("only-errors") && target.classList.contains("is-right")) {
          root.classList.remove("only-errors");
          var tg = app.querySelector('[data-action="errors"]');
          if (tg) { tg.setAttribute("aria-pressed", "false"); tg.textContent = "Mostrar só os erros"; }
        }
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    var action = b.dataset.action;
    if (action === "check") checkGap(b.dataset.key);
    else if (action === "finish") finishTest();
    else if (action === "restart") restartTest();
    else if (action === "print") window.print();
    else if (action === "errors") {
      var root2 = document.getElementById("testRoot");
      if (!root2) return;
      var on = root2.classList.toggle("only-errors");
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "Mostrar todas as questões" : "Mostrar só os erros";
    }
  });

  /* ------------------------------------------------------------------
   * Roteamento
   * ------------------------------------------------------------------ */
  function route() {
    var hash = location.hash || "#/";
    var m = hash.match(/^#\/prova\/([\w-]+)/);
    if (ctx && ctx.timer) clearInterval(ctx.timer);
    if (!m) {
      destroyPlayers();
      ctx = null;
      document.title = "Listening Tests B2";
      renderHome();
      return;
    }
    var test = findTest(m[1]);
    if (!test) { location.hash = "#/"; return; }
    document.title = test.tipo + " (" + test.turmas + ") – Listening Tests B2";
    var st = getState(test.id);
    if (!st || !st.answers || !st.startedAt) {
      destroyPlayers();
      ctx = null;
      renderIntro(test);
      return;
    }
    if (!st.checked) st.checked = {};
    renderTest(test, st);
  }

  window.addEventListener("hashchange", function () {
    route();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  });
  window.addEventListener("pagehide", persistNow);

  route();
})();
