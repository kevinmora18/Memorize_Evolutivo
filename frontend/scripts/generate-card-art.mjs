#!/usr/bin/env node
// Uso: CARD_ART_PROVIDER=fal CARD_ART_API_KEY=xxx node scripts/generate-card-art.mjs [--dry-run] [--force] [--only <slug[,slug]>]
// Proveedores: fal | openai | stability | pollinations | gemini (key en aistudio.google.com/apikey)
// Pollinations: CARD_ART_SEED_SALT=<texto> cambia la seed para variar un resultado (útil con --force)
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'scripts', 'card-art.manifest.json');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY_RUN = flag('--dry-run');
const FORCE = flag('--force');
const ONLY = value('--only');
const PROVIDER = (value('--provider') || process.env.CARD_ART_PROVIDER || 'fal').toLowerCase();
const API_KEY = process.env.CARD_ART_API_KEY;

const buildPrompt = (manifest, card) =>
  manifest.style.base
    .replace('{subject}', card.subject)
    .replace('{palette}', manifest.palettes[card.palette || card.universe] || 'deep dark tones');

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function generateFal(prompt, negative, model) {
  const res = await fetch(`https://fal.run/${model || 'fal-ai/flux/dev'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${API_KEY}` },
    body: JSON.stringify({
      prompt,
      negative_prompt: negative,
      image_size: 'square_hd',
      num_images: 1,
      num_inference_steps: 32,
    }),
  });
  if (!res.ok) throw new Error(`fal.ai ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const url = data.images?.[0]?.url;
  if (!url) throw new Error('fal.ai: respuesta sin imágenes');
  const img = await fetch(url);
  return Buffer.from(await img.arrayBuffer());
}

async function generateOpenAI(prompt, model) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: model || 'gpt-image-1', prompt, size: '1024x1024', n: 1 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI: respuesta sin imagen');
  return Buffer.from(b64, 'base64');
}

async function generateStability(prompt, negative, model) {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('negative_prompt', negative);
  form.append('aspect_ratio', '1:1');
  form.append('output_format', 'png');
  const res = await fetch(
    `https://api.stability.ai/v2beta/stable-image/generate/${model || 'core'}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'image/*' },
      body: form,
    }
  );
  if (!res.ok) throw new Error(`Stability ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function seedFromSlug(slug) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1000000;
}

async function generatePollinations(prompt, negative, seed) {
  const model = process.env.CARD_ART_MODEL || 'black-forest-labs/flux.1-schnell';
  const url =
    `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
    `?model=${encodeURIComponent(model)}&width=1024&height=1024&nologo=true&seed=${seed}` +
    `&negative=${encodeURIComponent(negative)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    signal: AbortSignal.timeout(240000),
  });
  if (!res.ok) throw new Error(`Pollinations ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function generateGemini(prompt, model) {
  const m = model || 'gemini-2.5-flash-image';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '1:1' },
        },
      }),
      signal: AbortSignal.timeout(240000),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) {
    const text = parts.find((p) => p.text)?.text;
    throw new Error(`Gemini: respuesta sin imagen${text ? ` (texto: ${text.slice(0, 140)})` : ''}`);
  }
  return Buffer.from(img.inlineData.data, 'base64');
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const onlyList = ONLY ? ONLY.split(',').map((s) => s.trim()) : null;
  const cards = onlyList ? manifest.cards.filter((c) => onlyList.includes(c.slug) || onlyList.includes(c.id)) : manifest.cards;
  if (cards.length === 0) {
    console.error(`Sin coincidencias para --only ${ONLY}`);
    process.exit(1);
  }

  console.log(`Memorize Evolutivo · generación de arte — proveedor: ${PROVIDER} · cartas: ${cards.length}`);

  if (DRY_RUN) {
    for (const card of cards) {
      console.log('\n──────────────────────────────────────────');
      console.log(`${card.id}  →  ${manifest.output.masterDir}/${card.universe}/${card.slug}.png`);
      console.log(buildPrompt(manifest, card));
      console.log(`NEGATIVE: ${manifest.style.negative}`);
    }
    console.log('\n(--dry-run: no se generó ningún archivo)');
    return;
  }

  if (!API_KEY) {
    console.error('Falta CARD_ART_API_KEY. Usa --dry-run para imprimir los prompts sin generar.');
    process.exit(1);
  }

  const outDir = path.join(root, manifest.output.masterDir);
  let done = 0;
  let skipped = 0;

  for (const card of cards) {
    const dir = path.join(outDir, card.universe);
    const target = path.join(dir, `${card.slug}.png`);
    await mkdir(dir, { recursive: true });

    if (!FORCE && (await exists(target))) {
      skipped += 1;
      console.log(`· ${card.id} ya existe (usa --force para regenerar)`);
      continue;
    }

    const prompt = buildPrompt(manifest, card);
    process.stdout.write(`→ ${card.id} ${card.slug}... `);
    try {
      let buffer;
      if (PROVIDER === 'fal') buffer = await generateFal(prompt, manifest.style.negative, process.env.CARD_ART_MODEL);
      else if (PROVIDER === 'openai') buffer = await generateOpenAI(prompt, process.env.CARD_ART_MODEL);
      else if (PROVIDER === 'stability') buffer = await generateStability(prompt, manifest.style.negative, process.env.CARD_ART_MODEL);
      else if (PROVIDER === 'pollinations') {
        const salt = process.env.CARD_ART_SEED_SALT || '';
        buffer = await generatePollinations(prompt, manifest.style.negative, seedFromSlug(card.slug + salt));
      }
      else if (PROVIDER === 'gemini') buffer = await generateGemini(prompt, process.env.CARD_ART_MODEL);
      else throw new Error(`Proveedor desconocido: ${PROVIDER} (usa fal | openai | stability | pollinations | gemini)`);

      await writeFile(target, buffer);
      done += 1;
      console.log('ok');
      if (PROVIDER === 'pollinations') await new Promise((r) => setTimeout(r, 4000));
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  console.log(`\nCompletado: ${done} generadas, ${skipped} omitidas.`);
  console.log('Siguiente paso: npm run cards:optimize');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
