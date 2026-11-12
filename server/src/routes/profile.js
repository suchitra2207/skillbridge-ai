'use strict';

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile
// Returns the full profile for the demo user, including skills.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const db = getDb();
    const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@skillbridge.ai';

    // Fetch user + profile in one query
    const profileResult = await db.execute({
      sql: `
        SELECT u.id AS user_id, u.email AS user_email, u.full_name,
               p.id, p.headline, p.location, p.about,
               p.personal_info, p.career_interests,
               p.education, p.experience,
               p.certifications, p.projects,
               p.onboarding_step, p.updated_at
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE u.email = ?
      `,
      args: [demoEmail],
    });

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const row = profileResult.rows[0];

    // Fetch skills separately
    const skillsResult = await db.execute({
      sql: `
        SELECT id, skill_name, category, source, confidence, confirmed_by_user
        FROM user_skills
        WHERE user_id = ?
        ORDER BY category, skill_name
      `,
      args: [row.user_id],
    });

    const profile = buildProfileResponse(row, skillsResult.rows);
    res.json({ profile });

  } catch (err) {
    console.error('[GET /api/profile]', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/profile
// Creates or updates the demo user's profile. Idempotent — never duplicates.
//
// Expected body (all fields optional — send only what changed):
// {
//   personal_info:   { fullName, email, location, qualification, institution, graduationYear, currentStatus },
//   headline:        string,
//   about:           string,
//   career_interests:{ preferredRoles, preferredDomains, interests, workArrangement },
//   education:       [ { qualification, institution, year, grade } ],
//   experience:      [ { title, type, organisation, description, skills, duration } ],
//   certifications:  [ { name, issuer, year, skills } ],
//   projects:        [ { title, description, skills, duration } ],
//   skills:          [ { skillName, category } ],  — replaces all user_skills
//   onboarding_step: number
// }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const db = getDb();
    const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@skillbridge.ai';

    // Resolve demo user
    const userResult = await db.execute({
      sql:  'SELECT id FROM users WHERE email = ?',
      args: [demoEmail],
    });
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Demo user not found' });
    }
    const userId = userResult.rows[0].id;

    // Get existing profile id
    const existingResult = await db.execute({
      sql:  'SELECT id FROM profiles WHERE user_id = ?',
      args: [userId],
    });
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile record not found — restart the server to seed' });
    }
    const profileId = existingResult.rows[0].id;

    const body = req.body;

    // Validate that body is an object
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    // Build update fields from body — only update what was sent
    const updates = {};

    if (body.personal_info !== undefined) {
      const pi = body.personal_info;
      if (typeof pi !== 'object') return res.status(400).json({ error: 'personal_info must be an object' });
      updates.personal_info = JSON.stringify(pi);

      // Sync full_name and location to their canonical columns too
      if (pi.fullName) {
        await db.execute({ sql: 'UPDATE users SET full_name = ? WHERE id = ?', args: [String(pi.fullName).trim(), userId] });
      }
      if (pi.location) {
        updates.location = String(pi.location).trim();
      }
    }

    if (body.headline !== undefined)        updates.headline = String(body.headline).trim().slice(0, 200);
    if (body.about    !== undefined)        updates.about    = String(body.about).trim().slice(0, 2000);
    if (body.location !== undefined)        updates.location = String(body.location).trim();
    if (body.onboarding_step !== undefined) updates.onboarding_step = Number(body.onboarding_step);

    if (body.career_interests !== undefined) {
      if (!Array.isArray(body.career_interests) && typeof body.career_interests !== 'object') {
        return res.status(400).json({ error: 'career_interests must be an object or array' });
      }
      updates.career_interests = JSON.stringify(body.career_interests);
    }

    if (body.education !== undefined) {
      if (!Array.isArray(body.education)) return res.status(400).json({ error: 'education must be an array' });
      updates.education = JSON.stringify(body.education);
    }

    if (body.experience !== undefined) {
      if (!Array.isArray(body.experience)) return res.status(400).json({ error: 'experience must be an array' });
      updates.experience = JSON.stringify(body.experience);
    }

    if (body.certifications !== undefined) {
      if (!Array.isArray(body.certifications)) return res.status(400).json({ error: 'certifications must be an array' });
      updates.certifications = JSON.stringify(body.certifications);
    }

    if (body.projects !== undefined) {
      if (!Array.isArray(body.projects)) return res.status(400).json({ error: 'projects must be an array' });
      updates.projects = JSON.stringify(body.projects);
    }

    // Build SET clause
    const setClauses = Object.keys(updates).map(k => `${k} = ?`);
    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    if (setClauses.length > 1) { // more than just updated_at
      await db.execute({
        sql:  `UPDATE profiles SET ${setClauses.join(', ')} WHERE id = ?`,
        args: [...Object.values(updates), profileId],
      });
    }

    // Handle skills replacement — only when explicitly provided
    if (Array.isArray(body.skills)) {
      // Delete all existing user-added skills, preserve ai_extracted ones
      await db.execute({
        sql:  "DELETE FROM user_skills WHERE user_id = ? AND source = 'user_added'",
        args: [userId],
      });

      // Insert new skill set
      for (const skill of body.skills) {
        if (!skill.skillName || typeof skill.skillName !== 'string') continue;
        const name = skill.skillName.trim();
        if (!name) continue;
        const category = ['technical', 'soft', 'transferable'].includes(skill.category) ? skill.category : 'technical';

        await db.execute({
          sql: `
            INSERT INTO user_skills (id, user_id, skill_name, category, source, confidence, confirmed_by_user)
            VALUES (?, ?, ?, ?, 'user_added', 1.0, 1)
            ON CONFLICT(user_id, skill_name) DO UPDATE SET
              category = excluded.category,
              source = 'user_added',
              confirmed_by_user = 1
          `,
          args: [generateId(), userId, name, category],
        });
      }
    }

    res.json({ message: 'Profile updated successfully', profileId });

  } catch (err) {
    console.error('[PUT /api/profile]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildProfileResponse(row, skillRows) {
  return {
    id:              row.id,
    userId:          row.user_id,
    fullName:        row.full_name,
    userEmail:       row.user_email,
    headline:        row.headline,
    location:        row.location,
    about:           row.about,
    personalInfo:    safeParseJson(row.personal_info, {}),
    careerInterests: safeParseJson(row.career_interests, {}),
    education:       safeParseJson(row.education, []),
    experience:      safeParseJson(row.experience, []),
    certifications:  safeParseJson(row.certifications, []),
    projects:        safeParseJson(row.projects, []),
    onboardingStep:  row.onboarding_step ?? 0,
    updatedAt:       row.updated_at,
    skills: skillRows.map(s => ({
      id:             s.id,
      skillName:      s.skill_name,
      category:       s.category,
      source:         s.source,
      confidence:     s.confidence,
      confirmedByUser: Boolean(s.confirmed_by_user),
    })),
  };
}

function safeParseJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); }
  catch { return fallback; }
}

function generateId() {
  // Simple UUID v4 without importing uuid (crypto.randomUUID available in Node 14.17+)
  return require('crypto').randomUUID();
}

module.exports = router;
