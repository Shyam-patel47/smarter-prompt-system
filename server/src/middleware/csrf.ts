import { Request, Response, NextFunction } from 'express';

export const requireValidOrigin = (req: Request, res: Response, next: NextFunction) => {
  // Only apply CSRF checks to state-changing requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  // When requests come through Vercel's rewrite proxy, the browser sees
  // it as same-origin, so it may not send an Origin or Referer header.
  // If neither header is present, allow the request (same-origin behavior).
  if (!originHeader && !refererHeader) {
    return next();
  }

  let requestOrigin = '';
  if (originHeader) {
    requestOrigin = originHeader;
  } else if (refererHeader) {
    try {
      const url = new URL(refererHeader);
      requestOrigin = url.origin;
    } catch {
      requestOrigin = '';
    }
  }

  // Exact match against the allowed client URL
  if (requestOrigin && requestOrigin !== clientUrl) {
    console.warn(`[CSRF WARNING] Blocked ${req.method} request to ${req.originalUrl} from unauthorized origin: ${requestOrigin}`);
    return res.status(403).json({ message: 'Forbidden: CSRF protection blocked this request.' });
  }

  next();
};

