#!/usr/bin/env node
// Uso: npm run cards:optimize  (requiere masters en art-source/cards/<universo>/<slug>.png)
import { readFile, mkdir, access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'scripts', 'card-art.manifest.json');

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.error('Falta la dependencia "sharp". Instálala con: npm i -D sharp');
    process.exit(1);
  }
}

async function main() {
  const sharp = await loadSharp();
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const masterDir = path.join(root, manifest.output.masterDir);
  const publicDir = path.join(root, manifest.output.publicDir);

  let processed = 0;
  let missing = 0;

  console.log(`Memorize Evolutivo · optimización — ${manifest.output.sizes.join('/')} ${manifest.output.formats.join('+')}`);

  for (const card of manifest.cards) {
    const source = path.join(masterDir, card.universe, `${card.slug}.png`);
    if (!(await exists(source))) {
      missing += 1;
      continue;
    }

    const outDir = path.join(publicDir, card.universe);
    await mkdir(outDir, { recursive: true });

    for (const size of manifest.output.sizes) {
      const resized = sharp(source).resize(size, size, { fit: 'cover' });
      for (const format of manifest.output.formats) {
        const target = path.join(outDir, `${card.slug}-${size}.${format}`);
        const buffer =
          format === 'avif'
            ? await resized.clone().avif({ quality: 62, effort: 5 }).toBuffer()
            : await resized.clone().webp({ quality: 82, effort: 5 }).toBuffer();
        await writeFile(target, buffer);
      }
    }
    processed += 1;
    console.log(`✓ ${card.id}`);
  }

  console.log(`\nOptimizadas ${processed} cartas.${missing ? ` ${missing} sin master (se renderizarán con el emblema SVG).` : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
