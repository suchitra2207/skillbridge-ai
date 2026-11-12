import { useState, useEffect, useCallback } from 'react';
import { useSearchParams }  from 'react-router-dom';
import { Search, SlidersHorizontal, Bookmark, X } from 'lucide-react';
import { PageShell }         from '../components/layout/PageShell';
import { OpportunityCard }   from '../components/opportunities/OpportunityCard';
import { Button }            from '../components/ui/Button';
import {
  getOpportunities, getOpportunityMeta, getSavedOpportunities,
} from '../services/api';

const ARRANGEMENT_LABELS = {
  onsite:   'On-site',
  hybrid:   'Hybrid',
  remote:   'Remote',
  flexible: 'Flexible',
};

const TYPE_LABELS = {
  'full-time':  'Full-time',
  'internship': 'Internship',
};

/**
 * OpportunitiesPage — discovers and filters matched opportunities.
 */
export default function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ───────────────────────────────────────────────────────────────────
  const [opportunities, setOpportunities] = useState([]);
  const [savedOpps,     setSavedOpps]     = useState([]);
  const [meta,          setMeta]          = useState({ domains: [], workArrangements: [], types: [] });
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [hasSkills,     setHasSkills]     = useState(true);
  const [userSkillCount, setUserSkillCount] = useState(0);
  const [activeTab,     setActiveTab]     = useState('all'); // 'all' | 'saved'
  const [showFilters,   setShowFilters]   = useState(false);

  // ── Filters from URL params ─────────────────────────────────────────────────
  const search          = searchParams.get('search')          || '';
  const domainFilter    = searchParams.get('domain')          || '';
  const arrangementFilter = searchParams.get('workArrangement') || '';
  const typeFilter      = searchParams.get('opportunityType') || '';

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const activeFilterCount = [domainFilter, arrangementFilter, typeFilter, search].filter(Boolean).length;

  // ── Load meta (filter options) ──────────────────────────────────────────────
  useEffect(() => {
    getOpportunityMeta().then(setMeta).catch(() => {});
  }, []);

  // ── Load opportunities ──────────────────────────────────────────────────────
  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search)            params.search          = search;
      if (domainFilter)      params.domain          = domainFilter;
      if (arrangementFilter) params.workArrangement = arrangementFilter;
      if (typeFilter)        params.opportunityType = typeFilter;

      const data = await getOpportunities(params);
      setOpportunities(data.opportunities || []);
      setHasSkills(data.hasSkills);
      setUserSkillCount(data.userSkillCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [search, domainFilter, arrangementFilter, typeFilter]);

  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);

  // ── Load saved ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'saved') {
      getSavedOpportunities()
        .then(data => setSavedOpps(data.opportunities || []))
        .catch(() => setSavedOpps([]));
    }
  }, [activeTab]);

  // ── Save toggle callback ────────────────────────────────────────────────────
  function handleSaveToggle(id, isSaved) {
    setOpportunities(prev =>
      prev.map(o => o.id === id ? { ...o, isSaved } : o)
    );
    if (!isSaved) {
      setSavedOpps(prev => prev.filter(o => o.id !== id));
    }
  }

  // ── Display list ────────────────────────────────────────────────────────────
  const displayList = activeTab === 'saved' ? savedOpps : opportunities;

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <p className="section-label">Opportunities</p>
          <h1 className="text-2xl font-bold">Discover matched roles</h1>
          <p className="text-text-secondary text-sm mt-1">
            {userSkillCount > 0
              ? `Ranked by match to your ${userSkillCount} confirmed skill${userSkillCount !== 1 ? 's' : ''}.`
              : 'Complete your profile and confirm skills to see personalised match scores.'
            }
          </p>
        </div>

        {/* No-skills notice */}
        {!hasSkills && (
          <div className="card bg-brand-amber-lt border-amber-200 mb-5 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">Add skills to see your match scores</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Opportunities are shown below, but scores reflect 0 matched skills.
                <a href="/skills/review" className="ml-1 underline font-medium">Analyse your skills</a> or
                <a href="/onboarding" className="ml-1 underline font-medium">update your profile</a>.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-border">
          <TabButton
            active={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            label={`All opportunities (${opportunities.length})`}
          />
          <TabButton
            active={activeTab === 'saved'}
            onClick={() => setActiveTab('saved')}
            label={`Saved (${savedOpps.length})`}
            icon={<Bookmark size={13} />}
          />
        </div>

        {/* Search + filter bar */}
        {activeTab === 'all' && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="search"
                className="form-input pl-8"
                placeholder="Search by title, company or domain…"
                value={search}
                onChange={e => setFilter('search', e.target.value)}
                aria-label="Search opportunities"
              />
            </div>

            {/* Filter toggle */}
            <Button
              variant={showFilters || activeFilterCount > 1 ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(f => !f)}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-white text-brand-green text-xs font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Filter panel */}
        {activeTab === 'all' && showFilters && (
          <div className="card mb-4 grid sm:grid-cols-3 gap-4">
            {/* Domain */}
            <div>
              <label className="form-label text-xs">Domain</label>
              <select
                className="form-input text-sm"
                value={domainFilter}
                onChange={e => setFilter('domain', e.target.value)}
              >
                <option value="">All domains</option>
                {meta.domains.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Work arrangement */}
            <div>
              <label className="form-label text-xs">Work arrangement</label>
              <select
                className="form-input text-sm"
                value={arrangementFilter}
                onChange={e => setFilter('workArrangement', e.target.value)}
              >
                <option value="">All arrangements</option>
                {meta.workArrangements.map(a => (
                  <option key={a} value={a}>{ARRANGEMENT_LABELS[a] || a}</option>
                ))}
              </select>
            </div>

            {/* Opportunity type */}
            <div>
              <label className="form-label text-xs">Opportunity type</label>
              <select
                className="form-input text-sm"
                value={typeFilter}
                onChange={e => setFilter('opportunityType', e.target.value)}
              >
                <option value="">All types</option>
                {meta.types.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <X size={12} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="inline-block w-7 h-7 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted text-sm mt-3">Loading opportunities…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="card text-center py-10">
            <p className="text-text-secondary text-sm mb-3">{error}</p>
            <Button variant="secondary" onClick={loadOpportunities}>Retry</Button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {displayList.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                {activeTab === 'saved'
                  ? <p className="text-sm">No saved opportunities yet. Browse all roles and click <strong>Save</strong>.</p>
                  : <p className="text-sm">No opportunities match your current filters. <button className="text-brand-green underline" onClick={clearFilters}>Clear filters</button></p>
                }
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {displayList.map(opp => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer disclaimer */}
        <p className="text-center text-xs text-text-muted mt-8 py-4 border-t border-border">
          ⚠️ All opportunities shown are <strong>DEMO DATA</strong> — fictional listings created for demonstration purposes only.
          No companies, vacancies or application links are real.
        </p>
      </div>
    </PageShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, label, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
        ${active
          ? 'border-brand-green text-brand-green'
          : 'border-transparent text-text-muted hover:text-text-primary'
        }`}
    >
      {icon}{label}
    </button>
  );
}
