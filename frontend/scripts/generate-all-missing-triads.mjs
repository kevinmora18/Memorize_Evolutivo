import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const PREVIEW_MAPS = [
  {
    id: 'elements-preview',
    filename: 'elements_triad_preview.jpg',
    width: 1376,
    height: 768,
    prompt:
      'Cinematic 8k wide panoramic wallpaper, game map concept art. A mythical fantasy realm where the four primal elements collide: volcanic molten magma flows meeting frozen crystalline ice glaciers, floating earth monoliths, and raging lightning storms with tornado vortex winds in the sky, dramatic epic volumetric lighting, hyper-realistic fantasy landscape, masterpiece. No text, no watermark, no logo, no frame.',
  },
  {
    id: 'science-preview',
    filename: 'science_triad_preview.jpg',
    width: 1376,
    height: 768,
    prompt:
      'Cinematic 8k wide panoramic wallpaper, sci-fi game map concept art. A monumental futuristic research citadel laboratory hovering in orbit, massive particle accelerator rings glowing with electric cyan energy, holographic quantum simulations, optical laser telescopes pointed at deep cosmic nebula, epic sci-fi atmospheric lighting, hyper-detailed photorealistic. No text, no watermark, no logo, no frame.',
  },
  {
    id: 'human-preview',
    filename: 'human_triad_preview.jpg',
    width: 1376,
    height: 768,
    prompt:
      'Cinematic 8k wide panoramic wallpaper, epic historical and futuristic game map concept art. The journey of human civilization depicted across a grand landscape: ancient stone monuments transitioning into bronze age cities, industrial steam towers, modern illuminated megacities, and towering space launchports with rockets reaching into the stars, sunset golden hour lighting, masterpiece render. No text, no watermark, no logo, no frame.',
  },
];

const CARDS = [
  // --- ELEMENTOS (15 Cartas) ---
  {
    id: 'ele-chispa',
    filename: 'ele-chispa.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. A bright glowing volcanic ember spark floating above volcanic obsidian rock, microscopic fractal fire tendrils dancing in the air, intense orange-red glow, dark moody atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'ele-llama',
    filename: 'ele-llama.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. An ancient sacred eternal flame burning on a carved basalt pedestal, swirling tongues of golden, orange and crimson fire, heat distortion waves, dramatic dark cinematic lighting. No text, no watermark, no frame.',
  },
  {
    id: 'ele-inferno',
    filename: 'ele-inferno.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A colossal raging primordial fire tornado elemental erupting from molten magma cracks, blinding incandescent fire vortex, flying volcanic embers, epic dramatic composition, photorealistic. No text, no watermark, no frame.',
  },
  {
    id: 'ele-escarcha',
    filename: 'ele-escarcha.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. Delicate crystalline frost needles branching across dark polished glacier ice, sparkling sapphire and cyan refraction, morning glacial mist, hyper-detailed macro realism. No text, no watermark, no frame.',
  },
  {
    id: 'ele-glaciar',
    filename: 'ele-glaciar.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A massive ancient glacial ice spire cave monolith, deep translucent azure and electric teal ice veins glowing with primordial cold, icy stalactites, cinematic rim light. No text, no watermark, no frame.',
  },
  {
    id: 'ele-tempestad-hielo',
    filename: 'ele-tempestad-hielo.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A furious blizzard vortex cyclone of crystalline ice shards and glowing arctic aurora borealis light, frozen hurricane spiraling across mountain peaks, dramatic cinematic lighting. No text, no watermark, no frame.',
  },
  {
    id: 'ele-arena',
    filename: 'ele-arena.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. Fine golden and basalt mineral sand swirling in a mystical miniature vortex, crystalline quartz particles catching warm sunset light, photorealistic geological macro textures. No text, no watermark, no frame.',
  },
  {
    id: 'ele-roca',
    filename: 'ele-roca.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A giant ancient carved granite monolith embedded with glowing amber rune veins, moss and cracked stone textures, dramatic volumetric twilight lighting, epic scale. No text, no watermark, no frame.',
  },
  {
    id: 'ele-coloso-tierra',
    filename: 'ele-coloso-tierra.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A colossal ancient stone titan golem awakening from a mountain ridge, heavy tectonic rock plates, glowing emerald geode core inside cracked chest, majestic epic atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'ele-brisa',
    filename: 'ele-brisa.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A gentle ethereal spirit breeze spiraling through glowing autumn leaves and dandelion seeds in twilight air, soft cyan wind ribbons, whimsical mystical atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'ele-torbellino',
    filename: 'ele-torbellino.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A powerful dust devil tornado funnel spinning across a windswept canyon, swirling clouds of dust and electric wind currents, dramatic atmospheric lighting, realistic motion blur. No text, no watermark, no frame.',
  },
  {
    id: 'ele-tifon',
    filename: 'ele-tifon.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A monumental celestial typhoon vortex churning dark storm clouds with spiraling lightning arcs, towering vortex reaching the upper stratosphere, epic terrifying storm scale. No text, no watermark, no frame.',
  },
  {
    id: 'ele-carga',
    filename: 'ele-carga.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. Microscopic electrostatic ionized sparks crackling between two polished metallic spheres, glowing purple and electric cyan plasma micro-arcs, dark industrial background. No text, no watermark, no frame.',
  },
  {
    id: 'ele-centella',
    filename: 'ele-centella.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A ball lightning orb floating and crackling with volatile electric filaments, bright violet and electric blue plasma halo, dark stormy sky background, intense illumination. No text, no watermark, no frame.',
  },
  {
    id: 'ele-trueno',
    filename: 'ele-trueno.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A cataclysmic lightning bolt striking an ancient peak, blinding electric white and sapphire branching bolts shattering the sky, atmospheric thunder shockwave, masterpiece render. No text, no watermark, no frame.',
  },

  // --- CIENCIA (15 Cartas) ---
  {
    id: 'cie-lente',
    filename: 'cie-lente.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A giant deep-space observatory telescope lens with golden anti-reflective coating, reflecting distant swirling spiral galaxies and colorful nebulae, precision brass and carbon mechanics. No text, no watermark, no frame.',
  },
  {
    id: 'cie-estrella',
    filename: 'cie-estrella.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A glowing newborn protostar igniting inside a deep cosmic stellar nursery nebula, iridescent violet and cyan gas clouds, bright radiant accretion disk, photorealistic astronomy. No text, no watermark, no frame.',
  },
  {
    id: 'cie-agujero-negro',
    filename: 'cie-agujero-negro.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A supermassive black hole with gravitational gravitational lensing bending spacetime, radiant glowing golden and cyan accretion disk spinning around the event horizon, cosmic masterpiece. No text, no watermark, no frame.',
  },
  {
    id: 'cie-atomo',
    filename: 'cie-atomo.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. A glowing quantum model of an atom, shimmering nucleus surrounded by radiant orbital electron probability clouds of emerald and cyan light, dark quantum vacuum background. No text, no watermark, no frame.',
  },
  {
    id: 'cie-molecula',
    filename: 'cie-molecula.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. A complex crystalline molecular lattice structure made of translucent sapphire and ruby bonds, prismatic light refractions, sleek laboratory dark background. No text, no watermark, no frame.',
  },
  {
    id: 'cie-reaccion',
    filename: 'cie-reaccion.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. A dazzling exothermic chemical explosion reaction inside a heavy tempered laboratory glass flask, glowing fluorescent violet and neon turquoise sparks bursting outward, cinematic. No text, no watermark, no frame.',
  },
  {
    id: 'cie-adn',
    filename: 'cie-adn.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A luminous bioluminescent double-helix DNA strand floating in dark fluid, glowing genetic nucleotide rungs in cyan, gold and magenta, microscopic depth of field. No text, no watermark, no frame.',
  },
  {
    id: 'cie-celula',
    filename: 'cie-celula.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A living human stem cell undergoing mitosis cell division, translucent membrane with glowing organelles and glowing chromosomes, electron microscope style photorealism. No text, no watermark, no frame.',
  },
  {
    id: 'cie-organismo',
    filename: 'cie-organismo.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A synthetic bio-engineered organism inside an illuminated glass stasis incubation chamber, iridescent scales with glowing neural patterns, bio-tech tubing, cinematic lighting. No text, no watermark, no frame.',
  },
  {
    id: 'cie-colisionador',
    filename: 'cie-colisionador.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. Circular underground high-energy particle hadron collider tunnel with massive superconducting magnetic rings, glowing blue beam pipe, intricate electrical cables, industrial sci-fi scale. No text, no watermark, no frame.',
  },
  {
    id: 'cie-boson',
    filename: 'cie-boson.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A Higgs boson subatomic particle event manifesting as a spherical shockwave of golden radiant light beams and decaying particle tracks in bubble chamber, physics masterpiece. No text, no watermark, no frame.',
  },
  {
    id: 'cie-antimateria',
    filename: 'cie-antimateria.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A futuristic magnetic containment trap vacuum cylinder suspending a glowing volatile antimateria plasma droplet in absolute zero, dangerous purple glow, titanium casing. No text, no watermark, no frame.',
  },
  {
    id: 'cie-termo',
    filename: 'cie-termo.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A polished chrome and brass entropy perpetual motion pendulum swinging over glowing heat gradient coils, warm infrared to cold ultraviolet transitions, scientific apparatus. No text, no watermark, no frame.',
  },
  {
    id: 'cie-reactor-fusion',
    filename: 'cie-reactor-fusion.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. Inside of a toroidal tokamak fusion reactor chamber, swirling blazing ribbon of million-degree deuterium-tritium plasma held by superconducting magnets, blinding energy. No text, no watermark, no frame.',
  },
  {
    id: 'cie-supernova',
    filename: 'cie-supernova.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A catastrophic thermonuclear supernova detonation tearing apart a giant star, blinding cosmic flash with expanding shockwaves of radiant gold and magenta gas, space masterpiece. No text, no watermark, no frame.',
  },

  // --- HUMANO (15 Cartas) ---
  {
    id: 'hum-pedernal',
    filename: 'hum-pedernal.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. Two primitive dark flint stones striking together, generating bright orange flying sparks onto dry moss tinder, dark cave background with ancient cave paintings, historical realism. No text, no watermark, no frame.',
  },
  {
    id: 'hum-hoguera',
    filename: 'hum-hoguera.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A primordial campfire surrounded by smooth river stones at night under starry sky, crackling glowing embers, warm inviting light casting long shadows, photorealistic. No text, no watermark, no frame.',
  },
  {
    id: 'hum-forja',
    filename: 'hum-forja.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. An ancient bronze age blacksmith forge with glowing molten bronze being poured into clay molds, heavy iron hammer and anvil with flying sparks, smoky workshop atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'hum-hoz',
    filename: 'hum-hoz.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. An antique curved bronze and carved wooden sickle resting on sheaves of harvested golden wheat, soft warm morning sun rays cutting through field mist. No text, no watermark, no frame.',
  },
  {
    id: 'hum-espiga',
    filename: 'hum-espiga.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. Golden wheat stalks and ears heavy with grain in the glow of a summer sunset, golden hour light haloing each grain kernel, fertile earth background, photorealistic botanical textures. No text, no watermark, no frame.',
  },
  {
    id: 'hum-granero',
    filename: 'hum-granero.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. An ancient neolithic walled settlement with stone and clay granaries, bustling agrarian village at dawn, smoke rising from rooftops, realistic historical atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'hum-rueda',
    filename: 'hum-rueda.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. An ancient heavy carved stone and hardwood spoked wheel resting against an adobe mud wall, dust swirling in desert sunbeams, detailed historical craftsmanship textures. No text, no watermark, no frame.',
  },
  {
    id: 'hum-engranaje',
    filename: 'hum-engranaje.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. Heavy industrial steam age brass and forged steel clockwork interlocking gears, glistening lubrication oil droplets, steam vents hissing in moody 19th-century factory background. No text, no watermark, no frame.',
  },
  {
    id: 'hum-locomotora',
    filename: 'hum-locomotora.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A colossal black steel steam locomotive engine charging across a high stone viaduct bridge, billowing plumes of white steam against a dramatic sunset sky, power and progress. No text, no watermark, no frame.',
  },
  {
    id: 'hum-papiro',
    filename: 'hum-papiro.webp',
    prompt:
      'Hyper-realistic 8k cinematic macro photo, collectible card art. An ancient papyrus scroll unrolled on a dark wooden study desk, handwritten golden glyphs and ink diagrams, feather quill pen and brass inkwell, soft candlelit glow. No text, no watermark, no frame.',
  },
  {
    id: 'hum-imprenta',
    filename: 'hum-imprenta.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A Renaissance wooden and metal Gutenberg printing press in a workshop, lead movable type blocks in rows with fresh black ink, newly printed illuminated manuscript sheets drying. No text, no watermark, no frame.',
  },
  {
    id: 'hum-biblioteca',
    filename: 'hum-biblioteca.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A towering monumental grand library with multi-level spiral staircases, hundreds of thousands of leather-bound illuminated tomes, warm amber chandelier light, majesty of human knowledge. No text, no watermark, no frame.',
  },
  {
    id: 'hum-cohete',
    filename: 'hum-cohete.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible card art. A monumental white and black Saturn-style space rocket launching from seaside pad at dusk, colossal pillar of fiery orange exhaust and smoke billowing across the ocean horizon, epic historic triumph. No text, no watermark, no frame.',
  },
  {
    id: 'hum-estacion',
    filename: 'hum-estacion.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A massive modular international space station orbiting high above Earth, solar array wings gleaming in orbital sunrise, cupola observation window showing deep blue oceans below. No text, no watermark, no frame.',
  },
  {
    id: 'hum-colonia',
    filename: 'hum-colonia.webp',
    prompt:
      'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A thriving human biodome colony outpost on the red dust plains of Mars, glowing geodesic greenhouse domes, pressurized rovers and solar arrays under a dusty pink Martian sunset. No text, no watermark, no frame.',
  },
];

const cardsDir = path.resolve('public/cards/triads');
const triadsDir = path.resolve('public/triads');

async function fileValid(p) {
  try {
    const s = await fs.stat(p);
    return s.size > 2000;
  } catch {
    return false;
  }
}

async function fetchWithFallback(prompt, width, height, seed, models = ['turbo', 'flux-realism']) {
  for (const model of models) {
    const modelParam = model ? `&model=${model}` : '';
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}${modelParam}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) {
        console.warn(`[HTTP ${res.status}] with model ${model}, trying next...`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < 1000) continue;
      return buf;
    } catch (err) {
      console.warn(`[Fetch error ${model}]: ${err.message}`);
    }
  }
  throw new Error('All models failed');
}

async function saveProcessed(buf, outPath, isWide) {
  const meta = await sharp(buf).metadata();
  const cropH = Math.floor(meta.height * 0.95);

  if (isWide) {
    await sharp(buf)
      .extract({ left: 0, top: 0, width: meta.width, height: cropH })
      .resize(1376, 768)
      .jpeg({ quality: 90 })
      .toFile(outPath);
  } else {
    await sharp(buf)
      .extract({ left: 0, top: 0, width: meta.width, height: cropH })
      .resize(512, 512)
      .webp({ quality: 90 })
      .toFile(outPath);
  }
}

async function run() {
  await fs.mkdir(cardsDir, { recursive: true });
  await fs.mkdir(triadsDir, { recursive: true });

  console.log('=== STEP 1: PREVIEWS ===');
  let pSeed = 700;
  for (const prev of PREVIEW_MAPS) {
    pSeed += 31;
    const outPath = path.join(triadsDir, prev.filename);
    if (await fileValid(outPath)) {
      console.log(`[SKIP] Exists: ${prev.filename}`);
      continue;
    }

    console.log(`[PREVIEW] Generating ${prev.filename}...`);
    try {
      const buf = await fetchWithFallback(prev.prompt, 1376, 768, pSeed);
      await saveProcessed(buf, outPath, true);
      console.log(`[SUCCESS] Saved preview: ${prev.filename}`);
    } catch (err) {
      console.error(`[ERROR] Preview ${prev.filename}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log('\n=== STEP 2: 45 TRIAD CARDS ===');
  let cSeed = 1000;
  let current = 0;
  for (const card of CARDS) {
    current++;
    cSeed += 43;
    const outPath = path.join(cardsDir, card.filename);
    if (await fileValid(outPath)) {
      console.log(`[${current}/${CARDS.length}][SKIP] Exists: ${card.filename}`);
      continue;
    }

    console.log(`[${current}/${CARDS.length}][CARD] Generating ${card.id} (${card.filename})...`);
    let saved = false;
    for (let att = 1; att <= 3; att++) {
      try {
        const buf = await fetchWithFallback(card.prompt, 1024, 1024, cSeed + att * 7);
        await saveProcessed(buf, outPath, false);
        console.log(`[SUCCESS] Saved: ${card.filename}`);
        saved = true;
        break;
      } catch (err) {
        console.warn(`[WARN] Attempt ${att} failed on ${card.id}: ${err.message}. Retrying...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (!saved) {
      console.error(`[FAILED] Could not generate ${card.filename}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\n*** GENERATION COMPLETED ***');
}

run().catch(console.error);
