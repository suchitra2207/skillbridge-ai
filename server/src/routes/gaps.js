'use strict';

const express = require('express');
const router  = express.Router();
const { getDb }          = require('../db/database');
const { analyseGap, analyseSummary } = require('../services/gapAnalyser');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/gaps/summary
// Returns readiness scores across all opportunities — used by the dashboard.
// Must be declared BEFORE /:opportunityId.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', async (_req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const skillsResult = await db.execute({
      sql:  'SELECT skill_name FROM user_skills WHERE user_id = ? AND confirmed_by_user = 1',
      args: [userId],
    });
    const userSkillNames = skillsResult.rows.map(r => r.skill_name);

    const summary = analyseSummary(userSkillNames);
    res.json({ summary, userSkillCount: userSkillNames.length });
  } catch (err) {
    console.error('[GET /api/gaps/summary]', err);
    res.status(500).json({ error: 'Failed to generate gap summary' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/gaps/:opportunityId
// Returns full gap analysis for a specific opportunity.
// Results are cached in gap_analyses table; always recomputed (skills may change).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:opportunityId', async (req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const skillsResult = await db.execute({
      sql:  'SELECT skill_name FROM user_skills WHERE user_id = ? AND confirmed_by_user = 1',
      args: [userId],
    });
    const userSkillNames = skillsResult.rows.map(r => r.skill_name);

    // Analyse (always fresh — skills change over time)
    const gap = analyseGap(userSkillNames, req.params.opportunityId);

    // Fetch skill progress for the missing skills
    const progressResult = await db.execute({
      sql:  'SELECT skill_name, status FROM skill_progress WHERE user_id = ?',
      args: [userId],
    });
    const progressMap = {};
    for (const row of progressResult.rows) {
      progressMap[row.skill_name] = row.status;
    }

    // Annotate recommendations with tracked progress
    const recommendations = gap.recommendations.map(r => ({
      ...r,
      progress: progressMap[r.skillName] || null,
    }));

    // Cache in gap_analyses (upsert)
    const gapId = require('crypto').randomUUID();
    await db.execute({
      sql: `
        INSERT INTO gap_analyses
          (id, user_id, opportunity_id, present_skills, missing_skills,
           missing_preferred, transferable, readiness_score, skill_recommendations, gap_explanation)
        VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)
        ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
          present_skills        = excluded.present_skills,
          missing_skills        = excluded.missing_skills,
          missing_preferred     = excluded.missing_preferred,
          readiness_score       = excluded.readiness_score,
          skill_recommendations = excluded.skill_recommendations,
          gap_explanation       = excluded.gap_explanation
      `,
      args: [
        gapId,
        userId,
        req.params.opportunityId,
        JSON.stringify(gap.presentRequired),
        JSON.stringify(gap.missingRequired),
        JSON.stringify(gap.missingPreferred),
        gap.readinessScore,
        JSON.stringify(recommendations),
        `Readiness: ${gap.readinessScore}%. ${gap.missingRequired.length} required skill(s) to develop.`,
      ],
    });

    res.json({ gap: { ...gap, recommendations } });
  } catch (err) {
    if (err.message?.startsWith('Opportunity not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('[GET /api/gaps/:opportunityId]', err);
    res.status(500).json({ error: 'Failed to analyse skill gap' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/gaps/progress/:skillName
// Tracks learning progress for a specific skill.
// status: 'learning' | 'practising' | 'confident'
// ─────────────────────────────────────────────────────────────────────────────
router.put('/progress/:skillName', async (req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const { status } = req.body;
    const validStatuses = ['learning', 'practising', 'confident'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const skillName = decodeURIComponent(req.params.skillName);

    await db.execute({
      sql: `
        INSERT INTO skill_progress (id, user_id, skill_name, status)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, skill_name) DO UPDATE SET
          status = excluded.status,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [require('crypto').randomUUID(), userId, skillName, status],
    });

    res.json({ message: 'Progress updated', skillName, status });
  } catch (err) {
    console.error('[PUT /api/gaps/progress/:skillName]', err);
    res.status(500).json({ error: 'Failed to update skill progress' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/gaps/progress/:skillName
// Removes progress tracking for a skill (resets to untracked).
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/progress/:skillName', async (req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const skillName = decodeURIComponent(req.params.skillName);

    await db.execute({
      sql:  'DELETE FROM skill_progress WHERE user_id = ? AND skill_name = ?',
      args: [userId, skillName],
    });

    res.json({ message: 'Progress tracking removed', skillName });
  } catch (err) {
    console.error('[DELETE /api/gaps/progress/:skillName]', err);
    res.status(500).json({ error: 'Failed to remove skill progress' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/gaps/progress/all
// Returns all tracked skill progress for the user.
// Must be declared BEFORE /:opportunityId.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/progress/all', async (_req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const result = await db.execute({
      sql:  'SELECT skill_name, status, updated_at FROM skill_progress WHERE user_id = ? ORDER BY updated_at DESC',
      args: [userId],
    });

    res.json({
      progress: result.rows.map(r => ({
        skillName:  r.skill_name,
        status:     r.status,
        updatedAt:  r.updated_at,
      })),
    });
  } catch (err) {
    console.error('[GET /api/gaps/progress/all]', err);
    res.status(500).json({ error: 'Failed to retrieve skill progress' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getDemoUser() {
  const db = getDb();
  const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@skillbridge.ai';
  const result = await db.execute({
    sql:  'SELECT id FROM users WHERE email = ?',
    args: [demoEmail],
  });
  if (result.rows.length === 0) throw new Error('Demo user not found');
  return { userId: result.rows[0].id };
}

module.exports = router;
