'use strict';

const express = require('express');
const router  = express.Router();
const { getDb }        = require('../db/database');
const { extractSkills } = require('../services/skillExtractor');

const VALID_CATEGORIES = new Set(['technical', 'soft', 'transferable']);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skills
// Returns all confirmed skills for the demo user.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const result = await db.execute({
      sql: `
        SELECT id, skill_name, category, source, confidence, confirmed_by_user, created_at
        FROM user_skills
        WHERE user_id = ?
        ORDER BY category, skill_name
      `,
      args: [userId],
    });

    res.json({
      skills: result.rows.map(mapSkillRow),
    });
  } catch (err) {
    console.error('[GET /api/skills]', err);
    res.status(500).json({ error: 'Failed to retrieve skills' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/skills/extract
// Aggregates the user's profile and returns skill suggestions for review.
// Does NOT save anything — the user must call /confirm to persist.
//
// Response:
// {
//   suggestions: [{ skillName, category, evidence, evidenceVerified,
//                   confidence?, matchMethod }],
//   method:   'ai_extraction' | 'keyword_match',
//   modelId:  string | null,
//   warning:  string | null,
//   existingSkillNames: string[]   — already-confirmed skills to show in UI
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/extract', async (_req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    // Load full profile
    const profileRow = await db.execute({
      sql: `
        SELECT u.id AS user_id, u.email, u.full_name,
               p.headline, p.location, p.personal_info,
               p.career_interests, p.education, p.experience,
               p.certifications, p.projects
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.id = ?
      `,
      args: [userId],
    });

    if (profileRow.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch existing confirmed skills (to exclude from suggestions)
    const existingResult = await db.execute({
      sql:  'SELECT skill_name FROM user_skills WHERE user_id = ? AND confirmed_by_user = 1',
      args: [userId],
    });
    const existingSkillNames = existingResult.rows.map(r => r.skill_name.toLowerCase());

    // Assemble profile object for the extractor
    const row = profileRow.rows[0];
    const profile = {
      personalInfo:    safeParseJson(row.personal_info, {}),
      careerInterests: safeParseJson(row.career_interests, {}),
      education:       safeParseJson(row.education, []),
      experience:      safeParseJson(row.experience, []),
      certifications:  safeParseJson(row.certifications, []),
      skills:          existingResult.rows.map(r => ({ skillName: r.skill_name, source: 'user_added' })),
    };

    // Run extraction (AI or keyword fallback)
    const extraction = await extractSkills(profile);

    // Filter out suggestions whose names match already-confirmed skills
    const filteredSuggestions = extraction.suggestions.filter(s =>
      !existingSkillNames.includes(s.skillName.toLowerCase())
    );

    res.json({
      suggestions:        filteredSuggestions,
      method:             extraction.method,
      modelId:            extraction.modelId,
      warning:            extraction.warning,
      existingSkillNames: existingResult.rows.map(r => r.skill_name),
    });
  } catch (err) {
    console.error('[POST /api/skills/extract]', err);
    res.status(500).json({ error: 'Failed to extract skills' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/skills/confirm
// Saves user-confirmed skill suggestions. Rejected skills are never stored.
// Will NOT overwrite a skill that already exists with source='user_added'.
//
// Request body:
// {
//   confirmed: [
//     { skillName: string, category: string }   — user-approved suggestions
//   ]
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/confirm', async (req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const { confirmed } = req.body;

    if (!Array.isArray(confirmed)) {
      return res.status(400).json({ error: '"confirmed" must be an array' });
    }

    let inserted = 0;
    let skipped  = 0;

    for (const skill of confirmed) {
      if (!skill.skillName || typeof skill.skillName !== 'string') continue;

      const name = skill.skillName.trim();
      if (!name) continue;

      const category = VALID_CATEGORIES.has(skill.category) ? skill.category : 'technical';

      // Check if this skill already exists as user_added — do not overwrite
      const existing = await db.execute({
        sql:  "SELECT id, source FROM user_skills WHERE user_id = ? AND LOWER(skill_name) = LOWER(?)",
        args: [userId, name],
      });

      if (existing.rows.length > 0 && existing.rows[0].source === 'user_added') {
        skipped++;
        continue; // Preserve user-entered skills; never overwrite them
      }

      // Insert or update (ai_extracted skills can be updated, user_added cannot)
      await db.execute({
        sql: `
          INSERT INTO user_skills
            (id, user_id, skill_name, category, source, confidence, confirmed_by_user)
          VALUES (?, ?, ?, ?, 'ai_extracted', 1.0, 1)
          ON CONFLICT(user_id, skill_name) DO UPDATE SET
            category         = excluded.category,
            source           = CASE WHEN source = 'user_added' THEN 'user_added' ELSE 'ai_extracted' END,
            confirmed_by_user = 1
        `,
        args: [require('crypto').randomUUID(), userId, name, category],
      });
      inserted++;
    }

    res.json({
      message:  `${inserted} skill(s) saved, ${skipped} skipped (already user-entered).`,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error('[POST /api/skills/confirm]', err);
    res.status(500).json({ error: 'Failed to confirm skills' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/skills/:id
// Removes a single skill from the user's profile.
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    await db.execute({
      sql:  'DELETE FROM user_skills WHERE id = ? AND user_id = ?',
      args: [req.params.id, userId],
    });

    res.json({ message: 'Skill removed' });
  } catch (err) {
    console.error('[DELETE /api/skills/:id]', err);
    res.status(500).json({ error: 'Failed to remove skill' });
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

function mapSkillRow(row) {
  return {
    id:              row.id,
    skillName:       row.skill_name,
    category:        row.category,
    source:          row.source,
    confidence:      row.confidence,
    confirmedByUser: Boolean(row.confirmed_by_user),
    createdAt:       row.created_at,
  };
}

function safeParseJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); }
  catch { return fallback; }
}

module.exports = router;
