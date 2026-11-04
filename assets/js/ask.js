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
    '<form class="ask-form"><input maxlength="500" placeholder="e.g. What projects has he built?" aria-label="Your question"><button type="submit" aria-label="Send"><i class="bx bx-send"></i></button></form>' +
    '<div class="ask-foot">Powered by Claude · answers may be imperfect</div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body = panel.querySelector('.ask-body');
  var form = panel.querySelector('form');
  var input = form.querySelector('input');
  var send = form.querySelector('button');

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
        : m.content ? rich(m.content) : '<span class="ask-dots"><span></span><span></span><span></span></span>';
      html += '<div class="ask-msg ' + (m.role === 'user' ? 'user' : 'bot') + '"><div class="ask-bubble">' + inner + '</div></div>';
    });
    body.innerHTML = html;
    body.scrollTop = body.scrollHeight;
    send.disabled = busy;
  }

  function ask(q) {
    q = q.trim();
    if (!q || busy) return;
    var history = messages.concat([{ role: 'user', content: q }]);
    var reply = { role: 'assistant', content: '' };
    messages = history.concat([reply]);
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
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          reply.content += dec.decode(r.value, { stream: true });
          render();
          return pump();
        });
      }
      return pump();
    }).catch(function (e) {
      reply.content = '_' + e.message + '_';
    }).then(function () {
      if (!reply.content) reply.content = '_No answer came back. Try again._';
      busy = false;
      render();
    });
  }

  function toggle(open) {
    var isOpen = open === undefined ? !panel.classList.contains('open') : open;
    panel.classList.toggle('open', isOpen);
    fab.innerHTML = isOpen ? '<i class="bx bx-x"></i><span>Close</span>' : '<i class="bx bx-message-rounded-dots"></i><span>Ask me anything</span>';
    if (isOpen) { render(); setTimeout(function () { input.focus(); }, 50); }
  }

  fab.addEventListener('click', function () { toggle(); });
  panel.querySelector('.ask-head button').addEventListener('click', function () { toggle(false); });
  body.addEventListener('click', function (e) {
    var b = e.target.closest('.ask-chips button');
    if (b) ask(b.textContent);
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
})();
