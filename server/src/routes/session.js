'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

/**
 * GET /api/session
 * Returns the demo user record and their profile.
 * In the MVP there is one demo user — no authentication required.
 * Post-hackathon: replace with JWT middleware.
 */
router.get('/', async (_req, res) => {
  try {
    const db = getDb();
    const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@skillbridge.ai';

    const result = await db.execute({
      sql: `
        SELECT u.id, u.email, u.full_name, u.created_at,
               p.id            AS profile_id,
               p.headline,
               p.location,
               p.career_interests,
               p.onboarding_step
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.email = ?
      `,
      args: [demoEmail],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Demo user not found. Re-run the server to seed.' });
    }

    const user = result.rows[0];

    const session = {
      id:        user.id,
      email:     user.email,
      fullName:  user.full_name,
      createdAt: user.created_at,
      profile: {
        id:              user.profile_id,
        headline:        user.headline,
        location:        user.location,
        careerInterests: safeParseJson(user.career_interests, []),
        onboardingStep:  user.onboarding_step,
      },
    };

    res.json({ session });
  } catch (err) {
    console.error('[GET /api/session]', err);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

/**
 * POST /api/session/start
 * Resets the demo session to a clean state (useful for repeated demos).
 */
router.post('/start', async (_req, res) => {
  try {
    const db = getDb();
    const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@skillbridge.ai';

    const userResult = await db.execute({
      sql:  'SELECT id FROM users WHERE email = ?',
      args: [demoEmail],
    });

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const userId = userResult.rows[0].id;

    // Reset profile to blank
    await db.execute({
      sql: `
        UPDATE profiles
        SET headline = NULL, career_interests = '[]', education = '[]',
            experience = '[]', certifications = '[]', projects = '[]',
            about = NULL, onboarding_step = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      args: [userId],
    });

    // Clear all AI-generated data for a clean demo
    await db.execute({ sql: 'DELETE FROM user_skills         WHERE user_id = ?', args: [userId] });
    await db.execute({ sql: 'DELETE FROM opportunity_matches  WHERE user_id = ?', args: [userId] });
    await db.execute({ sql: 'DELETE FROM saved_opportunities  WHERE user_id = ?', args: [userId] });
    await db.execute({ sql: 'DELETE FROM gap_analyses         WHERE user_id = ?', args: [userId] });

    // Delete roadmap progress, then roadmaps
    const roadmapsResult = await db.execute({
      sql:  'SELECT id FROM roadmaps WHERE user_id = ?',
      args: [userId],
    });

    for (const row of roadmapsResult.rows) {
      await db.execute({
        sql:  'DELETE FROM roadmap_progress WHERE roadmap_id = ?',
        args: [row.id],
      });
    }

    await db.execute({ sql: 'DELETE FROM roadmaps WHERE user_id = ?', args: [userId] });

    res.json({ message: 'Demo session reset successfully', userId });
  } catch (err) {
    console.error('[POST /api/session/start]', err);
    res.status(500).json({ error: 'Failed to reset demo session' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeParseJson(value, fallback) {
  try { return JSON.parse(value); }
  catch { return fallback; }
}

module.exports = router;
