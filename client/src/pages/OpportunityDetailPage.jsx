import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Briefcase, Monitor, Building2,
  BookmarkCheck, Bookmark, ArrowRight,
} from 'lucide-react';
import { PageShell }        from '../components/layout/PageShell';
import { Badge }            from '../components/ui/Badge';
import { Button }           from '../components/ui/Button';
import { SkillGapSection }  from '../components/opportunities/SkillGapSection';
import { getOpportunity, toggleSaveOpportunity } from '../services/api';

const TIER_VARIANT = {
  'Strong Match': 'green', 'Good Match': 'green',
  'Partial Match': 'amber', 'Low Match': 'gray',
};

const ARRANGEMENT_LABELS = {
  onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote', flexible: 'Flexible',
};

/**
 * OpportunityDetailPage — full opportunity view with match breakdown.
 */
export default function OpportunityDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [opp,     setOpp]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOpportunity(id)
      .then(({ opportunity }) => {
        if (!cancelled) { setOpp(opportunity); setSaved(opportunity.isSaved); }
      })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleSaveToggle() {
    setSaving(true);
    try {
      const result = await toggleSaveOpportunity(id);
      setSaved(result.saved);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  if (loading) return (
    <PageShell>
      <div className="py-20 text-center">
        <div className="inline-block w-7 h-7 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    </PageShell>
  );

  if (error || !opp) return (
    <PageShell>
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-text-secondary mb-4">{error || 'Opportunity not found.'}</p>
        <Button variant="secondary" onClick={() => navigate('/opportunities')}>
          <ArrowLeft size={14} /> Back to opportunities
        </Button>
      </div>
    </PageShell>
  );

  const {
    title, company, domain, location, workArrangement, opportunityType,
    description, requiredSkills, preferredSkills,
    matchScore, matchTier, presentRequired, missingRequired, presentPreferred,
    explanation, disclaimer,
  } = opp;

  const scoreColour = matchScore >= 80 ? 'text-green-700'
                    : matchScore >= 55 ? 'text-green-600'
                    : matchScore >= 30 ? 'text-amber-600'
                    : 'text-text-muted';

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        {/* Back nav */}
        <button
          type="button"
          onClick={() => navigate('/opportunities')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-5 transition-colors"
        >
          <ArrowLeft size={14} /> All opportunities
        </button>

        {/* Header card */}
        <div className="card mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold">{title}</h1>
                <span className="badge-demo badge">{opportunityType}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-text-muted">
                <Building2 size={13} /> {company}
              </div>
            </div>

            {/* Match score */}
            <div className="text-right flex-shrink-0">
              <div className={`text-4xl font-bold leading-none ${scoreColour}`}>{matchScore}%</div>
              <Badge variant={TIER_VARIANT[matchTier] || 'gray'} className="mt-1">
                {matchTier}
              </Badge>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted border-t border-border pt-3">
            <span className="flex items-center gap-1"><MapPin size={13} /> {location}</span>
            <span className="flex items-center gap-1"><Monitor size={13} /> {ARRANGEMENT_LABELS[workArrangement] || workArrangement}</span>
            <span className="flex items-center gap-1"><Briefcase size={13} /> {domain}</span>
          </div>

          {/* Match progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>Overall match</span>
              <span className={scoreColour}>{matchScore}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  matchScore >= 55 ? 'bg-brand-green' : matchScore >= 30 ? 'bg-amber-400' : 'bg-gray-300'
                }`}
                style={{ width: `${matchScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="card mb-4 bg-surface border-border">
            <p className="text-sm font-medium text-text-primary mb-1">Why this role matches you</p>
            <p className="text-sm text-text-secondary">{explanation}</p>
          </div>
        )}

        {/* Skill breakdown */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold mb-3">Skill match breakdown</h2>

          <div className="space-y-4">
            {/* Required present */}
            {presentRequired.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                  ✅ Required skills you have ({presentRequired.length}/{requiredSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presentRequired.map((s, i) => (
                    <span key={i} className="badge badge-green">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Required missing */}
            {missingRequired.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                  ✗ Required skills to develop ({missingRequired.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missingRequired.map((s, i) => (
                    <span key={i} className="badge badge-amber">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred present */}
            {presentPreferred.length > 0 && (
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                  ⭐ Preferred skills you have ({presentPreferred.length}/{preferredSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presentPreferred.map((s, i) => (
                    <span key={i} className="badge badge-green opacity-80">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred missing */}
            {(() => {
              const missingPref = (preferredSkills || []).filter(
                s => !presentPreferred.includes(s)
              );
              return missingPref.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                    Preferred skills to consider ({missingPref.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingPref.map((s, i) => (
                      <span key={i} className="badge badge-gray">{s}</span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Job description */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold mb-2">About this role</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <Button
            variant={saved ? 'secondary' : 'primary'}
            size="lg"
            loading={saving}
            onClick={handleSaveToggle}
            className="flex-1 sm:flex-none"
          >
            {saved
              ? <><BookmarkCheck size={16} /> Saved</>
              : <><Bookmark size={16} /> Save this opportunity</>
            }
          </Button>

          {missingRequired.length > 0 && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/roadmap')}
              className="flex-1 sm:flex-none"
            >
              Build skills for this role <ArrowRight size={15} />
            </Button>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 border border-border rounded-lg text-xs text-text-muted">
          <span className="badge-demo badge flex-shrink-0">DEMO DATA</span>
          <p>{disclaimer}</p>
        </div>
      </div>
    </PageShell>
  );
}
