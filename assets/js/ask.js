// "Ask me" chat: talks to /api/ask, which answers from this site, Things Done and the travel atlas.
(function () {
  var SUGGESTIONS = [
    'What does Ashar work on now?',
    'What did he study at MIT?',
    'Which hackathons has he done?',
    'How many countries has he visited?',
  ];
  var messages = [];
  var busy = false;

  var fab = document.createElement('button');
  fab.className = 'ask-fab';
  fab.setAttribute('aria-label', 'Ask me anything');
  fab.innerHTML = '<i class="bx bx-message-rounded-dots"></i><span>Ask me anything</span>';

  var panel = document.createElement('div');
  panel.className = 'ask-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Ask about Ashar');
  panel.innerHTML =
    '<div class="ask-head"><img src="assets/img/asharflag.JPG" alt=""><div><b>Ask about Ashar</b><small>Answers from this site, his Things Done log and travel atlas</small></div><button type="button" aria-label="Close">&times;</button></div>' +
    '<div class="ask-body"></div>' +
    '<div class="ask-sr" role="status" aria-live="polite" aria-atomic="true"></div>' +
    '<form class="ask-form"><input maxlength="500" placeholder="e.g. What projects has he built?" aria-label="Your question"><button type="submit" aria-label="Send"><i class="bx bx-send"></i></button></form>' +
    '<div class="ask-foot">Powered by Claude · answers may be imperfect</div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body = panel.querySelector('.ask-body');
  var form = panel.querySelector('form');
  var input = form.querySelector('input');
  var send = form.querySelector('button');
  var live = panel.querySelector('.ask-sr');
  // The server ends every answer with one of these markers (see api/ask.js).
  var DONE_MARK = '\u0000OK';
  var FAIL_MARK = '\u0000ERR';

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  // Tiny, safe markdown: escape first, then **bold**, _italic_, "- " bullets, line breaks.
  function rich(text) {
    return text.split('\n').map(function (line) {
      var bullet = /^\s*[-*•]\s+/.test(line);
      var h = esc(line.replace(/^\s*[-*•]\s+/, ''))
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|\s)_([^_]+)_(?=\s|$|[.,!?])/g, '$1<em>$2</em>');
      if (!line.trim()) return '<div style="height:6px"></div>';
      return bullet ? '<div class="li"><span>' + h + '</span></div>' : '<div>' + h + '</div>';
    }).join('');
  }

  function render() {
    var html = '';
    if (!messages.length) {
      html += '<div class="ask-intro">Hi! Ask anything about Ashar: his work, MIT, projects, hackathons, travels, or what he was up to in a given year.</div><div class="ask-chips">' +
        SUGGESTIONS.map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join('') + '</div>';
    }
    messages.forEach(function (m) {
      var inner = m.role === 'user' ? esc(m.content)
        : m.error ? (m.content ? rich(m.content) : '') + '<div><em>' + esc(m.error) + '</em></div>'
        : m.content ? rich(m.content) : '<span class="ask-dots"><span></span><span></span><span></span></span>';
      html += '<div class="ask-msg ' + (m.role === 'user' ? 'user' : 'bot') + '"><div class="ask-bubble">' + inner + '</div></div>';
    });
    body.innerHTML = html;
    body.scrollTop = body.scrollHeight;
    send.disabled = busy;
  }

  // Conversation sent to the server: completed answers only. A failed turn (and the question that
  // produced it) stays on screen but is never resent as if it were a real answer.
  function historyFor(q) {
    var out = [];
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i], next = messages[i + 1];
      if (m.role === 'user' && next && next.role === 'assistant' && !next.error) out.push({ role: 'user', content: m.content }, { role: 'assistant', content: next.content });
    }
    out.push({ role: 'user', content: q });
    return out;
  }

  function ask(q) {
    q = q.trim();
    if (!q || busy) return;
    var history = historyFor(q);
    var reply = { role: 'assistant', content: '' };
    messages = messages.concat([{ role: 'user', content: q }, reply]);
    live.textContent = '';
    input.value = '';
    busy = true;
    render();
    fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    }).then(function (res) {
      if (!res.ok || !res.body) {
        return res.json().catch(function () { return {}; }).then(function (e) { throw new Error(e.error || 'Something went wrong. Try again.'); });
      }
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var raw = '';
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) {
            raw += dec.decode();
            if (raw.slice(-DONE_MARK.length) === DONE_MARK) { reply.content = raw.slice(0, -DONE_MARK.length).trim(); return; }
            reply.content = raw.replace(FAIL_MARK, '').trim();
            // No success marker: the server reported a failure or the connection was cut off.
            throw new Error(reply.content ? 'The answer was cut off. Try asking again.' : 'Something went wrong. Try again.');
          }
          raw += dec.decode(r.value, { stream: true });
          reply.content = raw.split('\u0000')[0];
          render();
          return pump();
        });
      }
      return pump();
    }).catch(function (e) {
      reply.error = e.message || 'Something went wrong. Try again.';
    }).then(function () {
      if (!reply.content && !reply.error) reply.error = 'No answer came back. Try again.';
      busy = false;
      render();
      // Announce only the finished reply to screen readers, not every streamed chunk.
      live.textContent = reply.error ? reply.error : reply.content.replace(/\*\*/g, '');
    });
  }

  function toggle(open) {
    var isOpen = open === undefined ? !panel.classList.contains('open') : open;
    panel.classList.toggle('open', isOpen);
    fab.innerHTML = isOpen ? '<i class="bx bx-x"></i><span>Close</span>' : '<i class="bx bx-message-rounded-dots"></i><span>Ask me anything</span>';
    if (isOpen) { render(); setTimeout(function () { input.focus(); }, 50); }
    else if (panel.contains(document.activeElement) || document.activeElement === document.body) fab.focus();
  }

  fab.addEventListener('click', function () { toggle(); });
  panel.querySelector('.ask-head button').addEventListener('click', function () { toggle(false); });
  body.addEventListener('click', function (e) {
    var b = e.target.closest('.ask-chips button');
    if (b) ask(b.textContent);
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) toggle(false); });
})();
