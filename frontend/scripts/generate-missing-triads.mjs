import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const MISSING_TRIADS = [
  {
    id: 'eco-sol',
    filename: 'eco-sol.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A primordial cosmic sun radiating luminous golden solar flares, corona arcs of glowing orange fire swirling into deep ether, warm radiant volumetric light, photorealistic cosmic details, masterpiece render. No text, no watermark, no frame.',
  },
  {
    id: 'eco-semilla',
    filename: 'eco-semilla.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. A glowing bioluminescent jade seed sprouting in rich dark fertile earth, tiny translucent emerald leaves unfolding with crystalline morning dew drops glistening, ethereal green rim light, photorealistic botanical textures. No text, no watermark, no frame.',
  },
  {
    id: 'eco-arbol',
    filename: 'eco-arbol.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A colossal ancient world tree with massive glowing roots winding into mystical soil, sprawling canopy with bioluminescent turquoise and azure leaves under a twilight sky, ethereal floating spores, majestic epic lighting, photorealistic. No text, no watermark, no frame.',
  },
  {
    id: 'eco-flor',
    filename: 'eco-flor.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. An enchanting glowing lotus blossom floating on still dark pond water, radiant magenta and pink translucent petals with shimmering morning dew, mystical soft mist, ethereal botanical glow, photorealistic render. No text, no watermark, no frame.',
  },
  {
    id: 'tec-chip',
    filename: 'tec-chip.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A state-of-the-art quantum microchip processor on dark polished silicon wafer, intricate microscopic gold nano-circuits pulsing with bright cyan neon light, laser-engraved die architecture, photorealistic cybernetic textures. No text, no watermark, no frame.',
  },
  {
    id: 'tec-nucleo',
    filename: 'tec-nucleo.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A heavy cylindrical magnetic plasma containment core reactor chamber, containing a furious swirling orb of intense violet and hot magenta fusion energy, metallic conduits, high-voltage electromagnetic rings, cinematic volumetric lighting. No text, no watermark, no frame.',
  },
  {
    id: 'tec-androide',
    filename: 'tec-androide.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. An elegant humanoid android with polished titanium and dark carbon fiber armor plates, glowing amber visor optical sensors, visible hydraulic neck wiring, standing in moody futuristic laboratory, photorealistic sci-fi render. No text, no watermark, no frame.',
  },
  {
    id: 'tec-qubit',
    filename: 'tec-qubit.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A floating quantum qubit crystalline structure trapped in a laser-cooled electromagnetic trap, emitting multifaceted prismatic cyan and azure laser refractions, intricate gold cryogenic cables, 8k photorealistic. No text, no watermark, no frame.',
  },
  {
    id: 'tec-servidor',
    filename: 'tec-servidor.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A monolithic quantum supercomputer server rack tower with glowing teal coolant conduits and liquid helium tubes, pulsing data buses, dark high-tech server vault background, dramatic sci-fi lighting. No text, no watermark, no frame.',
  },
  {
    id: 'tec-ia',
    filename: 'tec-ia.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A transcendent artificial general intelligence holographic avatar face formed by millions of glowing gold and turquoise neural network synapsis sparks, cosmic nebula background, volumetric god rays, masterpiece render. No text, no watermark, no frame.',
  },
];

const targetDir = path.resolve('public/cards/triads');

async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size > 1000;
  } catch {
    return false;
  }
}

async function generateWithModels(card, seed) {
  const models = ['flux-realism', 'turbo', ''];
  const outPath = path.join(targetDir, card.filename);

  for (const model of models) {
    const modelParam = model ? `&model=${model}` : '';
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(card.prompt)}?width=1024&height=1024&seed=${seed}${modelParam}`;
    
    try {
      console.log(`[GENERATING] ${card.id} (${card.filename}) using ${model || 'default'}...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) {
        console.warn(`[HTTP ${res.status}] with model ${model || 'default'}, trying next...`);
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 500) {
        console.warn(`[Empty response] with model ${model || 'default'}, trying next...`);
        continue;
      }

      const meta = await sharp(buf).metadata();
      const cropH = Math.floor(meta.height * 0.95);

      await sharp(buf)
        .extract({ left: 0, top: 0, width: meta.width, height: cropH })
        .resize(512, 512)
        .webp({ quality: 90 })
        .toFile(outPath);

      console.log(`[SUCCESS] ✓ Saved ${card.filename} (512x512)`);
      return true;
    } catch (err) {
      console.warn(`[Error] ${model || 'default'}: ${err.message}`);
    }
  }

  return false;
}

async function run() {
  await fs.mkdir(targetDir, { recursive: true });
  let seed = 415;

  for (const card of MISSING_TRIADS) {
    seed += 47;
    const outPath = path.join(targetDir, card.filename);
    if (await fileExists(outPath)) {
      console.log(`[SKIP] Already exists: ${card.filename}`);
      continue;
    }

    let saved = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      saved = await generateWithModels(card, seed + attempt * 11);
      if (saved) break;
      console.log(`Retrying ${card.id} in 4s...`);
      await new Promise((r) => setTimeout(r, 4000));
    }

    if (!saved) {
      console.error(`FAILED to generate ${card.filename}`);
    }

    // Short delay between images to avoid aggressive bursting
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('*** ALL REQUIRED TRIAD CARDS READY ***');
}

run().catch(console.error);
