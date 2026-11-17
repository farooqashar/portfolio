

# Agent Rules <!-- tessl-managed -->

@.tessl/RULES.md follow the [instructions](.tessl/RULES.md)

## Editing index.html

- The sidebar navigation menu (`<nav id="navbar">`) holds only in-page section links (`#mainTop`, `#about`, `#resume`, `#portfolio`, `#life`). Do not add external links or new menu entries there unless the issue explicitly asks for a menu item.
- Put a new external profile or booking link in the sidebar icon row (`<div class="social-links">` under the profile picture). Build it like the other entries: `target="_blank"`, `rel="noopener"`, a class named for the destination, a `title` and a matching `aria-label`, and a Boxicons `<i class="bx ...">` icon.
- When an issue leaves placement open, use the icon row and say so in the PR description.

## Checking the page in a browser

- No browser is preinstalled. For any layout, CSS or JS change, install Playwright once in `/tmp`, outside the repo: `mkdir -p /tmp/pw && cd /tmp/pw && npm init -y >/dev/null && npm i playwright@1 && npx playwright install --with-deps chromium` (about 40s). `--with-deps` is required, or Chromium fails to launch for missing system libraries.
- Serve the repo with `python3 -m http.server 8765 & SERVER=$!` and stop it with `kill $SERVER` as its own command. Never use `pkill -f http.server`: the pattern matches your own shell's command line and kills it, skipping everything chained after it.
- Check desktop (1440px) and phone (390px) widths.

## Line endings

- Files in this repo do not all share one line ending (at the time of writing `assets/js/main.js` is CRLF, `index.html` and `assets/css/style.css` are LF). Check a file with `file <path>` before editing and keep its existing endings.
- When editing with Python, open files with `newline=""` (or in binary mode) so CRLF is not rewritten, and use `\r\n` in replacement text for CRLF files.
- Before committing, run `git diff --stat` and check it only counts the lines you changed, not the whole file.
