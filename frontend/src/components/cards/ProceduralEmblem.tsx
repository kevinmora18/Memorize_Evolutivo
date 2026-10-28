import { UNIVERSE_TOKENS } from '../../lib/archivoTokens';
import type { GameUniverse } from '../../lib/cardCatalog';

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cx = 100;
const cy = 100;

function Ticks({ color }: { color: string }) {
  return (
    <g stroke={color} strokeWidth="1" opacity="0.35">
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const long = i % 6 === 0;
        const r1 = long ? 78 : 82;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * 88}
            y2={cy + Math.sin(a) * 88}
          />
        );
      })}
    </g>
  );
}

function VolcaniaMotif({ accent, rng }: { accent: string; rng: () => number }) {
  const shards = [
    { pts: '100,34 132,92 118,154 82,154 68,92', rot: 0, o: 1 },
    { pts: '100,44 124,86 114,134 86,134 76,86', rot: 38, o: 0.55 },
    { pts: '100,44 124,86 114,134 86,134 76,86', rot: -34, o: 0.4 },
  ];
  return (
    <g>
      {shards.map((s, i) => (
        <g key={i} transform={`rotate(${s.rot} ${cx} ${cy})`} opacity={s.o}>
          <polygon points={s.pts} fill="url(#emb-fill)" stroke={accent} strokeOpacity="0.45" strokeWidth="1" />
          <line x1={cx} y1="40" x2={cx} y2="150" stroke={accent} strokeOpacity="0.25" strokeWidth="0.8" />
        </g>
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const a = rng() * Math.PI * 2;
        const r = 30 + rng() * 55;
        return (
          <circle
            key={`e${i}`}
            cx={cx + Math.cos(a) * r}
            cy={cy + Math.sin(a) * r}
            r={0.8 + rng() * 1.8}
            fill={accent}
            opacity={0.25 + rng() * 0.5}
          />
        );
      })}
    </g>
  );
}

function FrostheimMotif({ accent, rng }: { accent: string; rng: () => number }) {
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
    }).join(' ');
  return (
    <g>
      <polygon points={hex(62)} fill="url(#emb-fill)" stroke={accent} strokeOpacity="0.5" strokeWidth="1.2" />
      <polygon points={hex(44)} fill="none" stroke={accent} strokeOpacity="0.3" strokeWidth="0.8" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * 62}
            y2={cy + Math.sin(a) * 62}
            stroke={accent}
            strokeOpacity="0.22"
            strokeWidth="0.8"
          />
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const a = rng() * Math.PI * 2;
        const r = 20 + rng() * 60;
        const s = 2 + rng() * 2.4;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return (
          <path
            key={`s${i}`}
            d={`M ${x} ${y - s} L ${x + s * 0.28} ${y - s * 0.28} L ${x + s} ${y} L ${x + s * 0.28} ${y + s * 0.28} L ${x} ${y + s} L ${x - s * 0.28} ${y + s * 0.28} L ${x - s} ${y} L ${x - s * 0.28} ${y - s * 0.28} Z`}
            fill={accent}
            opacity={0.3 + rng() * 0.5}
          />
        );
      })}
    </g>
  );
}

function NeuralMotif({ accent, rng }: { accent: string; rng: () => number }) {
  const nodes = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + rng() * 0.5;
    const r = 38 + rng() * 34;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, r: 2.5 + rng() * 2.5 };
  });
  return (
    <g>
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={accent} strokeOpacity="0.3" strokeWidth="1" />
          <circle cx={(cx + n.x) / 2} cy={(cy + n.y) / 2} r="1.4" fill={accent} opacity="0.7" />
        </g>
      ))}
      <circle cx={cx} cy={cy} r="20" fill="url(#emb-fill)" stroke={accent} strokeOpacity="0.5" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="9" fill={accent} opacity="0.85" />
      <circle cx={cx} cy={cy} r="14" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="3 3" />
      {nodes.map((n, i) => (
        <circle key={`n${i}`} cx={n.x} cy={n.y} r={n.r} fill={accent} opacity="0.75" />
      ))}
    </g>
  );
}

function VerdalisMotif({ accent, rng }: { accent: string; rng: () => number }) {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + rng() * 0.4;
    const len = 34 + rng() * 30;
    const x2 = cx + Math.cos(a) * len;
    const y2 = cy + Math.sin(a) * len;
    const w = 9 + rng() * 6;
    const pa = a + Math.PI / 2;
    const mx = cx + Math.cos(a) * len * 0.5;
    const my = cy + Math.sin(a) * len * 0.5;
    return `M ${cx} ${cy} Q ${mx + Math.cos(pa) * w} ${my + Math.sin(pa) * w} ${x2} ${y2} Q ${mx - Math.cos(pa) * w} ${my - Math.sin(pa) * w} ${cx} ${cy} Z`;
  });
  return (
    <g>
      {leaves.map((d, i) => (
        <path key={i} d={d} fill="url(#emb-fill)" stroke={accent} strokeOpacity="0.35" strokeWidth="0.7" />
      ))}
      <circle cx={cx} cy={cy} r="11" fill={accent} opacity="0.85" />
      <circle cx={cx} cy={cy} r="17" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="0.8" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = rng() * Math.PI * 2;
        const r = 46 + rng() * 40;
        return (
          <circle
            key={`m${i}`}
            cx={cx + Math.cos(a) * r}
            cy={cy + Math.sin(a) * r}
            r={0.9 + rng() * 1.6}
            fill={accent}
            opacity={0.3 + rng() * 0.5}
          />
        );
      })}
    </g>
  );
}

function LunarisMotif({ accent, rng }: { accent: string; rng: () => number }) {
  const stars = Array.from({ length: 6 }, () => {
    const a = rng() * Math.PI * 2;
    const r = 34 + rng() * 50;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, s: 1 + rng() * 1.6 };
  });
  return (
    <g>
      <mask id="emb-crescent">
        <rect x="0" y="0" width="200" height="200" fill="white" />
        <circle cx={cx + 16} cy={cy - 8} r="36" fill="black" />
      </mask>
      <circle cx={cx} cy={cy} r="40" fill="url(#emb-fill)" stroke={accent} strokeOpacity="0.4" strokeWidth="0.8" mask="url(#emb-crescent)" />
      <circle cx={cx} cy={cy} r="40" fill={accent} opacity="0.75" mask="url(#emb-crescent)" />
      <polyline
        points={stars.map((s) => `${s.x},${s.y}`).join(' ')}
        fill="none"
        stroke={accent}
        strokeOpacity="0.3"
        strokeWidth="0.7"
      />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill={accent} opacity="0.7" />
      ))}
      {Array.from({ length: 4 }, (_, i) => {
        const a = rng() * Math.PI * 2;
        const r = 60 + rng() * 24;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return (
          <path
            key={`sp${i}`}
            d={`M ${x} ${y - 3} L ${x + 0.9} ${y - 0.9} L ${x + 3} ${y} L ${x + 0.9} ${y + 0.9} L ${x} ${y + 3} L ${x - 0.9} ${y + 0.9} L ${x - 3} ${y} L ${x - 0.9} ${y - 0.9} Z`}
            fill={accent}
            opacity="0.6"
          />
        );
      })}
    </g>
  );
}

const MOTIFS: Record<GameUniverse, (p: { accent: string; rng: () => number }) => JSX.Element> = {
  volcania: VolcaniaMotif,
  frostheim: FrostheimMotif,
  neural: NeuralMotif,
  verdalis: VerdalisMotif,
  lunaris: LunarisMotif,
};

interface ProceduralEmblemProps {
  seedKey: string;
  universe: GameUniverse | 'archivo';
  accent?: string;
  className?: string;
}

export function ProceduralEmblem({ seedKey, universe, accent, className }: ProceduralEmblemProps) {
  const token = UNIVERSE_TOKENS[universe];
  const color = accent ?? token.accent;
  const gameUniverse: GameUniverse = universe === 'archivo' ? 'neural' : universe;
  const rng = mulberry32(hashSeed(seedKey));
  const Motif = MOTIFS[gameUniverse];

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`emb-bg-${seedKey}`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor={token.deep2} />
          <stop offset="100%" stopColor="#05070C" />
        </radialGradient>
        <radialGradient id="emb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emb-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.06" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="200" height="200" fill={`url(#emb-bg-${seedKey})`} />
      <circle cx={cx} cy={cy} r="86" fill="url(#emb-glow)" />
      <circle cx={cx} cy={cy} r="88" fill="none" stroke={color} strokeOpacity="0.16" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="78" fill="none" stroke={color} strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 5" />
      <Ticks color={color} />
      <Motif accent={color} rng={rng} />
    </svg>
  );
}
