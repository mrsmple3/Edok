import serveStatic from 'serve-static';
import { fromNodeMiddleware } from 'h3';
import { join, extname } from 'path';

export default fromNodeMiddleware((req, res, next) => {
  const ext = extname(req.url || '').toLowerCase();

  if (ext === '.p7b') {
    res.setHeader('Content-Type', 'application/x-pkcs7-certificates');
  } else if (ext === '.json') {
    res.setHeader('Content-Type', 'application/json');
  }

  return serveStatic(join(process.cwd(), 'public'), {
    index: false,
  })(req, res, next);
});
