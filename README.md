# Antibiotic Awareness Week Arcade

Stewardship mini-games with a secret-code-word contest. One set of source files builds two versions:

| Version | What it is | Where it comes from |
|---|---|---|
| Website | Normal multi-file site | `dist/` (deployed by Vercel) |
| theHUB block | One self-contained HTML block to paste into theHUB | `dist/hub.html` |

## Where things live

```
index.html          page shell for the website
src/main.js         the menu list: which games appear, in what order
src/core.js         code words, Microsoft Form link, menu, shared helpers
src/style.css       all styles
src/games/*.js      one file per game (quiz.js holds Myth/Fact, De-escalation Dash, Duration Station)
build-hub.js        packs everything into dist/hub.html for theHUB
```

## Working on it

1. Branch off `main`, make your change, open a pull request.
2. Vercel posts a preview link on the pull request. Play-test there.
   The theHUB version of that branch is at `<preview link>/hub.html`.
3. Merge when it looks good. Vercel updates the live site.

To get the theHUB block: open `<live site>/hub.html`, view the page source, and copy all of it into theHUB's HTML block.

## Running it on your own computer (optional)

Needs [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install      # once
npm run dev      # live preview at http://localhost:5173
npm run build    # builds dist/ and dist/hub.html
```

## Adding a game

1. Copy a similar file in `src/games/` and rename it.
2. Import it in `src/main.js` and add a line to the `GAMES` list.
3. Add its code word to `CODES` in `src/core.js` (the key must match the game's `id`).
