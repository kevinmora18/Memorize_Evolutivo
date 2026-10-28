import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const CARDS = [
  {
    id: 'tec-antena',
    filename: 'tec-antena.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A massive futuristic planetary communication antenna array tower on a dark metallic platform, glowing violet and electric cyan microwave beam shooting vertically into the night clouds, intricate wires, carbon fiber plating, atmospheric rim lighting, realistic depth of field, octane render, masterpiece, photorealistic textures. No text, no watermark, no frame.',
  },
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
    id: 'tec-idea',
    filename: 'tec-idea.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. An antique heavy quartz filament light bulb with glowing warm amber filaments sparking with electric lightning micro-arcs inside, realistic glass scratches and reflections, floating golden dust motes, moody dark vintage workshop background, cinematic warm rim light, ultra-detailed photorealism. No text, no watermark, no frame.',
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
    id: 'tec-microscopio',
    filename: 'tec-microscopio.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A sophisticated high-tech quantum electron microscope with brushed titanium lenses and chrome mechanical arms, focusing a coherent bright cyan laser beam onto a dark glowing wafer, dark laboratory background with teal reflections, photorealistic macro details. No text, no watermark, no frame.',
  },
  {
    id: 'tec-tubo',
    filename: 'tec-tubo.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A heavy laboratory borosilicate glass test tube vial filled with swirling bioluminescent purple chemical elixir, tiny glowing bubbles rising, condensation droplets on glass surface, subtle purple smoke escaping stopper, dark moody chemistry lab background, photorealistic glass and liquid physics. No text, no watermark, no frame.',
  },
  {
    id: 'tec-medicina',
    filename: 'tec-medicina.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A sleek medical nanotech capsule pill made of polished crimson chrome and transparent glass, containing glowing microscopic crimson red nanorobots and a microscopic DNA helix, floating in sterile dark field with soft red volumetric rim light, hyper-detailed photorealistic render. No text, no watermark, no frame.',
  },
];

const targetDir = path.resolve('public/cards/triads');

async function generateCard(card, seed) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(card.prompt)}?model=flux&width=1024&height=1024&seed=${seed}`;

  console.log(`[GENERATING REALISTIC] ${card.id} (${card.filename})...`);
  const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${card.id}`);

  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const cropH = Math.floor(meta.height * 0.95);

  const outPath = path.join(targetDir, card.filename);
  await sharp(buf)
    .extract({ left: 0, top: 0, width: meta.width, height: cropH })
    .resize(512, 512)
    .webp({ quality: 90 })
    .toFile(outPath);

  console.log(`[SAVED REALISTIC] ✓ ${card.filename}`);
}

async function main() {
  await fs.mkdir(targetDir, { recursive: true });
  let seed = 100;
  for (const card of CARDS) {
    seed += 37;
    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await generateCard(card, seed);
        success = true;
        break;
      } catch (err) {
        console.warn(`[Attempt ${attempt} Failed for ${card.id}]: ${err.message}`);
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
    if (!success) {
      console.error(`FAILED completely for ${card.id}`);
    }
    // Pause 2s between cards
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log('--- ALL REALISTIC TRIAD CARDS GENERATED ---');
}

main().catch(console.error);
