import fetch from 'node-fetch';

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verifies a reCAPTCHA v3 token with Google's API.
 *
 * In development (NODE_ENV !== 'production'), verification is skipped and
 * a mock passing result is returned so devs don't need real keys.
 *
 * @param {string} token  - The token from the client's grecaptcha.execute()
 * @returns {{ success: boolean, score: number, action: string, error?: string }}
 */
export async function verifyRecaptcha(token) {
  // Dev bypass — remove or guard when deploying to production
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[reCAPTCHA] Dev mode: skipping verification, returning mock pass.');
    return { success: true, score: 1.0, action: 'contact' };
  }

  if (!token) {
    return { success: false, score: 0, error: 'Missing reCAPTCHA token.' };
  }

  const params = new URLSearchParams({
    secret:   process.env.RECAPTCHA_SECRET_KEY,
    response: token,
  });

  const response = await fetch(`${VERIFY_URL}?${params}`, { method: 'POST' });
  const data     = await response.json();

  const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

  if (!data.success) {
    return { success: false, score: 0, error: 'reCAPTCHA verification failed.', codes: data['error-codes'] };
  }

  if (data.score < minScore) {
    return { success: false, score: data.score, error: `Low reCAPTCHA score (${data.score}). Suspected bot.` };
  }

  return { success: true, score: data.score, action: data.action };
}
