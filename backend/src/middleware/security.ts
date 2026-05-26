import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// 1. Logging and Security Auditor
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  // Only target API transactions to avoid logging frontend static/source files like ErrorBoundary.tsx
  if (!req.path.startsWith('/api')) {
    return next();
  }
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  console.log(`[SECURITY AUDIT LOG] - ${new Date().toISOString()} - IP: ${ip} - Method: ${req.method} - URL: ${req.originalUrl} - Agent: ${userAgent}`);
  next();
}

// 2. SQL Injection and Common XSS Shield (Sanitization checks)
// NOTE: The shield targets actual injection patterns ONLY.
// French apostrophes (l'adresse, N'Goran, etc.) are explicitly allowed.
export function sqlAndXssShield(req: Request, res: Response, next: NextFunction) {
  // Only inspect API payload requests
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const xssPattern = /(<script[\s>]|<iframe[\s>]|<object[\s>]|<embed[\s>]|javascript\s*:|on(?:click|error|mouseover|load|focus)\s*=)/i;

  // Genuine SQL injection patterns — NOT triggered by a lone French apostrophe
  const sqlInjectionPatterns: RegExp[] = [
    /'\s*(or|and)\s+['"\d]/i,            // ' OR '1 / ' AND "1
    /'\s*--/,                              // ' -- (comment terminator after injection)
    /'\s*;/,                               // '; (statement separator)
    /\bunion\s+(all\s+)?select\b/i,        // UNION SELECT
    /\bselect\b.{0,100}\bfrom\b/i,        // SELECT ... FROM
    /\binsert\s+into\b/i,                  // INSERT INTO
    /\bdelete\s+from\b/i,                  // DELETE FROM
    /\bupdate\b.{0,60}\bset\b/i,          // UPDATE table SET
    /\b(drop|truncate)\s+table\b/i,        // DROP TABLE / TRUNCATE TABLE
    /\/\*[\s\S]*?\*\//,                    // /* block comment */
  ];

  const sqlResultCheck = (str: string): boolean => {
    if (xssPattern.test(str)) return true;
    return sqlInjectionPatterns.some(p => p.test(str));
  };

  const inspectValue = (val: any): boolean => {
    if (typeof val === 'string') {
      return sqlResultCheck(val);
    } else if (val && typeof val === 'object' && !(val instanceof Date)) {
      for (const key of Object.keys(val)) {
        if (inspectValue(val[key])) return true;
      }
    }
    return false;
  };

  if (inspectValue(req.body) || inspectValue(req.query) || inspectValue(req.params)) {
    console.warn(`[SECURITY SHIELD] Injection pattern detected — IP: ${req.ip} — URL: ${req.originalUrl}`);
    res.status(400).json({ 
      error: 'Requête suspecte ou malveillante rejetée pour préserver l\'intégrité des données d\'Abidjan.',
      code: 'SECURITY_SHIELD_TRIGGERED'
    });
    return;
  }

  next();
}

// 3. CORS Secured Configuration
export const securedCors = cors({
  origin: (origin, callback) => {
    // For AI Studio iframe and local developments, we allow all origins during preview, but secure custom protocols
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-akpbf-signature'],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24h
});

// 4. Rate Limiting Protection (Anti DDoS and Force brute)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 mins window
  message: { error: 'Nombre maximal de requêtes globales dépassé pour cet IP. Veuillez patienter.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.path.startsWith('/api'),
  validate: { trustProxy: false },
});

// 5. Speed Damping (Slow Down)
export const speedDampener = (slowDown as any)({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Slow down requests after 100 queries are made
  delayMs: () => 500, // Add 500ms delay to each request above threshold
  skip: (req: any) => !req.path.startsWith('/api'),
});

// 6. Secure security headers using Helmet
export const customHelmet = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com", "https://unpkg.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      "img-src": ["'self'", "data:", "https://*"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "https://unpkg.com"],
      "connect-src": ["'self'", "wss:", "ws:", "https://*"],
      "frame-ancestors": ["'self'", "https://*.google.com", "https://*.run.app", "https://*.replit.dev", "https://*.replit.app", "https://*.repl.co"],
      "upgrade-insecure-requests": [],
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year of Force HTTPS (HSTS)
    includeSubDomains: true,
    preload: true
  },
  xXssProtection: true, // X-XSS-Protection header
  noSniff: true,        // X-Content-Type-Options header
  referrerPolicy: { policy: 'no-referrer' }, // Referrer-Policy header
});
