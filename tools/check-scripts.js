// Revisa la sintaxis de los <script> inline y del JSON-LD de todas las páginas del sitio.
// Uso: node tools/check-scripts.js   → sale con código 1 si hay errores.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const SKIP = /^(\.|node_modules|ARCHIVOS|CONTENIDO|REDISE|VIDEOS)/;
// Páginas viejas que vercel.json redirige a / (no se sirven)
const LEGACY = new Set(['index-beta.html', 'index-beta-export.html', 'index-original-temp.html']);
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.test(f.name) || (d === ROOT && LEGACY.has(f.name))) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.html')) files.push(p);
  }
})(ROOT);
// JS externos propios
const jsFiles = fs.existsSync(path.join(ROOT, 'js')) ? fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => path.join(ROOT, 'js', f)) : [];
let errores = 0, revisados = 0;
const line = (src, idx) => src.slice(0, idx).split('\n').length;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(src))) {
    const attrs = m[1], code = m[2];
    if (/\bsrc=/.test(attrs) || !code.trim()) continue;
    const type = (attrs.match(/type=["']([^"']+)/) || [])[1] || '';
    const rel = path.relative(ROOT, f) + ':' + line(src, m.index);
    revisados++;
    try {
      if (type === 'application/ld+json') JSON.parse(code);
      else if (!type || /javascript/.test(type)) new vm.Script(code, { filename: rel });
    } catch (e) { errores++; console.error('✗ ' + rel + ' → ' + e.message); }
  }
}
for (const f of jsFiles) {
  revisados++;
  try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); }
  catch (e) { errores++; console.error('✗ ' + path.relative(ROOT, f) + ' → ' + e.message); }
}
console.log(`${files.length} páginas, ${revisados} scripts revisados, ${errores} con errores`);
process.exit(errores ? 1 : 0);
