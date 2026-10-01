import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';
import { resolveArticleImageUrl } from '@/lib/media-url';

type Props = ComponentProps<'img'> & ExtraProps;

export function MarkdownImage({ src, alt }: Props) {
  const imageUrl = typeof src === 'string' ? resolveArticleImageUrl(src) : undefined;
  if (!imageUrl) return null;

  return <img src={imageUrl} alt={alt ?? ''} loading="lazy" decoding="async" className="mx-auto block h-auto max-h-[32rem] max-w-full rounded-lg object-contain" />;
}
