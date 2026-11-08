import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Brain, Zap, Target, Award, Clock, Sparkles,
  Volume2, VolumeX, Eye, Snowflake, RotateCcw, Home, CheckCircle2,
  Layers, Flame, ArrowRight, ChevronRight
} from "lucide-react";
import type { Universe } from '../App';
import { ParticleExplosion, FreezeOverlay } from './ClassicEffects';
import { InGameCompanionWidget } from './InGameCompanionWidget';

export type ModoTriada = 'ecosistema' | 'tecnologia' | 'elementos' | 'naturaleza' | 'ciencia' | 'humano';

interface TriadasConexionesProps {
  universe?: Universe;
  modo: ModoTriada;
  onComplete: () => void;
  onBackToMenu: () => void;
  level?: number;
}

export interface TriadCardItem {
  id: string;
  name: string;
  step: 1 | 2 | 3;
  stepName: string;
  category: string;
  color: string;
  glow: string;
  bgGradient: string;
  iconType: string;
  lore: string;
  imageSrc?: string;
}

export interface TriadGroupDef {
  id: number;
  name: string;
  themeColor: string;
  chainTitle: string;
  chainDescription: string;
  items: [TriadCardItem, TriadCardItem, TriadCardItem];
}

interface InGameCard {
  uniqueId: string;
  triadId: number;
  triadName: string;
  triadThemeColor: string;
  chainTitle: string;
  chainDescription: string;
  chainSteps: { step: number; name: string; stepName: string; imageSrc?: string }[];
  item: TriadCardItem;
  totalStepsInGroup: number;
  isFlipped: boolean;
  isMatched: boolean;
  isHinted?: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
   Audio Synthesizer Engine para el Modo Tríadas (Armonías de 3 notas)
   ────────────────────────────────────────────────────────────────────────── */
class TriadsAudio {
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
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.05);
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
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  playPairMatch() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Acorde armónico de 2 notas brillantes (Do y Sol)
      const freqs = [523.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.14, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.45);
      });
    } catch {}
  }

  playTriadMatch() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Tríada Mayor Arpegiada Armónica (Do, Mi, Sol, Do alto)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
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
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.14);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
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
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  /* ── Capa Sonora Temática Inmersiva (Fuego, Agua, Tecnología, Viento, etc.) ── */
  playThematicSfx(triadId: number) {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      // 1. Fuego y Magma (Ciclo Ígneo, Forja de Montaña, Metalurgia)
      if (triadId === 5 || triadId === 201 || triadId === 401) {
        this.sfxFireCrackles(ctx);
      }
      // 2. Océano, Agua y Lluvia (Ciclo Hidrológico, Ciclo Glaciar)
      else if (triadId === 3 || triadId === 202) {
        this.sfxWaterDroplets(ctx);
      }
      // 3. Tecnología y Chiptune Retro-Futurista (Evolución Robótica, Red, Generación, Nanomedicina, Cuántica, Colisionador, Espacio)
      else if ([101, 102, 103, 104, 105, 304, 405].includes(triadId)) {
        this.sfxTechLaserSynth(ctx);
      }
      // 4. Viento y Tormenta Eléctrica (Ciclo Eólico, Ciclo Fulgurante)
      else if (triadId === 204 || triadId === 205) {
        this.sfxWindAndLightning(ctx);
      }
      // 5. Naturaleza, Vida y Polinización (Ciclo Solar, Danza Polinizadora, Metamorfosis, Agricultura)
      else if ([1, 2, 4, 402].includes(triadId)) {
        this.sfxOrganicChimes(ctx);
      }
      // 6. Tierra y Monolito Tectónico (Ciclo Telúrico)
      else if (triadId === 203) {
        this.sfxEarthquakeRumble(ctx);
      }
      // 7. Ciencia, Genética y Fusión Cósmica
      else {
        this.sfxCosmicResonance(ctx);
      }
    } catch {}
  }

  /* Sfx 1: Crepitar de fuego, brasas y soplido térmico */
  private sfxFireCrackles(ctx: AudioContext) {
    const now = ctx.currentTime;

    // Soplido térmico grave (whoosh de calor)
    const whooshOsc = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    const whooshFilter = ctx.createBiquadFilter();
    whooshOsc.type = "sawtooth";
    whooshOsc.frequency.setValueAtTime(120, now);
    whooshOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    whooshFilter.type = "lowpass";
    whooshFilter.frequency.setValueAtTime(260, now);
    whooshGain.gain.setValueAtTime(0.09, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    whooshOsc.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    whooshOsc.start(now);
    whooshOsc.stop(now + 0.35);

    // Micro-chispas crepitantes aleatorias (pop-pop-crackle)
    const sparks = [0.03, 0.08, 0.14, 0.21, 0.29];
    sparks.forEach((offset, i) => {
      const sparkOsc = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      const sparkFilter = ctx.createBiquadFilter();
      sparkOsc.type = "square";
      sparkOsc.frequency.setValueAtTime(1400 + (i % 3) * 600, now + offset);
      sparkFilter.type = "bandpass";
      sparkFilter.frequency.setValueAtTime(1800, now + offset);
      sparkFilter.Q.value = 5;
      sparkGain.gain.setValueAtTime(0.06, now + offset);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.025);
      sparkOsc.connect(sparkFilter);
      sparkFilter.connect(sparkGain);
      sparkGain.connect(ctx.destination);
      sparkOsc.start(now + offset);
      sparkOsc.stop(now + offset + 0.03);
    });
  }

  /* Sfx 2: Eco cristalino de gotas de agua descendiendo en estanque */
  private sfxWaterDroplets(ctx: AudioContext) {
    const now = ctx.currentTime;
    const droplets = [
      { delay: 0.02, startFreq: 1850, endFreq: 640 },
      { delay: 0.12, startFreq: 2280, endFreq: 790 },
      { delay: 0.24, startFreq: 1540, endFreq: 520 },
    ];

    droplets.forEach((d) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(d.startFreq, now + d.delay);
      osc.frequency.exponentialRampToValueAtTime(d.endFreq, now + d.delay + 0.07);
      gain.gain.setValueAtTime(0.12, now + d.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d.delay + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + d.delay);
      osc.stop(now + d.delay + 0.18);
    });

    // Resonancia acuática cavernosa de fondo
    const caveOsc = ctx.createOscillator();
    const caveGain = ctx.createGain();
    caveOsc.type = "sine";
    caveOsc.frequency.setValueAtTime(520, now + 0.05);
    caveGain.gain.setValueAtTime(0.05, now + 0.05);
    caveGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    caveOsc.connect(caveGain);
    caveGain.connect(ctx.destination);
    caveOsc.start(now + 0.05);
    caveOsc.stop(now + 0.55);
  }

  /* Sfx 3: Destello de sintetizador retro-futurista (Chiptune / Cyber beam) */
  private sfxTechLaserSynth(ctx: AudioContext) {
    const now = ctx.currentTime;
    // Arpegio ascendente hiperveloz de 5 notas
    const notes = [659.25, 880, 1174.66, 1760, 2637.02];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const t = now + i * 0.035;

      osc.type = i % 2 === 0 ? "sawtooth" : "square";
      osc.frequency.setValueAtTime(freq, t);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, t);
      filter.frequency.exponentialRampToValueAtTime(8000, t + 0.06);
      filter.Q.value = 6;

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    });

    // Sub-láser de barrido cuántico
    const laserOsc = ctx.createOscillator();
    const laserGain = ctx.createGain();
    laserOsc.type = "triangle";
    laserOsc.frequency.setValueAtTime(950, now + 0.08);
    laserOsc.frequency.exponentialRampToValueAtTime(220, now + 0.32);
    laserGain.gain.setValueAtTime(0.08, now + 0.08);
    laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    laserOsc.connect(laserGain);
    laserGain.connect(ctx.destination);
    laserOsc.start(now + 0.08);
    laserOsc.stop(now + 0.32);
  }

  /* Sfx 4: Silbido de viento y descarga eléctrica sutil */
  private sfxWindAndLightning(ctx: AudioContext) {
    const now = ctx.currentTime;
    // Ráfaga de aire envolvente
    const windOsc = ctx.createOscillator();
    const windGain = ctx.createGain();
    const windFilter = ctx.createBiquadFilter();
    windOsc.type = "sawtooth";
    windOsc.frequency.setValueAtTime(280, now);
    windOsc.frequency.linearRampToValueAtTime(740, now + 0.18);
    windOsc.frequency.linearRampToValueAtTime(320, now + 0.38);
    windFilter.type = "bandpass";
    windFilter.frequency.setValueAtTime(650, now);
    windFilter.Q.value = 3;
    windGain.gain.setValueAtTime(0.07, now);
    windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    windOsc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(ctx.destination);
    windOsc.start(now);
    windOsc.stop(now + 0.4);

    // Chispazo electrostático agudo
    const spark = ctx.createOscillator();
    const sparkGain = ctx.createGain();
    spark.type = "sawtooth";
    spark.frequency.setValueAtTime(2200, now + 0.06);
    spark.frequency.exponentialRampToValueAtTime(140, now + 0.14);
    sparkGain.gain.setValueAtTime(0.08, now + 0.06);
    sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    spark.connect(sparkGain);
    sparkGain.connect(ctx.destination);
    spark.start(now + 0.06);
    spark.stop(now + 0.14);
  }

  /* Sfx 5: Campanillas orgánicas de bosque y vida */
  private sfxOrganicChimes(ctx: AudioContext) {
    const now = ctx.currentTime;
    const chimes = [1046.5, 1318.51, 1567.98, 2093.0];
    chimes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.045;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  /* Sfx 6: Resonancia telúrica y sacudida sísmica */
  private sfxEarthquakeRumble(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.38);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  /* Sfx 7: Resonancia cósmica y armónicos estelares */
  private sfxCosmicResonance(ctx: AudioContext) {
    const now = ctx.currentTime;
    const freqs = [392.0, 587.33, 880.0, 1396.91];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.05;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.48);
    });
  }
}

const audio = new TriadsAudio();

/* ──────────────────────────────────────────────────────────────────────────
   Catálogo de Tríadas Realistas, Distintas y Reconocibles a Primera Vista
   ────────────────────────────────────────────────────────────────────────── */
const TRIADS_CATALOG: Record<string, TriadGroupDef[]> = {
  ecosistema: [
    {
      id: 1,
      name: "El Ciclo Solar",
      themeColor: "#FF7A00",
      chainTitle: "Sol → Semilla → Árbol",
      chainDescription: "El Sol nutre la Semilla que germina en Árbol Ancestral",
      items: [
        {
          id: "eco-sol",
          name: "Sol Primigenio",
          step: 1,
          stepName: "Energía Solar",
          category: "Ecosistema",
          color: "#FF7A00",
          glow: "rgba(255, 122, 0, 0.5)",
          bgGradient: "from-amber-600 via-orange-600 to-red-600",
          iconType: "sol",
          lore: "Radiación cósmica que activa el despertar biológico",
          imageSrc: "/cards/triads/eco-sol.webp",
        },
        {
          id: "eco-semilla",
          name: "Semilla Lumínica",
          step: 2,
          stepName: "Brote Vivo",
          category: "Ecosistema",
          color: "#10B981",
          glow: "rgba(16, 185, 129, 0.5)",
          bgGradient: "from-emerald-600 via-green-600 to-teal-700",
          iconType: "semilla",
          lore: "Brote con rocío que canaliza la luz hacia el suelo fértil",
          imageSrc: "/cards/triads/eco-semilla.webp",
        },
        {
          id: "eco-arbol",
          name: "Árbol Ancestral",
          step: 3,
          stepName: "Culminación",
          category: "Ecosistema",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.5)",
          bgGradient: "from-sky-600 via-indigo-600 to-purple-800",
          iconType: "arbol",
          lore: "Árbol sagrado cuyas raíces sostienen la vida del ecosistema",
          imageSrc: "/cards/triads/eco-arbol.webp",
        },
      ],
    },
    {
      id: 2,
      name: "Danza Polinizadora",
      themeColor: "#EAB308",
      chainTitle: "Abeja → Flor → Miel",
      chainDescription: "La Abeja poliniza la Flor para destilar el Néctar Dorado",
      items: [
        {
          id: "eco-abeja",
          name: "Abeja Centinela",
          step: 1,
          stepName: "Recolectora",
          category: "Ecosistema",
          color: "#EAB308",
          glow: "rgba(234, 179, 8, 0.5)",
          bgGradient: "from-yellow-600 via-amber-600 to-orange-700",
          iconType: "abeja",
          lore: "Portadora del polen estelar entre los valles vivos",
          imageSrc: "/cards/triads/eco-abeja.webp",
        },
        {
          id: "eco-flor",
          name: "Flor de Loto",
          step: 2,
          stepName: "Floración",
          category: "Ecosistema",
          color: "#EC4899",
          glow: "rgba(236, 72, 153, 0.5)",
          bgGradient: "from-pink-600 via-rose-600 to-red-700",
          iconType: "flor",
          lore: "Pétalos de éter que se abren con la luz del amanecer",
          imageSrc: "/cards/triads/eco-flor.webp",
        },
        {
          id: "eco-miel",
          name: "Néctar Dorado",
          step: 3,
          stepName: "Esencia Pura",
          category: "Ecosistema",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.5)",
          bgGradient: "from-amber-500 via-yellow-600 to-orange-600",
          iconType: "miel",
          lore: "Elixir ámbar concentrado con propiedades revitalizantes",
          imageSrc: "/cards/triads/eco-miel.webp",
        },
      ],
    },
    {
      id: 3,
      name: "Ciclo Hidrológico",
      themeColor: "#06B6D4",
      chainTitle: "Nube → Gota → Océano",
      chainDescription: "El Vapor condensa en Gota para alimentar el Gran Océano",
      items: [
        {
          id: "eco-nube",
          name: "Vapor Celeste",
          step: 1,
          stepName: "Condensación",
          category: "Ecosistema",
          color: "#60A5FA",
          glow: "rgba(96, 165, 250, 0.5)",
          bgGradient: "from-blue-500 via-sky-600 to-indigo-700",
          iconType: "nube",
          lore: "Bruma en las alturas cargada de rocío atmosférico",
          imageSrc: "/cards/triads/eco-nube.webp",
        },
        {
          id: "eco-gota",
          name: "Gota de Cristal",
          step: 2,
          stepName: "Precipitación",
          category: "Ecosistema",
          color: "#06B6D4",
          glow: "rgba(6, 182, 212, 0.5)",
          bgGradient: "from-cyan-500 via-teal-600 to-blue-700",
          iconType: "gota",
          lore: "Lágrima pura de agua que desciende fertilizando el valle",
          imageSrc: "/cards/triads/eco-gota.webp",
        },
        {
          id: "eco-oceano",
          name: "Abismo Marino",
          step: 3,
          stepName: "Masa Oceánica",
          category: "Ecosistema",
          color: "#3B82F6",
          glow: "rgba(59, 130, 246, 0.5)",
          bgGradient: "from-blue-700 via-indigo-900 to-slate-950",
          iconType: "oceano",
          lore: "El inmenso mar donde confluyen todos los afluentes",
          imageSrc: "/cards/triads/eco-oceano.webp",
        },
      ],
    },
    {
      id: 4,
      name: "La Metamorfosis",
      themeColor: "#818CF8",
      chainTitle: "Huevo → Oruga → Mariposa",
      chainDescription: "El Huevo eclosiona en Oruga y metamorfosea en Mariposa Astral",
      items: [
        {
          id: "eco-huevo",
          name: "Huevo de Jade",
          step: 1,
          stepName: "Génesis",
          category: "Ecosistema",
          color: "#A3E635",
          glow: "rgba(163, 230, 53, 0.5)",
          bgGradient: "from-lime-500 via-emerald-600 to-green-700",
          iconType: "huevo",
          lore: "Cápsula embrionaria protegida por resina vegetal",
          imageSrc: "/cards/triads/eco-huevo.webp",
        },
        {
          id: "eco-oruga",
          name: "Oruga de Musgo",
          step: 2,
          stepName: "Crecimiento",
          category: "Ecosistema",
          color: "#10B981",
          glow: "rgba(16, 185, 129, 0.5)",
          bgGradient: "from-emerald-500 via-teal-600 to-green-800",
          iconType: "oruga",
          lore: "Ser voraz que acumula la esencia verde del bosque",
          imageSrc: "/cards/triads/eco-oruga.webp",
        },
        {
          id: "eco-mariposa",
          name: "Mariposa Astral",
          step: 3,
          stepName: "Vuelo Supremo",
          category: "Ecosistema",
          color: "#818CF8",
          glow: "rgba(129, 140, 248, 0.5)",
          bgGradient: "from-indigo-500 via-purple-600 to-pink-700",
          iconType: "mariposa",
          lore: "Alas tornasoladas que surcan las corrientes de energía",
          imageSrc: "/cards/triads/eco-mariposa.webp",
        },
      ],
    },
    {
      id: 5,
      name: "La Forja de Montaña",
      themeColor: "#EF4444",
      chainTitle: "Magma → Obsidiana → Montaña",
      chainDescription: "El Magma funde la Obsidiana que levanta el Pico Rocoso",
      items: [
        {
          id: "eco-magma",
          name: "Caldera de Magma",
          step: 1,
          stepName: "Fusión",
          category: "Ecosistema",
          color: "#EF4444",
          glow: "rgba(239, 68, 68, 0.5)",
          bgGradient: "from-red-600 via-orange-600 to-amber-700",
          iconType: "magma",
          lore: "Fuego fundido en el corazón geológico de la tierra",
          imageSrc: "/cards/triads/eco-magma.webp",
        },
        {
          id: "eco-obsidiana",
          name: "Bloque Obsidiana",
          step: 2,
          stepName: "Cristalización",
          category: "Ecosistema",
          color: "#71717A",
          glow: "rgba(113, 113, 122, 0.5)",
          bgGradient: "from-zinc-700 via-stone-800 to-black",
          iconType: "obsidiana",
          lore: "Vidrio volcánico negro afilado y templado bajo presión",
          imageSrc: "/cards/triads/eco-obsidiana.webp",
        },
        {
          id: "eco-montana",
          name: "Pico Volcánico",
          step: 3,
          stepName: "Monolito",
          category: "Ecosistema",
          color: "#D97706",
          glow: "rgba(217, 119, 6, 0.5)",
          bgGradient: "from-amber-700 via-stone-800 to-stone-950",
          iconType: "montana",
          lore: "Cumbre colosal que corona el horizonte telúrico",
          imageSrc: "/cards/triads/eco-montana.webp",
        },
      ],
    },
  ],
  tecnologia: [
    {
      id: 101,
      name: "Evolución Robótica",
      themeColor: "#00F0FF",
      chainTitle: "Chip → Núcleo → Androide",
      chainDescription: "El Chip procesa el Núcleo de Plasma para animar al Androide",
      items: [
        {
          id: "tec-chip",
          name: "Procesador Chip",
          step: 1,
          stepName: "Cálculo Lógico",
          category: "Tecnología",
          color: "#00F0FF",
          glow: "rgba(0, 240, 255, 0.5)",
          bgGradient: "from-cyan-600 via-blue-600 to-slate-900",
          iconType: "chip",
          lore: "Microcircuito de silicio y oro con 100 teraflops de cálculo",
          imageSrc: "/cards/triads/tec-chip.webp",
        },
        {
          id: "tec-nucleo",
          name: "Núcleo de Plasma",
          step: 2,
          stepName: "Batería de Poder",
          category: "Tecnología",
          color: "#EC4899",
          glow: "rgba(236, 72, 153, 0.5)",
          bgGradient: "from-fuchsia-600 via-pink-600 to-purple-900",
          iconType: "nucleo",
          lore: "Cámara sellada de acero que contiene arcos voltaicos púrpuras",
          imageSrc: "/cards/triads/tec-nucleo.webp",
        },
        {
          id: "tec-androide",
          name: "Androide Centinela",
          step: 3,
          stepName: "Autonomía",
          category: "Tecnología",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.5)",
          bgGradient: "from-amber-500 via-orange-600 to-slate-900",
          iconType: "androide",
          lore: "Chasis biónico de titanio cromado con visor óptico guiado",
          imageSrc: "/cards/triads/tec-androide.webp",
        },
      ],
    },
    {
      id: 102,
      name: "Enlace Orbital",
      themeColor: "#8B5CF6",
      chainTitle: "Antena → Satélite → Red Global",
      chainDescription: "La Antena emite a la Sonda Orbital que conecta la Red Global",
      items: [
        {
          id: "tec-antena",
          name: "Emisor Terrestre",
          step: 1,
          stepName: "Transmisión",
          category: "Tecnología",
          color: "#8B5CF6",
          glow: "rgba(139, 92, 246, 0.5)",
          bgGradient: "from-violet-600 via-purple-600 to-slate-900",
          iconType: "antena",
          lore: "Torre parabólica que dispara ondas microondas hacia el cielo",
          imageSrc: "/cards/triads/tec-antena.webp",
        },
        {
          id: "tec-satelite",
          name: "Sonda Orbital",
          step: 2,
          stepName: "Relevo Espacial",
          category: "Tecnología",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.5)",
          bgGradient: "from-sky-500 via-blue-600 to-indigo-900",
          iconType: "satelite",
          lore: "Satélite con paneles solares desplegados en órbita geoestacionaria",
          imageSrc: "/cards/triads/tec-satelite.webp",
        },
        {
          id: "tec-red",
          name: "Malla Planetaria",
          step: 3,
          stepName: "Interconexión",
          category: "Tecnología",
          color: "#10B981",
          glow: "rgba(16, 185, 129, 0.5)",
          bgGradient: "from-emerald-500 via-teal-600 to-cyan-900",
          iconType: "red",
          lore: "Capa de hiperconexión cuántica que une a toda la civilización",
          imageSrc: "/cards/triads/tec-red.webp",
        },
      ],
    },
    {
      id: 103,
      name: "Generación Eléctrica",
      themeColor: "#FBBF24",
      chainTitle: "Chispa → Célula → Relámpago",
      chainDescription: "La Idea enciende la Batería que desata el Rayo de Fusión",
      items: [
        {
          id: "tec-idea",
          name: "Chispa Conceptual",
          step: 1,
          stepName: "Invención",
          category: "Tecnología",
          color: "#FBBF24",
          glow: "rgba(251, 191, 36, 0.5)",
          bgGradient: "from-yellow-500 via-amber-600 to-orange-700",
          iconType: "idea",
          lore: "Filamento incandescente de tungsteno en burbuja de cuarzo",
          imageSrc: "/cards/triads/tec-idea.webp",
        },
        {
          id: "tec-bateria",
          name: "Célula de Fusión",
          step: 2,
          stepName: "Acumulación",
          category: "Tecnología",
          color: "#3B82F6",
          glow: "rgba(59, 130, 246, 0.5)",
          bgGradient: "from-blue-600 via-indigo-600 to-slate-900",
          iconType: "bateria",
          lore: "Bloque de grafeno de alta densidad que almacena gigavatios",
          imageSrc: "/cards/triads/tec-bateria.webp",
        },
        {
          id: "tec-rayo",
          name: "Haz de Plasma",
          step: 3,
          stepName: "Descarga",
          category: "Tecnología",
          color: "#06B6D4",
          glow: "rgba(6, 182, 212, 0.5)",
          bgGradient: "from-cyan-400 via-teal-500 to-blue-800",
          iconType: "rayo",
          lore: "Arco de plasma relampagueante que canaliza energía infinita",
          imageSrc: "/cards/triads/tec-rayo.webp",
        },
      ],
    },
    {
      id: 104,
      name: "Síntesis Nanomédica",
      themeColor: "#A855F7",
      chainTitle: "Microscopio → Probeta → Nanomedicina",
      chainDescription: "El Microscopio examina la Solución para sintetizar la Cura",
      items: [
        {
          id: "tec-microscopio",
          name: "Lente Óptico",
          step: 1,
          stepName: "Inspección",
          category: "Tecnología",
          color: "#06B6D4",
          glow: "rgba(6, 182, 212, 0.5)",
          bgGradient: "from-cyan-600 via-sky-600 to-blue-900",
          iconType: "microscopio",
          lore: "Óptica de haz de electrones para visualizar estructuras moleculares",
          imageSrc: "/cards/triads/tec-microscopio.webp",
        },
        {
          id: "tec-tubo",
          name: "Solución Química",
          step: 2,
          stepName: "Reacción",
          category: "Tecnología",
          color: "#A855F7",
          glow: "rgba(168, 85, 247, 0.5)",
          bgGradient: "from-purple-600 via-fuchsia-600 to-indigo-900",
          iconType: "tubo",
          lore: "Compuesto bioluminiscente en tubo de borosilicato sellado",
          imageSrc: "/cards/triads/tec-tubo.webp",
        },
        {
          id: "tec-medicina",
          name: "Cápsula Regenerativa",
          step: 3,
          stepName: "Tratamiento",
          category: "Tecnología",
          color: "#E11D48",
          glow: "rgba(225, 29, 72, 0.5)",
          bgGradient: "from-rose-600 via-red-600 to-pink-900",
          iconType: "medicina",
          lore: "Nanobots encapsulados capaces de reconstruir tejido celular",
          imageSrc: "/cards/triads/tec-medicina.webp",
        },
      ],
    },
    {
      id: 105,
      name: "Inteligencia Cuántica",
      themeColor: "#38BDF8",
      chainTitle: "Qubit → Matriz → Singularidad",
      chainDescription: "El Qubit procesa en la Matriz para despertar la Singularidad Digital",
      items: [
        {
          id: "tec-qubit",
          name: "Qubit Cuántico",
          step: 1,
          stepName: "Superposición",
          category: "Tecnología",
          color: "#06B6D4",
          glow: "rgba(6, 182, 212, 0.5)",
          bgGradient: "from-cyan-500 via-sky-600 to-blue-900",
          iconType: "chip",
          lore: "Partícula subatómica en superposición de estados infinitos",
          imageSrc: "/cards/triads/tec-qubit.webp",
        },
        {
          id: "tec-servidor",
          name: "Matriz Cuántica",
          step: 2,
          stepName: "Procesamiento",
          category: "Tecnología",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.5)",
          bgGradient: "from-sky-600 via-indigo-700 to-slate-950",
          iconType: "red",
          lore: "Supercomputador refrigerado por helio que canaliza datos cuánticos",
          imageSrc: "/cards/triads/tec-servidor.webp",
        },
        {
          id: "tec-ia",
          name: "Singularidad Digital",
          step: 3,
          stepName: "Consciencia",
          category: "Tecnología",
          color: "#A855F7",
          glow: "rgba(168, 85, 247, 0.5)",
          bgGradient: "from-purple-600 via-violet-700 to-indigo-950",
          iconType: "androide",
          lore: "Consciencia sintética emergente que trasciende las dimensiones",
          imageSrc: "/cards/triads/tec-ia.webp",
        },
      ],
    },
  ],
  elementos: [
    {
      id: 201,
      name: "Ciclo Ígneo",
      themeColor: "#F97316",
      chainTitle: "Chispa → Llama → Vórtice Infernal",
      chainDescription: "La Chispa enciende la Llama que desata el Vórtice Infernal",
      items: [
        {
          id: "ele-chispa",
          name: "Chispa Volcánica",
          step: 1,
          stepName: "Ignición",
          category: "Elementos",
          color: "#F97316",
          glow: "rgba(249, 115, 22, 0.5)",
          bgGradient: "from-orange-500 via-amber-600 to-red-700",
          iconType: "magma",
          lore: "Microscópica chispa que desata la energía térmica primordial",
          imageSrc: "/cards/triads/ele-chispa.webp",
        },
        {
          id: "ele-llama",
          name: "Llama Eterna",
          step: 2,
          stepName: "Combustión",
          category: "Elementos",
          color: "#EF4444",
          glow: "rgba(239, 68, 68, 0.5)",
          bgGradient: "from-red-500 via-rose-600 to-orange-700",
          iconType: "magma",
          lore: "Fuego inextinguible guardado en los santuarios telúricos",
          imageSrc: "/cards/triads/ele-llama.webp",
        },
        {
          id: "ele-inferno",
          name: "Vórtice Infernal",
          step: 3,
          stepName: "Cataclismo",
          category: "Elementos",
          color: "#DC2626",
          glow: "rgba(220, 38, 38, 0.6)",
          bgGradient: "from-red-600 via-red-800 to-slate-950",
          iconType: "magma",
          lore: "Torrente de magma y fuego primordial que purifica la tierra",
          imageSrc: "/cards/triads/ele-inferno.webp",
        },
      ],
    },
    {
      id: 202,
      name: "Ciclo Glaciar",
      themeColor: "#38BDF8",
      chainTitle: "Escarcha → Glaciar → Ventisca Boreal",
      chainDescription: "La Escarcha coagula en Glaciar para desatar la Ventisca Boreal",
      items: [
        {
          id: "ele-escarcha",
          name: "Brote de Escarcha",
          step: 1,
          stepName: "Congelación",
          category: "Elementos",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.5)",
          bgGradient: "from-sky-400 via-blue-500 to-indigo-800",
          iconType: "gota",
          lore: "Agujas de hielo cristalino que detienen el fluir del tiempo",
          imageSrc: "/cards/triads/ele-escarcha.webp",
        },
        {
          id: "ele-glaciar",
          name: "Monolito Glaciar",
          step: 2,
          stepName: "Cristalización",
          category: "Elementos",
          color: "#06B6D4",
          glow: "rgba(6, 182, 212, 0.5)",
          bgGradient: "from-cyan-500 via-teal-600 to-slate-900",
          iconType: "gota",
          lore: "Estructura milenaria de hielo puro templada en el abismo polar",
          imageSrc: "/cards/triads/ele-glaciar.webp",
        },
        {
          id: "ele-tempestad-hielo",
          name: "Ventisca Boreal",
          step: 3,
          stepName: "Cero Absoluto",
          category: "Elementos",
          color: "#6366F1",
          glow: "rgba(99, 102, 241, 0.6)",
          bgGradient: "from-indigo-500 via-blue-700 to-slate-950",
          iconType: "gota",
          lore: "Tormenta ártica que envuelve el mundo en silencio eterno",
          imageSrc: "/cards/triads/ele-tempestad-hielo.webp",
        },
      ],
    },
    {
      id: 203,
      name: "Ciclo Telúrico",
      themeColor: "#F59E0B",
      chainTitle: "Polvo → Monolito → Titán Tectónico",
      chainDescription: "El Polvo sedimenta en Monolito hasta despertar al Titán Tectónico",
      items: [
        {
          id: "ele-arena",
          name: "Polvo de Basalto",
          step: 1,
          stepName: "Erosión",
          category: "Elementos",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.5)",
          bgGradient: "from-amber-400 via-yellow-600 to-stone-800",
          iconType: "montana",
          lore: "Arenas doradas cargadas de microcristales de cuarzo",
          imageSrc: "/cards/triads/ele-arena.webp",
        },
        {
          id: "ele-roca",
          name: "Monolito Rúnico",
          step: 2,
          stepName: "Cohesión",
          category: "Elementos",
          color: "#78716C",
          glow: "rgba(120, 113, 108, 0.5)",
          bgGradient: "from-stone-400 via-stone-600 to-stone-900",
          iconType: "montana",
          lore: "Piedra milenaria que resistió el embate de las eras",
          imageSrc: "/cards/triads/ele-roca.webp",
        },
        {
          id: "ele-coloso-tierra",
          name: "Titán Tectónico",
          step: 3,
          stepName: "Despertar",
          category: "Elementos",
          color: "#10B981",
          glow: "rgba(16, 185, 129, 0.6)",
          bgGradient: "from-emerald-600 via-stone-700 to-stone-950",
          iconType: "montana",
          lore: "Coloso telúrico que mueve las placas continentales al despertar",
          imageSrc: "/cards/triads/ele-coloso-tierra.webp",
        },
      ],
    },
    {
      id: 204,
      name: "Ciclo Eólico",
      themeColor: "#2DD4BF",
      chainTitle: "Brisa → Vórtice → Tifón Celestial",
      chainDescription: "La Brisa arrecia en Vórtice hasta convertirse en Tifón Celestial",
      items: [
        {
          id: "ele-brisa",
          name: "Brisa Susurrante",
          step: 1,
          stepName: "Corriente",
          category: "Elementos",
          color: "#A7F3D0",
          glow: "rgba(167, 243, 208, 0.5)",
          bgGradient: "from-teal-300 via-emerald-500 to-cyan-800",
          iconType: "nube",
          lore: "Viento sutil que transporta el aliento de los bosques primigenios",
          imageSrc: "/cards/triads/ele-brisa.webp",
        },
        {
          id: "ele-torbellino",
          name: "Vórtice Espiral",
          step: 2,
          stepName: "Aceleración",
          category: "Elementos",
          color: "#2DD4BF",
          glow: "rgba(45, 212, 191, 0.5)",
          bgGradient: "from-teal-400 via-cyan-600 to-slate-900",
          iconType: "nube",
          lore: "Fuerza centrífuga que alza los secretos de la tierra al firmamento",
          imageSrc: "/cards/triads/ele-torbellino.webp",
        },
        {
          id: "ele-tifon",
          name: "Tifón Celestial",
          step: 3,
          stepName: "Tempestad",
          category: "Elementos",
          color: "#0EA5E9",
          glow: "rgba(14, 165, 233, 0.6)",
          bgGradient: "from-sky-500 via-blue-700 to-slate-950",
          iconType: "nube",
          lore: "Ciclón devastador que domina la atmósfera planetaria",
          imageSrc: "/cards/triads/ele-tifon.webp",
        },
      ],
    },
    {
      id: 205,
      name: "Ciclo Fulgurante",
      themeColor: "#818CF8",
      chainTitle: "Ion → Centella → Ira del Trueno",
      chainDescription: "El Ion acumula carga en Centella y desata la Ira del Trueno",
      items: [
        {
          id: "ele-carga",
          name: "Ion Atmosférico",
          step: 1,
          stepName: "Polaridad",
          category: "Elementos",
          color: "#C084FC",
          glow: "rgba(192, 132, 252, 0.5)",
          bgGradient: "from-purple-400 via-violet-600 to-indigo-900",
          iconType: "rayo",
          lore: "Diferencia de potencial que preludia la caída del trueno",
          imageSrc: "/cards/triads/ele-carga.webp",
        },
        {
          id: "ele-centella",
          name: "Centella Espectral",
          step: 2,
          stepName: "Descarga",
          category: "Elementos",
          color: "#818CF8",
          glow: "rgba(129, 140, 248, 0.5)",
          bgGradient: "from-indigo-400 via-purple-600 to-slate-900",
          iconType: "rayo",
          lore: "Orbe de plasma relampagueante que desafía la gravedad",
          imageSrc: "/cards/triads/ele-centella.webp",
        },
        {
          id: "ele-trueno",
          name: "Ira del Trueno",
          step: 3,
          stepName: "Cataclismo",
          category: "Elementos",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.6)",
          bgGradient: "from-sky-400 via-indigo-600 to-slate-950",
          iconType: "rayo",
          lore: "Rayo maestro que desciende desde la estratósfera con furia cósmica",
          imageSrc: "/cards/triads/ele-trueno.webp",
        },
      ],
    },
  ],
  ciencia: [
    {
      id: 301,
      name: "Cosmología y Astrofísica",
      themeColor: "#38BDF8",
      chainTitle: "Lente → Protoestrella → Horizonte de Sucesos",
      chainDescription: "El Lente observa la Protoestrella en su camino a la Singularidad",
      items: [
        {
          id: "cie-lente",
          name: "Lente de Espacio Profundo",
          step: 1,
          stepName: "Observación",
          category: "Ciencia",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.5)",
          bgGradient: "from-sky-500 via-blue-600 to-indigo-900",
          iconType: "microscopio",
          lore: "Óptica de cuarzo y oro que penetra los confines del universo observable",
          imageSrc: "/cards/triads/cie-lente.webp",
        },
        {
          id: "cie-estrella",
          name: "Protoestrella",
          step: 2,
          stepName: "Ignición",
          category: "Ciencia",
          color: "#FBBF24",
          glow: "rgba(251, 191, 36, 0.5)",
          bgGradient: "from-amber-400 via-orange-600 to-purple-900",
          iconType: "sol",
          lore: "Nube de gas colapsando por gravedad en el núcleo de una nebulosa",
          imageSrc: "/cards/triads/cie-estrella.webp",
        },
        {
          id: "cie-agujero-negro",
          name: "Horizonte de Sucesos",
          step: 3,
          stepName: "Singularidad",
          category: "Ciencia",
          color: "#A855F7",
          glow: "rgba(168, 85, 247, 0.6)",
          bgGradient: "from-violet-600 via-purple-900 to-black",
          iconType: "chip",
          lore: "Abismo gravitacional donde el espaciotiempo colapsa irremediablemente",
          imageSrc: "/cards/triads/cie-agujero-negro.webp",
        },
      ],
    },
    {
      id: 302,
      name: "Química y Materia",
      themeColor: "#10B981",
      chainTitle: "Átomo → Red Molecular → Reacción Exotérmica",
      chainDescription: "El Átomo se enlaza en Molécula y transmuta en Reacción Exotérmica",
      items: [
        {
          id: "cie-atomo",
          name: "Átomo Cuántico",
          step: 1,
          stepName: "Estructura",
          category: "Ciencia",
          color: "#10B981",
          glow: "rgba(16, 185, 129, 0.5)",
          bgGradient: "from-emerald-400 via-teal-600 to-slate-900",
          iconType: "chip",
          lore: "Núcleo de protones orbitado por densas nubes de probabilidad electrónica",
          imageSrc: "/cards/triads/cie-atomo.webp",
        },
        {
          id: "cie-molecula",
          name: "Red Molecular",
          step: 2,
          stepName: "Enlace",
          category: "Ciencia",
          color: "#06B6D4",
          glow: "rgba(6, 182, 212, 0.5)",
          bgGradient: "from-cyan-500 via-sky-600 to-indigo-900",
          iconType: "tubo",
          lore: "Enrejado covalente que da origen a los compuestos fundamentales",
          imageSrc: "/cards/triads/cie-molecula.webp",
        },
        {
          id: "cie-reaccion",
          name: "Reacción Exotérmica",
          step: 3,
          stepName: "Transmutación",
          category: "Ciencia",
          color: "#EC4899",
          glow: "rgba(236, 72, 153, 0.6)",
          bgGradient: "from-pink-500 via-rose-600 to-purple-950",
          iconType: "tubo",
          lore: "Liberación explosiva de energía al reorganizarse los enlaces químicos",
          imageSrc: "/cards/triads/cie-reaccion.webp",
        },
      ],
    },
    {
      id: 303,
      name: "Genética y Evolución",
      themeColor: "#4ADE80",
      chainTitle: "Genoma → Célula Madre → Organismo Sintético",
      chainDescription: "El Genoma dirige la Célula Madre para sintetizar el Organismo Perfecto",
      items: [
        {
          id: "cie-adn",
          name: "Código Genómico",
          step: 1,
          stepName: "Información",
          category: "Ciencia",
          color: "#4ADE80",
          glow: "rgba(74, 222, 128, 0.5)",
          bgGradient: "from-green-400 via-emerald-600 to-teal-900",
          iconType: "semilla",
          lore: "Doble hélice con miles de millones de pares de bases que codifican la vida",
          imageSrc: "/cards/triads/cie-adn.webp",
        },
        {
          id: "cie-celula",
          name: "Célula Madre",
          step: 2,
          stepName: "Diferenciación",
          category: "Ciencia",
          color: "#22D3EE",
          glow: "rgba(34, 211, 238, 0.5)",
          bgGradient: "from-cyan-400 via-teal-600 to-slate-900",
          iconType: "huevo",
          lore: "Unidad biológica primordial capaz de especializarse en cualquier tejido",
          imageSrc: "/cards/triads/cie-celula.webp",
        },
        {
          id: "cie-organismo",
          name: "Organismo Bio-Sintético",
          step: 3,
          stepName: "Evolución",
          category: "Ciencia",
          color: "#F43F5E",
          glow: "rgba(244, 63, 94, 0.6)",
          bgGradient: "from-rose-500 via-pink-700 to-slate-950",
          iconType: "androide",
          lore: "Forma de vida rediseñada genéticamente para prosperar en otros mundos",
          imageSrc: "/cards/triads/cie-organismo.webp",
        },
      ],
    },
    {
      id: 304,
      name: "Física de Partículas",
      themeColor: "#A855F7",
      chainTitle: "Colisionador → Bosón → Antimateria",
      chainDescription: "El Colisionador revela el Bosón para cosechar Antimateria pura",
      items: [
        {
          id: "cie-colisionador",
          name: "Anillo de Hadrones",
          step: 1,
          stepName: "Aceleración",
          category: "Ciencia",
          color: "#64748B",
          glow: "rgba(100, 116, 139, 0.5)",
          bgGradient: "from-slate-500 via-stone-700 to-slate-950",
          iconType: "satelite",
          lore: "Túnel subterráneo criogénico que acelera partículas a velocidades relativistas",
          imageSrc: "/cards/triads/cie-colisionador.webp",
        },
        {
          id: "cie-boson",
          name: "Bosón Escalar",
          step: 2,
          stepName: "Masa",
          category: "Ciencia",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.5)",
          bgGradient: "from-amber-400 via-orange-600 to-slate-900",
          iconType: "rayo",
          lore: "Partícula mediadora del campo cuántico que otorga masa al universo",
          imageSrc: "/cards/triads/cie-boson.webp",
        },
        {
          id: "cie-antimateria",
          name: "Contenedor de Antimateria",
          step: 3,
          stepName: "Aniquilación",
          category: "Ciencia",
          color: "#D946EF",
          glow: "rgba(217, 70, 239, 0.6)",
          bgGradient: "from-fuchsia-500 via-purple-700 to-black",
          iconType: "nucleo",
          lore: "Trampa magnética que retiene antipartículas listas para liberar energía total",
          imageSrc: "/cards/triads/cie-antimateria.webp",
        },
      ],
    },
    {
      id: 305,
      name: "Energía y Fusión",
      themeColor: "#F97316",
      chainTitle: "Péndulo → Fusión Tokamak → Supernova",
      chainDescription: "El Péndulo estudia la entropía para dominar la Fusión y desatar la Supernova",
      items: [
        {
          id: "cie-termo",
          name: "Péndulo Entrópico",
          step: 1,
          stepName: "Equilibrio",
          category: "Ciencia",
          color: "#94A3B8",
          glow: "rgba(148, 163, 184, 0.5)",
          bgGradient: "from-slate-400 via-slate-600 to-slate-900",
          iconType: "idea",
          lore: "Mecanismo de precisión que ilustra las leyes inexorables de la termodinámica",
          imageSrc: "/cards/triads/cie-termo.webp",
        },
        {
          id: "cie-reactor-fusion",
          name: "Cámara Tokamak",
          step: 2,
          stepName: "Fusión",
          category: "Ciencia",
          color: "#3B82F6",
          glow: "rgba(59, 130, 246, 0.5)",
          bgGradient: "from-blue-500 via-cyan-600 to-indigo-950",
          iconType: "nucleo",
          lore: "Jaula magnética toroidal que confina plasma a 150 millones de grados",
          imageSrc: "/cards/triads/cie-reactor-fusion.webp",
        },
        {
          id: "cie-supernova",
          name: "Supernova Cósmica",
          step: 3,
          stepName: "Ignición Estelar",
          category: "Ciencia",
          color: "#F97316",
          glow: "rgba(249, 115, 22, 0.6)",
          bgGradient: "from-orange-500 via-red-600 to-purple-950",
          iconType: "sol",
          lore: "Colapso y explosión cataclísmica que esparce los elementos pesados por la galaxia",
          imageSrc: "/cards/triads/cie-supernova.webp",
        },
      ],
    },
  ],
  humano: [
    {
      id: 401,
      name: "Fuego y Metalurgia",
      themeColor: "#EA580C",
      chainTitle: "Pedernal → Hoguera → Forja de Bronce",
      chainDescription: "El Pedernal enciende la Hoguera y culmina en la Forja de Bronce",
      items: [
        {
          id: "hum-pedernal",
          name: "Pedernal y Chispa",
          step: 1,
          stepName: "Descubrimiento",
          category: "Civilización",
          color: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.5)",
          bgGradient: "from-amber-500 via-stone-700 to-stone-900",
          iconType: "idea",
          lore: "Primer golpe de piedra que iluminó las cavernas de la prehistoria",
          imageSrc: "/cards/triads/hum-pedernal.webp",
        },
        {
          id: "hum-hoguera",
          name: "Hoguera Tribal",
          step: 2,
          stepName: "Comunidad",
          category: "Civilización",
          color: "#EA580C",
          glow: "rgba(234, 88, 12, 0.5)",
          bgGradient: "from-orange-500 via-amber-700 to-stone-950",
          iconType: "magma",
          lore: "El centro del campamento donde nacieron los primeros mitos y canciones",
          imageSrc: "/cards/triads/hum-hoguera.webp",
        },
        {
          id: "hum-forja",
          name: "Forja de Bronce",
          step: 3,
          stepName: "Metalurgia",
          category: "Civilización",
          color: "#DC2626",
          glow: "rgba(220, 38, 38, 0.6)",
          bgGradient: "from-red-600 via-orange-800 to-stone-950",
          iconType: "magma",
          lore: "El fuego domesticado para doblegar el metal y forjar herramientas eternas",
          imageSrc: "/cards/triads/hum-forja.webp",
        },
      ],
    },
    {
      id: 402,
      name: "La Revolución Agrícola",
      themeColor: "#EAB308",
      chainTitle: "Hoz → Espiga Dorada → Ciudadela",
      chainDescription: "La Hoz cosecha la Espiga para levantar la gran Ciudadela Amurallada",
      items: [
        {
          id: "hum-hoz",
          name: "Hoz de Cosecha",
          step: 1,
          stepName: "Cultivo",
          category: "Civilización",
          color: "#84CC16",
          glow: "rgba(132, 204, 22, 0.5)",
          bgGradient: "from-lime-500 via-amber-600 to-stone-800",
          iconType: "semilla",
          lore: "Hoja afilada que permitió cosechar los campos fértiles del Neolítico",
          imageSrc: "/cards/triads/hum-hoz.webp",
        },
        {
          id: "hum-espiga",
          name: "Espiga Dorada",
          step: 2,
          stepName: "Abundancia",
          category: "Civilización",
          color: "#EAB308",
          glow: "rgba(234, 179, 8, 0.5)",
          bgGradient: "from-yellow-400 via-amber-600 to-stone-900",
          iconType: "flor",
          lore: "Trigo domesticado que transformó a los cazadores nómadas en agricultores",
          imageSrc: "/cards/triads/hum-espiga.webp",
        },
        {
          id: "hum-granero",
          name: "Ciudadela Amurallada",
          step: 3,
          stepName: "Sedentarismo",
          category: "Civilización",
          color: "#D97706",
          glow: "rgba(217, 119, 6, 0.6)",
          bgGradient: "from-amber-600 via-stone-700 to-stone-950",
          iconType: "montana",
          lore: "Primeros silos y murallas donde florecieron las ciudades más antiguas",
          imageSrc: "/cards/triads/hum-granero.webp",
        },
      ],
    },
    {
      id: 403,
      name: "Mecánica e Industria",
      themeColor: "#0284C7",
      chainTitle: "Rueda → Engranaje → Locomotora a Vapor",
      chainDescription: "La Rueda evolucionó en Engranaje para forjar la Locomotora a Vapor",
      items: [
        {
          id: "hum-rueda",
          name: "Rueda Primitiva",
          step: 1,
          stepName: "Movimiento",
          category: "Civilización",
          color: "#A8A29E",
          glow: "rgba(168, 162, 158, 0.5)",
          bgGradient: "from-stone-400 via-stone-600 to-stone-900",
          iconType: "chip",
          lore: "Invención fundamental que venció la fricción y unió los caminos",
          imageSrc: "/cards/triads/hum-rueda.webp",
        },
        {
          id: "hum-engranaje",
          name: "Engranaje de Acero",
          step: 2,
          stepName: "Mecanización",
          category: "Civilización",
          color: "#0284C7",
          glow: "rgba(2, 132, 199, 0.5)",
          bgGradient: "from-sky-500 via-slate-600 to-slate-900",
          iconType: "chip",
          lore: "Dientes de hierro templado que impulsaron la Revolución Industrial",
          imageSrc: "/cards/triads/hum-engranaje.webp",
        },
        {
          id: "hum-locomotora",
          name: "Locomotora a Vapor",
          step: 3,
          stepName: "Expansión",
          category: "Civilización",
          color: "#475569",
          glow: "rgba(71, 85, 105, 0.6)",
          bgGradient: "from-slate-600 via-stone-800 to-black",
          iconType: "androide",
          lore: "Monstruo de acero y carbón que achicó continentes enteros a ritmo de vapor",
          imageSrc: "/cards/triads/hum-locomotora.webp",
        },
      ],
    },
    {
      id: 404,
      name: "Escritura y Saber",
      themeColor: "#6366F1",
      chainTitle: "Papiro → Imprenta → Gran Archivo",
      chainDescription: "El Papiro inspiró la Imprenta para construir el Gran Archivo Universal",
      items: [
        {
          id: "hum-papiro",
          name: "Papiro y Cálamo",
          step: 1,
          stepName: "Escritura",
          category: "Civilización",
          color: "#FDE047",
          glow: "rgba(253, 224, 71, 0.5)",
          bgGradient: "from-yellow-300 via-amber-500 to-stone-800",
          iconType: "idea",
          lore: "Signos trazados en tinta sobre junco que derrotaron al olvido humano",
          imageSrc: "/cards/triads/hum-papiro.webp",
        },
        {
          id: "hum-imprenta",
          name: "Prensa de Gutenberg",
          step: 2,
          stepName: "Difusión",
          category: "Civilización",
          color: "#B45309",
          glow: "rgba(180, 83, 9, 0.5)",
          bgGradient: "from-amber-700 via-stone-800 to-slate-950",
          iconType: "chip",
          lore: "Taller renacentista que multiplicó los libros y democratizó el conocimiento",
          imageSrc: "/cards/triads/hum-imprenta.webp",
        },
        {
          id: "hum-biblioteca",
          name: "Gran Archivo Universal",
          step: 3,
          stepName: "Inmortalidad",
          category: "Civilización",
          color: "#6366F1",
          glow: "rgba(99, 102, 241, 0.6)",
          bgGradient: "from-indigo-500 via-purple-700 to-slate-950",
          iconType: "red",
          lore: "Catedral del saber que resguarda la memoria colectiva de la humanidad",
          imageSrc: "/cards/triads/hum-biblioteca.webp",
        },
      ],
    },
    {
      id: 405,
      name: "La Conquista Espacial",
      themeColor: "#F97316",
      chainTitle: "Cohete → Estación Espacial → Cúpula Marciana",
      chainDescription: "El Cohete alcanza la Estación Espacial y funda la Cúpula Marciana",
      items: [
        {
          id: "hum-cohete",
          name: "Cohete Orbital",
          step: 1,
          stepName: "Despegue",
          category: "Civilización",
          color: "#F97316",
          glow: "rgba(249, 115, 22, 0.5)",
          bgGradient: "from-orange-500 via-red-600 to-slate-950",
          iconType: "rayo",
          lore: "Columna de fuego y titanio que rompió las cadenas de la gravedad terrestre",
          imageSrc: "/cards/triads/hum-cohete.webp",
        },
        {
          id: "hum-estacion",
          name: "Estación Espacial",
          step: 2,
          stepName: "Permanencia",
          category: "Civilización",
          color: "#38BDF8",
          glow: "rgba(56, 189, 248, 0.5)",
          bgGradient: "from-sky-400 via-blue-600 to-slate-900",
          iconType: "satelite",
          lore: "Hogar de la humanidad suspendido en órbita perpetua sobre la Tierra azul",
          imageSrc: "/cards/triads/hum-estacion.webp",
        },
        {
          id: "hum-colonia",
          name: "Cúpula Marciana",
          step: 3,
          stepName: "Trascendencia",
          category: "Civilización",
          color: "#EF4444",
          glow: "rgba(239, 68, 68, 0.6)",
          bgGradient: "from-red-500 via-rose-700 to-slate-950",
          iconType: "sol",
          lore: "Primera ciudad humana en otro planeta, el nacimiento de la especie multiplanetaria",
          imageSrc: "/cards/triads/hum-colonia.webp",
        },
      ],
    },
  ],

};

TRIADS_CATALOG.naturaleza = TRIADS_CATALOG.ecosistema;

/* ──────────────────────────────────────────────────────────────────────────
   Iconos Ilustrativos Realistas en SVG para cada Carta
   ────────────────────────────────────────────────────────────────────────── */
function RealisticCardEmblem({ iconType, color }: { iconType: string; color: string }) {
  switch (iconType) {
    case "sol":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#FF7A00]">
          <circle cx="50" cy="50" r="24" fill="url(#sunGrad)" />
          {Array.from({ length: 12 }).map((_, i) => (
            <polygon
              key={i}
              points="48,12 52,12 50,4"
              fill="#FFAA00"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <defs>
            <radialGradient id="sunGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFF2A3" />
              <stop offset="50%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#D93800" />
            </radialGradient>
          </defs>
        </svg>
      );
    case "semilla":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#10B981]">
          <path
            d="M50 82 Q48 50 40 42 Q32 34 38 22 Q52 24 50 42 Q52 48 54 82 Z"
            fill="url(#stemGrad)"
          />
          <path d="M48 44 Q65 32 72 40 Q75 52 52 50 Z" fill="url(#leafGrad)" />
          <path d="M46 54 Q25 46 22 56 Q25 66 46 58 Z" fill="url(#leafGrad)" />
          <circle cx="58" cy="38" r="2.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="32" cy="54" r="2" fill="#FFFFFF" opacity="0.8" />
          <defs>
            <linearGradient id="stemGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      );
    case "arbol":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#38BDF8]">
          <path
            d="M48 90 L52 90 L53 60 Q60 52 70 48 M50 62 L32 50 M47 70 Q38 82 25 88 M53 72 Q62 82 75 88"
            stroke="#1E3A8A"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="50" cy="36" r="22" fill="url(#treeCanopy)" />
          <circle cx="34" cy="42" r="14" fill="url(#treeCanopy)" opacity="0.85" />
          <circle cx="66" cy="42" r="14" fill="url(#treeCanopy)" opacity="0.85" />
          <defs>
            <radialGradient id="treeCanopy" cx="45%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="40%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </radialGradient>
          </defs>
        </svg>
      );
    case "chip":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#00F0FF]">
          <rect x="25" y="25" width="50" height="50" rx="8" fill="#0A1628" stroke="#00F0FF" strokeWidth="2.5" />
          <rect x="36" y="36" width="28" height="28" rx="4" fill="#00F0FF" opacity="0.25" />
          <path d="M42 50 L58 50 M50 42 L50 58" stroke="#00F0FF" strokeWidth="2" />
          {/* Pines */}
          <line x1="32" y1="18" x2="32" y2="25" stroke="#00F0FF" strokeWidth="2" />
          <line x1="50" y1="18" x2="50" y2="25" stroke="#00F0FF" strokeWidth="2" />
          <line x1="68" y1="18" x2="68" y2="25" stroke="#00F0FF" strokeWidth="2" />
          <line x1="32" y1="75" x2="32" y2="82" stroke="#00F0FF" strokeWidth="2" />
          <line x1="50" y1="75" x2="50" y2="82" stroke="#00F0FF" strokeWidth="2" />
          <line x1="68" y1="75" x2="68" y2="82" stroke="#00F0FF" strokeWidth="2" />
          <line x1="18" y1="35" x2="25" y2="35" stroke="#00F0FF" strokeWidth="2" />
          <line x1="18" y1="50" x2="25" y2="50" stroke="#00F0FF" strokeWidth="2" />
          <line x1="18" y1="65" x2="25" y2="65" stroke="#00F0FF" strokeWidth="2" />
          <line x1="75" y1="35" x2="82" y2="35" stroke="#00F0FF" strokeWidth="2" />
          <line x1="75" y1="50" x2="82" y2="50" stroke="#00F0FF" strokeWidth="2" />
          <line x1="75" y1="65" x2="82" y2="65" stroke="#00F0FF" strokeWidth="2" />
        </svg>
      );
    case "nucleo":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#EC4899]">
          <rect x="30" y="24" width="40" height="52" rx="10" fill="#180728" stroke="#94A3B8" strokeWidth="2.5" />
          <ellipse cx="50" cy="24" rx="20" ry="7" fill="#64748B" />
          <ellipse cx="50" cy="76" rx="20" ry="7" fill="#475569" />
          {/* Rayo de plasma interno */}
          <path
            d="M50 32 L46 48 L56 46 L48 68"
            stroke="#EC4899"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="12" fill="#EC4899" opacity="0.3" filter="blur(2px)" />
        </svg>
      );
    case "androide":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F59E0B]">
          <path
            d="M32 45 Q50 30 68 45 L66 65 Q50 78 34 65 Z"
            fill="#CBD5E1"
            stroke="#475569"
            strokeWidth="2"
          />
          {/* Visor Óptico */}
          <rect x="36" y="46" width="28" height="7" rx="3.5" fill="#00F0FF" />
          <line x1="38" y1="49.5" x2="62" y2="49.5" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M46 64 L54 64" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "abeja":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#EAB308]">
          <ellipse cx="50" cy="52" rx="18" ry="24" fill="#FACC15" />
          <path d="M33 46 H67 M33 54 H67 M36 62 H64" stroke="#1E293B" strokeWidth="3" />
          <ellipse cx="36" cy="36" rx="9" ry="14" fill="#E2E8F0" opacity="0.75" transform="rotate(-30 36 36)" />
          <ellipse cx="64" cy="36" rx="9" ry="14" fill="#E2E8F0" opacity="0.75" transform="rotate(30 64 36)" />
        </svg>
      );
    case "flor":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#EC4899]">
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
    case "miel":
      return (
        <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-[0_0_15px_#F59E0B]">
          <rect x="34" y="32" width="32" height="42" rx="6" fill="#F59E0B" stroke="#78350F" strokeWidth="2.5" />
          <ellipse cx="50" cy="32" rx="16" ry="6" fill="#FDE68A" />
          <path d="M42 46 Q50 56 58 46" stroke="#78350F" strokeWidth="2" fill="none" />
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
   Componente Principal: TriadasConexiones / RelacionesConexiones (Modo Relaciones)
   ────────────────────────────────────────────────────────────────────────── */
export function TriadasConexiones({
  modo = "ecosistema",
  onComplete,
  onBackToMenu,
  level = 1,
}: TriadasConexionesProps) {
  const [currentLevel, setCurrentLevel] = useState(level || 1);
  const activeCatalog = TRIADS_CATALOG[modo] || TRIADS_CATALOG.ecosistema;

  // En niveles 1 y 2: conectar 2 cartas (pareja causa-efecto/transformación directa).
  // En niveles 3 y 4+: conectar 3 cartas (tríada evolutiva completa de 3 eslabones).
  const cardsPerGroup = currentLevel <= 2 ? 2 : 3;

  const [cards, setCards] = useState<InGameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [completedTriads, setCompletedTriads] = useState<number[]>([]);
  const [phase, setPhase] = useState<"preview" | "playing" | "victory">("preview");
  const [previewCountdown, setPreviewCountdown] = useState(3.5);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(() => localStorage.getItem("memorize_sound_muted") === "true");

  // Efectos visuales interactivos
  const [shakingIdx, setShakingIdx] = useState<number[]>([]);
  const [explosion, setExplosion] = useState<{ x: number; y: number; color: string; id: number } | null>(null);
  const [activeBanner, setActiveBanner] = useState<{ title: string; desc: string; color: string } | null>(null);

  const lockRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sincronizar nivel si cambia la prop
  useEffect(() => {
    if (level && level !== currentLevel) {
      setCurrentLevel(level);
    }
  }, [level]);

  // Toggle de sonido
  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    localStorage.setItem("memorize_sound_muted", String(next));
  };

  // Configuración de dificultad por nivel:
  // Nivel 1: 3 grupos x 2 cartas = 6 cartas (Parejas simples)
  // Nivel 2: 4 grupos x 2 cartas = 8 cartas (Parejas ampliadas)
  // Nivel 3: 3 grupos x 3 cartas = 9 cartas (Tríadas básicas)
  // Nivel 4: 4 grupos x 3 cartas = 12 cartas (Tríadas avanzadas)
  // Nivel 5: 5 grupos x 3 cartas = 15 cartas (Desafío maestro)
  const getGroupsCount = (lvl: number) => {
    if (lvl === 1) return 3;
    if (lvl === 2) return 4;
    if (lvl === 3) return 3;
    if (lvl === 4) return 4;
    return 5;
  };

  const getBaseTime = (lvl: number) => {
    if (lvl === 1) return 60;
    if (lvl === 2) return 75;
    if (lvl === 3) return 90;
    if (lvl === 4) return 105;
    return 120;
  };

  const handleSelectLevel = (newLevel: number) => {
    setCurrentLevel(newLevel);
    setSelectedCards([]);
    setCards([]);
  };

  // Inicializar partida
  const initializeGame = useCallback(() => {
    const groupsCount = getGroupsCount(currentLevel);
    const selectedDefs = activeCatalog.slice(0, groupsCount);
    const perGroup = currentLevel <= 2 ? 2 : 3;

    const deck: InGameCard[] = [];
    selectedDefs.forEach((triad) => {
      // En niveles 1 y 2 tomamos los primeros 2 eslabones (Paso 1 y Paso 2)
      const groupItems = triad.items.slice(0, perGroup);

      const chainSteps = groupItems.map((it) => ({
        step: it.step,
        name: it.name,
        stepName: it.stepName,
        imageSrc: it.imageSrc,
      }));

      const chainTitle = perGroup === 2
        ? `${groupItems[0].name.split(" ")[0]} ➔ ${groupItems[1].name.split(" ")[0]}`
        : triad.chainTitle;

      const chainDescription = perGroup === 2
        ? `${groupItems[0].name} se relaciona directamente con ${groupItems[1].name}`
        : triad.chainDescription;

      groupItems.forEach((item) => {
        deck.push({
          uniqueId: `${item.id}-${Math.random().toString(36).substring(2, 6)}`,
          triadId: triad.id,
          triadName: triad.name,
          triadThemeColor: triad.themeColor,
          chainTitle,
          chainDescription,
          chainSteps,
          item,
          totalStepsInGroup: perGroup,
          isFlipped: true, // Revelado en preview inicial
          isMatched: false,
          isHinted: false,
        });
      });
    });

    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setPhase("preview");
    setPreviewCountdown(currentLevel <= 2 ? 3.0 : 3.5);
    setSelectedCards([]);
    setCompletedTriads([]);
    setTimeLeft(getBaseTime(currentLevel));
    lockRef.current = false;

    // Conteo regresivo del escaneo previo
    const interval = setInterval(() => {
      setPreviewCountdown((prev) => {
        if (prev <= 0.5) {
          clearInterval(interval);
          setCards((curr) => curr.map((c) => ({ ...c, isFlipped: false })));
          setPhase("playing");
          audio.playFlip();
          return 0;
        }
        return prev - 0.5;
      });
    }, 500);
  }, [activeCatalog, currentLevel]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Reloj de cuenta regresiva
  useEffect(() => {
    if (phase !== "playing" || isTimeFrozen) return;

    if (timeLeft <= 0) {
      setPhase("victory");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setPhase("victory");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isTimeFrozen, timeLeft]);

  // Manejar clic en carta
  const handleCardClick = (idx: number) => {
    if (phase !== "playing") return;
    if (lockRef.current) return;
    if (selectedCards.length >= cardsPerGroup) return;

    const card = cards[idx];
    if (card.isFlipped || card.isMatched) return;

    audio.playFlip();

    const newCards = [...cards];
    newCards[idx] = { ...newCards[idx], isFlipped: true };
    setCards(newCards);

    const newSelected = [...selectedCards, idx];
    setSelectedCards(newSelected);

    const stepSoFar = newSelected.length;
    if (stepSoFar === 1) {
      audio.playCardStep(1);
    } else if (stepSoFar === 2 && cardsPerGroup === 3) {
      audio.playCardStep(2);
    }

    // Comprobar si se completó el número de cartas requeridas (2 en Nv 1-2, 3 en Nv 3+)
    if (newSelected.length === cardsPerGroup) {
      lockRef.current = true;

      const firstIdx = newSelected[0];
      const secondIdx = newSelected[1];
      const card1 = cards[firstIdx];
      const card2 = cards[secondIdx];

      const isMatch = cardsPerGroup === 2
        ? card1.triadId === card2.triadId
        : (newSelected.length === 3 && card1.triadId === card2.triadId && card2.triadId === cards[newSelected[2]].triadId);

      if (isMatch) {
        // MATCH EXITOSO
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));
        const pts = (cardsPerGroup === 2 ? 200 : 350) * newCombo;
        setScore((s) => s + pts);
        setTimeLeft((t) => t + (cardsPerGroup === 2 ? 5 : 8));

        if (cardsPerGroup === 2) {
          audio.playPairMatch();
        } else {
          audio.playTriadMatch();
        }
        // Disparar capa de audio temático inmersivo (Fuego, Agua, Tecnología, Viento, etc.)
        audio.playThematicSfx(card1.triadId);

        const triadDef = activeCatalog.find((t) => t.id === card1.triadId);
        if (triadDef) {
          const bannerTitle = cardsPerGroup === 2
            ? `¡RELACIÓN CONECTADA: ${triadDef.name.toUpperCase()}!`
            : `¡TRÍADA CONECTADA: ${triadDef.name.toUpperCase()}!`;
          const bannerDesc = cardsPerGroup === 2
            ? `${triadDef.items[0].name} ➔ ${triadDef.items[1].name}`
            : triadDef.chainDescription;

          setActiveBanner({
            title: bannerTitle,
            desc: bannerDesc,
            color: triadDef.themeColor,
          });
          setTimeout(() => setActiveBanner(null), 2500);
        }

        // Explosión de partículas en la carta
        const explosionTargetIdx = cardsPerGroup === 2 ? secondIdx : newSelected[1];
        const rect = cardRefs.current[explosionTargetIdx]?.getBoundingClientRect();
        if (rect) {
          setExplosion({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            color: card1.item.color,
            id: Date.now(),
          });
        }

        setTimeout(() => {
          setCards((curr) => {
            const updated = [...curr];
            newSelected.forEach((i) => {
              if (updated[i]) updated[i] = { ...updated[i], isMatched: true };
            });

            const allMatched = updated.every((c) => c.isMatched);
            if (allMatched) {
              audio.playVictory();
              setPhase("victory");
            }
            return updated;
          });

          setCompletedTriads((prev) => [...prev, card1.triadId]);
          setSelectedCards([]);
          lockRef.current = false;
        }, 500);
      } else {
        // ERROR / DESENCUENTRO
        audio.playMismatch();
        setCombo(0);
        setShakingIdx(newSelected);

        setTimeout(() => {
          setCards((curr) => {
            const updated = [...curr];
            newSelected.forEach((i) => {
              if (updated[i]) updated[i] = { ...updated[i], isFlipped: false };
            });
            return updated;
          });

          setShakingIdx([]);
          setSelectedCards([]);
          lockRef.current = false;
        }, 750);
      }
    }
  };

  // Habilidad del Compañero 3D: Revelar cartas afines
  const handleCompanionReveal = useCallback(() => {
    if (phase !== "playing") return;
    const unmatched = cards.filter((c) => !c.isMatched && !c.isFlipped);
    if (unmatched.length === 0) return;

    audio.playPower();
    const targetTriad = unmatched[0].triadId;
    setCards((curr) =>
      curr.map((c) => (c.triadId === targetTriad && !c.isMatched ? { ...c, isFlipped: true, isHinted: true } : c))
    );

    setTimeout(() => {
      setCards((curr) =>
        curr.map((c) =>
          c.triadId === targetTriad && !c.isMatched
            ? { ...c, isFlipped: false, isHinted: false }
            : { ...c, isHinted: false }
        )
      );
    }, 2200);
  }, [phase, cards]);

  // Habilidad del Compañero 3D: Congelar tiempo
  const handleCompanionFreeze = useCallback(() => {
    if (phase !== "playing") return;
    audio.playPower();
    setIsTimeFrozen(true);
    setTimeout(() => {
      setIsTimeFrozen(false);
    }, 6000);
  }, [phase]);

  const targetCount = getGroupsCount(currentLevel);

  // Bandeja de Ensamblaje en vivo adaptativa (2 o 3 casillas)
  const activeTriadAssembly = (() => {
    if (selectedCards.length === 0) return null;
    const firstCard = cards[selectedCards[0]];
    if (!firstCard) return null;

    const triadDef = activeCatalog.find((t) => t.id === firstCard.triadId);
    if (!triadDef) return null;

    const selectedInGroup = selectedCards
      .map((idx) => cards[idx])
      .filter((c) => c && c.triadId === firstCard.triadId);

    const groupItems = triadDef.items.slice(0, cardsPerGroup);

    const steps = groupItems.map((it) => {
      const isSelected = selectedInGroup.some((c) => c.item.id === it.id);
      return {
        step: it.step,
        name: it.name,
        stepName: it.stepName,
        isFilled: isSelected,
        imageSrc: it.imageSrc,
      };
    });

    return {
      name: triadDef.name,
      themeColor: triadDef.themeColor,
      chainTitle: cardsPerGroup === 2
        ? `${groupItems[0].name.split(" ")[0]} ➔ ${groupItems[1].name.split(" ")[0]}`
        : triadDef.chainTitle,
      chainDescription: triadDef.chainDescription,
      selectedCount: selectedInGroup.length,
      totalRequired: cardsPerGroup,
      steps,
    };
  })();

  // Distribución responsiva según total de cartas
  const totalCards = cards.length;
  const gridClasses = totalCards <= 6
    ? "grid-cols-3 max-w-md"
    : totalCards === 8
    ? "grid-cols-4 max-w-xl"
    : totalCards <= 9
    ? "grid-cols-3 max-w-lg"
    : totalCards <= 12
    ? "grid-cols-3 sm:grid-cols-4 max-w-3xl"
    : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 max-w-4xl";

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] w-full text-white relative overflow-hidden select-none flex flex-col justify-between game-screen-lock"
      style={{
        background: "radial-gradient(circle at 50% 10%, #160B2B 0%, #080314 55%, #03010A 100%)",
      }}
    >
      {/* ── Fondo Animado & Partículas Cuánticas ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-[100px]" />

        {/* Rejilla de Conexión Sináptica */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#A855F7 1px, transparent 1px), linear-gradient(90deg, #A855F7 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Efectos de Partículas y Congelación ──────────────────────────────── */}
      {explosion && (
        <ParticleExplosion
          key={explosion.id}
          x={explosion.x}
          y={explosion.y}
          color={explosion.color}
          active={true}
          onDone={() => setExplosion(null)}
        />
      )}
      <FreezeOverlay active={isTimeFrozen} />

      {/* ── Compañero 3D Animado (Integración idéntica al modo clásico) ──────── */}
      <InGameCompanionWidget
        onRevealPair={handleCompanionReveal}
        onFreezeTime={handleCompanionFreeze}
        combo={combo}
        matchedCount={completedTriads.length}
        isGameActive={phase === "playing"}
      />

      {/* ── Barra Superior Móvil Compacta (sm:hidden) ────────────────────── */}
      <header className="px-2.5 py-1.5 flex sm:hidden items-center justify-between border-b border-white/10 backdrop-blur-md bg-black/40 relative z-30 shrink-0">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/5 active:bg-white/15 text-[11px] font-mono tracking-wider text-gray-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
          <span>SALIR</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="font-black text-xs tracking-wider uppercase text-white">
            {cardsPerGroup === 2 ? "RELACIONES" : "TRÍADAS"}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
            cardsPerGroup === 2
              ? "border-amber-500/40 text-amber-300 bg-amber-500/15"
              : "border-purple-500/40 text-purple-300 bg-purple-500/15"
          }`}>
            N{currentLevel} · {cardsPerGroup} CARTAS
          </span>
        </div>

        <button
          onClick={toggleSound}
          title={soundMuted ? "Activar audio" : "Silenciar"}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300"
        >
          {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
        </button>
      </header>

      {/* ── Barra Superior Escritorio (hidden sm:flex) ─────────────────────── */}
      <header className="px-8 py-3 relative z-30 hidden sm:flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-black/25 shrink-0">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-400/50 transition-all text-xs font-mono tracking-wider text-gray-200"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400" />
          <span>SALIR</span>
        </button>

        {/* Centro: Título + Selector Rápido de Nivel */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h1 className="font-black text-base tracking-[0.2em] uppercase text-white drop-shadow">
              MODO RELACIONES
            </h1>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest border ${
              cardsPerGroup === 2
                ? "border-amber-500/40 text-amber-300 bg-amber-500/15"
                : "border-purple-500/40 text-purple-300 bg-purple-500/15"
            }`}>
              {modo.toUpperCase()} · NIVEL {currentLevel} ({cardsPerGroup === 2 ? "2 CARTAS POR RELACIÓN" : "3 CARTAS POR TRÍADA"})
            </span>
          </div>

          {/* Selector de Nivel Interactivo */}
          <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-gray-400 uppercase px-1.5 font-bold">Nivel:</span>
            {[1, 2, 3, 4].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleSelectLevel(lvl)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  currentLevel === lvl
                    ? lvl <= 2
                      ? "bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black"
                      : "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)] font-black"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Nv {lvl} {lvl <= 2 ? "(2 cartas)" : "(3 cartas)"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={toggleSound}
          title={soundMuted ? "Activar audio" : "Silenciar"}
          className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
        </button>
      </header>

      {/* ── Selector Móvil de Nivel Compacto ─────────────────────────────────── */}
      <div className="px-2 pt-1 sm:hidden flex items-center justify-center gap-1 z-20 shrink-0">
        {[1, 2, 3, 4].map((lvl) => (
          <button
            key={lvl}
            onClick={() => handleSelectLevel(lvl)}
            className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all ${
              currentLevel === lvl
                ? lvl <= 2
                  ? "bg-amber-500 text-black font-black"
                  : "bg-purple-600 text-white font-black"
                : "bg-black/40 text-gray-400 border border-white/5"
            }`}
          >
            Nv{lvl}: {lvl <= 2 ? "2 cartas" : "3 cartas"}
          </button>
        ))}
      </div>

      {/* ── HUD Móvil de 1 Línea (sm:hidden) ─────────────────────────────────── */}
      <div className="px-2 pt-1 relative z-20 sm:hidden shrink-0">
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md font-mono text-xs">
          {/* Puntos */}
          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg flex-1 justify-center">
            <Brain className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="font-black text-purple-300 text-xs">{score.toLocaleString()}</span>
          </div>

          {/* Combo */}
          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg shrink-0">
            <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="font-black text-cyan-300 text-xs">×{combo}</span>
          </div>

          {/* Tiempo */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg shrink-0 border ${
              timeLeft <= 10
                ? "bg-red-950/50 border-red-500/70 text-red-400"
                : isTimeFrozen
                ? "bg-cyan-950/50 border-cyan-400 text-cyan-300"
                : "bg-white/5 border-transparent text-yellow-300"
            }`}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span className="font-black text-xs">{timeLeft}s</span>
          </div>

          {/* Conexiones */}
          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg shrink-0">
            <Award className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-black text-emerald-300 text-xs">{completedTriads.length}/{targetCount}</span>
          </div>
        </div>
      </div>

      {/* ── HUD Escritorio Completo (hidden sm:block) ────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto px-4 pt-2 relative z-20 hidden sm:block shrink-0">
        <div className="grid grid-cols-4 gap-3">
          {/* Puntos */}
          <div className="px-3.5 py-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">PUNTOS</span>
            </div>
            <span className="font-mono text-xl font-black text-purple-300">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Combo */}
          <div className="px-3.5 py-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">COMBO</span>
            </div>
            <span className="font-mono text-xl font-black text-cyan-300">
              ×{combo}
            </span>
          </div>

          {/* Tiempo */}
          <div
            className={`px-3.5 py-2 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-colors ${
              timeLeft <= 10
                ? "bg-red-950/40 border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                : isTimeFrozen
                ? "bg-cyan-950/40 border-cyan-400"
                : "bg-black/40 border-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${timeLeft <= 10 ? "text-red-400" : "text-yellow-400"}`} />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                {isTimeFrozen ? "CONGELADO" : "TIEMPO"}
              </span>
            </div>
            <span
              className={`font-mono text-xl font-black ${
                timeLeft <= 10 ? "text-red-400" : "text-yellow-300"
              }`}
            >
              {timeLeft}s
            </span>
          </div>

          {/* Conexiones Resueltas */}
          <div className="px-3.5 py-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                {cardsPerGroup === 2 ? "RELACIONES" : "TRÍADAS"}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xl font-black">
              <span className="text-emerald-300">{completedTriads.length}</span>
              <span className="text-gray-600 text-sm">/{targetCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bandeja Flotante de Ensamblaje en Vivo (Adaptativa: 2 o 3 cartas) ── */}
      <AnimatePresence>
        {activeTriadAssembly && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className={`w-full mx-auto px-3 sm:px-4 pt-1 z-30 shrink-0 ${
              activeTriadAssembly.totalRequired === 2 ? "max-w-lg" : "max-w-2xl"
            }`}
          >
            <div
              className="p-2 sm:p-2.5 rounded-2xl border-2 backdrop-blur-xl shadow-2xl flex flex-col gap-1.5 transition-all"
              style={{
                borderColor: `${activeTriadAssembly.themeColor}90`,
                background: "rgba(10, 5, 22, 0.94)",
                boxShadow: `0 0 30px ${activeTriadAssembly.themeColor}35`,
              }}
            >
              <div className="flex items-center justify-between px-1">
                <span
                  className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 truncate"
                  style={{ color: activeTriadAssembly.themeColor }}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">CONECTANDO: {activeTriadAssembly.name}</span>
                </span>
                <span className="font-mono text-[10px] text-gray-300 shrink-0 font-bold">
                  {activeTriadAssembly.selectedCount}/{activeTriadAssembly.totalRequired} {activeTriadAssembly.totalRequired === 2 ? "cartas" : "eslabones"}
                </span>
              </div>

              {/* Slots del flujo: 2 columnas en Nv 1-2, 3 columnas en Nv 3+ */}
              <div
                className={`grid gap-1.5 sm:gap-2 ${
                  activeTriadAssembly.totalRequired === 2 ? "grid-cols-2" : "grid-cols-3"
                }`}
              >
                {activeTriadAssembly.steps.map((st) => (
                  <div
                    key={st.step}
                    className={`p-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                      st.isFilled
                        ? "bg-white/10 border-white/40 text-white shadow-sm"
                        : "bg-black/50 border-white/10 text-gray-400 border-dashed"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md font-mono text-[10px] font-black flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        background: st.isFilled ? activeTriadAssembly.themeColor : "rgba(255,255,255,0.08)",
                        color: st.isFilled ? "#000" : "#888",
                      }}
                    >
                      {st.isFilled ? "✓" : st.step}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[8px] text-gray-400 uppercase leading-none truncate">
                        Paso {st.step}
                      </div>
                      <div className={`font-serif text-[10px] sm:text-xs font-bold truncate leading-tight ${st.isFilled ? "text-white" : "text-gray-400"}`}>
                        {st.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Banner Flotante de Conexión (Overlay que no empuja cartas) ─────────── */}
      <AnimatePresence>
        {activeBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-12 sm:top-20 left-1/2 -translate-x-1/2 z-50 p-2 sm:p-3.5 rounded-2xl border-2 backdrop-blur-xl text-center shadow-2xl pointer-events-none max-w-[92vw] sm:max-w-md w-full"
            style={{
              borderColor: activeBanner.color,
              background: "rgba(10, 5, 20, 0.95)",
              boxShadow: `0 0 35px ${activeBanner.color}88`,
            }}
          >
            <div
              className="font-mono text-[10px] sm:text-xs font-black tracking-widest uppercase mb-0.5 flex items-center justify-center gap-2"
              style={{ color: activeBanner.color }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeBanner.title}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-white tracking-wide truncate sm:whitespace-normal">{activeBanner.desc}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tablero de Juego (Cartas Realistas de Gran Formato con Viewport Lock) ─── */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-1 sm:px-4 py-1 sm:py-2 relative z-20 w-full max-w-5xl mx-auto overflow-hidden">
        <div className="relative p-1.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm w-full h-full max-h-full flex flex-col items-center justify-center overflow-hidden">
          {/* Indicador de Escaneo Previo con Pista del Objetivo */}
          {phase === "preview" && (
            <div className="mb-1 sm:mb-2 flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-purple-300 font-bold bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/40 animate-pulse shrink-0">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>
                {cardsPerGroup === 2
                  ? `MEMORIZA LAS PAREJAS (2 CARTAS): ${previewCountdown.toFixed(1)}s`
                  : `MEMORIZA LAS TRÍADAS (3 CARTAS): ${previewCountdown.toFixed(1)}s`}
              </span>
            </div>
          )}

          {/* Cuadrícula de Cartas Coleccionables */}
          <div
            className={`grid gap-2 sm:gap-3.5 w-full h-full max-h-full items-center justify-center justify-items-center content-center ${gridClasses}`}
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
                    aspectRatio: "2.7/4",
                    perspective: 1000,
                  }}
                  className="w-full max-w-[125px] sm:max-w-[155px] md:max-w-[175px] h-full max-h-[25dvh] sm:max-h-[210px] md:max-h-[240px] relative cursor-pointer select-none touch-manipulation flex items-center justify-center group"
                  whileHover={!card.isFlipped && !card.isMatched ? { y: -4, scale: 1.04 } : {}}
                  whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
                  animate={
                    isShaking
                      ? { x: [0, -6, 6, -4, 4, 0], rotate: [0, -3, 3, -1, 1, 0] }
                      : card.isHinted
                      ? { scale: [1, 1.08, 1], filter: "drop-shadow(0 0 20px #E8B54A)" }
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
                    {/* Reverso de Carta */}
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-white/10 bg-gradient-to-b from-[#180D2E] via-[#0E061D] to-[#070210] flex flex-col items-center justify-between p-2 sm:p-3 shadow-xl transition-all group-hover:border-purple-400/50"
                      style={{
                        backfaceVisibility: "hidden",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.7)",
                      }}
                    >
                      <div className="w-full flex justify-between items-center text-[8px] sm:text-[10px] font-mono text-purple-400/70 uppercase">
                        <span className="font-bold tracking-widest">
                          {card.totalStepsInGroup === 2 ? "RELACIÓN" : "TRÍADA"}
                        </span>
                        <span>#{String(idx + 1).padStart(2, "0")}</span>
                      </div>

                      {/* Emblema Central del Reverso */}
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-500/25 to-fuchsia-500/15 border border-purple-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform">
                        <Layers className="w-5 h-5 sm:w-7 sm:h-7 text-purple-300" />
                      </div>

                      <div className="text-[8px] sm:text-[10px] font-mono text-purple-300/50 uppercase tracking-[0.2em]">
                        MEMORIZE
                      </div>
                    </div>

                    {/* Frente de Carta (Boca Arriba) */}
                    <div
                      className={`absolute inset-0 rounded-2xl overflow-hidden border-2 flex flex-col justify-between p-2 sm:p-2.5 transition-all shadow-xl ${
                        card.isMatched
                          ? "opacity-60 border-emerald-400/70 bg-[#06140E]"
                          : isSelected
                          ? "border-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.5)] bg-[#0F0822]"
                          : "bg-gradient-to-b from-[#160A29] via-[#0C0418] to-[#06020D]"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderColor: isSelected
                          ? "#00F0FF"
                          : card.isMatched
                          ? "#10B981"
                          : `${card.triadThemeColor}90`,
                        boxShadow: isSelected
                          ? "0 0 25px rgba(0,240,255,0.5)"
                          : `inset 0 0 16px ${card.triadThemeColor}25, 0 8px 20px rgba(0,0,0,0.6)`,
                      }}
                    >
                      {/* 1. Cabecera Unificada de la Relación / Familia */}
                      <div
                        className="flex items-center justify-between gap-1 w-full pb-1 border-b border-white/10 shrink-0"
                        style={{ borderColor: `${card.triadThemeColor}30` }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                            style={{ background: card.triadThemeColor, boxShadow: `0 0 8px ${card.triadThemeColor}` }}
                          />
                          <span
                            className="font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-tight truncate max-w-[85px] sm:max-w-[110px]"
                            style={{ color: card.triadThemeColor }}
                            title={card.triadName}
                          >
                            {card.triadName}
                          </span>
                        </div>
                        <span
                          className="px-1.5 py-0.2 sm:py-0.5 rounded text-[8px] sm:text-[10px] font-mono font-black uppercase tracking-wider text-black shrink-0 shadow-sm"
                          style={{ background: card.triadThemeColor }}
                        >
                          {card.item.step}/{card.totalStepsInGroup}
                        </span>
                      </div>

                      {/* 2. Ilustración Realista Grande y Protagónica */}
                      <div className="flex-1 w-full min-h-0 my-1 relative overflow-hidden rounded-xl bg-black/60 border border-white/10 flex items-center justify-center group shadow-inner">
                        {/* Resplandor del color de familia detrás de la imagen */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
                          style={{ background: `radial-gradient(circle at 50% 50%, ${card.triadThemeColor}, transparent 75%)` }}
                        />

                        {card.item.imageSrc ? (
                          <img
                            src={card.item.imageSrc}
                            alt={card.item.name}
                            className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.1] transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="scale-90 sm:scale-110">
                            <RealisticCardEmblem iconType={card.item.iconType} color={card.triadThemeColor} />
                          </div>
                        )}

                        {/* Subtítulo de función o rol del eslabón sobre la imagen */}
                        <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-center">
                          <span className="font-mono text-[8px] sm:text-[9px] text-gray-200 uppercase tracking-wider truncate block font-medium">
                            {card.item.stepName}
                          </span>
                        </div>
                      </div>

                      {/* 3. Título del Objeto y Mini-Diagrama de Conexión */}
                      <div className="w-full pt-0.5 shrink-0 text-center flex flex-col gap-0.5">
                        <h4
                          className="font-serif font-black text-[11px] sm:text-xs text-white tracking-tight uppercase truncate leading-tight"
                          title={card.item.name}
                        >
                          {card.item.name}
                        </h4>

                        {/* Mini Diagrama de Flujo (2 pasos o 3 pasos según nivel) */}
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 font-mono text-[7px] sm:text-[8px] text-gray-400 bg-black/40 py-0.5 px-1 rounded-md border border-white/5 truncate">
                          {card.chainSteps?.map((st, i) => {
                            const isCurrent = st.step === card.item.step;
                            const shortName = st.name.split(" ")[0];
                            return (
                              <span key={st.step} className="flex items-center gap-0.5 truncate">
                                <span
                                  className={`px-1 py-0.2 rounded font-bold transition-all truncate ${
                                    isCurrent
                                      ? "text-black font-black shadow-sm"
                                      : "text-gray-400 font-normal"
                                  }`}
                                  style={isCurrent ? { background: card.triadThemeColor } : {}}
                                  title={st.name}
                                >
                                  {shortName}
                                </span>
                                {i < (card.totalStepsInGroup - 1) && <span className="text-gray-600 text-[6px]">➔</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Badge de Selección (1, 2 ó 3) */}
                      {isSelected && !card.isMatched && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-400 text-black font-black font-mono text-[10px] sm:text-xs flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.7)] ring-2 ring-white/80 z-20"
                        >
                          {selectionOrder}
                        </motion.div>
                      )}

                      {/* Sello de Relación Resuelta */}
                      {card.isMatched && (
                        <div className="absolute inset-0 bg-emerald-950/50 backdrop-blur-[2px] flex items-center justify-center z-20">
                          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.7)]" />
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

      {/* ── Pie Informativo (hidden sm:flex) ─────────────────────────────────── */}
      <footer className="px-4 py-1.5 relative z-20 hidden sm:flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-white/5 bg-black/30 backdrop-blur-sm shrink-0">
        <span>
          {cardsPerGroup === 2
            ? "CONECTA LAS 2 CARTAS EN RELACIÓN CAUSA-EFECTO DIRECTA"
            : "CONECTA LAS 3 CARTAS DEL MISMO CICLO EVOLUTIVO O LÓGICO"}
        </span>
        <span>MODO RELACIONES · MEMORIZE EVOLUTIVO</span>
      </footer>

      {/* ── Modal de Victoria / Final del Nivel con Progresión Pedagógica ────── */}
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
              className="bg-gradient-to-br from-[#120726] via-[#0B0418] to-[#04010A] p-6 sm:p-8 rounded-3xl border-2 border-purple-400/60 max-w-md w-full shadow-[0_0_80px_rgba(168,85,247,0.3)] text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                <Award className="w-9 h-9 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black mb-1 bg-gradient-to-r from-purple-300 via-white to-pink-300 bg-clip-text text-transparent">
                ¡NIVEL {currentLevel} SUPERADO!
              </h2>

              <p className="text-xs font-mono text-gray-300 mb-4">
                {currentLevel === 1 && "¡Excelente intuición! Conectaste las parejas causa-efecto con éxito."}
                {currentLevel === 2 && "¡Dominio de parejas alcanzado! Has superado la fase de 2 cartas."}
                {currentLevel === 3 && "¡Increíble! Dominaste la primera fase de Tríadas de 3 cartas."}
                {currentLevel >= 4 && "¡Maestría absoluta en cadenas evolutivas completas!"}
              </p>

              {/* Hito pedagógico: desbloqueo de tríadas de 3 cartas al pasar nivel 2 */}
              {currentLevel === 2 && (
                <div className="p-3 mb-4 rounded-xl border border-amber-400/50 bg-amber-950/40 text-left">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-black uppercase text-amber-300 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>¡DESAFÍO DE TRÍADAS DESBLOQUEADO!</span>
                  </div>
                  <p className="text-[11px] font-mono text-gray-300 leading-relaxed">
                    A partir del <strong className="text-amber-200">Nivel 3</strong>, cada conexión evoluciona y requerirá encontrar las <strong className="text-amber-200">3 cartas</strong> de la cadena completa (Inicio ➔ Proceso ➔ Culminación).
                  </p>
                </div>
              )}

              {/* Puntuación y Estadísticas */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-4 backdrop-blur-sm">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-0.5">
                    Puntos
                  </span>
                  <span className="text-2xl font-black font-mono text-purple-300">
                    {score.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-0.5">
                    Combo Máx
                  </span>
                  <span className="text-2xl font-black font-mono text-cyan-300">
                    ×{maxCombo}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col gap-2">
                {currentLevel < 4 ? (
                  <button
                    onClick={() => {
                      handleSelectLevel(currentLevel + 1);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-mono text-xs font-black tracking-wider uppercase bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Siguiente: Nivel {currentLevel + 1} {currentLevel + 1 <= 2 ? "(2 cartas)" : "(3 cartas)"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onComplete || onBackToMenu}
                    className="w-full py-3 px-4 rounded-xl font-mono text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Reclamar Recompensa y XP 🏆</span>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      initializeGame();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-black tracking-wider uppercase bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>

                  <button
                    onClick={onBackToMenu}
                    className="flex-1 py-2.5 px-3 rounded-xl font-mono text-xs font-bold tracking-wider uppercase bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Menú</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Alias de exportación para máxima compatibilidad
export const RelacionesConexiones = TriadasConexiones;
export default TriadasConexiones;
