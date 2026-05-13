import { isDark, sectionAltBg } from './theme.js';
import type { Theme } from './theme.js';

const PRIMARY = 'var(--color-primary)';

export interface VideoEmbedProps {
  content: {
    title?: string;
    subtitle?: string;
    videoUrl?: string;
    caption?: string;
  };
  variant: 'centered' | 'split' | 'minimal';
  theme: Theme;
}

// Convert a YouTube or Vimeo watch URL to its embed equivalent.
// Returns null for unrecognised origins — those get the placeholder.
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube: youtube.com/watch?v=ID  or  youtu.be/ID
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // Vimeo: vimeo.com/ID
    if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com') {
      const id = u.pathname.slice(1).split('/')[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { /* invalid URL */ }
  return null;
}

function VideoFrame({ videoUrl, title }: { videoUrl?: string; title?: string }) {
  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title ?? 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full rounded-2xl"
      />
    );
  }

  // Placeholder — shown when no URL or unrecognised origin
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
      style={{ background: `linear-gradient(135deg, #1e1e2e, #2d2d44)` }}
      aria-label="Video placeholder"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full opacity-90"
        style={{ backgroundColor: PRIMARY }}
      >
        <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7 translate-x-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <p className="mt-4 text-sm text-white/50">
        {videoUrl ? 'Unsupported video source' : 'Add a YouTube or Vimeo URL'}
      </p>
    </div>
  );
}

export function VideoEmbed({ content, variant, theme }: VideoEmbedProps) {
  const { title, subtitle, videoUrl, caption } = content;
  const dark = isDark(theme.themeMode);
  const textPrimary = dark ? 'text-white'   : 'text-gray-900';
  const textMuted   = dark ? 'text-gray-400' : 'text-gray-500';
  const altBg       = sectionAltBg(theme.themeMode);

  // 16:9 aspect-ratio wrapper
  const frame = (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl" style={{ paddingBottom: '56.25%' }}>
      <VideoFrame videoUrl={videoUrl} title={title} />
    </div>
  );

  switch (variant) {

    case 'split':
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1">
                {title && <h2 className={`text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>}
                {subtitle && <p className={`mt-4 text-lg leading-relaxed ${textMuted}`}>{subtitle}</p>}
                {caption && <p className={`mt-6 text-sm ${textMuted}`}>{caption}</p>}
              </div>
              <div className="order-1 lg:order-2">{frame}</div>
            </div>
          </div>
        </section>
      );

    case 'minimal':
      return (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            {frame}
            {caption && <p className={`mt-4 text-center text-sm ${textMuted}`}>{caption}</p>}
          </div>
        </section>
      );

    case 'centered':
    default:
      return (
        <section className={`px-6 py-24 ${altBg} sm:py-32`}>
          <div className="mx-auto max-w-4xl text-center">
            {title && <h2 className={`mb-4 text-3xl font-extrabold ${textPrimary} sm:text-4xl`}>{title}</h2>}
            {subtitle && <p className={`mb-10 text-lg ${textMuted}`}>{subtitle}</p>}
            {frame}
            {caption && <p className={`mt-6 text-sm ${textMuted}`}>{caption}</p>}
          </div>
        </section>
      );
  }
}
