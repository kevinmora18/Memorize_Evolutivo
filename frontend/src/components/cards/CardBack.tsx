import { UNIVERSE_TOKENS } from '../../lib/archivoTokens';
import type { UniverseId } from '../../lib/archivoTokens';

function CornerTicks({ color }: { color: string }) {
  const c = [
    { x: 14, y: 14, dx: 1, dy: 1 },
    { x: 286, y: 14, dx: -1, dy: 1 },
    { x: 14, y: 386, dx: 1, dy: -1 },
    { x: 286, y: 386, dx: -1, dy: -1 },
  ];
  return (
    <g stroke={color} strokeWidth="1.2" opacity="0.4">
      {c.map((t, i) => (
        <g key={i}>
          <line x1={t.x} y1={t.y} x2={t.x + t.dx * 14} y2={t.y} />
          <line x1={t.x} y1={t.y} x2={t.x} y2={t.y + t.dy * 14} />
        </g>
      ))}
    </g>
  );
}

function PatternArchivo({ color }: { color: string }) {
  const dots: JSX.Element[] = [];
  for (let gx = 30; gx <= 270; gx += 24) {
    for (let gy = 30; gy <= 370; gy += 24) {
      if (Math.hypot(gx - 150, gy - 200) < 95) continue;
      dots.push(<circle key={`${gx}-${gy}`} cx={gx} cy={gy} r="1" fill={color} opacity="0.14" />);
    }
  }
  return <g>{dots}</g>;
}

function PatternVolcania({ color }: { color: string }) {
  const shards = [
    '40,0 70,40 30,90 0,60 0,0',
    '300,60 260,110 300,160',
    '0,250 34,300 0,340',
    '300,300 268,340 300,380',
    '80,400 120,350 160,400',
  ];
  return (
    <g fill="none" stroke={color} strokeOpacity="0.13" strokeWidth="1">
      {shards.map((p, i) => (
        <polygon key={i} points={p} />
      ))}
      <path d="M 20 180 L 60 165 L 90 190 L 130 175" strokeOpacity="0.09" />
      <path d="M 180 240 L 220 225 L 255 250 L 285 240" strokeOpacity="0.09" />
    </g>
  );
}

function PatternFrostheim({ color }: { color: string }) {
  const hexAt = (hx: number, hy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      return `${hx + Math.cos(a) * r},${hy + Math.sin(a) * r}`;
    }).join(' ');
  return (
    <g fill="none" stroke={color} strokeOpacity="0.12" strokeWidth="1">
      <polygon points={hexAt(40, 60, 26)} />
      <polygon points={hexAt(262, 100, 34)} />
      <polygon points={hexAt(60, 330, 30)} />
      <polygon points={hexAt(250, 320, 22)} />
      <polygon points={hexAt(150, 30, 18)} />
      <polygon points={hexAt(150, 372, 18)} />
    </g>
  );
}

function PatternNeural({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeOpacity="0.14" strokeWidth="1">
      <path d="M 0 80 L 50 80 L 70 100 L 70 140" />
      <circle cx="70" cy="140" r="3.5" fill={color} stroke="none" opacity="0.5" />
      <path d="M 300 90 L 250 90 L 230 110 L 230 150" />
      <circle cx="230" cy="150" r="3.5" fill={color} stroke="none" opacity="0.5" />
      <path d="M 0 320 L 46 320 L 66 300 L 66 260" />
      <circle cx="66" cy="260" r="3.5" fill={color} stroke="none" opacity="0.5" />
      <path d="M 300 330 L 254 330 L 234 310 L 234 270" />
      <circle cx="234" cy="270" r="3.5" fill={color} stroke="none" opacity="0.5" />
      <circle cx="150" cy="52" r="2.5" fill={color} stroke="none" opacity="0.4" />
      <circle cx="150" cy="350" r="2.5" fill={color} stroke="none" opacity="0.4" />
    </g>
  );
}

function PatternVerdalis({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeOpacity="0.13" strokeWidth="1">
      <path d="M 30 400 Q 46 330 30 270 Q 16 216 44 168" />
      <path d="M 44 168 Q 60 140 48 108" strokeOpacity="0.09" />
      <path d="M 270 400 Q 254 330 270 270 Q 286 214 258 168" />
      <path d="M 258 168 Q 244 140 256 112" strokeOpacity="0.09" />
      <path d="M 90 60 Q 110 84 92 108" />
      <path d="M 210 60 Q 192 84 208 108" />
      <circle cx="48" cy="108" r="3" fill={color} stroke="none" opacity="0.4" />
      <circle cx="256" cy="112" r="3" fill={color} stroke="none" opacity="0.4" />
    </g>
  );
}

function PatternLunaris({ color }: { color: string }) {
  const stars = [
    [40, 70],
    [92, 44],
    [240, 60],
    [268, 128],
    [222, 340],
    [76, 356],
    [46, 250],
    [266, 236],
  ];
  return (
    <g>
      <polyline
        points={stars.map((s) => s.join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeOpacity="0.12"
        strokeWidth="1"
      />
      {stars.map((s, i) => (
        <circle key={i} cx={s[0]} cy={s[1]} r={i % 3 === 0 ? 2.2 : 1.4} fill={color} opacity="0.35" />
      ))}
    </g>
  );
}

const PATTERNS: Record<UniverseId, (p: { color: string }) => JSX.Element> = {
  archivo: PatternArchivo,
  volcania: PatternVolcania,
  frostheim: PatternFrostheim,
  neural: PatternNeural,
  verdalis: PatternVerdalis,
  lunaris: PatternLunaris,
};

interface CardBackProps {
  universe: UniverseId;
  className?: string;
}

export function CardBack({ universe, className }: CardBackProps) {
  const token = UNIVERSE_TOKENS[universe];
  const accent = token.accent;
  const Pattern = PATTERNS[universe];

  return (
    <svg
      viewBox="0 0 300 400"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Reverso de carta — ${token.name}`}
    >
      <defs>
        <linearGradient id={`back-bg-${universe}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={token.deep2} />
          <stop offset="100%" stopColor="#05070C" />
        </linearGradient>
        <radialGradient id={`back-glow-${universe}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.14" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="300" height="400" fill={`url(#back-bg-${universe})`} />
      <Pattern color={accent} />
      <rect x="0" y="0" width="300" height="400" fill={`url(#back-glow-${universe})`} />

      <circle cx="150" cy="200" r="74" fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="1" />
      <circle cx="150" cy="200" r="64" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="150" cy="200" r="52" fill="rgba(5,7,12,0.55)" stroke={accent} strokeOpacity="0.5" strokeWidth="1" />

      <text
        x="151.5"
        y="215"
        textAnchor="middle"
        fontFamily="'Instrument Serif', Georgia, serif"
        fontSize="44"
        fill="#02040a"
        opacity="0.8"
        letterSpacing="2"
      >
        MEM
      </text>
      <text
        x="150"
        y="213"
        textAnchor="middle"
        fontFamily="'Instrument Serif', Georgia, serif"
        fontSize="44"
        fill={token.accent}
        opacity="0.95"
        letterSpacing="2"
      >
        MEM
      </text>
      <text
        x="150"
        y="240"
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="8"
        fill="#9AA3B2"
        opacity="0.75"
        letterSpacing="4"
      >
        MEMORIZE EVOLUTIVO
      </text>

      <line x1="60" y1="200" x2="92" y2="200" stroke={accent} strokeOpacity="0.35" strokeWidth="1" />
      <line x1="208" y1="200" x2="240" y2="200" stroke={accent} strokeOpacity="0.35" strokeWidth="1" />

      <text
        x="150"
        y="368"
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="8"
        fill="#5C6675"
        opacity="0.9"
        letterSpacing="3"
      >
        {token.wing} // {token.code}
      </text>

      <rect x="10" y="10" width="280" height="380" fill="none" stroke="#E8E6DF" strokeOpacity="0.05" strokeWidth="1" rx="10" />
      <CornerTicks color={accent} />
    </svg>
  );
}
