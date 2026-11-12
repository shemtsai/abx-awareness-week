// Builds the theHUB version: one self-contained HTML block (styles + script inside),
// in the same format as the original paste-in block. Output: dist/hub.html
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',      // plain script, no modules, works anywhere
  target: 'es2018',
  charset: 'utf8',     // keep emoji readable instead of \u escapes
  outdir: 'out',
  write: false,
});

const js = result.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
const css = result.outputFiles.find(f => f.path.endsWith('.css')).text;

const html = `<!-- Antibiotic Awareness Week Game Hub: paste this entire block into the HTML block -->
<div class="aaw-wrap">
<div id="aaw-hub"></div>
<style>/*<![CDATA[*/
${css}/*]]>*/</style>
<script>//<![CDATA[
${js}//]]></script>
</div>
`;

mkdirSync('dist', { recursive: true });
writeFileSync('dist/hub.html', html);
console.log(`theHUB block written to dist/hub.html (${(html.length / 1024).toFixed(1)} KB)`);
