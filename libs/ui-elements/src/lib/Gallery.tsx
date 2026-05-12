import React from 'react';
import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

interface GalleryItem { alt: string; imageUrl?: string }

export interface GalleryProps {
  content: { title?: string; items: GalleryItem[] };
  variant: 'grid' | 'masonry' | 'minimal';
  theme: Theme;
}

function GalleryImage({ item, i, className, style }: { item: GalleryItem; i: number; className?: string; style?: React.CSSProperties }) {
  const hue = (i * 53) % 360;
  if (item.imageUrl) {
    return (
      <div className={`overflow-hidden rounded-xl ${className ?? ''}`} style={style}>
        <img
          src={item.imageUrl}
          alt={item.alt}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl ${className ?? ''}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue},55%,55%), hsl(${hue + 40},55%,45%))`, ...style }}
      role="img"
      aria-label={item.alt}
    >
      <span className="text-sm font-medium text-white/70">{item.alt}</span>
    </div>
  );
}

export function Gallery({ content, variant, theme }: GalleryProps) {
  const { title, items } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const altBg       = sectionAltBg(theme.themeMode);

  const sectionTitle = title && (
    <h2 className={`mb-12 text-center text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>
  );

  switch (variant) {

    case 'masonry':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {items.map((item, i) => (
                <GalleryImage
                  key={i}
                  item={item}
                  i={i}
                  className="mb-4 break-inside-avoid h-48 w-full"
                  style={{ height: `${180 + (i % 3) * 60}px` }}
                />
              ))}
            </div>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            {sectionTitle}
            <div className="flex flex-wrap gap-3">
              {items.map((item, i) => (
                <GalleryImage key={i} item={item} i={i} className="h-32 w-32 flex-none" />
              ))}
            </div>
          </div>
        </section>
      );

    case 'grid':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            {sectionTitle}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => (
                <GalleryImage key={i} item={item} i={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </section>
      );
  }
}
