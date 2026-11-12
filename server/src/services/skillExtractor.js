'use strict';

/**
 * skillExtractor.js — core skill extraction service.
 *
 * Workflow:
 *   1. aggregateProfileText(profile) — deterministic: builds structured text from profile data
 *   2. extractWithAI(profileText)    — calls watsonx.ai; falls back to keyword match if unavailable
 *   3. validateEvidence(suggestions, profileText) — verifies each evidence phrase exists in the profile
 *   4. The result is returned to the route as an array of *suggestions* — not saved until confirmed
 *
 * Category standard (Day 3+): technical | soft | transferable
 * Skills marked 'domain' from Day 2 are migrated to 'transferable' by the DB migration.
 */

const llmClient = require('./llmClient');
const path      = require('path');
const fs        = require('fs');

// ── Skill taxonomy for keyword fallback ──────────────────────────────────────
let _taxonomy = null;

function getTaxonomy() {
  if (_taxonomy) return _taxonomy;
  try {
    const taxPath = path.join(__dirname, '../../../shared/skillTaxonomy.json');
    _taxonomy = JSON.parse(fs.readFileSync(taxPath, 'utf8'));
  } catch {
    _taxonomy = {};
  }
  return _taxonomy;
}

// ── Canonical category names ──────────────────────────────────────────────────
const VALID_CATEGORIES = new Set(['technical', 'soft', 'transferable']);

function normaliseCategory(raw) {
  if (!raw) return 'technical';
  const lower = String(raw).toLowerCase().trim();
  // Accept 'domain' as legacy alias for 'transferable'
  if (lower === 'domain') return 'transferable';
  return VALID_CATEGORIES.has(lower) ? lower : 'technical';
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Profile aggregation
// Builds a structured, token-efficient text summary from the stored profile.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assembles a plain-text representation of the user's profile.
 * Each section is labelled so evidence references can be verified against it.
 *
 * @param {object} profile — full profile object as returned by GET /api/profile
 * @returns {{ text: string, sections: object }} — text for the prompt; sections for evidence validation
 */
function aggregateProfileText(profile) {
  const pi      = profile.personalInfo || {};
  const ci      = profile.careerInterests || {};
  const sections = {};
  const lines   = [];

  // Personal
  const personal = [
    pi.fullName       && `Name: ${pi.fullName}`,
    pi.currentStatus  && `Status: ${pi.currentStatus}`,
    pi.qualification  && `Qualification: ${pi.qualification}`,
    pi.institution    && `Institution: ${pi.institution}`,
    pi.graduationYear && `Graduation year: ${pi.graduationYear}`,
    pi.location       && `Location: ${pi.location}`,
  ].filter(Boolean);

  if (personal.length) {
    sections.personal = personal.join('\n');
    lines.push('== PERSONAL ==', sections.personal);
  }

  // Career interests
  const interests = [
    ci.preferredRoles?.length   && `Preferred roles: ${ci.preferredRoles.join(', ')}`,
    ci.preferredDomains?.length && `Preferred domains: ${ci.preferredDomains.join(', ')}`,
    ci.goals                    && `Career goals: ${ci.goals}`,
  ].filter(Boolean);

  if (interests.length) {
    sections.interests = interests.join('\n');
    lines.push('', '== CAREER INTERESTS ==', sections.interests);
  }

  // Explicitly-entered skills (from Day 2)
  const existingSkills = (profile.skills || [])
    .filter(s => s.source === 'user_added')
    .map(s => `${s.skillName} (${s.category})`);

  if (existingSkills.length) {
    sections.skills = existingSkills.join(', ');
    lines.push('', '== SKILLS ALREADY LISTED ==', sections.skills);
  }

  // Education
  const edu = safeArray(profile.education);
  if (edu.length) {
    sections.education = edu.map(e =>
      [e.qualification, e.institution, e.year, e.grade].filter(Boolean).join(' | ')
    ).join('\n');
    lines.push('', '== EDUCATION ==', sections.education);
  }

  // Projects & experience
  const exp = safeArray(profile.experience);
  if (exp.length) {
    sections.experience = exp.map(e => {
      const skillList = (e.skills || []).map(s =>
        typeof s === 'string' ? s : s.skillName
      ).join(', ');
      return [
        `Type: ${e.type || 'project'}`,
        e.title        && `Title: ${e.title}`,
        e.organisation && `Organisation: ${e.organisation}`,
        e.description  && `Description: ${e.description}`,
        skillList      && `Technologies: ${skillList}`,
        e.duration     && `Duration: ${e.duration}`,
      ].filter(Boolean).join(' | ');
    }).join('\n');
    lines.push('', '== PROJECTS AND EXPERIENCE ==', sections.experience);
  }

  // Certifications
  const certs = safeArray(profile.certifications);
  if (certs.length) {
    sections.certifications = certs.map(c =>
      [c.name, c.issuer, c.year, c.skills && `Skills: ${c.skills}`].filter(Boolean).join(' | ')
    ).join('\n');
    lines.push('', '== CERTIFICATIONS AND LEARNING ==', sections.certifications);
  }

  const text = lines.join('\n').trim();
  return { text, sections };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2A — AI extraction via watsonx.ai
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_EXTRACTION_PROMPT = `You are a skills analyst for a career platform. Extract skills from this candidate's profile.

Return ONLY a valid JSON object — no explanation, no markdown, no extra text:
{
  "skills": [
    {
      "skillName": "exact skill name",
      "category": "technical" or "soft" or "transferable",
      "evidence": "a direct phrase or reference from the profile (maximum 20 words)",
      "confidence": 0.5 to 1.0
    }
  ]
}

Rules:
- Only extract skills clearly evidenced in the profile text below.
- Do not invent skills that are not mentioned.
- "technical": programming languages, frameworks, tools, platforms, databases.
- "soft": communication, teamwork, leadership, interpersonal skills.
- "transferable": methodologies, business practices, domain knowledge that apply across roles.
- "evidence" must be a phrase, technology name, or description fragment that actually appears in the profile.
- Maximum 25 skills. Quality over quantity.
- Normalise skill names: use "JavaScript" not "JS", "React" not "ReactJS".
- Do not repeat skills already listed in "SKILLS ALREADY LISTED" section.
- confidence: 1.0 = explicitly stated, 0.8 = strongly implied, 0.5 = inferred from context.

CANDIDATE PROFILE:
`;

/**
 * Calls watsonx.ai to extract skills from profile text.
 * Returns an array of raw suggestion objects (not yet validated).
 *
 * @param {string} profileText
 * @returns {Promise<Array<{skillName, category, evidence, confidence}>>}
 */
async function extractWithAI(profileText) {
  const prompt = SKILL_EXTRACTION_PROMPT + profileText;

  const rawText = await llmClient.generate(prompt, {
    maxNewTokens: 1000,
    temperature:  0.2,
  });

  // Extract JSON — the model should return only JSON but may add preamble
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Model returned non-JSON output: ${rawText.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed.skills)) {
    throw new Error('Model response missing "skills" array');
  }

  return parsed.skills
    .filter(s => s && typeof s.skillName === 'string' && s.skillName.trim())
    .map(s => ({
      skillName:  s.skillName.trim(),
      category:   normaliseCategory(s.category),
      evidence:   typeof s.evidence === 'string' ? s.evidence.trim().slice(0, 200) : '',
      confidence: typeof s.confidence === 'number' ? Math.min(1, Math.max(0, s.confidence)) : 0.8,
      matchMethod: 'ai_extraction',
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2B — Deterministic keyword fallback
// Used when watsonx.ai is unavailable or returns an error.
// Returns labelled matches with no invented confidence scores.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the skill taxonomy keyword matcher against the profile text.
 * Returns skills that have a verifiable presence in the text.
 *
 * @param {string} profileText
 * @param {object} sections — named sections for evidence attribution
 * @returns {Array<{skillName, category, evidence, matchMethod}>}
 */
function extractWithKeywords(profileText, sections) {
  const taxonomy  = getTaxonomy();
  const lowerText = profileText.toLowerCase();
  const found     = new Map(); // canonical name → suggestion

  for (const [alias, canonicalName] of Object.entries(taxonomy)) {
    if (alias === '_comment') continue;
    // Use word-boundary matching for short aliases to avoid false positives
    const needsBoundary = alias.length <= 3;
    const pattern = needsBoundary
      ? new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i')
      : new RegExp(escapeRegex(alias), 'i');

    if (pattern.test(lowerText) && !found.has(canonicalName)) {
      // Determine which section contains this evidence
      const evidenceSection = findEvidenceSection(alias, sections);

      found.set(canonicalName, {
        skillName:   canonicalName,
        category:    inferCategoryFromTaxonomy(canonicalName),
        evidence:    evidenceSection,
        matchMethod: 'keyword_match',  // never labelled as AI-extracted
        // No confidence score — this is a deterministic text match, not a probability
      });
    }
  }

  return Array.from(found.values()).slice(0, 25);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Evidence validation
// Verifies each evidence phrase actually appears in the raw profile text.
// Invalid evidence is replaced with the section attribution from metadata.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that each suggestion's evidence phrase exists in the profile text.
 * If the evidence is not found, it is replaced with a section-level reference.
 *
 * @param {Array}  suggestions  — raw suggestions from AI or keyword match
 * @param {string} profileText  — full assembled profile text
 * @param {object} sections     — named section strings for fallback attribution
 * @returns {Array} suggestions with validated or corrected evidence
 */
function validateEvidence(suggestions, profileText, sections) {
  const lowerText = profileText.toLowerCase();

  return suggestions.map(s => {
    const evidenceLower = (s.evidence || '').toLowerCase();

    // Evidence is valid if at least 4 words of it appear together in the profile
    // (or the whole phrase if shorter)
    const isVerified = evidenceLower.length > 3
      && lowerText.includes(evidenceLower.slice(0, Math.min(evidenceLower.length, 40)));

    if (isVerified) return s;

    // Try to attribute to a section
    const fallbackSection = findEvidenceSection(s.skillName, sections);
    return { ...s, evidence: fallbackSection, evidenceVerified: false };
  }).map(s => ({ ...s, evidenceVerified: s.evidenceVerified !== false }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts skill suggestions from a profile.
 * Automatically falls back to keyword matching if watsonx.ai is unavailable.
 *
 * @param {object} profile — full profile from GET /api/profile
 * @returns {Promise<{
 *   suggestions: Array,
 *   method: 'ai_extraction' | 'keyword_match',
 *   modelId: string | null,
 *   warning: string | null
 * }>}
 */
async function extractSkills(profile) {
  const { text: profileText, sections } = aggregateProfileText(profile);

  if (!profileText.trim()) {
    return {
      suggestions: [],
      method:      'keyword_match',
      modelId:     null,
      warning:     'Profile has no content to analyse. Please complete your profile first.',
    };
  }

  // Try AI extraction if available
  if (llmClient.isAvailable()) {
    try {
      const rawSuggestions = await extractWithAI(profileText);
      const validated      = validateEvidence(rawSuggestions, profileText, sections);
      return {
        suggestions: validated,
        method:      'ai_extraction',
        modelId:     llmClient.getModelId(),
        warning:     null,
      };
    } catch (err) {
      console.warn('[skillExtractor] AI extraction failed, falling back to keywords:', err.message);
      // Fall through to keyword matching
    }
  }

  // Keyword fallback
  const keywordSuggestions = extractWithKeywords(profileText, sections);
  const validated          = validateEvidence(keywordSuggestions, profileText, sections);

  return {
    suggestions: validated,
    method:      'keyword_match',
    modelId:     null,
    warning:     llmClient.isAvailable()
      ? 'AI extraction failed — showing keyword matches. These are deterministic text matches, not AI inferences.'
      : 'watsonx.ai credentials not configured — showing keyword matches. Configure WATSONX_AI_APIKEY to enable AI extraction.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds which section of the profile contains the given text.
 * Returns a human-readable attribution string.
 */
function findEvidenceSection(text, sections) {
  const lower = text.toLowerCase();
  for (const [name, content] of Object.entries(sections)) {
    if (content && content.toLowerCase().includes(lower)) {
      const labels = {
        personal:       'Personal information',
        interests:      'Career interests',
        skills:         'Listed skills',
        education:      'Education',
        experience:     'Projects and experience',
        certifications: 'Certifications and learning',
      };
      return labels[name] || name;
    }
  }
  return 'Profile text';
}

/**
 * Infers a category for a canonically-named skill when using keyword matching.
 * Uses heuristics derived from the taxonomy.
 */
function inferCategoryFromTaxonomy(canonicalName) {
  const soft = new Set([
    'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Leadership', 'Time Management', 'Adaptability', 'Creativity',
    'Attention to Detail', 'Presentation Skills', 'Written Communication',
    'Active Listening', 'Collaboration', 'Self-Motivation',
  ]);
  const transferable = new Set([
    'Agile', 'Scrum', 'Jira', 'Project Management', 'Product Management',
    'UI/UX Design', 'Technical Writing', 'Business Analysis',
    'Digital Marketing', 'SEO', 'Content Writing', 'Quality Assurance',
    'Microsoft Excel', 'Microsoft Word', 'Microsoft PowerPoint',
  ]);
  if (soft.has(canonicalName))        return 'soft';
  if (transferable.has(canonicalName)) return 'transferable';
  return 'technical';
}

module.exports = { extractSkills, aggregateProfileText };
