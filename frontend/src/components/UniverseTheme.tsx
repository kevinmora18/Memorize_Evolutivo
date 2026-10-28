import type { ReactNode } from 'react';
import type { UniverseId } from '../lib/archivoTokens';

interface UniverseThemeProps {
  universe: UniverseId;
  children: ReactNode;
}

export function UniverseTheme({ universe, children }: UniverseThemeProps) {
  return (
    <div data-universe={universe} className="contents">
      {children}
    </div>
  );
}
