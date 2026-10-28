import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const REMAINING_5 = [
  {
    id: 'tec-satelite',
    filename: 'tec-satelite.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. Deep space scientific orbital probe satellite, detailed gold thermal foil shielding, glowing cyan optical sensors, extended solar array panels, Earth horizon glow in the dark background, realistic zero-gravity reflections, cinematic lighting, 8k resolution, photorealistic metallic finish. No text, no watermark, no frame.',
  },
  {
    id: 'tec-red',
    filename: 'tec-red.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. Holographic glowing planetary sphere with intricate glowing emerald and turquoise fiber-optic cybernetic grid lines, data nodes pulsing with light, dark tech server room background with soft neon bokeh, high-tech glass refraction, photorealistic details. No text, no watermark, no frame.',
  },
  {
    id: 'tec-bateria',
    filename: 'tec-bateria.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A heavy cylindrical graphene fusion battery capsule made of dark titanium and reinforced sapphire glass, glowing vibrant cobalt-blue plasma fluid contained inside, glowing status indicator gauges, metallic conduits, cinematic dramatic lighting, photorealistic textures. No text, no watermark, no frame.',
  },
  {
    id: 'tec-rayo',
    filename: 'tec-rayo.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A furious concentrated electric plasma arc discharge leaping between heavy copper magnetic coils, blinding electric cyan and violet lightning branches, heat distortion, dark industrial chamber background, realistic motion blur and sparks, 8k resolution, photorealistic. No text, no watermark, no frame.',
  },
  {
    id: 'tec-tubo',
    filename: 'tec-tubo.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A heavy laboratory borosilicate glass test tube vial filled with swirling bioluminescent purple chemical elixir, tiny glowing bubbles rising, condensation droplets on glass surface, subtle purple smoke escaping stopper, dark moody chemistry lab background, photorealistic glass and liquid physics. No text, no watermark, no frame.',
  },
];

const targetDir = path.resolve('public/cards/triads');

async function generateOne(card, seed) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(card.prompt)}?model=flux&width=1024&height=1024&seed=${seed}`;
  console.log(`[GENERATING] ${card.id}...`);

  const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const cropH = Math.floor(meta.height * 0.95);

  const outPath = path.join(targetDir, card.filename);
  await sharp(buf)
    .extract({ left: 0, top: 0, width: meta.width, height: cropH })
    .resize(512, 512)
    .webp({ quality: 90 })
    .toFile(outPath);

  console.log(`[SUCCESS] ✓ Saved ${card.filename}`);
}

async function run() {
  let seed = 300;
  for (const card of REMAINING_5) {
    seed += 53;
    let saved = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        await generateOne(card, seed);
        saved = true;
        break;
      } catch (err) {
        console.warn(`[Attempt ${attempt}] ${card.id} error: ${err.message}. Retrying in 8s...`);
        await new Promise((r) => setTimeout(r, 8000));
      }
    }
    if (!saved) {
      console.error(`FAILED: ${card.id}`);
    }
    // Respectful delay between cards
    console.log('Cooling down 6s...');
    await new Promise((r) => setTimeout(r, 6000));
  }
  console.log('*** FINISHED 5 CARDS ***');
}

run().catch(console.error);
