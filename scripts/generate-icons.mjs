// Gera os PNGs de ícone a partir de public/icon-source.svg
// Uso: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcSvg = readFileSync(join(__dirname, '..', 'public', 'icon-source.svg'));
const outDir = join(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const t of targets) {
  await sharp(srcSvg).resize(t.size, t.size).png().toFile(join(outDir, t.name));
  console.log(`✓ ${t.name} (${t.size}x${t.size})`);
}

// Versão "maskable" — adiciona padding (safe area) pro Android cortar contornos
// Maskable specs: o conteúdo principal deve caber dentro de um círculo de 80% do canvas
await sharp(srcSvg)
  .resize(410, 410) // 80% de 512 = 410
  .extend({
    top: 51, bottom: 51, left: 51, right: 51,
    background: { r: 37, g: 99, b: 235, alpha: 1 }, // mesmo azul do gradiente
  })
  .png()
  .toFile(join(outDir, 'icon-512-maskable.png'));
console.log('✓ icon-512-maskable.png (512x512 com safe area)');

// Favicon 32x32 PNG (alguns navegadores antigos)
await sharp(srcSvg).resize(32, 32).png().toFile(join(outDir, 'favicon-32.png'));
console.log('✓ favicon-32.png');

console.log('\nÍcones gerados em /public');
