import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { configureHelmet } from './middleware/helmet.js';
import contactRouter from './routes/contact.js';
import projectsRouter from './routes/projects.js';

const app  = express();
const PORT = process.env.PORT || 5000;

/* ──────────────────────────────────────────────────────────── */
/*  Global Security Middleware                                  */
/* ──────────────────────────────────────────────────────────── */

// 1. Helmet — sets 11+ secure HTTP headers
app.use(configureHelmet());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);

    // 1. Allow Localhost for development
    const isLocalhost = origin === 'http://localhost:5173';
    
    // 2. Allow any Netlify domain (*.netlify.app) using Regex
    const isNetlify = /^https:\/\/[a-zA-Z0-9-]+\.netlify\.app$/.test(origin);
    
    // 3. Fallback to explicit FRONTEND_URL if set in env variables
    const isAllowedEnv = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

    if (isLocalhost || isNetlify || isAllowedEnv) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Handles pre-flight OPTIONS requests
}));

// 3. Body parsing — size-capped to prevent payload flooding
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

/* ──────────────────────────────────────────────────────────── */
/*  Routes                                                      */
/* ──────────────────────────────────────────────────────────── */
app.use('/api/contact', contactRouter);
app.use('/api/projects', projectsRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 404 catch-all — no stack traces, no route disclosure
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not Found' }));

// Global error handler — never leak internals
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

/* ──────────────────────────────────────────────────────────── */
/*  Start                                                       */
/* ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\u2705 Portfolio API running on http://localhost:${PORT}`);
  console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   SMTP_HOST    : ${process.env.SMTP_HOST   || '⚠️  NOT SET'}`);
  console.log(`   SMTP_USER    : ${process.env.SMTP_USER   || '⚠️  NOT SET'}`);
  console.log(`   SMTP_PASS    : ${process.env.SMTP_PASS   ? '✅ loaded (hidden)' : '⚠️  NOT SET'}`);
  console.log(`   RECEIVER     : ${process.env.RECEIVER_EMAIL || '⚠️  NOT SET'}`);
  console.log(`   CORS origin  : ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
});

// Export the Express API for Vercel Serverless Functions
export default app;
