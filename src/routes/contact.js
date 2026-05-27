import { Router } from 'express';
import { contactValidationRules, validateContactForm } from '../middleware/sanitize.js';
import { contactLimiter } from '../middleware/rateLimit.js';
import { verifyRecaptcha } from '../services/recaptcha.js';
import { sendContactEmail } from '../services/mailer.js';

const router = Router();

/**
 * POST /api/contact
 *
 * Security layers (in order):
 *  1. contactLimiter      — IP-based rate limit (3/15 min)
 *  2. contactValidationRules — express-validator: trim, escape, type checks
 *  3. validateContactForm  — error aggregation + DNS MX check + DOMPurify sweep
 *  4. verifyRecaptcha     — Google reCAPTCHA v3 server-side verification
 *  5. sendContactEmail    — Nodemailer dispatch
 */
router.post(
  '/',
  contactLimiter,
  contactValidationRules,
  validateContactForm,
  async (req, res) => {
    try {
      const { name, email, message, recaptchaToken } = req.body;

      // reCAPTCHA v3 server-side check
      const captcha = await verifyRecaptcha(recaptchaToken);
      if (!captcha.success) {
        return res.status(403).json({
          success: false,
          error: captcha.error || 'Bot detection triggered. Please try again.',
        });
      }

      await sendContactEmail({ name, email, message });

      return res.status(200).json({
        success: true,
        message: 'Your message was sent successfully! I\'ll be in touch soon.',
      });
    } catch (err) {
      // Full error exposed in terminal for debugging — never sent to client
      console.error('[Contact Route Error] Full details:');
      console.error('  Message :', err.message);
      console.error('  Code    :', err.code);      // e.g. ECONNREFUSED, EAUTH
      console.error('  Response:', err.response);  // Nodemailer SMTP response
      console.error('  Stack   :', err.stack);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      });
    }
  }
);

export default router;
