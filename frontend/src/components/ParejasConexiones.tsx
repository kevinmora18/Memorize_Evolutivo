import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Brain, Zap, Target, Award, Clock, Sparkles,
  Volume2, VolumeX, Eye, Snowflake, RotateCcw, Home, CheckCircle2,
  Layers, Flame, Link2
} from "lucide-react";
import type { Universe } from '../App';
import { ParticleExplosion, FreezeOverlay } from './ClassicEffects';
import { InGameCompanionWidget } from './InGameCompanionWidget';

export type ModoConexion = 'naturaleza' | 'ciencia' | 'humano';

export interface ParejasConexionesProps {
  universe?: Universe;
  modo: ModoConexion | string;
  onComplete: () => void;
  onBackToMenu: () => void;
  level?: number;
}

export interface PairCardItem {
  id: string;
  name: string;
  role: "Causa" | "Efecto" | "Origen" | "Destino" | "Herramienta" | "Objeto";
  relation: string;
  category: string;
  color: string;
  glow: string;
  bgGradient: string;
  iconType: string;
  lore: string;
}

export interface PairGroupDef {
  id: number;
  name: string;
  themeColor: string;
  pairTitle: string;
  relationExplanation: string;
  items: [PairCardItem, PairCardItem];
}

interface InGameCard {
  uniqueId: string;
  pairId: number;
  item: PairCardItem;
  isFlipped: boolean;
  isMatched: boolean;
  isHinted?: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
   Audio Synthesizer Engine para el Modo Parejas (Armonías de 2 notas / acordes)
   ────────────────────────────────────────────────────────────────────────── */
class PairsAudio {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private isMuted(): boolean {
    return localStorage.getItem("memorize_sound_muted") === "true";
  }

  playFlip() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  playCardStep(step: 1 | 2) {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freq = step === 1 ? 523.25 : 659.25; // Do ó Mi
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  playPairMatch() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Acorde armónico perfecto (Do - Sol - Do octava)
      const notes = [523.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.45);
      });
    } catch {}
  }

  playMismatch() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  playVictory() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.14, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch {}
  }

  playPower() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }
}

const audio = new PairsAudio();

/* ──────────────────────────────────────────────────────────────────────────
   Catálogo Extenso de Parejas Conceptuales (Naturaleza, Ciencia, Humano)
   ────────────────────────────────────────────────────────────────────────── */
const PAIRS_CATALOG: Record<string, PairGroupDef[]> = {
  naturaleza: [
    {
      id: 1,
      name: "Polinización Dorada",
      themeColor: "#EAB308",
      pairTitle: "Abeja ↔ Miel",
      relationExplanation: "La abeja poliniza las flores y sintetiza la miel dorada pura.",
      items: [
        {
          id: "nat-abeja",
          name: "Abeja Reina",
          role: "Causa",
          relation: "Produce miel",
          category: "Fauna Silvestre",
          color: "#FACC15",
          glow: "rgba(250, 204, 21, 0.4)",
          bgGradient: "from-amber-950/60 to-yellow-900/40",
          iconType: "bee",
          lore: "Arquitecta de colonias vivas y clave del ecosistema.",
        },
        {
          id: "nat-miel",
          name: "Miel Dorada",
          role: "Efecto",
          relation: "Cosecha de la abeja",
          category: "Nutriente Esencial",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.4)",
          bgGradient: "from-amber-950/60 to-yellow-900/40",
          iconType: "honey",
          lore: "Néctar cristalizado con propiedades curativas eternas.",
        },
      ],
    },
    {
      id: 2,
      name: "Sinfonía Abisal",
      themeColor: "#0284C7",
      pairTitle: "Pez ↔ Océano",
      relationExplanation: "El pez abisal nada y prospera en las profundidades del océano.",
      items: [
        {
          id: "nat-pez",
          name: "Pez Bioluminiscente",
          role: "Origen",
          relation: "Habita el océano",
          category: "Vida Marina",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.4)",
          bgGradient: "from-sky-950/60 to-blue-900/40",
          iconType: "fish",
          lore: "Genera destellos fríos para orientarse en el abismo.",
        },
        {
          id: "nat-oceano",
          name: "Fosa Oceánica",
          role: "Destino",
          relation: "Hábitat acuático",
          category: "Hidrosfera",
          color: "#0284C7",
          glow: "rgba(2, 132, 199, 0.4)",
          bgGradient: "from-sky-950/60 to-blue-900/40",
          iconType: "ocean",
          lore: "El gran manto azul que regula el clima del planeta.",
        },
      ],
    },
    {
      id: 3,
      name: "Dosel Primigenio",
      themeColor: "#10B981",
      pairTitle: "Árbol ↔ Follaje",
      relationExplanation: "El roble ancestral nutre la fronda verde que oxigena el mundo.",
      items: [
        {
          id: "nat-arbol",
          name: "Roble Primigenio",
          role: "Origen",
          relation: "Sustenta las hojas",
          category: "Flora Ancestral",
          color: "#22C55E",
          glow: "rgba(34, 197, 94, 0.4)",
          bgGradient: "from-emerald-950/60 to-green-900/40",
          iconType: "tree",
          lore: "Tronco milenario con raíces que abrazan el manto terrestre.",
        },
        {
          id: "nat-hojas",
          name: "Fronda Esmeralda",
          role: "Destino",
          relation: "Hojas del roble",
          category: "Fotosíntesis",
          color: "#10B981",
          glow: "rgba(16, 185, 129, 0.4)",
          bgGradient: "from-emerald-950/60 to-green-900/40",
          iconType: "leaves",
          lore: "Captura los rayos solares para convertir la luz en vida.",
        },
      ],
    },
    {
      id: 4,
      name: "Ciclo Hidrológico",
      themeColor: "#60A5FA",
      pairTitle: "Nube ↔ Lluvia",
      relationExplanation: "La condensación en la nube desata la lluvia que hidrata los valles.",
      items: [
        {
          id: "nat-nube",
          name: "Cúmulo de Vapor",
          role: "Causa",
          relation: "Condensa agua",
          category: "Meteorología",
          color: "#94A3B8",
          glow: "rgba(148, 163, 184, 0.4)",
          bgGradient: "from-slate-950/60 to-blue-950/40",
          iconType: "cloud",
          lore: "Masa flotante de vapor que viaja con los vientos alisios.",
        },
        {
          id: "nat-lluvia",
          name: "Lluvia Cristalina",
          role: "Efecto",
          relation: "Agua que cae",
          category: "Precipitación",
          color: "#60A5FA",
          glow: "rgba(96, 165, 250, 0.4)",
          bgGradient: "from-slate-950/60 to-blue-950/40",
          iconType: "rain",
          lore: "Gotas purificadas que reviven los suelos áridos.",
        },
      ],
    },
    {
      id: 5,
      name: "Danza Nectarífera",
      themeColor: "#F43F5E",
      pairTitle: "Flor ↔ Mariposa",
      relationExplanation: "La flor silvestre atrae a la mariposa para dispersar el polen.",
      items: [
        {
          id: "nat-flor",
          name: "Orquídea Rubí",
          role: "Origen",
          relation: "Nutre con néctar",
          category: "Flora Tropical",
          color: "#F43F5E",
          glow: "rgba(244, 63, 94, 0.4)",
          bgGradient: "from-rose-950/60 to-pink-900/40",
          iconType: "flower",
          lore: "Pétalos carmesíes adaptados para la visita de polinizadores.",
        },
        {
          id: "nat-mariposa",
          name: "Mariposa Monarca",
          role: "Destino",
          relation: "Visita la flor",
          category: "Insectos Alados",
          color: "#FB7185",
          glow: "rgba(251, 113, 133, 0.4)",
          bgGradient: "from-rose-950/60 to-pink-900/40",
          iconType: "butterfly",
          lore: "Emisaria alada que migra miles de kilómetros por el aire.",
        },
      ],
    },
    {
      id: 6,
      name: "Heliotropismo Vital",
      themeColor: "#F59E0B",
      pairTitle: "Sol ↔ Girasol",
      relationExplanation: "La luz del Sol guía y orienta el crecimiento del girasol.",
      items: [
        {
          id: "nat-sol",
          name: "Sol Cenital",
          role: "Causa",
          relation: "Emite energía",
          category: "Astro Solar",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.5)",
          bgGradient: "from-orange-950/60 to-amber-900/40",
          iconType: "sun",
          lore: "Reactor estelar de fusión que alumbra el firmamento.",
        },
        {
          id: "nat-girasol",
          name: "Girasol Radiante",
          role: "Efecto",
          relation: "Sigue la luz",
          category: "Flora Solar",
          color: "#EAB308",
          glow: "rgba(234, 179, 8, 0.4)",
          bgGradient: "from-orange-950/60 to-amber-900/40",
          iconType: "sunflower",
          lore: "Gira pacientemente saludando a la estrella durante el día.",
        },
      ],
    },
    {
      id: 7,
      name: "Metamorfosis Silente",
      themeColor: "#A855F7",
      pairTitle: "Oruga ↔ Crisálida",
      relationExplanation: "La oruga teje su crisálida para transformarse en un ser libre.",
      items: [
        {
          id: "nat-oruga",
          name: "Oruga de Seda",
          role: "Origen",
          relation: "Construye crisálida",
          category: "Estadio Larval",
          color: "#84CC16",
          glow: "rgba(132, 204, 22, 0.4)",
          bgGradient: "from-purple-950/60 to-fuchsia-950/40",
          iconType: "caterpillar",
          lore: "Recolecta nutrientes en el follaje antes de la gran vigilia.",
        },
        {
          id: "nat-crisalida",
          name: "Crisálida Astral",
          role: "Destino",
          relation: "Capullo de cambio",
          category: "Evolución",
          color: "#A855F7",
          glow: "rgba(168, 85, 247, 0.4)",
          bgGradient: "from-purple-950/60 to-fuchsia-950/40",
          iconType: "cocoon",
          lore: "Cámara sellada de reposo donde la materia se reorganiza.",
        },
      ],
    },
    {
      id: 8,
      name: "Germinación Ancestral",
      themeColor: "#4ADE80",
      pairTitle: "Semilla ↔ Brote",
      relationExplanation: "La semilla en la tierra fértil despierta como un brote viviente.",
      items: [
        {
          id: "nat-semilla",
          name: "Semilla Latente",
          role: "Origen",
          relation: "Despierta en brote",
          category: "Cápsula Vital",
          color: "#D97706",
          glow: "rgba(217, 119, 6, 0.4)",
          bgGradient: "from-emerald-950/60 to-green-950/40",
          iconType: "seed",
          lore: "Guarda todo el código genético para levantar un bosque entero.",
        },
        {
          id: "nat-brote",
          name: "Brote Viviente",
          role: "Destino",
          relation: "Primer tallo verde",
          category: "Nueva Vida",
          color: "#4ADE80",
          glow: "rgba(74, 222, 128, 0.4)",
          bgGradient: "from-emerald-950/60 to-green-950/40",
          iconType: "sprout",
          lore: "Abre paso a través de la corteza buscando el primer rayo solar.",
        },
      ],
    },
  ],

  ciencia: [
    {
      id: 1,
      name: "Computación Cognitiva",
      themeColor: "#06B6D4",
      pairTitle: "Robot ↔ Computadora",
      relationExplanation: "El autómata autónomo ejecuta sus algoritmos en la computadora cuántica.",
      items: [
        {
          id: "cie-robot",
          name: "Autómata Cognitivo",
          role: "Herramienta",
          relation: "Controlado por PC",
          category: "Robótica Avanzada",
          color: "#06B6D4",
          glow: "rgba(6, 182, 212, 0.4)",
          bgGradient: "from-cyan-950/60 to-blue-900/40",
          iconType: "robot",
          lore: "Chasis de aleación biónica dotado de servo-motores precisos.",
        },
        {
          id: "cie-pc",
          name: "Matriz Cuántica",
          role: "Objeto",
          relation: "Procesa cálculos",
          category: "Hardware Central",
          color: "#0EA5E9",
          glow: "rgba(14, 165, 233, 0.4)",
          bgGradient: "from-cyan-950/60 to-blue-900/40",
          iconType: "computer",
          lore: "Procesador superconductor operando a temperaturas de helio.",
        },
      ],
    },
    {
      id: 2,
      name: "Microscopía Molecular",
      themeColor: "#8B5CF6",
      pairTitle: "Microscopio ↔ Tubo Reactivo",
      relationExplanation: "El microscopio de haz analiza los reactivos del tubo de ensayo.",
      items: [
        {
          id: "cie-micro",
          name: "Microscopio Óptico",
          role: "Herramienta",
          relation: "Observa la muestra",
          category: "Instrumental",
          color: "#8B5CF6",
          glow: "rgba(139, 92, 246, 0.4)",
          bgGradient: "from-violet-950/60 to-purple-900/40",
          iconType: "microscope",
          lore: "Lentes de cristal zafiro capaces de revelar estructuras celulares.",
        },
        {
          id: "cie-tubo",
          name: "Tubo de Reactivo",
          role: "Objeto",
          relation: "Contiene solución",
          category: "Química Analítica",
          color: "#A855F7",
          glow: "rgba(168, 85, 247, 0.4)",
          bgGradient: "from-violet-950/60 to-purple-900/40",
          iconType: "testTube",
          lore: "Compuesto activo con luminiscencia para trazabilidad en laboratorio.",
        },
      ],
    },
    {
      id: 3,
      name: "Almacenamiento Energético",
      themeColor: "#F59E0B",
      pairTitle: "Electricidad ↔ Batería",
      relationExplanation: "La descarga eléctrica de alto voltaje carga la batería de iones.",
      items: [
        {
          id: "cie-rayo",
          name: "Arco Eléctrico",
          role: "Causa",
          relation: "Flujo de electrones",
          category: "Electrodinámica",
          color: "#FBBF24",
          glow: "rgba(251, 191, 36, 0.5)",
          bgGradient: "from-amber-950/60 to-yellow-950/40",
          iconType: "lightning",
          lore: "Plasma ionizado que conduce millones de voltios instantáneos.",
        },
        {
          id: "cie-bateria",
          name: "Batería de Iones",
          role: "Efecto",
          relation: "Almacena la carga",
          category: "Celdas de Poder",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.4)",
          bgGradient: "from-amber-950/60 to-yellow-950/40",
          iconType: "battery",
          lore: "Electrolitos sólidos capaces de mantener energía estable por años.",
        },
      ],
    },
    {
      id: 4,
      name: "Telemetría Orbital",
      themeColor: "#38BDF8",
      pairTitle: "Satélite ↔ Antena",
      relationExplanation: "El satélite orbital retransmite paquetes de datos a la antena parabólica.",
      items: [
        {
          id: "cie-sat",
          name: "Satélite Geosíncrono",
          role: "Origen",
          relation: "Emite telemetría",
          category: "Aeroespacial",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.4)",
          bgGradient: "from-sky-950/60 to-indigo-950/40",
          iconType: "satellite",
          lore: "Orbitador geoestacionario con paneles de galio y antenas láser.",
        },
        {
          id: "cie-antena",
          name: "Antena Parabólica",
          role: "Destino",
          relation: "Capta la señal",
          category: "Telecomunicaciones",
          color: "#6366F1",
          glow: "rgba(99, 102, 241, 0.4)",
          bgGradient: "from-sky-950/60 to-indigo-950/40",
          iconType: "dish",
          lore: "Plato reflector calibrado para enfocar microondas cósmicas.",
        },
      ],
    },
    {
      id: 5,
      name: "Bio-Ingeniería Molecular",
      themeColor: "#EC4899",
      pairTitle: "ADN ↔ Terapia Génica",
      relationExplanation: "La doble hélice de ADN es restaurada con precisión por la cápsula génica.",
      items: [
        {
          id: "cie-dna",
          name: "Doble Hélice ADN",
          role: "Origen",
          relation: "Código biológico",
          category: "Genética",
          color: "#EC4899",
          glow: "rgba(236, 72, 153, 0.4)",
          bgGradient: "from-pink-950/60 to-rose-950/40",
          iconType: "dna",
          lore: "Espiral base que almacena la enciclopedia de la vida orgánica.",
        },
        {
          id: "cie-jeringa",
          name: "Cápsula Génica",
          role: "Herramienta",
          relation: "Edita el genoma",
          category: "Biotecnología",
          color: "#F43F5E",
          glow: "rgba(244, 63, 94, 0.4)",
          bgGradient: "from-pink-950/60 to-rose-950/40",
          iconType: "syringe",
          lore: "Vector molecular programado para corregir anomalías celulares.",
        },
      ],
    },
    {
      id: 6,
      name: "Astrofísica Profunda",
      themeColor: "#818CF8",
      pairTitle: "Telescopio ↔ Constelación",
      relationExplanation: "El telescopio espacial capta fotones emitidos por constelaciones lejanas.",
      items: [
        {
          id: "cie-tele",
          name: "Telescopio Espacial",
          role: "Herramienta",
          relation: "Enfoca estrellas",
          category: "Astronomía",
          color: "#818CF8",
          glow: "rgba(129, 140, 248, 0.4)",
          bgGradient: "from-indigo-950/60 to-violet-950/40",
          iconType: "telescope",
          lore: "Espejos hexagonales dorados sensibles al espectro infrarrojo.",
        },
        {
          id: "cie-estrellas",
          name: "Cúmulo Estelar",
          role: "Objeto",
          relation: "Luz observada",
          category: "Cosmología",
          color: "#C084FC",
          glow: "rgba(192, 132, 252, 0.4)",
          bgGradient: "from-indigo-950/60 to-violet-950/40",
          iconType: "stars",
          lore: "Nebulosa brillante donde colapsan gigantes gaseosas vivas.",
        },
      ],
    },
    {
      id: 7,
      name: "Arquitectura Sináptica",
      themeColor: "#14B8A6",
      pairTitle: "Chip ↔ Red Global",
      relationExplanation: "El chip neuronal enruta el flujo hacia la red de enlace global.",
      items: [
        {
          id: "cie-chip",
          name: "Chip Neuronal",
          role: "Origen",
          relation: "Conecta a la red",
          category: "Microelectrónica",
          color: "#14B8A6",
          glow: "rgba(20, 184, 166, 0.4)",
          bgGradient: "from-teal-950/60 to-emerald-950/40",
          iconType: "chip",
          lore: "Litografía de 2 nanómetros con miles de millones de transistores.",
        },
        {
          id: "cie-red",
          name: "Red Troncal",
          role: "Destino",
          relation: "Tráfico de datos",
          category: "Ciberespacio",
          color: "#2DD4BF",
          glow: "rgba(45, 212, 191, 0.4)",
          bgGradient: "from-teal-950/60 to-emerald-950/40",
          iconType: "network",
          lore: "Malla de fibra óptica submarina que interconecta continentes.",
        },
      ],
    },
    {
      id: 8,
      name: "Fusión Confinada",
      themeColor: "#F97316",
      pairTitle: "Matraz ↔ Plasma",
      relationExplanation: "Los isótopos del matraz enriquecen el núcleo de plasma estelar.",
      items: [
        {
          id: "cie-matraz",
          name: "Matraz Isótopo",
          role: "Origen",
          relation: "Aporta combustible",
          category: "Física Nuclear",
          color: "#F97316",
          glow: "rgba(249, 115, 22, 0.4)",
          bgGradient: "from-orange-950/60 to-red-950/40",
          iconType: "flask",
          lore: "Solución de deuterio y tritio bajo blindaje de borosilicato.",
        },
        {
          id: "cie-plasma",
          name: "Toroide de Plasma",
          role: "Destino",
          relation: "Fusión limpia",
          category: "Energía Estelar",
          color: "#EF4444",
          glow: "rgba(239, 68, 68, 0.5)",
          bgGradient: "from-orange-950/60 to-red-950/40",
          iconType: "plasma",
          lore: "Campo magnético toroidal que retiene gas a cien millones de grados.",
        },
      ],
    },
  ],

  humano: [
    {
      id: 1,
      name: "Soberanía Feudal",
      themeColor: "#F59E0B",
      pairTitle: "Corona ↔ Castillo",
      relationExplanation: "La corona imperial ejerce soberanía sobre el castillo fortificado.",
      items: [
        {
          id: "hum-corona",
          name: "Corona Imperial",
          role: "Herramienta",
          relation: "Simboliza reinado",
          category: "Monarquía",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.5)",
          bgGradient: "from-amber-950/60 to-yellow-950/40",
          iconType: "crown",
          lore: "Forjada en oro noble e incrustada con zafiros de reinos antiguos.",
        },
        {
          id: "hum-castillo",
          name: "Castillo Fortificado",
          role: "Objeto",
          relation: "Asiento del rey",
          category: "Arquitectura Clásica",
          color: "#D97706",
          glow: "rgba(217, 119, 6, 0.4)",
          bgGradient: "from-amber-950/60 to-yellow-950/40",
          iconType: "castle",
          lore: "Bastión de almenas de piedra erigido sobre el acantilado real.",
        },
      ],
    },
    {
      id: 2,
      name: "Guardia del Reino",
      themeColor: "#94A3B8",
      pairTitle: "Espada ↔ Escudo",
      relationExplanation: "La espada forjada y el escudo de armas configuran la defensa de la legión.",
      items: [
        {
          id: "hum-espada",
          name: "Espada de Acero",
          role: "Herramienta",
          relation: "Arma de combate",
          category: "Herrería",
          color: "#CBD5E1",
          glow: "rgba(203, 213, 225, 0.4)",
          bgGradient: "from-slate-950/60 to-zinc-950/40",
          iconType: "sword",
          lore: "Filo templado en agua de glaciar para cortar armaduras.",
        },
        {
          id: "hum-escudo",
          name: "Escudo Blasón",
          role: "Herramienta",
          relation: "Defensa aliada",
          category: "Protección",
          color: "#64748B",
          glow: "rgba(100, 116, 139, 0.4)",
          bgGradient: "from-slate-950/60 to-zinc-950/40",
          iconType: "shield",
          lore: "Roble recubierto de bronce que desvía proyectiles hostiles.",
        },
      ],
    },
    {
      id: 3,
      name: "Arte Gastronómico",
      themeColor: "#FB923C",
      pairTitle: "Chef ↔ Festín",
      relationExplanation: "El chef artesano transforma ingredientes nobles en un banquete supremo.",
      items: [
        {
          id: "hum-chef",
          name: "Chef Maestro",
          role: "Causa",
          relation: "Prepara el menú",
          category: "Alta Cocina",
          color: "#FB923C",
          glow: "rgba(251, 146, 60, 0.4)",
          bgGradient: "from-orange-950/60 to-amber-950/40",
          iconType: "chef",
          lore: "Guardián de técnicas culinarias transmitidas por generaciones.",
        },
        {
          id: "hum-banquete",
          name: "Festín Gourmet",
          role: "Efecto",
          relation: "Platillo servido",
          category: "Gastronomía",
          color: "#F97316",
          glow: "rgba(249, 115, 22, 0.4)",
          bgGradient: "from-orange-950/60 to-amber-950/40",
          iconType: "dishFood",
          lore: "Fusión de aromas, texturas y especias selectas sobre plata.",
        },
      ],
    },
    {
      id: 4,
      name: "Armonía Acústica",
      themeColor: "#F472B6",
      pairTitle: "Guitarra ↔ Partitura",
      relationExplanation: "Las cuerdas de la guitarra dan vida audible a la partitura clásica.",
      items: [
        {
          id: "hum-guitarra",
          name: "Guitarra de Concierto",
          role: "Herramienta",
          relation: "Toca las notas",
          category: "Lutería",
          color: "#F472B6",
          glow: "rgba(244, 114, 182, 0.4)",
          bgGradient: "from-pink-950/60 to-fuchsia-950/40",
          iconType: "guitar",
          lore: "Caja de resonancia tallada en madera de cedro español.",
        },
        {
          id: "hum-notas",
          name: "Partitura Imperial",
          role: "Objeto",
          relation: "Composición escrita",
          category: "Música Clásica",
          color: "#E879F9",
          glow: "rgba(232, 121, 249, 0.4)",
          bgGradient: "from-pink-950/60 to-fuchsia-950/40",
          iconType: "notes",
          lore: "Pentagrama con compases creados por maestros barrocos.",
        },
      ],
    },
    {
      id: 5,
      name: "Erudición y Sabiduría",
      themeColor: "#38BDF8",
      pairTitle: "Biblioteca ↔ Birrete",
      relationExplanation: "El estudio de los textos antiguos conduce al birrete de graduación.",
      items: [
        {
          id: "hum-libro",
          name: "Tomo de Conocimiento",
          role: "Origen",
          relation: "Enseña la ciencia",
          category: "Literatura",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.4)",
          bgGradient: "from-sky-950/60 to-blue-950/40",
          iconType: "book",
          lore: "Manuscrito iluminado con siglos de filosofía y matemáticas.",
        },
        {
          id: "hum-birrete",
          name: "Birrete Académico",
          role: "Destino",
          relation: "Premio al mérito",
          category: "Academia",
          color: "#6366F1",
          glow: "rgba(99, 102, 241, 0.4)",
          bgGradient: "from-sky-950/60 to-blue-950/40",
          iconType: "cap",
          lore: "Distintivo ceremonial de la cumbre del saber universitario.",
        },
      ],
    },
    {
      id: 6,
      name: "Creación Plástica",
      themeColor: "#A855F7",
      pairTitle: "Paleta ↔ Lienzo",
      relationExplanation: "Los pigmentos de la paleta componen la obra viva sobre el lienzo.",
      items: [
        {
          id: "hum-paleta",
          name: "Paleta de Óleos",
          role: "Herramienta",
          relation: "Mezcla colores",
          category: "Bellas Artes",
          color: "#A855F7",
          glow: "rgba(168, 85, 247, 0.4)",
          bgGradient: "from-purple-950/60 to-violet-950/40",
          iconType: "palette",
          lore: "Madera barnizada con óleos puros de ultramar y ocre.",
        },
        {
          id: "hum-lienzo",
          name: "Lienzo Maestro",
          role: "Objeto",
          relation: "Soporte de la pintura",
          category: "Pintura",
          color: "#C084FC",
          glow: "rgba(192, 132, 252, 0.4)",
          bgGradient: "from-purple-950/60 to-violet-950/40",
          iconType: "canvas",
          lore: "Lino tensado sobre bastidor listo para recibir pinceladas eternas.",
        },
      ],
    },
    {
      id: 7,
      name: "Deporte y Pasión",
      themeColor: "#4ADE80",
      pairTitle: "Balón ↔ Portería",
      relationExplanation: "El disparo del balón infla la red de la portería en el gol de la victoria.",
      items: [
        {
          id: "hum-balon",
          name: "Balón de Cuero",
          role: "Herramienta",
          relation: "Rueda en el césped",
          category: "Deporte Rey",
          color: "#4ADE80",
          glow: "rgba(74, 222, 128, 0.4)",
          bgGradient: "from-emerald-950/60 to-green-950/40",
          iconType: "ball",
          lore: "Esfera de hexágonos cosidos a mano con rebote perfecto.",
        },
        {
          id: "hum-arco",
          name: "Red de la Victoria",
          role: "Destino",
          relation: "Meta del remate",
          category: "Estadio",
          color: "#22C55E",
          glow: "rgba(34, 197, 94, 0.4)",
          bgGradient: "from-emerald-950/60 to-green-950/40",
          iconType: "goal",
          lore: "Malla blanca vibrando con el grito de cincuenta mil aficionados.",
        },
      ],
    },
    {
      id: 8,
      name: "Rumbo y Exploración",
      themeColor: "#EAB308",
      pairTitle: "Brújula ↔ Carta Náutica",
      relationExplanation: "La aguja imantada de la brújula traza el derrotero sobre el mapa antiguo.",
      items: [
        {
          id: "hum-brujula",
          name: "Brújula Dorada",
          role: "Herramienta",
          relation: "Apunta al norte",
          category: "Navegación",
          color: "#EAB308",
          glow: "rgba(234, 179, 8, 0.5)",
          bgGradient: "from-amber-950/60 to-yellow-950/40",
          iconType: "compass",
          lore: "Aguja magnética suspendida en zafiro orientada al polo terrestre.",
        },
        {
          id: "hum-mapa",
          name: "Carta Náutica",
          role: "Objeto",
          relation: "Describe las rutas",
          category: "Cartografía",
          color: "#CA8A04",
          glow: "rgba(202, 138, 4, 0.4)",
          bgGradient: "from-amber-950/60 to-yellow-950/40",
          iconType: "map",
          lore: "Pergamino con rumbos marítimos, corrientes y costas inexploradas.",
        },
      ],
    },
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
   Motor de Emblemas Vectoriales de Alta Definición
   ────────────────────────────────────────────────────────────────────────── */
function RealisticPairEmblem({ iconType, color }: { iconType: string; color: string }) {
  switch (iconType) {
    case "bee":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#FACC15]">
          <ellipse cx="50" cy="52" rx="18" ry="24" fill="#FACC15" />
          <path d="M33 46 H67 M33 54 H67 M36 62 H64" stroke="#1E293B" strokeWidth="3" />
          <ellipse cx="36" cy="36" rx="9" ry="14" fill="#E2E8F0" opacity="0.75" transform="rotate(-30 36 36)" />
          <ellipse cx="64" cy="36" rx="9" ry="14" fill="#E2E8F0" opacity="0.75" transform="rotate(30 64 36)" />
          <circle cx="44" cy="36" r="2.5" fill="#000" />
          <circle cx="56" cy="36" r="2.5" fill="#000" />
        </svg>
      );
    case "honey":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F59E0B]">
          <rect x="34" y="32" width="32" height="42" rx="6" fill="#F59E0B" stroke="#78350F" strokeWidth="2.5" />
          <ellipse cx="50" cy="32" rx="16" ry="6" fill="#FDE68A" />
          <path d="M42 46 Q50 56 58 46" stroke="#78350F" strokeWidth="2" fill="none" />
          <circle cx="50" cy="56" r="4" fill="#FEF08A" />
        </svg>
      );
    case "fish":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#38BDF8]">
          <path d="M25 50 Q50 30 72 50 Q50 70 25 50 Z" fill="#38BDF8" />
          <polygon points="72,50 88,38 88,62" fill="#0284C7" />
          <circle cx="36" cy="46" r="3" fill="#0C4A6E" />
          <path d="M46 45 Q52 50 46 55" stroke="#BAE6FD" strokeWidth="2" fill="none" />
        </svg>
      );
    case "ocean":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#0284C7]">
          <path d="M18 45 Q34 35 50 45 T82 45" stroke="#38BDF8" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M18 58 Q34 48 50 58 T82 58" stroke="#0284C7" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M24 71 Q38 63 52 71 T80 71" stroke="#0369A1" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "tree":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#22C55E]">
          <rect x="46" y="55" width="8" height="28" fill="#78350F" rx="2" />
          <circle cx="50" cy="42" r="24" fill="#15803D" />
          <circle cx="38" cy="46" r="16" fill="#16A34A" />
          <circle cx="62" cy="46" r="16" fill="#22C55E" />
          <circle cx="50" cy="34" r="18" fill="#4ADE80" opacity="0.6" />
        </svg>
      );
    case "leaves":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#10B981]">
          <path d="M50 20 Q75 35 68 68 Q35 75 20 50 Q35 25 50 20 Z" fill="#10B981" />
          <path d="M20 50 L68 68" stroke="#064E3B" strokeWidth="2.5" />
          <path d="M38 48 L46 40 M48 56 L58 48" stroke="#064E3B" strokeWidth="1.5" />
        </svg>
      );
    case "cloud":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#94A3B8]">
          <path d="M26 62 A14 14 0 0 1 36 38 A20 20 0 0 1 68 38 A16 16 0 0 1 78 62 Z" fill="#CBD5E1" />
          <ellipse cx="50" cy="62" rx="28" ry="4" fill="#94A3B8" opacity="0.4" />
        </svg>
      );
    case "rain":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#60A5FA]">
          <path d="M35 38 L30 54 M50 34 L45 58 M65 40 L60 56 M40 62 L36 76 M56 64 L52 78" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
    case "flower":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F43F5E]">
          <circle cx="50" cy="50" r="10" fill="#FACC15" />
          {Array.from({ length: 8 }).map((_, i) => (
            <ellipse
              key={i}
              cx="50"
              cy="28"
              rx="8"
              ry="16"
              fill="#F43F5E"
              opacity="0.8"
              transform={`rotate(${i * 45} 50 50)`}
            />
          ))}
        </svg>
      );
    case "butterfly":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#FB7185]">
          <ellipse cx="50" cy="50" rx="3.5" ry="20" fill="#18181B" />
          <path d="M50 42 C30 20 18 36 28 54 C35 62 48 52 50 48" fill="#F43F5E" />
          <path d="M50 42 C70 20 82 36 72 54 C65 62 52 52 50 48" fill="#F43F5E" />
          <path d="M50 50 C32 54 26 70 36 78 C44 82 48 64 50 54" fill="#FB7185" />
          <path d="M50 50 C68 54 74 70 64 78 C56 82 52 64 50 54" fill="#FB7185" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_18px_#F59E0B]">
          <circle cx="50" cy="50" r="20" fill="#F59E0B" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="18"
              x2="50"
              y2="10"
              stroke="#FDE047"
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${i * 45} 50 50)`}
            />
          ))}
        </svg>
      );
    case "sunflower":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#EAB308]">
          <circle cx="50" cy="50" r="16" fill="#78350F" />
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse
              key={i}
              cx="50"
              cy="24"
              rx="6"
              ry="14"
              fill="#EAB308"
              opacity="0.85"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="8" fill="#451A03" />
        </svg>
      );
    case "caterpillar":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#84CC16]">
          <circle cx="28" cy="54" r="10" fill="#84CC16" />
          <circle cx="42" cy="50" r="10" fill="#65A30D" />
          <circle cx="56" cy="52" r="10" fill="#84CC16" />
          <circle cx="70" cy="50" r="12" fill="#4D7C0F" />
          <circle cx="74" cy="46" r="2.5" fill="#000" />
        </svg>
      );
    case "cocoon":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#A855F7]">
          <ellipse cx="50" cy="50" rx="16" ry="28" fill="#9333EA" />
          <path d="M38 38 Q50 48 62 38 M36 50 Q50 60 64 50 M40 62 Q50 72 60 62" stroke="#E9D5FF" strokeWidth="2" fill="none" />
        </svg>
      );
    case "seed":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#D97706]">
          <path d="M50 22 C34 42 34 66 50 78 C66 66 66 42 50 22 Z" fill="#D97706" />
          <path d="M50 30 L50 72" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "sprout":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#4ADE80]">
          <path d="M50 78 Q50 48 42 34 Q58 38 52 78" fill="#15803D" />
          <path d="M42 38 Q22 28 32 50 Q44 48 42 38 Z" fill="#4ADE80" />
          <path d="M50 44 Q70 32 64 54 Q52 52 50 44 Z" fill="#22C55E" />
        </svg>
      );
    case "robot":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#06B6D4]">
          <rect x="28" y="32" width="44" height="40" rx="8" fill="#082F49" stroke="#06B6D4" strokeWidth="2.5" />
          <line x1="50" y1="20" x2="50" y2="32" stroke="#06B6D4" strokeWidth="2.5" />
          <circle cx="50" cy="18" r="4" fill="#38BDF8" />
          <rect x="36" y="44" width="28" height="8" rx="4" fill="#38BDF8" />
          <circle cx="42" cy="62" r="3" fill="#22D3EE" />
          <circle cx="58" cy="62" r="3" fill="#22D3EE" />
        </svg>
      );
    case "computer":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#0EA5E9]">
          <rect x="22" y="26" width="56" height="38" rx="5" fill="#0C4A6E" stroke="#0EA5E9" strokeWidth="2.5" />
          <rect x="28" y="32" width="44" height="26" rx="2" fill="#0284C7" opacity="0.35" />
          <path d="M42 64 L58 64 M50 64 L50 74 M36 74 L64 74" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "microscope":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#8B5CF6]">
          <path d="M45 22 L62 42 L52 50 L35 30 Z" fill="#8B5CF6" />
          <path d="M50 50 Q72 56 68 76 L40 76 Q38 56 50 50 Z" fill="#5B21B6" />
          <rect x="30" y="76" width="44" height="8" rx="3" fill="#4C1D95" />
        </svg>
      );
    case "testTube":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#A855F7]">
          <rect x="42" y="22" width="16" height="52" rx="8" fill="#3B0764" stroke="#C084FC" strokeWidth="2.5" />
          <path d="M44 48 L56 48 L56 66 A6 6 0 0 1 44 66 Z" fill="#A855F7" />
          <circle cx="50" cy="54" r="2" fill="#F3E8FF" />
        </svg>
      );
    case "lightning":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_18px_#FBBF24]">
          <polygon points="56,16 34,48 50,48 42,84 68,44 52,44" fill="#FBBF24" />
        </svg>
      );
    case "battery":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F59E0B]">
          <rect x="44" y="22" width="12" height="6" rx="2" fill="#F59E0B" />
          <rect x="32" y="28" width="36" height="52" rx="6" fill="#451A03" stroke="#F59E0B" strokeWidth="2.5" />
          <rect x="36" y="44" width="28" height="32" rx="3" fill="#FBBF24" />
        </svg>
      );
    case "satellite":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#38BDF8]">
          <rect x="42" y="42" width="16" height="16" rx="2" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
          <rect x="18" y="44" width="20" height="12" rx="2" fill="#0369A1" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="62" y="44" width="20" height="12" rx="2" fill="#0369A1" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="50" y1="42" x2="50" y2="28" stroke="#38BDF8" strokeWidth="2" />
          <circle cx="50" cy="26" r="3" fill="#BAE6FD" />
        </svg>
      );
    case "dish":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#6366F1]">
          <path d="M30 40 A28 28 0 0 0 70 70 L50 55 Z" fill="#312E81" stroke="#6366F1" strokeWidth="2.5" />
          <line x1="50" y1="55" x2="68" y2="40" stroke="#818CF8" strokeWidth="2" />
          <circle cx="68" cy="40" r="3" fill="#C7D2FE" />
          <path d="M42 70 L34 84 M56 70 L64 84" stroke="#6366F1" strokeWidth="2.5" />
        </svg>
      );
    case "dna":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#EC4899]">
          <path d="M36 20 Q50 36 64 50 Q50 64 36 80" stroke="#EC4899" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M64 20 Q50 36 36 50 Q50 64 64 80" stroke="#F43F5E" strokeWidth="3" fill="none" strokeLinecap="round" />
          <line x1="42" y1="28" x2="58" y2="28" stroke="#FBCFE8" strokeWidth="2" />
          <line x1="40" y1="50" x2="60" y2="50" stroke="#FBCFE8" strokeWidth="2" />
          <line x1="42" y1="72" x2="58" y2="72" stroke="#FBCFE8" strokeWidth="2" />
        </svg>
      );
    case "syringe":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F43F5E]">
          <rect x="42" y="32" width="16" height="38" rx="2" fill="#881337" stroke="#F43F5E" strokeWidth="2" />
          <line x1="50" y1="70" x2="50" y2="84" stroke="#FDA4AF" strokeWidth="2.5" />
          <rect x="36" y="26" width="28" height="6" rx="2" fill="#F43F5E" />
          <line x1="50" y1="18" x2="50" y2="26" stroke="#FDA4AF" strokeWidth="3" />
        </svg>
      );
    case "telescope":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#818CF8]">
          <polygon points="32,60 76,28 82,36 38,68" fill="#4338CA" stroke="#818CF8" strokeWidth="2" />
          <line x1="44" y1="62" x2="36" y2="82" stroke="#818CF8" strokeWidth="2.5" />
          <line x1="44" y1="62" x2="56" y2="82" stroke="#818CF8" strokeWidth="2.5" />
          <circle cx="79" cy="32" r="5" fill="#C7D2FE" />
        </svg>
      );
    case "stars":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_16px_#C084FC]">
          <polygon points="50,20 54,34 68,34 56,44 60,58 50,48 40,58 44,44 32,34 46,34" fill="#C084FC" />
          <circle cx="28" cy="68" r="3" fill="#E9D5FF" />
          <circle cx="72" cy="64" r="4" fill="#E9D5FF" />
        </svg>
      );
    case "chip":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#14B8A6]">
          <rect x="30" y="30" width="40" height="40" rx="6" fill="#042F2E" stroke="#14B8A6" strokeWidth="2.5" />
          <rect x="40" y="40" width="20" height="20" rx="3" fill="#14B8A6" opacity="0.4" />
          <line x1="38" y1="20" x2="38" y2="30" stroke="#14B8A6" strokeWidth="2" />
          <line x1="50" y1="20" x2="50" y2="30" stroke="#14B8A6" strokeWidth="2" />
          <line x1="62" y1="20" x2="62" y2="30" stroke="#14B8A6" strokeWidth="2" />
          <line x1="38" y1="70" x2="38" y2="80" stroke="#14B8A6" strokeWidth="2" />
          <line x1="50" y1="70" x2="50" y2="80" stroke="#14B8A6" strokeWidth="2" />
          <line x1="62" y1="70" x2="62" y2="80" stroke="#14B8A6" strokeWidth="2" />
        </svg>
      );
    case "network":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#2DD4BF]">
          <circle cx="50" cy="30" r="8" fill="#0F766E" stroke="#2DD4BF" strokeWidth="2" />
          <circle cx="30" cy="68" r="8" fill="#0F766E" stroke="#2DD4BF" strokeWidth="2" />
          <circle cx="70" cy="68" r="8" fill="#0F766E" stroke="#2DD4BF" strokeWidth="2" />
          <line x1="50" y1="38" x2="34" y2="62" stroke="#2DD4BF" strokeWidth="2" />
          <line x1="50" y1="38" x2="66" y2="62" stroke="#2DD4BF" strokeWidth="2" />
          <line x1="38" y1="68" x2="62" y2="68" stroke="#2DD4BF" strokeWidth="2" />
        </svg>
      );
    case "flask":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F97316]">
          <path d="M46 22 L54 22 L54 40 L70 68 A6 6 0 0 1 64 78 L36 78 A6 6 0 0 1 30 68 L46 40 Z" fill="#431407" stroke="#F97316" strokeWidth="2.5" />
          <path d="M35 68 L65 68 L60 76 L40 76 Z" fill="#EA580C" />
          <circle cx="50" cy="60" r="3" fill="#FED7AA" />
        </svg>
      );
    case "plasma":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_18px_#EF4444]">
          <circle cx="50" cy="50" r="22" fill="#7F1D1D" stroke="#EF4444" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="12" fill="#F87171" opacity="0.6" filter="blur(2px)" />
          <ellipse cx="50" cy="50" rx="30" ry="10" stroke="#FCA5A5" strokeWidth="1.5" fill="none" transform="rotate(30 50 50)" />
        </svg>
      );
    case "crown":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_16px_#F59E0B]">
          <polygon points="24,68 30,36 44,52 50,30 56,52 70,36 76,68" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          <rect x="24" y="68" width="52" height="8" rx="2" fill="#D97706" />
          <circle cx="30" cy="34" r="3" fill="#FEF08A" />
          <circle cx="50" cy="28" r="3.5" fill="#FEF08A" />
          <circle cx="70" cy="34" r="3" fill="#FEF08A" />
        </svg>
      );
    case "castle":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#D97706]">
          <rect x="28" y="44" width="44" height="34" fill="#78350F" />
          <rect x="24" y="32" width="16" height="46" fill="#92400E" />
          <rect x="60" y="32" width="16" height="46" fill="#92400E" />
          <path d="M44 78 L44 62 A6 6 0 0 1 56 62 L56 78 Z" fill="#451A03" />
        </svg>
      );
    case "sword":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#CBD5E1]">
          <polygon points="50,16 56,24 54,64 46,64 44,24" fill="#E2E8F0" />
          <rect x="36" y="64" width="28" height="6" rx="2" fill="#94A3B8" />
          <rect x="47" y="70" width="6" height="14" rx="2" fill="#475569" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#64748B]">
          <path d="M50 20 Q74 20 74 46 Q74 72 50 82 Q26 72 26 46 Q26 20 50 20 Z" fill="#334155" stroke="#94A3B8" strokeWidth="2.5" />
          <path d="M50 24 L50 78 M32 46 L68 46" stroke="#94A3B8" strokeWidth="2" />
        </svg>
      );
    case "chef":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#FB923C]">
          <path d="M38 52 C26 50 26 32 38 32 C38 22 62 22 62 32 C74 32 74 50 62 52 Z" fill="#F8FAFC" />
          <rect x="38" y="52" width="24" height="10" rx="2" fill="#E2E8F0" />
          <circle cx="50" cy="72" r="10" fill="#FDBA74" />
        </svg>
      );
    case "dishFood":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F97316]">
          <ellipse cx="50" cy="70" rx="34" ry="8" fill="#64748B" />
          <ellipse cx="50" cy="66" rx="28" ry="6" fill="#F1F5F9" />
          <path d="M30 64 Q50 36 70 64 Z" fill="#EA580C" opacity="0.8" />
          <circle cx="50" cy="46" r="4" fill="#FDE047" />
        </svg>
      );
    case "guitar":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F472B6]">
          <ellipse cx="44" cy="62" rx="18" ry="16" fill="#BE185D" />
          <ellipse cx="54" cy="44" rx="12" ry="10" fill="#9D174D" />
          <line x1="58" y1="38" x2="80" y2="16" stroke="#FBCFE8" strokeWidth="4" />
          <circle cx="48" cy="54" r="5" fill="#500724" />
        </svg>
      );
    case "notes":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#E879F9]">
          <ellipse cx="38" cy="68" rx="8" ry="6" fill="#E879F9" />
          <ellipse cx="68" cy="58" rx="8" ry="6" fill="#E879F9" />
          <line x1="44" y1="68" x2="44" y2="28" stroke="#F5D0FE" strokeWidth="3" />
          <line x1="74" y1="58" x2="74" y2="20" stroke="#F5D0FE" strokeWidth="3" />
          <polygon points="44,28 74,20 74,30 44,38" fill="#E879F9" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#38BDF8]">
          <path d="M50 34 Q30 26 18 34 L18 72 Q30 64 50 72 Z" fill="#0369A1" />
          <path d="M50 34 Q70 26 82 34 L82 72 Q70 64 50 72 Z" fill="#0284C7" />
          <line x1="50" y1="34" x2="50" y2="72" stroke="#BAE6FD" strokeWidth="3" />
        </svg>
      );
    case "cap":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#6366F1]">
          <polygon points="50,26 82,40 50,54 18,40" fill="#312E81" stroke="#818CF8" strokeWidth="2" />
          <path d="M30 46 L30 64 Q50 74 70 64 L70 46 Z" fill="#1E1B4B" />
          <line x1="74" y1="42" x2="74" y2="68" stroke="#FDE047" strokeWidth="2.5" />
          <circle cx="74" cy="70" r="3" fill="#FDE047" />
        </svg>
      );
    case "palette":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#A855F7]">
          <path d="M50 20 C72 20 84 34 78 54 C74 68 62 64 56 70 C50 76 54 82 46 82 C24 82 16 64 16 48 C16 32 30 20 50 20 Z" fill="#7E22CE" />
          <circle cx="36" cy="36" r="4" fill="#EF4444" />
          <circle cx="52" cy="30" r="4" fill="#F59E0B" />
          <circle cx="66" cy="40" r="4" fill="#10B981" />
          <circle cx="34" cy="54" r="5" fill="#3B0764" />
        </svg>
      );
    case "canvas":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#C084FC]">
          <rect x="24" y="24" width="52" height="42" rx="4" fill="#F5F3FF" stroke="#C084FC" strokeWidth="3" />
          <circle cx="40" cy="40" r="6" fill="#F59E0B" />
          <polygon points="28,62 48,46 64,62" fill="#8B5CF6" />
          <line x1="50" y1="66" x2="50" y2="82" stroke="#6D28D9" strokeWidth="3" />
        </svg>
      );
    case "ball":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#4ADE80]">
          <circle cx="50" cy="50" r="24" fill="#F8FAFC" stroke="#15803D" strokeWidth="2.5" />
          <polygon points="50,42 58,48 55,58 45,58 42,48" fill="#1E293B" />
          <line x1="50" y1="42" x2="50" y2="26" stroke="#1E293B" strokeWidth="2" />
          <line x1="58" y1="48" x2="72" y2="44" stroke="#1E293B" strokeWidth="2" />
        </svg>
      );
    case "goal":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#22C55E]">
          <rect x="20" y="36" width="60" height="40" fill="none" stroke="#F8FAFC" strokeWidth="4" />
          <path d="M20 46 H80 M20 56 H80 M20 66 H80 M35 36 V76 M50 36 V76 M65 36 V76" stroke="#94A3B8" strokeWidth="1.5" opacity="0.6" />
        </svg>
      );
    case "compass":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_16px_#EAB308]">
          <circle cx="50" cy="50" r="26" fill="#451A03" stroke="#EAB308" strokeWidth="3" />
          <polygon points="50,28 55,50 50,46 45,50" fill="#EF4444" />
          <polygon points="50,72 55,50 50,54 45,50" fill="#CBD5E1" />
          <circle cx="50" cy="50" r="3" fill="#EAB308" />
        </svg>
      );
    case "map":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#CA8A04]">
          <polygon points="22,30 42,24 60,30 78,24 78,72 60,78 42,72 22,78" fill="#78350F" stroke="#CA8A04" strokeWidth="2" />
          <path d="M34 46 Q50 38 66 54" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeDasharray="3 3" />
          <circle cx="66" cy="54" r="3" fill="#EF4444" />
        </svg>
      );
    default:
      return (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl"
          style={{ background: `${color}25`, border: `2px solid ${color}`, color }}
        >
          ✦
        </div>
      );
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Configuraciones Visuales de Modos
   ────────────────────────────────────────────────────────────────────────── */
const MODE_METADATA: Record<string, { title: string; subtitle: string; badge: string; color: string; gradient: string }> = {
  naturaleza: {
    title: "CONEXIONES VITALES",
    subtitle: "ECOSISTEMA & BIOLOGÍA",
    badge: "MODO PAREJAS",
    color: "#10B981",
    gradient: "from-emerald-500 via-teal-500 to-green-600",
  },
  ciencia: {
    title: "SINAPSIS CUÁNTICA",
    subtitle: "CIENCIA & TECNOLOGÍA",
    badge: "MODO PAREJAS",
    color: "#06B6D4",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
  },
  humano: {
    title: "LEGADO COGNITIVO",
    subtitle: "CULTURA & SOCIEDAD",
    badge: "MODO PAREJAS",
    color: "#F59E0B",
    gradient: "from-amber-500 via-orange-500 to-yellow-600",
  },
};

/* ──────────────────────────────────────────────────────────────────────────
   Componente Principal: ParejasConexiones (Modo Parejas)
   ────────────────────────────────────────────────────────────────────────── */
export function ParejasConexiones({
  modo = "naturaleza",
  onComplete,
  onBackToMenu,
  level = 1,
}: ParejasConexionesProps) {
  const safeModo = String(modo).toLowerCase();
  const activeCatalog = PAIRS_CATALOG[safeModo] || PAIRS_CATALOG.naturaleza;
  const meta = MODE_METADATA[safeModo] || MODE_METADATA.naturaleza;

  const [cards, setCards] = useState<InGameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [completedPairs, setCompletedPairs] = useState<number[]>([]);
  const [phase, setPhase] = useState<"preview" | "playing" | "victory">("preview");
  const [previewCountdown, setPreviewCountdown] = useState(3.5);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(85);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(() => localStorage.getItem("memorize_sound_muted") === "true");

  // Efectos visuales interactivos
  const [shakingIdx, setShakingIdx] = useState<number[]>([]);
  const [explosion, setExplosion] = useState<{ x: number; y: number; color: string; id: number } | null>(null);
  const [activeBanner, setActiveBanner] = useState<{ title: string; desc: string; color: string } | null>(null);

  const lockRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Toggle de sonido
  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    localStorage.setItem("memorize_sound_muted", String(next));
  };

  // Número de parejas según nivel
  const getPairsCount = (lvl: number) => {
    if (lvl <= 1) return 6; // 12 cartas (3x4)
    if (lvl <= 2) return 7; // 14 cartas
    return 8; // 16 cartas (4x4)
  };

  const targetCount = getPairsCount(level);

  // Inicializar o reiniciar partida
  const initializeGame = useCallback(() => {
    lockRef.current = false;
    setSelectedCards([]);
    setCompletedPairs([]);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAttempts(0);
    setTimeLeft(85);
    setIsTimeFrozen(false);
    setActiveBanner(null);
    setShakingIdx([]);
    setExplosion(null);

    // Seleccionar parejas al azar del catálogo
    const shuffledCatalog = [...activeCatalog].sort(() => Math.random() - 0.5);
    const chosenDefs = shuffledCatalog.slice(0, targetCount);

    const generatedCards: InGameCard[] = [];
    chosenDefs.forEach((pairDef) => {
      pairDef.items.forEach((item, itemIdx) => {
        generatedCards.push({
          uniqueId: `${pairDef.id}-${item.id}-${itemIdx}`,
          pairId: pairDef.id,
          item,
          isFlipped: true, // Se muestran al inicio durante el preview
          isMatched: false,
          isHinted: false,
        });
      });
    });

    // Barajar aleatoriamente
    const randomized = generatedCards.sort(() => Math.random() - 0.5);
    setCards(randomized);

    // Iniciar cuenta regresiva de previsualización
    setPhase("preview");
    setPreviewCountdown(3.5);
  }, [activeCatalog, targetCount]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Manejo de la fase de Preview
  useEffect(() => {
    if (phase !== "preview") return;

    const interval = setInterval(() => {
      setPreviewCountdown((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          setCards((prevCards) => prevCards.map((c) => ({ ...c, isFlipped: false })));
          setPhase("playing");
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase]);

  // Temporizador principal del juego
  useEffect(() => {
    if (phase !== "playing" || isTimeFrozen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isTimeFrozen]);

  // Habilidad: Revelar Pareja Pendiente
  const handleRevealPair = useCallback(() => {
    if (phase !== "playing" || lockRef.current) return;
    audio.playPower();

    const unmatchedPairs = cards.filter((c) => !c.isMatched);
    if (unmatchedPairs.length === 0) return;

    const targetPairId = unmatchedPairs[0].pairId;

    setCards((prev) =>
      prev.map((c) => (c.pairId === targetPairId ? { ...c, isHinted: true } : c))
    );

    setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isHinted: false })));
    }, 2500);
  }, [phase, cards]);

  // Habilidad: Congelar Tiempo
  const handleFreezeTime = useCallback(() => {
    if (phase !== "playing") return;
    audio.playPower();
    setIsTimeFrozen(true);
    setTimeout(() => {
      setIsTimeFrozen(false);
    }, 8000);
  }, [phase]);

  // Manejo del Clic en una Carta
  const handleCardClick = (idx: number) => {
    if (phase !== "playing" || lockRef.current) return;
    const clicked = cards[idx];
    if (clicked.isFlipped || clicked.isMatched) return;

    audio.playFlip();

    // Voltear carta
    const nextCards = [...cards];
    nextCards[idx] = { ...clicked, isFlipped: true };
    setCards(nextCards);

    const nextSelected = [...selectedCards, idx];
    setSelectedCards(nextSelected);

    // Audio armónico según paso seleccionado (1 ó 2)
    audio.playCardStep(nextSelected.length as 1 | 2);

    // Si seleccionó 2 cartas, evaluar pareja conceptual
    if (nextSelected.length === 2) {
      lockRef.current = true;
      setAttempts((prev) => prev + 1);

      const [i1, i2] = nextSelected;
      const c1 = nextCards[i1];
      const c2 = nextCards[i2];

      const isMatch = c1.pairId === c2.pairId;

      if (isMatch) {
        // ¡Pareja conceptual acertada!
        audio.playPairMatch();

        const currentPairDef = activeCatalog.find((p) => p.id === c1.pairId);
        const newCombo = combo + 1;
        setCombo(newCombo);
        if (newCombo > maxCombo) setMaxCombo(newCombo);

        const earnedPoints = Math.round((100 + newCombo * 35) * Math.min(newCombo, 5));
        setScore((prev) => prev + earnedPoints);

        // Disparar explosión de partículas
        const el = cardRefs.current[i2] || cardRefs.current[i1];
        if (el) {
          const rect = el.getBoundingClientRect();
          setExplosion({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            color: c1.item.color,
            id: Date.now(),
          });
        }

        // Mostrar Banner de Conexión
        if (currentPairDef) {
          setActiveBanner({
            title: `¡CONEXIÓN ESTABLECIDA! ${currentPairDef.pairTitle}`,
            desc: currentPairDef.relationExplanation,
            color: currentPairDef.themeColor,
          });
          setTimeout(() => setActiveBanner(null), 3000);
        }

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === i1 || i === i2 ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);
          lockRef.current = false;

          const updatedCompleted = [...completedPairs, c1.pairId];
          setCompletedPairs(updatedCompleted);

          // Verificar condición de Victoria
          if (updatedCompleted.length >= targetCount) {
            audio.playVictory();
            // Bonus por tiempo restante
            setScore((prev) => prev + Math.max(0, timeLeft * 15));
            setPhase("victory");
          }
        }, 650);
      } else {
        // Mismatch
        audio.playMismatch();
        setCombo(0);
        setShakingIdx([i1, i2]);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === i1 || i === i2 ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
          setShakingIdx([]);
          lockRef.current = false;
        }, 900);
      }
    }
  };

  // Cálculo de Columnas
  const totalCards = cards.length;
  const cols = totalCards <= 12 ? 4 : totalCards === 14 ? 4 : 4;

  const accuracy = attempts > 0 ? Math.round((completedPairs.length / attempts) * 100) : 100;

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col justify-between select-none text-white font-sans bg-[#030712]">
      {/* ── Fondo Cinemático con Gradiente Profundo y Partículas Ambientales ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] opacity-25"
          style={{ background: meta.color }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] rounded-full blur-[160px] opacity-20"
          style={{ background: meta.color }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#060B1C]/80 to-[#02050E]" />
        {/* Malla hexagonal tecnológica tenue */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      {/* Efecto de Explosión de Partículas al acertar */}
      {explosion && (
        <ParticleExplosion
          x={explosion.x}
          y={explosion.y}
          color={explosion.color}
          active={true}
          onDone={() => setExplosion(null)}
        />
      )}

      {/* Superposición cuando el tiempo está congelado */}
      <FreezeOverlay active={isTimeFrozen} />

      {/* ── Cabecera HUD Superior ────────────────────────────────────────── */}
      <header className="relative z-20 px-4 sm:px-6 pt-4 pb-2 w-full max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Botón Salir / Volver */}
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Boss Select</span>
        </button>

        {/* Identificador Central de Modo */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-md">
            <Link2 className="w-3.5 h-3.5" style={{ color: meta.color }} />
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase font-black" style={{ color: meta.color }}>
              {meta.badge} · {meta.subtitle}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 uppercase mt-0.5">
            {meta.title}
          </h1>
        </div>

        {/* Acciones de Audio y Reinicio */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label="Silenciar sonido"
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={initializeGame}
            aria-label="Reiniciar partida"
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-300 hover:text-white transition-all"
            title="Reiniciar Tablero"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* ── Widget del Compañero Neural Astral (InGame Companion) ─────────── */}
      <div className="relative z-30 w-full max-w-5xl mx-auto px-4 flex justify-end">
        <InGameCompanionWidget
          onRevealPair={handleRevealPair}
          onFreezeTime={handleFreezeTime}
          combo={combo}
          matchedCount={completedPairs.length}
          isGameActive={phase === "playing"}
        />
      </div>

      {/* ── Barra de Métricas y Estado Sináptico ─────────────────────────────── */}
      <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 my-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md shadow-2xl">
          {/* Puntuación */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                Puntaje
              </span>
              <span className="font-mono text-base font-black text-white">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Racha / Combo Activo */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Flame className={`w-5 h-5 ${combo >= 2 ? "text-amber-400 animate-bounce" : "text-gray-500"}`} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                Racha
              </span>
              <div className="flex items-center gap-1.5 font-mono text-base font-black">
                <span className={combo >= 2 ? "text-amber-300" : "text-white"}>{combo}x</span>
                {combo >= 2 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    +{combo * 35}pts
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tiempo Restante */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                isTimeFrozen
                  ? "bg-cyan-500/20 border-cyan-400/50"
                  : timeLeft <= 15
                  ? "bg-rose-500/20 border-rose-500/50 animate-pulse"
                  : "bg-blue-500/10 border-blue-500/30"
              }`}
            >
              {isTimeFrozen ? (
                <Snowflake className="w-5 h-5 text-cyan-300 animate-spin" />
              ) : (
                <Clock className={`w-5 h-5 ${timeLeft <= 15 ? "text-rose-400" : "text-blue-400"}`} />
              )}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                {isTimeFrozen ? "Congelado" : "Tiempo"}
              </span>
              <span
                className={`font-mono text-base font-black ${
                  isTimeFrozen
                    ? "text-cyan-300"
                    : timeLeft <= 15
                    ? "text-rose-400 animate-pulse"
                    : "text-white"
                }`}
              >
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Progreso de Parejas */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                Parejas
              </span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-base font-black text-teal-300">
                  {completedPairs.length}
                </span>
                <span className="text-gray-500 text-xs">/{targetCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner de Pareja Conectada con Explicación de Relación */}
        <AnimatePresence>
          {activeBanner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="mt-2.5 p-3 rounded-2xl border-2 backdrop-blur-xl text-center shadow-2xl relative overflow-hidden"
              style={{
                borderColor: activeBanner.color,
                background: "rgba(6, 12, 28, 0.92)",
                boxShadow: `0 0 35px ${activeBanner.color}66`,
              }}
            >
              <div
                className="font-mono text-xs font-black tracking-widest uppercase mb-0.5 flex items-center justify-center gap-2"
                style={{ color: activeBanner.color }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{activeBanner.title}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">{activeBanner.desc}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tablero de Juego (Cartas Realistas de Colección) ─────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 relative z-20 w-full max-w-4xl mx-auto">
        <div className="relative p-4 sm:p-6 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm w-full flex flex-col items-center">
          {/* Indicador de Escaneo Previo */}
          {phase === "preview" && (
            <div className="mb-3 flex items-center gap-2 font-mono text-xs text-teal-300 font-bold bg-teal-500/20 px-4 py-1.5 rounded-full border border-teal-400/40 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MEMORIZA LAS PAREJAS RELACIONADAS: {previewCountdown.toFixed(1)}s</span>
            </div>
          )}

          {/* Cuadrícula de Cartas Coleccionables */}
          <div
            className={`grid gap-3 sm:gap-4 w-full justify-center ${
              cols === 4 ? "grid-cols-4 max-w-2xl" : "grid-cols-4 max-w-2xl"
            }`}
          >
            {cards.map((card, idx) => {
              const isSelected = selectedCards.includes(idx);
              const selectionOrder = isSelected ? selectedCards.indexOf(idx) + 1 : null;
              const isShaking = shakingIdx.includes(idx);

              return (
                <motion.div
                  key={card.uniqueId}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  style={{
                    aspectRatio: "3/4",
                    maxWidth: "135px",
                    perspective: 1000,
                  }}
                  className="w-full relative cursor-pointer select-none"
                  whileHover={!card.isFlipped && !card.isMatched ? { y: -4, scale: 1.04 } : {}}
                  whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.96 } : {}}
                  animate={
                    isShaking
                      ? { x: [0, -6, 6, -4, 4, 0], rotate: [0, -2, 2, -1, 1, 0] }
                      : card.isHinted
                      ? { scale: [1, 1.08, 1], filter: "drop-shadow(0 0 16px #E8B54A)" }
                      : {}
                  }
                  transition={{ duration: isShaking ? 0.35 : 0.2 }}
                  onClick={() => handleCardClick(idx)}
                >
                  <motion.div
                    className="w-full h-full relative"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  >
                    {/* Reverso de Carta Realista */}
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-white/10 bg-[#070D1E] flex flex-col items-center justify-between p-3"
                      style={{
                        backfaceVisibility: "hidden",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                      }}
                    >
                      <div className="w-full flex justify-between items-center text-[9px] font-mono text-teal-400/60 uppercase">
                        <span>PAREJA</span>
                        <span>0{idx + 1}</span>
                      </div>

                      {/* Emblema Central del Reverso */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 flex items-center justify-center">
                        <Link2 className="w-6 h-6 text-teal-400" />
                      </div>

                      <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                        MEMORIZE
                      </div>
                    </div>

                    {/* Frente de Carta Realista (Boca Arriba) */}
                    <div
                      className={`absolute inset-0 rounded-2xl overflow-hidden border-2 flex flex-col justify-between p-2.5 transition-all ${
                        card.isMatched
                          ? "opacity-60 border-emerald-400/50 bg-[#041712]"
                          : isSelected
                          ? "border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.4)]"
                          : "border-white/20"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        background: `linear-gradient(180deg, #0A1224 0%, #030814 100%)`,
                        boxShadow: `inset 0 0 16px ${card.item.glow}`,
                      }}
                    >
                      {/* Cabecera de la Carta: Rol */}
                      <div className="flex items-center justify-between">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider border"
                          style={{
                            color: card.item.color,
                            borderColor: `${card.item.color}55`,
                            background: `${card.item.color}18`,
                          }}
                        >
                          {card.item.role}
                        </span>
                        <span className="text-[8px] font-mono text-gray-400 uppercase truncate max-w-[50px]">
                          {card.item.category}
                        </span>
                      </div>

                      {/* Ilustración Realista Focal */}
                      <div className="flex-1 flex flex-col items-center justify-center my-1 relative overflow-hidden rounded-xl">
                        <div
                          className="absolute inset-2 rounded-xl blur-lg opacity-30"
                          style={{ background: card.item.color }}
                        />
                        <RealisticPairEmblem iconType={card.item.iconType} color={card.item.color} />
                      </div>

                      {/* Pie de Carta: Título Nítido y Lore Breve */}
                      <div className="text-center pt-1 border-t border-white/10">
                        <h4
                          className="font-black text-xs sm:text-sm tracking-wider uppercase truncate"
                          style={{ color: card.item.color }}
                        >
                          {card.item.name}
                        </h4>
                        <p className="text-[9px] font-mono text-gray-400 truncate">
                          {card.item.relation}
                        </p>
                      </div>

                      {/* Badge de Selección (1, 2) */}
                      {isSelected && !card.isMatched && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-400 text-black font-black font-mono text-xs flex items-center justify-center shadow-lg"
                        >
                          {selectionOrder}
                        </motion.div>
                      )}

                      {/* Sello de Pareja Resuelta */}
                      {card.isMatched && (
                        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 drop-shadow" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Pie Informativo ─────────────────────────────────────────────────── */}
      <footer className="px-4 py-2 relative z-20 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-white/5 bg-black/30 backdrop-blur-sm">
        <span>CONECTA LAS 2 CARTAS CON RELACIÓN DIRECTA DE CAUSA, ORIGEN O HÁBITAT</span>
        <span>MODO PAREJAS · MEMORIZE EVOLUTIVO</span>
      </footer>

      {/* ── Modal de Victoria / Final del Nivel ──────────────────────────────── */}
      <AnimatePresence>
        {phase === "victory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.88, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gradient-to-br from-[#071322] via-[#050D18] to-[#02050E] p-6 sm:p-8 rounded-3xl border-2 border-emerald-400/60 max-w-md w-full shadow-[0_0_80px_rgba(16,185,129,0.3)] text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <Award className="w-9 h-9 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-1 bg-gradient-to-r from-emerald-300 via-white to-teal-300 bg-clip-text text-transparent">
                ¡CONEXIONES COMPLETADAS!
              </h2>
              <p className="text-xs font-mono text-gray-400 mb-6">
                Todas las relaciones conceptuales fueron sincronizadas con éxito
              </p>

              {/* Estadísticas de la Partida */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 block mb-0.5">Precisión</span>
                  <span className="font-mono text-lg font-black text-emerald-400">{accuracy}%</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 block mb-0.5">Racha Máx</span>
                  <span className="font-mono text-lg font-black text-amber-400">{maxCombo}x</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-[10px] font-mono text-gray-400 block mb-0.5">Tiempo Bonus</span>
                  <span className="font-mono text-lg font-black text-blue-400">+{Math.max(0, timeLeft * 15)}</span>
                </div>
              </div>

              {/* Puntuación Obtenida */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-6 backdrop-blur-sm">
                <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 block mb-1">
                  Puntuación Obtenida
                </span>
                <span className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">
                  {score.toLocaleString()}
                </span>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    initializeGame();
                    setTimeLeft(85);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-mono text-xs font-black tracking-wider uppercase bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Jugar de Nuevo</span>
                </button>

                <button
                  onClick={onComplete || onBackToMenu}
                  className="py-3 px-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Home className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
