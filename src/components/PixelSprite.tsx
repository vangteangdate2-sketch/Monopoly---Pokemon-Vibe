import React from 'react';
import type { ElementType } from '../types/game';

interface PixelSpriteProps {
  primaryColor: string;
  secondaryColor: string;
  type: ElementType;
  isLegendary?: boolean;
  size?: number;
  className?: string;
}

export const PixelPokemonSprite: React.FC<PixelSpriteProps> = ({
  primaryColor,
  secondaryColor,
  type,
  isLegendary = false,
  size = 44,
  className = '',
}) => {
  // Crisp 12x12 pixel-art silhouette varied by elemental type & legendary aura
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {isLegendary && (
        <>
          <rect x="1" y="1" width="1" height="1" fill="#FACC15" />
          <rect x="10" y="1" width="1" height="1" fill="#FACC15" />
          <rect x="1" y="10" width="1" height="1" fill="#FACC15" />
          <rect x="10" y="10" width="1" height="1" fill="#FACC15" />
        </>
      )}

      {type === 'Electric' && (
        <>
          <rect x="3" y="1" width="1" height="2" fill="#0F172A" />
          <rect x="8" y="1" width="1" height="2" fill="#0F172A" />
          <rect x="3" y="3" width="6" height="6" fill={primaryColor} />
          <rect x="2" y="4" width="8" height="4" fill={primaryColor} />
          <rect x="4" y="4" width="1" height="1" fill="#0F172A" />
          <rect x="7" y="4" width="1" height="1" fill="#0F172A" />
          <rect x="3" y="6" width="1" height="1" fill={secondaryColor} />
          <rect x="8" y="6" width="1" height="1" fill={secondaryColor} />
          <rect x="10" y="3" width="1" height="3" fill={primaryColor} />
          <rect x="9" y="5" width="2" height="1" fill={primaryColor} />
          <rect x="3" y="9" width="2" height="2" fill={primaryColor} />
          <rect x="7" y="9" width="2" height="2" fill={primaryColor} />
        </>
      )}

      {type === 'Fire' && (
        <>
          <rect x="4" y="1" width="4" height="2" fill={secondaryColor} />
          <rect x="3" y="3" width="6" height="6" fill={primaryColor} />
          <rect x="1" y="4" width="2" height="3" fill={secondaryColor} />
          <rect x="9" y="4" width="2" height="3" fill={secondaryColor} />
          <rect x="4" y="4" width="1" height="1" fill="#FFFFFF" />
          <rect x="7" y="4" width="1" height="1" fill="#FFFFFF" />
          <rect x="4" y="7" width="4" height="2" fill="#FEF08A" />
          <rect x="3" y="9" width="2" height="2" fill={primaryColor} />
          <rect x="7" y="9" width="2" height="2" fill={primaryColor} />
        </>
      )}

      {type === 'Water' && (
        <>
          <rect x="4" y="2" width="4" height="2" fill={primaryColor} />
          <rect x="2" y="4" width="8" height="5" fill={primaryColor} />
          <rect x="3" y="5" width="6" height="3" fill={secondaryColor} />
          <rect x="4" y="3" width="1" height="1" fill="#0F172A" />
          <rect x="7" y="3" width="1" height="1" fill="#0F172A" />
          <rect x="1" y="6" width="1" height="2" fill={primaryColor} />
          <rect x="10" y="6" width="1" height="2" fill={primaryColor} />
          <rect x="3" y="9" width="2" height="2" fill={primaryColor} />
          <rect x="7" y="9" width="2" height="2" fill={primaryColor} />
        </>
      )}

      {type === 'Grass' && (
        <>
          <rect x="4" y="1" width="4" height="2" fill={secondaryColor} />
          <rect x="3" y="2" width="6" height="1" fill="#4ADE80" />
          <rect x="2" y="3" width="8" height="6" fill={primaryColor} />
          <rect x="4" y="5" width="1" height="1" fill="#FFFFFF" />
          <rect x="7" y="5" width="1" height="1" fill="#FFFFFF" />
          <rect x="5" y="7" width="2" height="1" fill="#0F172A" />
          <rect x="2" y="9" width="2" height="2" fill={primaryColor} />
          <rect x="8" y="9" width="2" height="2" fill={primaryColor} />
        </>
      )}

      {type === 'Rock' && (
        <>
          <rect x="4" y="1" width="4" height="3" fill={primaryColor} />
          <rect x="2" y="4" width="8" height="4" fill={primaryColor} />
          <rect x="3" y="5" width="6" height="2" fill={secondaryColor} />
          <rect x="4" y="2" width="1" height="1" fill="#0F172A" />
          <rect x="7" y="2" width="1" height="1" fill="#0F172A" />
          <rect x="3" y="8" width="6" height="3" fill={primaryColor} />
        </>
      )}

      {type === 'Psychic' && (
        <>
          <rect x="3" y="1" width="2" height="2" fill={primaryColor} />
          <rect x="7" y="1" width="2" height="2" fill={primaryColor} />
          <rect x="3" y="3" width="6" height="6" fill={primaryColor} />
          <rect x="5" y="2" width="2" height="1" fill={secondaryColor} />
          <rect x="4" y="4" width="1" height="1" fill="#FFFFFF" />
          <rect x="7" y="4" width="1" height="1" fill="#FFFFFF" />
          <rect x="2" y="6" width="8" height="2" fill={secondaryColor} />
          <rect x="4" y="9" width="4" height="2" fill={primaryColor} />
        </>
      )}

      {type === 'Dragon' && (
        <>
          <rect x="2" y="2" width="2" height="2" fill={secondaryColor} />
          <rect x="8" y="2" width="2" height="2" fill={secondaryColor} />
          <rect x="4" y="2" width="4" height="3" fill={primaryColor} />
          <rect x="2" y="5" width="8" height="4" fill={primaryColor} />
          <rect x="4" y="6" width="4" height="2" fill={secondaryColor} />
          <rect x="4" y="3" width="1" height="1" fill="#FACC15" />
          <rect x="7" y="3" width="1" height="1" fill="#FACC15" />
          <rect x="3" y="9" width="2" height="2" fill={primaryColor} />
          <rect x="7" y="9" width="2" height="2" fill={primaryColor} />
        </>
      )}

      {type === 'Ice' && (
        <>
          <rect x="5" y="1" width="2" height="2" fill={secondaryColor} />
          <rect x="3" y="3" width="6" height="6" fill={primaryColor} />
          <rect x="1" y="5" width="2" height="2" fill={secondaryColor} />
          <rect x="9" y="5" width="2" height="2" fill={secondaryColor} />
          <rect x="4" y="4" width="1" height="1" fill="#0F172A" />
          <rect x="7" y="4" width="1" height="1" fill="#0F172A" />
          <rect x="5" y="6" width="2" height="2" fill="#FFFFFF" />
          <rect x="4" y="9" width="4" height="2" fill={secondaryColor} />
        </>
      )}
    </svg>
  );
};

export const PixelBadgeIcon: React.FC<{ color: string; size?: number }> = ({
  color,
  size = 18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 10 10"
    shapeRendering="crispEdges"
    className="shrink-0"
    aria-hidden="true"
  >
    <rect x="3" y="1" width="4" height="1" fill="#0F172A" />
    <rect x="2" y="2" width="6" height="6" fill={color} />
    <rect x="1" y="3" width="8" height="4" fill={color} />
    <rect x="3" y="3" width="2" height="2" fill="#FFFFFF" opacity="0.7" />
    <rect x="3" y="8" width="4" height="1" fill="#0F172A" />
  </svg>
);

export const PixelPokeball: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = '#E11D48',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    className="shrink-0"
    aria-hidden="true"
  >
    <rect x="3" y="1" width="6" height="1" fill="#0F172A" />
    <rect x="2" y="2" width="8" height="3" fill={color} />
    <rect x="1" y="3" width="10" height="2" fill={color} />
    <rect x="1" y="5" width="10" height="2" fill="#0F172A" />
    <rect x="1" y="7" width="10" height="2" fill="#F8FAFC" />
    <rect x="2" y="9" width="8" height="1" fill="#CBD5E1" />
    <rect x="3" y="10" width="6" height="1" fill="#0F172A" />
    <rect x="5" y="5" width="2" height="2" fill="#F8FAFC" />
  </svg>
);
