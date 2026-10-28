import type { ReactNode } from 'react';
import { RARITY_TOKENS } from '../../lib/archivoTokens';
import type { Rarity } from '../../lib/archivoTokens';

interface CardFrameProps {
  name?: string;
  code?: string;
  rarity?: Rarity;
  accent: string;
  revealed: boolean;
  compact?: boolean;
  children: ReactNode;
}

function RarityPips({ rarity, color }: { rarity: Rarity; color: string }) {
  const token = RARITY_TOKENS[rarity];
  if (rarity === 'anomalia') {
    return (
      <span className="an-seal" style={{ color }}>
        ANOMALÍA
      </span>
    );
  }
  return (
    <span className="flex items-center gap-[3px]">
      {Array.from({ length: 4 }, (_, i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rotate-45"
          style={{
            background: i < token.pips ? color : 'transparent',
            border: `1px solid ${i < token.pips ? color : 'rgba(92,102,117,0.45)'}`,
          }}
        />
      ))}
    </span>
  );
}

export function CardFrame({ name, code, rarity, accent, revealed, compact, children }: CardFrameProps) {
  const rarityColor = rarity ? RARITY_TOKENS[rarity].color : accent;
  const isLegendary = rarity === 'legendaria';

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: 'var(--an-radius-card)',
        border: '1px solid var(--an-line-strong)',
        boxShadow: 'var(--an-shadow-card)',
        background: 'var(--an-surface)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 'calc(var(--an-radius-card) - 1px)' }}>
        {children}
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 'var(--an-radius-card)',
          boxShadow: `inset 0 0 0 1px rgba(5,7,12,0.6), inset 0 0 26px rgba(5,7,12,0.55)`,
        }}
      />

      {isLegendary && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ borderRadius: 'var(--an-radius-card)', mixBlendMode: 'screen' }}
        >
          <div className="an-sheen" style={{ left: 0 }} />
        </div>
      )}

      {rarity === 'anomalia' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 'var(--an-radius-card)',
            background:
              'repeating-linear-gradient(45deg, rgba(194,75,255,0.10) 0 6px, transparent 6px 14px)',
          }}
        />
      )}

      <div className="absolute top-2 right-2 z-10 pointer-events-none">
        <RarityPips rarity={rarity ?? 'comun'} color={rarityColor} />
      </div>

      <span className="an-corner top-1.5 left-1.5 border-l border-t" />
      <span className="an-corner top-1.5 right-1.5 border-r border-t" />
      <span className="an-corner bottom-1.5 left-1.5 border-l border-b" />
      <span className="an-corner bottom-1.5 right-1.5 border-r border-b" />

      {name && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none transition-all duration-300"
          style={{
            padding: compact ? '14px 10px 8px' : '24px 12px 10px',
            background: 'linear-gradient(180deg, transparent, rgba(5,7,12,0.62) 45%, rgba(5,7,12,0.94))',
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(8px)',
          }}
        >
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              {code && (
                <div className="an-mono text-[8px] tracking-[0.22em]" style={{ color: accent, opacity: 0.9 }}>
                  {code}
                </div>
              )}
              <div
                className="an-title truncate"
                style={{ fontSize: compact ? 13 : 16, lineHeight: 1.15, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
              >
                {name}
              </div>
            </div>
            <div className="an-label shrink-0 pb-[2px] hidden sm:block">{rarity ? RARITY_TOKENS[rarity].label : ''}</div>
          </div>
          <div
            className="mt-1.5 h-px w-full"
            style={{ background: `linear-gradient(90deg, ${rarityColor}00, ${rarityColor}88, ${rarityColor}00)` }}
          />
        </div>
      )}
    </div>
  );
}
