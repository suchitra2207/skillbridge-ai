import { useState } from 'react';
import { useNavigate }   from 'react-router-dom';
import { Bookmark, BookmarkCheck, MapPin, Briefcase, Monitor, Building2 } from 'lucide-react';
import { Badge }  from '../ui/Badge';
import { toggleSaveOpportunity } from '../../services/api';

// ── Tier → badge variant ──────────────────────────────────────────────────────
const TIER_VARIANT = {
  'Strong Match':  'green',
  'Good Match':    'green',
  'Partial Match': 'amber',
  'Low Match':     'gray',
};

const ARRANGEMENT_LABELS = {
  onsite:   'On-site',
  hybrid:   'Hybrid',
  remote:   'Remote',
  flexible: 'Flexible',
};

const TYPE_LABELS = {
  'full-time':  'Full-time',
  'internship': 'Internship',
  'part-time':  'Part-time',
};

/**
 * OpportunityCard — displays a single opportunity with match data.
 *
 * Props:
 *   opportunity  — full opportunity object with matchScore, matchTier etc.
 *   onSaveToggle — optional callback after save/unsave
 */
export function OpportunityCard({ opportunity, onSaveToggle }) {
  const navigate = useNavigate();
  const [saved, setSaved]     = useState(opportunity.isSaved);
  const [saving, setSaving]   = useState(false);

  const {
    id, title, company, domain, location, workArrangement, opportunityType,
    matchScore, matchTier, presentRequired, missingRequired, presentPreferred,
    explanation,
  } = opportunity;

  async function handleSaveToggle(e) {
    e.stopPropagation();
    setSaving(true);
    try {
      const result = await toggleSaveOpportunity(id);
      setSaved(result.saved);
      onSaveToggle?.(id, result.saved);
    } catch {
      // Silently ignore — user can retry
    } finally {
      setSaving(false);
    }
  }

  const scoreColour = matchScore >= 80 ? 'text-green-700'
                    : matchScore >= 55 ? 'text-green-600'
                    : matchScore >= 30 ? 'text-amber-600'
                    : 'text-text-muted';

  return (
    <article
      className="card hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
      onClick={() => navigate(`/opportunities/${id}`)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/opportunities/${id}`)}
      aria-label={`${title} at ${company} — ${matchTier}`}
    >
      {/* Top row: title + save button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary leading-snug">{title}</h3>
            <span className="badge-demo badge">{TYPE_LABELS[opportunityType] || opportunityType}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Building2 size={11} className="flex-shrink-0" />
            <span>{company}</span>
          </div>
        </div>

        {/* Match score */}
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-bold leading-none ${scoreColour}`}>
            {matchScore}%
          </div>
          <Badge variant={TIER_VARIANT[matchTier] || 'gray'} className="mt-0.5 whitespace-nowrap">
            {matchTier}
          </Badge>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <MapPin size={11} /> {location}
        </span>
        <span className="flex items-center gap-1">
          <Monitor size={11} /> {ARRANGEMENT_LABELS[workArrangement] || workArrangement}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase size={11} /> {domain}
        </span>
      </div>

      {/* Score breakdown */}
      <div className="space-y-1.5">
        {/* Match bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              matchScore >= 55 ? 'bg-brand-green' : matchScore >= 30 ? 'bg-amber-400' : 'bg-gray-300'
            }`}
            style={{ width: `${matchScore}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Skill chips — compact view */}
        <div className="flex flex-wrap gap-1">
          {presentRequired.slice(0, 4).map((s, i) => (
            <span key={i} className="badge badge-green text-xs">{s}</span>
          ))}
          {missingRequired.slice(0, 3).map((s, i) => (
            <span key={i} className="badge badge-gray text-xs opacity-60">✗ {s}</span>
          ))}
          {(presentRequired.length + missingRequired.length > 7) && (
            <span className="badge badge-gray text-xs opacity-50">
              +{presentRequired.length + missingRequired.length - 7} more
            </span>
          )}
        </div>
      </div>

      {/* Explanation snippet */}
      {explanation && (
        <p className="text-xs text-text-secondary line-clamp-2">{explanation}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border mt-auto">
        <span className="badge badge-demo">DEMO DATA</span>
        <button
          type="button"
          onClick={handleSaveToggle}
          disabled={saving}
          className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded
            ${saved
              ? 'text-brand-green hover:text-green-700'
              : 'text-text-muted hover:text-text-primary'
            }`}
          aria-label={saved ? 'Remove from saved' : 'Save opportunity'}
        >
          {saved
            ? <><BookmarkCheck size={14} /> Saved</>
            : <><Bookmark size={14} /> Save</>
          }
        </button>
      </div>
    </article>
  );
}
