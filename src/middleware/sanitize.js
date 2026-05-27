import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import dns from 'dns';

/* ------------------------------------------------------------------ */
/*  Validation chain — runs in order                                   */
/* ------------------------------------------------------------------ */
export const contactValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.')
    .escape(),                        // converts <, >, &, ', " to HTML entities

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail()
    .isLength({ max: 254 }),          // RFC 5321 max length

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required.')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters.')
    .escape(),
];

/* ------------------------------------------------------------------ */
/*  MX record check — rejects domains with no mail server             */
/* ------------------------------------------------------------------ */
async function domainHasMxRecord(email) {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const records = await dns.promises.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;          // NXDOMAIN or lookup failure → reject
  }
}

/* ------------------------------------------------------------------ */
/*  Middleware: check validation errors + MX + DOMPurify sweep        */
/* ------------------------------------------------------------------ */
export async function validateContactForm(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }

  // Advanced email domain validation via DNS MX lookup
  const mxValid = await domainHasMxRecord(req.body.email);
  if (!mxValid) {
    return res.status(422).json({
      success: false,
      errors: [{ field: 'email', message: 'Email domain does not accept mail. Please use a real email address.' }],
    });
  }

  // Final DOMPurify sweep on all string fields (defence-in-depth)
  const purify = (str) => DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  req.body.name    = purify(req.body.name);
  req.body.message = purify(req.body.message);
  req.body.email   = purify(req.body.email);

  next();
}
