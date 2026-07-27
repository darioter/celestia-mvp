// Arregla el bug: al volver del flujo de reserva (logo, "Volver", "Nueva reserva")
// queda visible el landing viejo porque resetFlow() nunca reactiva el modo beta.
//
// Uso: poné este archivo junto a index.html y corré: node fix-index.js

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'index.html');

if (!fs.existsSync(FILE)) {
  console.error('No encuentro index.html en esta carpeta. Corré esto desde la raíz del repo.');
  process.exit(1);
}

let src = fs.readFileSync(FILE, 'utf8');
const usesCRLF = src.includes('\r\n');
function adaptEOL(s) { return usesCRLF ? s.replace(/\n/g, '\r\n') : s; }

const OLD = adaptEOL(`function resetFlow() {
  Object.assign(state, {`);

const NEW = adaptEOL(`function resetFlow() {
  // Fix: reactivar landing beta al volver (si no, queda visible el index viejo)
  document.body.classList.add('beta-mode');
  const _bl = document.getElementById('beta-landing');
  if (_bl) _bl.classList.remove('hidden');

  Object.assign(state, {`);

if (src.includes(NEW)) {
  console.log('Ya estaba aplicado, no se tocó nada.');
} else if (!src.includes(OLD)) {
  console.log('! NO encontré el texto esperado (function resetFlow() { ... Object.assign(state, {). No se tocó el archivo. Revisar a mano.');
} else {
  src = src.split(OLD).join(NEW);
  fs.writeFileSync(FILE, src, 'utf8');
  console.log('✓ Listo. Fix aplicado y guardado en index.html');
}
