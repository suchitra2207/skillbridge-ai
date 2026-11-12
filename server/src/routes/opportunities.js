'use strict';

const express = require('express');
const router  = express.Router();
const { getDb } = require('../db/database');
const { scoreAll, scoreOpportunity } = require('../services/opportunityMatcher');

// Load the curated dataset once at module load time
const OPPORTUNITIES = require('../data/opportunities.json');
const OPP_MAP = new Map(OPPORTUNITIES.map(o => [o.id, o]));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/opportunities
// Returns all opportunities, each annotated with the user's match data.
// Accepts query params: domain, workArrangement, opportunityType, search, sort
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    // Fetch confirmed skills
    const skillsResult = await db.execute({
      sql:  'SELECT skill_name FROM user_skills WHERE user_id = ? AND confirmed_by_user = 1',
      args: [userId],
    });
    const userSkillNames = skillsResult.rows.map(r => r.skill_name);

    // Fetch saved opportunity IDs
    const savedResult = await db.execute({
      sql:  'SELECT opportunity_id FROM saved_opportunities WHERE user_id = ?',
      args: [userId],
    });
    const savedIds = new Set(savedResult.rows.map(r => r.opportunity_id));

    // Score + sort all opportunities
    let results = scoreAll(userSkillNames, OPPORTUNITIES, savedIds);

    // ── Filters ────────────────────────────────────────────────────────────
    const { domain, workArrangement, opportunityType, search, sort } = req.query;

    if (domain)            results = results.filter(o => o.domain === domain);
    if (workArrangement)   results = results.filter(o => o.workArrangement === workArrangement);
    if (opportunityType)   results = results.filter(o => o.opportunityType === opportunityType);

    if (search) {
      const q = search.toLowerCase().trim();
      results = results.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        o.domain.toLowerCase().includes(q)
      );
    }

    // ── Sort ───────────────────────────────────────────────────────────────
    if (sort === 'title') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'company') {
      results.sort((a, b) => a.company.localeCompare(b.company));
    }
    // default: already sorted by matchScore desc from scoreAll()

    res.json({
      opportunities:    results,
      totalCount:       results.length,
      hasSkills:        userSkillNames.length > 0,
      userSkillCount:   userSkillNames.length,
    });
  } catch (err) {
    console.error('[GET /api/opportunities]', err);
    res.status(500).json({ error: 'Failed to retrieve opportunities' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/opportunities/meta
// Returns filter options (domains, arrangements, types) for the UI.
// IMPORTANT: all static-path routes must come BEFORE /:id to avoid Express
// treating them as id parameters.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/meta', (_req, res) => {
  const domains          = [...new Set(OPPORTUNITIES.map(o => o.domain))].sort();
  const workArrangements = [...new Set(OPPORTUNITIES.map(o => o.workArrangement))];
  const types            = [...new Set(OPPORTUNITIES.map(o => o.opportunityType))];

  res.json({ domains, workArrangements, types });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/opportunities/saved/list
// Returns only the saved opportunities for the demo user.
// Must be defined BEFORE /:id route.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/saved/list', async (_req, res) => {
  try {
    const { userId } = await getDemoUser();
    const db = getDb();

    const skillsResult = await db.execute({
      sql:  'SELECT skill_name FROM user_skills WHERE user_id = ? AND confirmed_by_user = 1',
      args: [userId],
    });
    const userSkillNames = skillsResult.rows.map(r => r.skill_name);

    const savedResult = await db.execute({
      sql:  'SELECT opportunity_id FROM saved_opportunities WHERE user_id = ?',
      args: [userId],
    });
    const savedIds = new Set(savedResult.rows.map(r => r.opportunity_id));

    const saved = OPPORTUNITIES
      .filter(o => savedIds.has(o.id))
      .map(opp => {
        const matchData = scoreOpportunity(userSkillNames, opp);
        return {
          ...opp,
          matchScore:       matchData.score,
          matchTier:        matchData.tier,
          presentRequired:  matchData.presentRequired,
          missingRequired:  matchData.missingRequired,
          presentPreferred: matchData.presentPreferred,
          explanation:      matchData.explanation,
          isSaved:          true,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ opportunities: saved, totalCount: saved.length });
  } catch (err) {
    console.error('[GET /api/opportunities/saved/list]', err);
    res.status(500).json({ error: 'Failed to retrieve saved opportunities' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/opportunities/:id
// Returns a single opportunity with match data.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const opp = OPP_MAP.get(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const { userId } = await getDemoUser();
    const db = getDb();

    const skillsResult = await db.execute({
      sql:  'SELECT skill_name FROM user_skills WHERE user_id = ? AND confirmed_by_user = 1',
      args: [userId],
    });
    const userSkillNames = skillsResult.rows.map(r => r.skill_name);

    const savedResult = await db.execute({
      sql:  'SELECT opportunity_id FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
      args: [userId, opp.id],
    });

    const matchData = scoreOpportunity(userSkillNames, opp);

    res.json({
      opportunity: {
        ...opp,
        matchScore:       matchData.score,
        matchTier:        matchData.tier,
        presentRequired:  matchData.presentRequired,
        missingRequired:  matchData.missingRequired,
        presentPreferred: matchData.presentPreferred,
        explanation:      matchData.explanation,
        isSaved:          savedResult.rows.length > 0,
      },
    });
  } catch (err) {
    console.error('[GET /api/opportunities/:id]', err);
    res.status(500).json({ error: 'Failed to retrieve opportunity' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/opportunities/:id/save
// Saves or unsaves an opportunity for the demo user (toggle).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/save', async (req, res) => {
  try {
    const oppId = req.params.id;
    if (!OPP_MAP.has(oppId)) return res.status(404).json({ error: 'Opportunity not found' });

    const { userId } = await getDemoUser();
    const db = getDb();

    const existing = await db.execute({
      sql:  'SELECT 1 FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
      args: [userId, oppId],
    });

    if (existing.rows.length > 0) {
      // Unsave
      await db.execute({
        sql:  'DELETE FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?',
        args: [userId, oppId],
      });
      res.json({ saved: false, message: 'Opportunity removed from saved list' });
    } else {
      // Save
      await db.execute({
        sql:  'INSERT INTO saved_opportunities (user_id, opportunity_id) VALUES (?, ?)',
        args: [userId, oppId],
      });
      res.json({ saved: true, message: 'Opportunity saved' });
    }
  } catch (err) {
    console.error('[POST /api/opportunities/:id/save]', err);
    res.status(500).json({ error: 'Failed to update saved opportunity' });
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
