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

// 2. CORS — only allow the configured client origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
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
