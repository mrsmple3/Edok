import serveStatic from 'serve-static';
import { fromNodeMiddleware } from 'h3';
import { extname } from 'path';
import { getPublicRoot, getUploadsRoot } from '~/server/utils/storage';

export default fromNodeMiddleware((req, res, next) => {
  const ext = extname(req.url || '').toLowerCase();

  if (ext === '.p7b') {
    res.setHeader('Content-Type', 'application/x-pkcs7-certificates');
  } else if (ext === '.json') {
    res.setHeader('Content-Type', 'application/json');
  }

  if ((req.url || '').startsWith('/uploads/')) {
    const relativeUrl = (req.url || '').replace(/^\/uploads\/?/, '');
    req.url = `/${relativeUrl}`;
    return serveStatic(getUploadsRoot(), {
      index: false,
    })(req, res, next);
  }

  return serveStatic(getPublicRoot(), {
    index: false,
  })(req, res, next);
});
