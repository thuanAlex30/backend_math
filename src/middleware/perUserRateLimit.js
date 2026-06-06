/**
 * Per-user Rate Limiting Middleware
 * Giới hạn theo userId (nếu đăng nhập) HOẶC IP (guest)
 * Dùng Map + rolling window (5 phút)
 */
const WINDOW_MS = 5 * 60 * 1000; // 5 phút
const MAX_FREE = 60; // guest
const MAX_AUTH = 200; // đăng nhập

// Map<key, { count: number, resetAt: number }>
const userBuckets = new Map();

function getKey(req) {
  const uid = req.user?.id;
  return uid
    ? `user:${uid}`
    : `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
}

function cleanExpired(now) {
  for (const [key, val] of userBuckets) {
    if (val.resetAt <= now) userBuckets.delete(key);
  }
}

export function perUserLimiter(req, res, next) {
  // Bỏ qua health/ping
  if (req.path === '/api/health' || req.path === '/health') return next();

  const now = Date.now();
  cleanExpired(now);

  const key = getKey(req);
  const max = req.user?.id ? MAX_AUTH : MAX_FREE;
  let bucket = userBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    userBuckets.set(key, bucket);
  }

  bucket.count++;
  userBuckets.set(key, bucket);

  const remaining = Math.max(0, max - bucket.count);
  const resetIn = Math.ceil((bucket.resetAt - now) / 1000);

  res.setHeader('X-RateLimit-Limit', max);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(bucket.resetAt / 1000));

  if (bucket.count > max) {
    return res.status(429).json({
      error: 'Quá nhiều yêu cầu. Vui lòng chờ vài phút.',
      retryAfter: resetIn,
      limit: max,
    });
  }

  next();
}

/** Middleware nhẹ — áp dụng sau verifyToken (nếu có) */
export function applyRateLimit(req, _res, next) {
  // Skip health
  if (req.path?.includes('health')) return next();
  perUserLimiter(req, {}, next);
}
