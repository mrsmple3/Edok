export function normalizeFileUrl(filePath?: string | null) {
  const normalizedPath = (filePath || '').trim().replace(/\\/g, '/');

  if (!normalizedPath) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('//')) {
    if (typeof window === 'undefined') {
      return `https:${normalizedPath}`;
    }

    return `${window.location.protocol}${normalizedPath}`;
  }

  const relativePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

  if (typeof window === 'undefined') {
    return relativePath;
  }

  return new URL(relativePath, window.location.origin).toString();
}
