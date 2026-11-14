// The "Learn more" page. Content and styles live in learn.html; this loads the site's fonts and base styles and counts the visit.
import './style.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource-variable/bricolage-grotesque/opsz.css';

// Count the visit with the same anonymous browser ID the game page uses
let visitor;
try { visitor = JSON.parse(localStorage.getItem('aaw.player'))?.id || JSON.parse(localStorage.getItem('aaw.visitor')); } catch { /* storage blocked */ }
if (!visitor) { visitor = crypto.randomUUID(); try { localStorage.setItem('aaw.visitor', JSON.stringify(visitor)); } catch { /* storage blocked */ } }
const body = JSON.stringify({ session: crypto.randomUUID(), player: visitor, type: 'visit', game: 'learn' });
navigator.sendBeacon?.('/api/event', body) || fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {});
