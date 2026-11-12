'use strict';

/**
 * opportunityMatcher.js — deterministic, explainable opportunity matching engine.
 *
 * ── Scoring Formula ────────────────────────────────────────────────────────────
 *
 * Inputs:
 *   userSkills[]       — normalised names of all confirmed user skills
 *   requiredSkills[]   — skills explicitly required by the opportunity
 *   preferredSkills[]  — skills that improve candidacy
 *
 * Normalisation:
 *   All skill names are lowercased + trimmed before comparison.
 *   skillTaxonomy.json aliases are resolved first (e.g. "js" → "javascript").
 *
 * Score components (total = 100 points):
 *
 *   coreScore (70 pts max):
 *     presentRequired = intersection(userSkills, requiredSkills)
 *     coreScore = (presentRequired.length / requiredSkills.length) * 70
 *     → If requiredSkills is empty: coreScore = 35 (partial credit, no requirements stated)
 *
 *   preferredScore (30 pts max):
 *     presentPreferred = intersection(userSkills, preferredSkills)
 *     preferredScore = preferredSkills.length > 0
 *       ? (presentPreferred.length / preferredSkills.length) * 30
 *       : 0
 *
 *   finalScore = round(coreScore + preferredScore)  — capped at 100
 *
 * Match tier labels:
 *   ≥ 80  → Strong Match
 *   ≥ 55  → Good Match
 *   ≥ 30  → Partial Match
 *   < 30  → Low Match
 *
 * No AI is involved in score computation. Explanations are template-generated
 * from the deterministic counts, making them fully reproducible.
 */

const path = require('path');
const fs   = require('fs');

// ── Load taxonomy for normalisation ──────────────────────────────────────────
let _taxonomy = null;

function getTaxonomy() {
  if (_taxonomy) return _taxonomy;
  try {
    const taxPath = path.join(__dirname, '../../../shared/skillTaxonomy.json');
    const raw = JSON.parse(fs.readFileSync(taxPath, 'utf8'));
    // Build a map: lowercase alias → lowercase canonical
    const map = {};
    for (const [alias, canonical] of Object.entries(raw)) {
      if (alias !== '_comment') {
        map[alias.toLowerCase()] = canonical.toLowerCase();
      }
    }
    _taxonomy = map;
  } catch {
    _taxonomy = {};
  }
  return _taxonomy;
}

/**
 * Normalise a skill name via the taxonomy and lowercasing.
 */
function normalise(name) {
  const lower = (name || '').toLowerCase().trim();
  const taxonomy = getTaxonomy();
  return taxonomy[lower] || lower;
}

/**
 * Scores a single opportunity against a user's confirmed skill set.
 *
 * @param {string[]} userSkillNames  — raw skill names from user_skills table
 * @param {object}   opportunity     — single opportunity object from dataset
 * @returns {{
 *   score: number,
 *   tier: string,
 *   presentRequired: string[],
 *   missingRequired: string[],
 *   presentPreferred: string[],
 *   explanation: string
 * }}
 */
function scoreOpportunity(userSkillNames, opportunity) {
  const userSet = new Set(userSkillNames.map(normalise));

  const required  = (opportunity.requiredSkills  || []);
  const preferred = (opportunity.preferredSkills || []);

  const presentRequired  = required.filter(s  => userSet.has(normalise(s)));
  const missingRequired  = required.filter(s  => !userSet.has(normalise(s)));
  const presentPreferred = preferred.filter(s => userSet.has(normalise(s)));

  // Core score: up to 70 points from required skills
  let coreScore;
  if (required.length === 0) {
    coreScore = 35; // No requirements listed — give partial credit
  } else {
    coreScore = (presentRequired.length / required.length) * 70;
  }

  // Preferred score: up to 30 points from preferred skills
  const preferredScore = preferred.length > 0
    ? (presentPreferred.length / preferred.length) * 30
    : 0;

  const score = Math.min(100, Math.round(coreScore + preferredScore));
  const tier  = scoreTier(score);

  const explanation = buildExplanation(
    score, tier,
    presentRequired, missingRequired, presentPreferred,
    required.length, preferred.length,
    opportunity,
  );

  return {
    score,
    tier,
    presentRequired:  presentRequired.map(s => s),
    missingRequired:  missingRequired.map(s => s),
    presentPreferred: presentPreferred.map(s => s),
    explanation,
  };
}

/**
 * Scores all opportunities and returns them sorted by score descending.
 *
 * @param {string[]} userSkillNames
 * @param {object[]} opportunities
 * @param {Set<string>} savedIds — set of opportunity IDs already saved by user
 * @returns {object[]} annotated opportunities with matchData
 */
function scoreAll(userSkillNames, opportunities, savedIds = new Set()) {
  return opportunities
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
        isSaved:          savedIds.has(opp.id),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ── Tier labels ───────────────────────────────────────────────────────────────

function scoreTier(score) {
  if (score >= 80) return 'Strong Match';
  if (score >= 55) return 'Good Match';
  if (score >= 30) return 'Partial Match';
  return 'Low Match';
}

function tierVariant(tier) {
  if (tier === 'Strong Match')  return 'green';
  if (tier === 'Good Match')    return 'green';
  if (tier === 'Partial Match') return 'amber';
  return 'gray';
}

// ── Explanation builder ───────────────────────────────────────────────────────

function buildExplanation(score, tier, presentRequired, missingRequired, presentPreferred, totalRequired, totalPreferred, opp) {
  const parts = [];

  // Opening sentence
  if (score >= 80) {
    parts.push(`Your skill set is a strong match for this ${opp.opportunityType} role at ${opp.company}.`);
  } else if (score >= 55) {
    parts.push(`You meet the core requirements for this role and have a good foundation to succeed.`);
  } else if (score >= 30) {
    parts.push(`You have some relevant skills for this role, but there are gaps to address.`);
  } else {
    parts.push(`This role requires skills that are not yet in your profile.`);
  }

  // Required skills coverage
  if (totalRequired > 0) {
    if (presentRequired.length === totalRequired) {
      parts.push(`You meet all ${totalRequired} required skill${totalRequired > 1 ? 's' : ''}.`);
    } else if (presentRequired.length > 0) {
      parts.push(`You have ${presentRequired.length} of ${totalRequired} required skill${totalRequired > 1 ? 's' : ''} (${presentRequired.slice(0, 3).join(', ')}${presentRequired.length > 3 ? '…' : ''}).`);
    } else {
      parts.push(`None of the required skills are currently in your profile.`);
    }
  }

  // Missing required
  if (missingRequired.length > 0) {
    const shown = missingRequired.slice(0, 3).join(', ');
    const extra = missingRequired.length > 3 ? ` and ${missingRequired.length - 3} more` : '';
    parts.push(`Key skills to develop: ${shown}${extra}.`);
  }

  // Preferred skills bonus
  if (totalPreferred > 0 && presentPreferred.length > 0) {
    parts.push(`You also have ${presentPreferred.length} preferred skill${presentPreferred.length > 1 ? 's' : ''} (${presentPreferred.slice(0, 2).join(', ')}), which strengthens your candidacy.`);
  }

  return parts.join(' ');
}

module.exports = { scoreAll, scoreOpportunity, scoreTier, tierVariant, normalise };
