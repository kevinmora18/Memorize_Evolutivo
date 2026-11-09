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
  showText?: boolean;
  children: ReactNode;
}

export function CardFrame({ rarity, accent, children }: CardFrameProps) {
  const rarityColor = rarity ? RARITY_TOKENS[rarity].color : accent;
  const isLegendary = rarity === 'legendaria';

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: 'var(--an-radius-card)',
        border: `1.5px solid ${rarityColor}66`,
        boxShadow: 'var(--an-shadow-card)',
        background: 'var(--an-surface)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 'calc(var(--an-radius-card) - 1px)' }}>
        {children}
      </div>

      {isLegendary && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ borderRadius: 'var(--an-radius-card)', mixBlendMode: 'screen' }}
        >
          <div className="an-sheen" style={{ left: 0 }} />
        </div>
      )}
    </div>
  );
}
