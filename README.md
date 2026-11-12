# Antibiotic Awareness Week Arcade

Stewardship mini-games with a secret-code-word contest. There are two versions, built from one file:

| Version | What it is |
|---|---|
| **Standalone** | `standalone/aaw-arcade.html`: one self-contained HTML file. Paste it into any page that allows HTML blocks, or open it in a browser. |
| **Website** | The Vercel site. It loads the standalone file as-is and adds code-word submissions, a leaderboard, and play tracking. |

## Where things live

```
standalone/aaw-arcade.html   the games: questions, code words, styles, everything
web/index.html               website page around the arcade (header, submission form)
web/main.js                  loads the arcade, sends tracking, handles submissions
web/style.css                website styles
web/admin.html, admin.js     private results page (/admin)
api/submit.js                saves submitted code words
api/event.js                 logs game starts/finishes
api/admin.js                 leaderboard + activity for the admin page
api/_lib.js                  database connection; reads the code words from the standalone file
```

## How we work

All game changes happen in **`standalone/aaw-arcade.html`**. The website picks them up automatically. You never copy changes over by hand.

1. Make a branch, edit `standalone/aaw-arcade.html`, open a pull request.
2. Vercel comments a preview link on the pull request. Play-test it there, or download the file from the branch and open it in a browser.
3. Merge. The live website updates on its own.

Website-only changes (look, submission form, admin page) go in `web/` or `api/`.

### Rules for the standalone file
- It must stay one self-contained file: no imports, no outside scripts or fonts.
- If you add a game, add its code word to `CODES`. The website checks submissions against that list.
- Keep the `track(...)` lines. They do nothing on their own, but the website uses them.

## One-time Vercel setup

1. **Import the repo** in Vercel. The settings in `vercel.json` are picked up automatically.
2. **Add a database:** Project → Storage → Create Database → **Neon** (free plan) → connect it to this project. Tables are created automatically on first use.
3. **Set an admin password:** Project → Settings → Environment Variables → add `ADMIN_KEY` with a long random value. Never commit it.
4. **Redeploy** (Deployments → ⋯ → Redeploy) so the new settings take effect.
5. Results are at `/admin`. Enter the `ADMIN_KEY` there.

## Data collected
- **Submissions:** the name or initials a player types and their valid code words.
- **Activity:** which game was started or finished and whether a code was unlocked, tagged with a random ID per page visit. No names, accounts, or cookies.

Note: this repo is public, so anyone reading `standalone/aaw-arcade.html` can see the code words.

## Running locally (optional)

Needs Node.js 22+. `npm install`, then `npm run dev` for the website at http://localhost:5173. Submissions and tracking only work on Vercel (or with `vercel dev`).
