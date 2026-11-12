'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDatabase } = require('./db/database');

// Route modules
const sessionRoutes = require('./routes/session');
const healthRoutes  = require('./routes/health');
const profileRoutes       = require('./routes/profile');
const skillsRoutes        = require('./routes/skills');
const opportunitiesRoutes = require('./routes/opportunities');
const gapsRoutes          = require('./routes/gaps');

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health',   healthRoutes);
app.use('/api/session',  sessionRoutes);
app.use('/api/profile',  profileRoutes);
app.use('/api/skills',         skillsRoutes);
app.use('/api/opportunities',  opportunitiesRoutes);
app.use('/api/gaps',           gapsRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start — database must be ready before accepting requests ─────────────────
(async () => {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`\n✅  SkillBridge AI server running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
      console.log(`   Session:      http://localhost:${PORT}/api/session\n`);
    });
  } catch (err) {
    console.error('❌  Failed to initialise database:', err);
    process.exit(1);
  }
})();

module.exports = app;
