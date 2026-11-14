// "Recent work": featured projects from the AI portfolio's projects.json, shown at the top of Portfolio.
// Any failure leaves the block hidden, so the earlier projects below are all that shows.
(function () {
  var BASE = 'https://ai.asharfarooq.xyz/';
  var box = document.getElementById('recent-work');
  if (!box || !window.fetch) return;
  var grid = box.querySelector('.recent-grid');

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  // Entries link to their live site, else their repo, else the AI portfolio. Relative urls are pages on the AI portfolio.
  function link(p) {
    var candidates = [p.url, p.repo];
    for (var i = 0; i < candidates.length; i++) {
      if (typeof candidates[i] !== 'string' || !candidates[i]) continue;
      try {
        var u = new URL(candidates[i], BASE);
        if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
      } catch (e) {}
    }
    return BASE;
  }
  function color(c) {
    return /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#149ddd';
  }

  fetch(BASE + 'projects.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (projects) {
      var featured = (Array.isArray(projects) ? projects : []).filter(function (p) {
        return p && p.featured && p.title;
      });
      if (!featured.length) return;
      grid.innerHTML = featured.map(function (p) {
        return '<a class="recent-card" target="_blank" rel="noopener" href="' + esc(link(p)) + '">' +
          '<span class="recent-glyph" style="background:' + color(p.color) + '" aria-hidden="true">' + esc(p.glyph || p.title.charAt(0)) + '</span>' +
          '<span class="recent-text"><b>' + esc(p.title) + '</b><small>' + esc(p.summary || '') + '</small></span>' +
          '</a>';
      }).join('');
      box.hidden = false;
      if (window.AOS) AOS.refresh();
    })
    .catch(function () {});
})();
