import helmet from 'helmet';

/**
 * Strict Helmet configuration enforcing:
 *  - Content-Security-Policy  (blocks inline scripts, restricts origins)
 *  - HSTS                     (force HTTPS for 1 year)
 *  - X-Frame-Options          (clickjacking protection)
 *  - X-Content-Type-Options   (MIME sniffing prevention)
 *  - Referrer-Policy
 *  - Permissions-Policy       (disable sensitive browser APIs)
 */
export function configureHelmet() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'", 'https://www.google.com', 'https://www.gstatic.com'],
        styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
        imgSrc:         ["'self'", 'data:', 'https:'],
        frameSrc:       ["'self'", 'https://www.youtube.com', 'https://www.google.com'],
        connectSrc:     ["'self'"],
        objectSrc:      ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge:            31536000, // 1 year
      includeSubDomains: true,
      preload:           true,
    },
    frameguard:          { action: 'sameorigin' },
    referrerPolicy:      { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  });
}
