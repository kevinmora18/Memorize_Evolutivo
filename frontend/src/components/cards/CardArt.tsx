import { useRef, useState } from 'react';
import { artBasePath, getCardById } from '../../lib/cardCatalog';
import { UNIVERSE_TOKENS } from '../../lib/archivoTokens';
import { ProceduralEmblem } from './ProceduralEmblem';

const FAILED_ART = new Set<string>();

interface CardArtProps {
  artId?: string;
  fallbackEmoji?: string;
  accent?: string;
  alt?: string;
  priority?: boolean;
  className?: string;
}

export function CardArt({ artId, fallbackEmoji, accent, alt, priority, className }: CardArtProps) {
  const [failed, setFailed] = useState(() => (artId ? FAILED_ART.has(artId) : false));
  const imgRef = useRef<HTMLImageElement>(null);
  const card = artId ? getCardById(artId) : undefined;

  if (!card) {
    if (!fallbackEmoji) return null;
    return (
      <div className={`w-full h-full flex items-center justify-center ${className ?? ''}`}>
        <span
          className="text-5xl leading-none select-none"
          style={{ filter: `drop-shadow(0 0 14px ${accent ?? '#35E0C8'}55)` }}
        >
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  const token = UNIVERSE_TOKENS[card.universe];
  const color = accent ?? token.accent;
  const base = artBasePath(card);

  if (failed) {
    return <ProceduralEmblem seedKey={card.id} universe={card.universe} accent={color} className={`w-full h-full ${className ?? ''}`} />;
  }

  return (
    <picture className={className}>
      <source
        type="image/avif"
        srcSet={`${base}-256.avif 256w, ${base}-512.avif 512w`}
        sizes="(max-width: 640px) 34vw, 240px"
      />
      <source
        type="image/webp"
        srcSet={`${base}-256.webp 256w, ${base}-512.webp 512w`}
        sizes="(max-width: 640px) 34vw, 240px"
      />
      <img
        ref={imgRef}
        src={`${base}-512.webp`}
        width={512}
        height={512}
        alt={alt ?? card.name}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className="w-full h-full object-cover"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${color}1F, ${token.deep} 72%)`,
        }}
        onLoad={() => {
          imgRef.current?.decode?.().catch(() => {});
        }}
        onError={() => {
          FAILED_ART.add(card.id);
          setFailed(true);
        }}
      />
    </picture>
  );
}
