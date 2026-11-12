'use strict';

/**
 * gapAnalyser.js — deterministic skill gap analysis service.
 *
 * ── Readiness Score Formula ───────────────────────────────────────────────────
 *
 * The readiness score is SEPARATE from the opportunity match score (Day 4).
 *
 *   readinessScore = round((presentRequired.length / totalRequired) * 100)
 *
 *   → Answers: "What percentage of required skills do I already have?"
 *   → Range: 0–100. If no required skills: 100 (already fully capable for stated requirements).
 *   → Readiness tiers:
 *       ≥ 80  → Ready to apply
 *       ≥ 50  → Nearly ready
 *       ≥ 25  → Building foundations
 *       < 25  → Significant preparation needed
 *
 * Difference from matchScore (Day 4):
 *   matchScore weights both required (70%) and preferred (30%) skills.
 *   readinessScore looks ONLY at required skills — it is a simpler, more direct
 *   measure of whether the candidate meets the stated minimum bar.
 *
 * ── Recommendation Priority ───────────────────────────────────────────────────
 *
 *   Missing required skills → High priority
 *   Missing preferred skills → Medium priority (if fewer than 5 required skills missing)
 *                            → Low priority otherwise
 */

const { scoreOpportunity } = require('./opportunityMatcher');
const { getRecommendation } = require('./skillRecommendations');

const OPPORTUNITIES = require('../data/opportunities.json');
const OPP_MAP = new Map(OPPORTUNITIES.map(o => [o.id, o]));

/**
 * Performs a full gap analysis for a user against a specific opportunity.
 *
 * @param {string[]} userSkillNames — confirmed skill names from user_skills table
 * @param {string}   opportunityId — opportunity to analyse
 * @returns {{
 *   opportunityId: string,
 *   opportunityTitle: string,
 *   company: string,
 *   readinessScore: number,
 *   readinessTier: string,
 *   presentRequired: string[],
 *   missingRequired: string[],
 *   presentPreferred: string[],
 *   missingPreferred: string[],
 *   matchScore: number,
 *   recommendations: Array<{skillName, priority, why, activity, project, category}>,
 *   hasSkills: boolean
 * }}
 */
function analyseGap(userSkillNames, opportunityId) {
  const opp = OPP_MAP.get(opportunityId);
  if (!opp) throw new Error(`Opportunity not found: ${opportunityId}`);

  const hasSkills = userSkillNames.length > 0;

  // Reuse the existing matcher for consistency
  const matchData = scoreOpportunity(userSkillNames, opp);

  const { presentRequired, missingRequired, presentPreferred, score: matchScore } = matchData;

  // Compute missing preferred
  const allPreferred  = opp.preferredSkills || [];
  const missingPreferred = allPreferred.filter(s => !presentPreferred.includes(s));

  // Readiness score (required skills only)
  const totalRequired = (opp.requiredSkills || []).length;
  const readinessScore = totalRequired === 0
    ? 100
    : Math.round((presentRequired.length / totalRequired) * 100);

  const readinessTier = getReadinessTier(readinessScore);

  // Build recommendations for missing required + missing preferred
  // Priority: all missing required = High; missing preferred = Medium if few required gaps, Low if many
  const manyRequiredGaps = missingRequired.length >= 5;

  const recommendations = [
    ...missingRequired.map(skill => getRecommendation(skill, true)),
    ...missingPreferred.map(skill => ({
      ...getRecommendation(skill, false),
      priority: manyRequiredGaps ? 'low' : 'medium',
    })),
  ];

  return {
    opportunityId,
    opportunityTitle: opp.title,
    company:          opp.company,
    domain:           opp.domain,
    readinessScore,
    readinessTier,
    presentRequired,
    missingRequired,
    presentPreferred,
    missingPreferred,
    matchScore,
    totalRequired,
    totalPreferred:   allPreferred.length,
    recommendations,
    hasSkills,
  };
}

/**
 * Returns a brief summary of gap analyses across all saved/top opportunities.
 * Used by the dashboard's skill gap summary widget.
 *
 * @param {string[]} userSkillNames
 * @returns {Array<{opportunityId, title, company, readinessScore, missingCount}>}
 */
function analyseSummary(userSkillNames) {
  return OPPORTUNITIES
    .map(opp => {
      const matchData = scoreOpportunity(userSkillNames, opp);
      const totalRequired = (opp.requiredSkills || []).length;
      const readinessScore = totalRequired === 0
        ? 100
        : Math.round((matchData.presentRequired.length / totalRequired) * 100);
      return {
        opportunityId:  opp.id,
        title:          opp.title,
        company:        opp.company,
        domain:         opp.domain,
        readinessScore,
        readinessTier:  getReadinessTier(readinessScore),
        matchScore:     matchData.score,
        missingCount:   matchData.missingRequired.length,
      };
    })
    .sort((a, b) => b.readinessScore - a.readinessScore);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getReadinessTier(score) {
  if (score >= 80) return 'Ready to apply';
  if (score >= 50) return 'Nearly ready';
  if (score >= 25) return 'Building foundations';
  return 'Significant preparation needed';
}

module.exports = { analyseGap, analyseSummary, getReadinessTier };
