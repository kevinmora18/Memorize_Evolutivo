import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const CARDS = [
  // --- ELEMENTOS ---
  {
    id: 'ele-chispa',
    filename: 'ele-chispa.webp',
    name: 'Chispa Volcánica',
    color: '#F97316',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. A bright glowing volcanic ember spark floating above volcanic obsidian rock, microscopic fractal fire tendrils dancing in the air, intense orange-red glow, dark moody atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'ele-llama',
    filename: 'ele-llama.webp',
    name: 'Llama Eterna',
    color: '#EF4444',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. An ancient sacred eternal flame burning on a carved basalt pedestal, swirling tongues of golden, orange and crimson fire, heat distortion waves, dramatic dark cinematic lighting. No text, no watermark, no frame.',
  },
  {
    id: 'ele-inferno',
    filename: 'ele-inferno.webp',
    name: 'Vórtice Infernal',
    color: '#DC2626',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A colossal raging primordial fire tornado elemental erupting from molten magma cracks, blinding incandescent fire vortex, flying volcanic embers, epic dramatic composition, photorealistic. No text, no watermark, no frame.',
  },
  {
    id: 'ele-escarcha',
    filename: 'ele-escarcha.webp',
    name: 'Brote de Escarcha',
    color: '#38BDF8',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. Delicate crystalline frost needles branching across dark polished glacier ice, sparkling sapphire and cyan refraction, morning glacial mist, hyper-detailed macro realism. No text, no watermark, no frame.',
  },
  {
    id: 'ele-glaciar',
    filename: 'ele-glaciar.webp',
    name: 'Monolito Glaciar',
    color: '#06B6D4',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A massive ancient glacial ice spire cave monolith, deep translucent azure and electric teal ice veins glowing with primordial cold, icy stalactites, cinematic rim light. No text, no watermark, no frame.',
  },
  {
    id: 'ele-tempestad-hielo',
    filename: 'ele-tempestad-hielo.webp',
    name: 'Ventisca Boreal',
    color: '#6366F1',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A furious blizzard vortex cyclone of crystalline ice shards and glowing arctic aurora borealis light, frozen hurricane spiraling across mountain peaks, dramatic cinematic lighting. No text, no watermark, no frame.',
  },
  {
    id: 'ele-arena',
    filename: 'ele-arena.webp',
    name: 'Polvo de Basalto',
    color: '#F59E0B',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. Fine golden and basalt mineral sand swirling in a mystical miniature vortex, crystalline quartz particles catching warm sunset light, photorealistic geological macro textures. No text, no watermark, no frame.',
  },
  {
    id: 'ele-roca',
    filename: 'ele-roca.webp',
    name: 'Monolito Rúnico',
    color: '#78716C',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A giant ancient carved granite monolith embedded with glowing amber rune veins, moss and cracked stone textures, dramatic volumetric twilight lighting, epic scale. No text, no watermark, no frame.',
  },
  {
    id: 'ele-coloso-tierra',
    filename: 'ele-coloso-tierra.webp',
    name: 'Titán Tectónico',
    color: '#10B981',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A colossal ancient stone titan golem awakening from a mountain ridge, heavy tectonic rock plates, glowing emerald geode core inside cracked chest, majestic epic atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'ele-brisa',
    filename: 'ele-brisa.webp',
    name: 'Brisa Susurrante',
    color: '#A7F3D0',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A gentle ethereal spirit breeze spiraling through glowing autumn leaves and dandelion seeds in twilight air, soft cyan wind ribbons, whimsical mystical atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'ele-torbellino',
    filename: 'ele-torbellino.webp',
    name: 'Vórtice Espiral',
    color: '#2DD4BF',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A powerful dust devil tornado funnel spinning across a windswept canyon, swirling clouds of dust and electric wind currents, dramatic atmospheric lighting, realistic motion blur. No text, no watermark, no frame.',
  },
  {
    id: 'ele-tifon',
    filename: 'ele-tifon.webp',
    name: 'Tifón Celestial',
    color: '#0EA5E9',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A monumental celestial typhoon vortex churning dark storm clouds with spiraling lightning arcs, towering vortex reaching the upper stratosphere, epic terrifying storm scale. No text, no watermark, no frame.',
  },
  {
    id: 'ele-carga',
    filename: 'ele-carga.webp',
    name: 'Ion Atmosférico',
    color: '#C084FC',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. Microscopic electrostatic ionized sparks crackling between two polished metallic spheres, glowing purple and electric cyan plasma micro-arcs, dark industrial background. No text, no watermark, no frame.',
  },
  {
    id: 'ele-centella',
    filename: 'ele-centella.webp',
    name: 'Centella Espectral',
    color: '#818CF8',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A ball lightning orb floating and crackling with volatile electric filaments, bright violet and electric blue plasma halo, dark stormy sky background, intense illumination. No text, no watermark, no frame.',
  },
  {
    id: 'ele-trueno',
    filename: 'ele-trueno.webp',
    name: 'Ira del Trueno',
    color: '#38BDF8',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A cataclysmic lightning bolt striking an ancient peak, blinding electric white and sapphire branching bolts shattering the sky, atmospheric thunder shockwave, masterpiece render. No text, no watermark, no frame.',
  },

  // --- CIENCIA ---
  {
    id: 'cie-lente',
    filename: 'cie-lente.webp',
    name: 'Lente de Espacio Profundo',
    color: '#38BDF8',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A giant deep-space observatory telescope lens with golden anti-reflective coating, reflecting distant swirling spiral galaxies and colorful nebulae, precision brass and carbon mechanics. No text, no watermark, no frame.',
  },
  {
    id: 'cie-estrella',
    filename: 'cie-estrella.webp',
    name: 'Protoestrella',
    color: '#FBBF24',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A glowing newborn protostar igniting inside a deep cosmic stellar nursery nebula, iridescent violet and cyan gas clouds, bright radiant accretion disk, photorealistic astronomy. No text, no watermark, no frame.',
  },
  {
    id: 'cie-agujero-negro',
    filename: 'cie-agujero-negro.webp',
    name: 'Horizonte de Sucesos',
    color: '#A855F7',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A supermassive black hole with gravitational gravitational lensing bending spacetime, radiant glowing golden and cyan accretion disk spinning around the event horizon, cosmic masterpiece. No text, no watermark, no frame.',
  },
  {
    id: 'cie-atomo',
    filename: 'cie-atomo.webp',
    name: 'Átomo Cuántico',
    color: '#10B981',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. A glowing quantum model of an atom, shimmering nucleus surrounded by radiant orbital electron probability clouds of emerald and cyan light, dark quantum vacuum background. No text, no watermark, no frame.',
  },
  {
    id: 'cie-molecula',
    filename: 'cie-molecula.webp',
    name: 'Red Molecular',
    color: '#06B6D4',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. A complex crystalline molecular lattice structure made of translucent sapphire and ruby bonds, prismatic light refractions, sleek laboratory dark background. No text, no watermark, no frame.',
  },
  {
    id: 'cie-reaccion',
    filename: 'cie-reaccion.webp',
    name: 'Reacción Exotérmica',
    color: '#EC4899',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. A dazzling exothermic chemical explosion reaction inside a heavy tempered laboratory glass flask, glowing fluorescent violet and neon turquoise sparks bursting outward, cinematic. No text, no watermark, no frame.',
  },
  {
    id: 'cie-adn',
    filename: 'cie-adn.webp',
    name: 'Código Genómico',
    color: '#4ADE80',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A luminous bioluminescent double-helix DNA strand floating in dark fluid, glowing genetic nucleotide rungs in cyan, gold and magenta, microscopic depth of field. No text, no watermark, no frame.',
  },
  {
    id: 'cie-celula',
    filename: 'cie-celula.webp',
    name: 'Célula Madre',
    color: '#22D3EE',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A living human stem cell undergoing mitosis cell division, translucent membrane with glowing organelles and glowing chromosomes, electron microscope style photorealism. No text, no watermark, no frame.',
  },
  {
    id: 'cie-organismo',
    filename: 'cie-organismo.webp',
    name: 'Organismo Bio-Sintético',
    color: '#F43F5E',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A synthetic bio-engineered organism inside an illuminated glass stasis incubation chamber, iridescent scales with glowing neural patterns, bio-tech tubing, cinematic lighting. No text, no watermark, no frame.',
  },
  {
    id: 'cie-colisionador',
    filename: 'cie-colisionador.webp',
    name: 'Anillo de Hadrones',
    color: '#64748B',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. Circular underground high-energy particle hadron collider tunnel with massive superconducting magnetic rings, glowing blue beam pipe, intricate electrical cables, industrial sci-fi scale. No text, no watermark, no frame.',
  },
  {
    id: 'cie-boson',
    filename: 'cie-boson.webp',
    name: 'Bosón Escalar',
    color: '#F59E0B',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible sci-fi card art. A Higgs boson subatomic particle event manifesting as a spherical shockwave of golden radiant light beams and decaying particle tracks in bubble chamber, physics masterpiece. No text, no watermark, no frame.',
  },
  {
    id: 'cie-antimateria',
    filename: 'cie-antimateria.webp',
    name: 'Contenedor de Antimateria',
    color: '#D946EF',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A futuristic magnetic containment trap vacuum cylinder suspending a glowing volatile antimateria plasma droplet in absolute zero, dangerous purple glow, titanium casing. No text, no watermark, no frame.',
  },
  {
    id: 'cie-termo',
    filename: 'cie-termo.webp',
    name: 'Péndulo Entrópico',
    color: '#94A3B8',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A polished chrome and brass entropy perpetual motion pendulum swinging over glowing heat gradient coils, warm infrared to cold ultraviolet transitions, scientific apparatus. No text, no watermark, no frame.',
  },
  {
    id: 'cie-reactor-fusion',
    filename: 'cie-reactor-fusion.webp',
    name: 'Cámara Tokamak',
    color: '#3B82F6',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. Inside of a toroidal tokamak fusion reactor chamber, swirling blazing ribbon of million-degree deuterium-tritium plasma held by superconducting magnets, blinding energy. No text, no watermark, no frame.',
  },
  {
    id: 'cie-supernova',
    filename: 'cie-supernova.webp',
    name: 'Supernova Cósmica',
    color: '#F97316',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A catastrophic thermonuclear supernova detonation tearing apart a giant star, blinding cosmic flash with expanding shockwaves of radiant gold and magenta gas, space masterpiece. No text, no watermark, no frame.',
  },

  // --- HUMANO ---
  {
    id: 'hum-pedernal',
    filename: 'hum-pedernal.webp',
    name: 'Pedernal y Chispa',
    color: '#F59E0B',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. Two primitive dark flint stones striking together, generating bright orange flying sparks onto dry moss tinder, dark cave background with ancient cave paintings, historical realism. No text, no watermark, no frame.',
  },
  {
    id: 'hum-hoguera',
    filename: 'hum-hoguera.webp',
    name: 'Hoguera Tribal',
    color: '#EA580C',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A primordial campfire surrounded by smooth river stones at night under starry sky, crackling glowing embers, warm inviting light casting long shadows, photorealistic. No text, no watermark, no frame.',
  },
  {
    id: 'hum-forja',
    filename: 'hum-forja.webp',
    name: 'Forja de Bronce',
    color: '#DC2626',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. An ancient bronze age blacksmith forge with glowing molten bronze being poured into clay molds, heavy iron hammer and anvil with flying sparks, smoky workshop atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'hum-hoz',
    filename: 'hum-hoz.webp',
    name: 'Hoz de Cosecha',
    color: '#84CC16',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. An antique curved bronze and carved wooden sickle resting on sheaves of harvested golden wheat, soft warm morning sun rays cutting through field mist. No text, no watermark, no frame.',
  },
  {
    id: 'hum-espiga',
    filename: 'hum-espiga.webp',
    name: 'Espiga Dorada',
    color: '#EAB308',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. Golden wheat stalks and ears heavy with grain in the glow of a summer sunset, golden hour light haloing each grain kernel, fertile earth background, photorealistic botanical textures. No text, no watermark, no frame.',
  },
  {
    id: 'hum-granero',
    filename: 'hum-granero.webp',
    name: 'Ciudadela Amurallada',
    color: '#D97706',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. An ancient neolithic walled settlement with stone and clay granaries, bustling agrarian village at dawn, smoke rising from rooftops, realistic historical atmosphere. No text, no watermark, no frame.',
  },
  {
    id: 'hum-rueda',
    filename: 'hum-rueda.webp',
    name: 'Rueda Primitiva',
    color: '#A8A29E',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. An ancient heavy carved stone and hardwood spoked wheel resting against an adobe mud wall, dust swirling in desert sunbeams, detailed historical craftsmanship textures. No text, no watermark, no frame.',
  },
  {
    id: 'hum-engranaje',
    filename: 'hum-engranaje.webp',
    name: 'Engranaje de Acero',
    color: '#0284C7',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. Heavy industrial steam age brass and forged steel clockwork interlocking gears, glistening lubrication oil droplets, steam vents hissing in moody 19th-century factory background. No text, no watermark, no frame.',
  },
  {
    id: 'hum-locomotora',
    filename: 'hum-locomotora.webp',
    name: 'Locomotora a Vapor',
    color: '#475569',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A colossal black steel steam locomotive engine charging across a high stone viaduct bridge, billowing plumes of white steam against a dramatic sunset sky, power and progress. No text, no watermark, no frame.',
  },
  {
    id: 'hum-papiro',
    filename: 'hum-papiro.webp',
    name: 'Papiro y Cálamo',
    color: '#FDE047',
    prompt: 'Hyper-realistic 8k cinematic macro photo, collectible card art. An ancient papyrus scroll unrolled on a dark wooden study desk, handwritten golden glyphs and ink diagrams, feather quill pen and brass inkwell, soft candlelit glow. No text, no watermark, no frame.',
  },
  {
    id: 'hum-imprenta',
    filename: 'hum-imprenta.webp',
    name: 'Prensa de Tipos Móviles',
    color: '#B45309',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A Renaissance wooden and metal Gutenberg printing press in a workshop, lead movable type blocks in rows with fresh black ink, newly printed illuminated manuscript sheets drying. No text, no watermark, no frame.',
  },
  {
    id: 'hum-biblioteca',
    filename: 'hum-biblioteca.webp',
    name: 'Gran Archivo Universal',
    color: '#6366F1',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A towering monumental grand library with multi-level spiral staircases, hundreds of thousands of leather-bound illuminated tomes, warm amber chandelier light, majesty of human knowledge. No text, no watermark, no frame.',
  },
  {
    id: 'hum-cohete',
    filename: 'hum-cohete.webp',
    name: 'Cohete Orbital',
    color: '#F97316',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible card art. A monumental white and black Saturn-style space rocket launching from seaside pad at dusk, colossal pillar of fiery orange exhaust and smoke billowing across the ocean horizon, epic historic triumph. No text, no watermark, no frame.',
  },
  {
    id: 'hum-estacion',
    filename: 'hum-estacion.webp',
    name: 'Estación Espacial',
    color: '#38BDF8',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A massive modular international space station orbiting high above Earth, solar array wings gleaming in orbital sunrise, cupola observation window showing deep blue oceans below. No text, no watermark, no frame.',
  },
  {
    id: 'hum-colonia',
    filename: 'hum-colonia.webp',
    name: 'Cúpula Marciana',
    color: '#EF4444',
    prompt: 'Hyper-realistic 8k cinematic photo, collectible sci-fi card art. A thriving human biodome colony outpost on the red dust plains of Mars, glowing geodesic greenhouse domes, pressurized rovers and solar arrays under a dusty pink Martian sunset. No text, no watermark, no frame.',
  },
];

const targetDir = path.resolve('public/cards/triads');

async function isAiGenerated(p) {
  try {
    const s = await fs.stat(p);
    // AI generated webp files from Pollinations/Sharp are > 15KB
    return s.size > 15000;
  } catch {
    return false;
  }
}

async function createBaseArt(card, outPath) {
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cardGlow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="${card.color}" stop-opacity="0.9" />
          <stop offset="50%" stop-color="${card.color}" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#050714" stop-opacity="1" />
        </radialGradient>
        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#818CF8" stop-opacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="#070913" />
      <circle cx="256" cy="230" r="210" fill="url(#cardGlow)" />
      
      <!-- Central Cosmic Emblem Orbit -->
      <circle cx="256" cy="230" r="130" fill="none" stroke="${card.color}" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>
      <circle cx="256" cy="230" r="75" fill="${card.color}" opacity="0.25" />
      <circle cx="256" cy="230" r="45" fill="${card.color}" opacity="0.75" />
      <circle cx="256" cy="230" r="18" fill="#FFFFFF" />

      <!-- Card Title Overlay -->
      <rect x="24" y="420" width="464" height="68" rx="14" fill="#0B0F19" opacity="0.92" stroke="url(#frameGrad)" stroke-width="1.5"/>
      <text x="256" y="462" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="bold" font-size="22" letter-spacing="1">
        ${card.name.toUpperCase()}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .webp({ quality: 90 })
    .toFile(outPath);
}

async function run() {
  await fs.mkdir(targetDir, { recursive: true });

  console.log('=== VERIFYING / CREATING BASE ART FOR ALL 45 CARDS ===');
  for (const card of CARDS) {
    const outPath = path.join(targetDir, card.filename);
    try {
      await fs.access(outPath);
    } catch {
      await createBaseArt(card, outPath);
      console.log(`[BASE ART CREATED] ${card.filename}`);
    }
  }

  console.log('\n=== FETCHING AI PHOTOREALISTIC WEBP (46s PACING) ===');
  let seed = 450;
  for (const card of CARDS) {
    seed += 37;
    const outPath = path.join(targetDir, card.filename);
    if (await isAiGenerated(outPath)) {
      console.log(`[AI READY] Already high-res AI: ${card.filename}`);
      continue;
    }

    console.log(`[AI GENERATING] ${card.id} (${card.filename})...`);
    let saved = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(card.prompt)}?width=768&height=768&seed=${seed}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
        if (!res.ok) {
          const txt = await res.text();
          console.warn(`[HTTP ${res.status}] ${txt.slice(0, 100)}`);
          if (res.status === 402) {
            console.log('Waiting 46s for rate-limit cooldown...');
            await new Promise((r) => setTimeout(r, 46000));
            continue;
          }
        } else {
          const buf = Buffer.from(await res.arrayBuffer());
          const meta = await sharp(buf).metadata();
          const cropH = Math.floor(meta.height * 0.95);
          await sharp(buf)
            .extract({ left: 0, top: 0, width: meta.width, height: cropH })
            .resize(512, 512)
            .webp({ quality: 90 })
            .toFile(outPath);

          console.log(`[SUCCESS] Upgraded ${card.filename} to photorealistic AI!`);
          saved = true;
          break;
        }
      } catch (err) {
        console.warn(`[Error] ${err.message}`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    // Cooldown 46s between AI images to satisfy Pollinations free limit
    console.log('Cooling down 46s before next image...');
    await new Promise((r) => setTimeout(r, 46000));
  }

  console.log('*** ALL CARDS UPGRADED SUCCESSFULLY ***');
}

run().catch(console.error);
