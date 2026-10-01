const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7210/api/v1').origin;

export function resolveArticleImageUrl(source?: string): string | undefined {
  if (!source) return source;

  try {
    const url = new URL(source, apiOrigin);
    const isUploadedImage = url.pathname.startsWith('/uploads/images/');
    const isLoopbackHost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);

    if (isUploadedImage && (source.startsWith('/uploads/images/') || isLoopbackHost)) {
      return new URL(`${url.pathname}${url.search}${url.hash}`, apiOrigin).toString();
    }

    return source;
  } catch {
    return source;
  }
}
