#!/usr/bin/env node
// Uso: node scripts/optimize-classic-art.mjs
// Toma los masters de art-source/classic/*.{png,jpg} y genera public/classic/<nombre>-<ancho>.{avif,webp}
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const masterDir = path.join(root, 'art-source', 'classic');
const publicDir = path.join(root, 'public', 'classic');

// Fondos panorámicos → 1920 / 960. Ilustraciones cuadradas → 640 / 320.
const SIZES = { wide: [1920, 960], square: [640, 320] };

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Falta la dependencia "sharp". Instálala con: npm i -D sharp');
    process.exit(1);
  }

  await mkdir(publicDir, { recursive: true });
  const files = (await readdir(masterDir)).filter((f) => /\.(png|jpe?g)$/i.test(f));

  for (const file of files) {
    const name = file.replace(/\.(png|jpe?g)$/i, '');
    const source = path.join(masterDir, file);
    const meta = await sharp(source).metadata();
    const kind = meta.width && meta.height && meta.width / meta.height > 1.2 ? 'wide' : 'square';

    for (const width of SIZES[kind]) {
      const resized = sharp(source).resize({ width, withoutEnlargement: false });
      await writeFile(path.join(publicDir, `${name}-${width}.webp`), await resized.clone().webp({ quality: 80, effort: 5 }).toBuffer());
      await writeFile(path.join(publicDir, `${name}-${width}.avif`), await resized.clone().avif({ quality: 58, effort: 5 }).toBuffer());
    }
    console.log(`✓ ${name} (${kind})`);
  }
  console.log(`\nOptimizadas ${files.length} ilustraciones del modo clásico.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
