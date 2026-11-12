import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Wrench, CheckCircle2, RotateCcw } from 'lucide-react';
import { getGapAnalysis, updateSkillProgress } from '../../services/api';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  high:   { badge: 'badge-amber', label: 'High priority',   dot: 'bg-red-400'   },
  medium: { badge: 'badge-gray',  label: 'Medium priority', dot: 'bg-amber-400' },
  low:    { badge: 'badge-gray',  label: 'Low priority',    dot: 'bg-gray-300'  },
};

const PROGRESS_STATES = [
  { value: null,          label: 'Not started',  icon: null,             cls: 'text-text-muted'     },
  { value: 'learning',    label: 'Learning',     icon: <BookOpen size={12} />, cls: 'text-amber-600' },
  { value: 'practising',  label: 'Practising',   icon: <Wrench size={12} />,   cls: 'text-brand-green' },
  { value: 'confident',   label: 'Confident',    icon: <CheckCircle2 size={12} />, cls: 'text-green-700' },
];

const READINESS_TIER_COLOURS = {
  'Ready to apply':                 { bar: 'bg-brand-green',  text: 'text-green-700',  bg: 'bg-brand-green-lt border-green-200' },
  'Nearly ready':                   { bar: 'bg-green-400',    text: 'text-green-600',  bg: 'bg-green-50 border-green-200'       },
  'Building foundations':           { bar: 'bg-amber-400',    text: 'text-amber-600',  bg: 'bg-brand-amber-lt border-amber-200' },
  'Significant preparation needed': { bar: 'bg-gray-300',     text: 'text-text-muted', bg: 'bg-gray-50 border-border'           },
};

/**
 * SkillGapSection — the full skill gap analysis panel for an opportunity.
 *
 * Props:
 *   opportunityId — ID of the opportunity to analyse
 *   hasSkills     — whether the user has any confirmed skills (for graceful empty state)
 */
export function SkillGapSection({ opportunityId, hasSkills }) {
  const [gap,       setGap]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [progress,  setProgress]  = useState({});  // skillName → status
  const [updating,  setUpdating]  = useState(null); // skill being updated
  const [expanded,  setExpanded]  = useState({});   // rec index → bool

  // ── Load gap analysis ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGapAnalysis(opportunityId)
      .then(({ gap: g }) => {
        if (cancelled) return;
        setGap(g);
        // Seed local progress from API response
        const prog = {};
        for (const r of (g.recommendations || [])) {
          if (r.progress) prog[r.skillName] = r.progress;
        }
        setProgress(prog);
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [opportunityId]);

  // ── Update progress ─────────────────────────────────────────────────────────
  async function handleProgressChange(skillName, newStatus) {
    setUpdating(skillName);
    try {
      await updateSkillProgress(skillName, newStatus);
      setProgress(p => ({ ...p, [skillName]: newStatus }));
    } catch {
      // Silent — UI reverts
    } finally {
      setUpdating(null);
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card py-8 text-center">
        <div className="inline-block w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-xs mt-2">Analysing skill gaps…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card py-6 text-center text-sm text-text-secondary">
        Unable to load gap analysis: {error}
      </div>
    );
  }

  if (!hasSkills || !gap) {
    return (
      <div className="card py-6">
        <p className="text-sm font-semibold text-text-primary mb-1">Skill Gap Analysis</p>
        <p className="text-sm text-text-secondary">
          Add and confirm skills in your profile to see a personalised gap analysis for this role.
        </p>
        <a href="/skills/review" className="text-sm text-brand-green font-medium mt-2 inline-block hover:underline">
          Analyse skills →
        </a>
      </div>
    );
  }

  const { readinessScore, readinessTier, presentRequired, missingRequired,
    presentPreferred, missingPreferred, recommendations, totalRequired, totalPreferred } = gap;

  const tierStyle  = READINESS_TIER_COLOURS[readinessTier] || READINESS_TIER_COLOURS['Building foundations'];
  const highPri    = recommendations.filter(r => r.priority === 'high');
  const medLowPri  = recommendations.filter(r => r.priority !== 'high');

  return (
    <div className="space-y-4">
      {/* Readiness score banner */}
      <div className={`card border ${tierStyle.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">
              Role Readiness
            </p>
            <p className={`text-3xl font-bold leading-none ${tierStyle.text}`}>
              {readinessScore}%
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${tierStyle.text}`}>{readinessTier}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {presentRequired.length} of {totalRequired} required skill{totalRequired !== 1 ? 's' : ''} present
            </p>
          </div>
        </div>
        <div className="w-full h-2 bg-white bg-opacity-60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${tierStyle.bar}`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Readiness measures required skills only. Match score (above) also includes preferred skills.
        </p>
      </div>

      {/* No gaps — fully ready */}
      {missingRequired.length === 0 && (
        <div className="card flex items-center gap-3 bg-brand-green-lt border-green-200">
          <CheckCircle2 className="text-brand-green flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-semibold text-green-800">You meet all required skills for this role!</p>
            {missingPreferred.length > 0 && (
              <p className="text-xs text-green-700 mt-0.5">
                {missingPreferred.length} preferred skill{missingPreferred.length > 1 ? 's' : ''} could further strengthen your application.
              </p>
            )}
          </div>
        </div>
      )}

      {/* High priority recommendations */}
      {highPri.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">
            Required skills to develop ({highPri.length})
          </h3>
          <div className="space-y-3">
            {highPri.map((rec, i) => (
              <RecommendationRow
                key={i}
                rec={rec}
                progress={progress[rec.skillName] || null}
                updating={updating === rec.skillName}
                expanded={!!expanded[`h${i}`]}
                onToggle={() => setExpanded(e => ({ ...e, [`h${i}`]: !e[`h${i}`] }))}
                onProgressChange={handleProgressChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium/low priority recommendations */}
      {medLowPri.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">
            Preferred skills to consider ({medLowPri.length})
          </h3>
          <div className="space-y-3">
            {medLowPri.map((rec, i) => (
              <RecommendationRow
                key={i}
                rec={rec}
                progress={progress[rec.skillName] || null}
                updating={updating === rec.skillName}
                expanded={!!expanded[`m${i}`]}
                onToggle={() => setExpanded(e => ({ ...e, [`m${i}`]: !e[`m${i}`] }))}
                onProgressChange={handleProgressChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* All present — no recommendations */}
      {recommendations.length === 0 && (
        <div className="card text-sm text-text-secondary">
          No recommendations — you already have all skills listed for this role.
        </div>
      )}
    </div>
  );
}

// ── Recommendation row ────────────────────────────────────────────────────────

function RecommendationRow({ rec, progress, updating, expanded, onToggle, onProgressChange }) {
  const priorityStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.low;
  const currentProgress = PROGRESS_STATES.find(p => p.value === progress) || PROGRESS_STATES[0];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Priority dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityStyle.dot}`} aria-hidden="true" />

        {/* Skill name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-text-primary">{rec.skillName}</span>
            <span className={`badge ${priorityStyle.badge} text-xs`}>{priorityStyle.label}</span>
            {rec.category && (
              <span className="badge badge-gray text-xs capitalize">{rec.category}</span>
            )}
          </div>
          {/* Progress indicator */}
          {progress && (
            <div className={`flex items-center gap-1 text-xs mt-0.5 ${currentProgress.cls}`}>
              {currentProgress.icon}
              <span>{currentProgress.label}</span>
            </div>
          )}
        </div>

        {/* Progress tracker */}
        <ProgressSelector
          skillName={rec.skillName}
          current={progress}
          updating={updating}
          onChange={onProgressChange}
        />

        {/* Expand toggle */}
        <button
          type="button"
          onClick={onToggle}
          className="flex-shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors rounded"
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border bg-surface space-y-3 pt-3">
          {/* Why it matters */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Why it matters</p>
            <p className="text-sm text-text-secondary">{rec.why}</p>
          </div>

          {/* Suggested activity */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">How to learn it</p>
            <p className="text-sm text-text-secondary">{rec.activity}</p>
          </div>

          {/* Project idea */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Practice project</p>
            <p className="text-sm text-text-secondary">{rec.project}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Progress selector ─────────────────────────────────────────────────────────

function ProgressSelector({ skillName, current, updating, onChange }) {
  const [open, setOpen] = useState(false);

  const states = PROGRESS_STATES.slice(1); // exclude null/"not started" from selector options

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={updating}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors
          ${current ? 'border-brand-green text-brand-green bg-brand-green-lt' : 'border-border text-text-muted bg-white hover:border-gray-300'}
          ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={`Track learning progress for ${skillName}`}
      >
        {updating
          ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          : current ? PROGRESS_STATES.find(p => p.value === current)?.icon : null
        }
        {current
          ? PROGRESS_STATES.find(p => p.value === current)?.label || 'Track'
          : 'Track progress'
        }
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-border rounded-lg shadow-md py-1 min-w-[140px]">
          {states.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => { onChange(skillName, s.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-surface transition-colors
                ${current === s.value ? 'text-brand-green font-medium' : 'text-text-secondary'}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
          {current && (
            <button
              type="button"
              onClick={() => { onChange(skillName, null); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-red-500 hover:bg-red-50 transition-colors border-t border-border mt-1"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
