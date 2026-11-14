

# Agent Rules <!-- tessl-managed -->

@.tessl/RULES.md follow the [instructions](.tessl/RULES.md)

## Editing index.html

- The sidebar navigation menu (`<nav id="navbar">`) holds only in-page section links (`#mainTop`, `#about`, `#resume`, `#portfolio`, `#life`). Do not add external links or new menu entries there unless the issue explicitly asks for a menu item.
- Put a new external profile or booking link in the sidebar icon row (`<div class="social-links">` under the profile picture). Build it like the newest entries (Calendly, AI Portfolio): `target="_blank"`, a class named for the destination, a `title`, and a Boxicons `<i class="bx ...">` icon.
- When an issue leaves placement open, use the icon row and say so in the PR description.
