import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  Zap, CheckCircle2, XCircle, Edit2,
  AlertTriangle, Info, ArrowRight,
} from 'lucide-react';

import { PageShell }  from '../components/layout/PageShell';
import { Button }     from '../components/ui/Button';
import { Card }       from '../components/ui/Card';
import { Badge }      from '../components/ui/Badge';
import {
  extractSkills, confirmSkills, getProfile,
} from '../services/api';

// ── Category helpers ──────────────────────────────────────────────────────────
const CATEGORY_LABELS = {
  technical:    'Technical',
  soft:         'Soft',
  transferable: 'Transferable',
};

const CATEGORY_BADGE = {
  technical:    'green',
  soft:         'gray',
  transferable: 'amber',
};

const METHOD_COPY = {
  ai_extraction: {
    icon:  <Zap size={14} className="text-brand-green" />,
    label: 'AI-powered extraction',
    note:  'Skills identified by IBM watsonx.ai (Granite 4.0) from your profile text. Each suggestion includes an evidence reference.',
  },
  keyword_match: {
    icon:  <Info size={14} className="text-text-muted" />,
    label: 'Keyword matching',
    note:  'Skills found by matching your profile text against a curated skill taxonomy. These are deterministic text matches — not AI inferences.',
  },
};

/**
 * SkillExtractionPage — Day 3 feature.
 *
 * Flow:
 *   1. Mount → call POST /api/skills/extract → receive suggestions
 *   2. User reviews each suggestion: Accept (edit name optionally) or Reject
 *   3. User clicks "Save Confirmed Skills" → POST /api/skills/confirm
 *   4. Navigate to dashboard
 *
 * Rules enforced:
 *   - Nothing is saved until the user explicitly confirms
 *   - Rejected suggestions are never stored
 *   - Existing user-added skills are shown as already-confirmed; cannot be changed here
 *   - AI confidence scores shown for ai_extraction; no score shown for keyword_match
 */
export default function SkillExtractionPage() {
  const navigate = useNavigate();

  const [phase, setPhase]   = useState('loading'); // loading | reviewing | saving | done | error
  const [extraction, setExtraction] = useState(null);
  const [decisions, setDecisions]   = useState({});  // { index: 'accept' | 'reject' }
  const [edits, setEdits]           = useState({});   // { index: editedSkillName }
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue]   = useState('');
  const [existingSkills, setExistingSkills] = useState([]);
  const [saveResult, setSaveResult] = useState(null);
  const [errorMsg, setErrorMsg]     = useState(null);
  const [warning, setWarning]       = useState(null);

  // ── Load suggestions on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await extractSkills();
        if (cancelled) return;

        setExtraction(data);
        setExistingSkills(data.existingSkillNames || []);
        setWarning(data.warning || null);

        // Default: all suggestions start as 'accept'
        const initial = {};
        (data.suggestions || []).forEach((_, i) => { initial[i] = 'accept'; });
        setDecisions(initial);

        setPhase('reviewing');
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || 'Failed to extract skills. Is the backend running?');
          setPhase('error');
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Decision handlers ───────────────────────────────────────────────────────
  function accept(i)  { setDecisions(d => ({ ...d, [i]: 'accept' })); }
  function reject(i)  { setDecisions(d => ({ ...d, [i]: 'reject' })); }
  function acceptAll() {
    const all = {};
    (extraction?.suggestions || []).forEach((_, i) => { all[i] = 'accept'; });
    setDecisions(all);
  }
  function rejectAll() {
    const all = {};
    (extraction?.suggestions || []).forEach((_, i) => { all[i] = 'reject'; });
    setDecisions(all);
  }

  function startEdit(i, currentName) {
    setEditingIndex(i);
    setEditValue(currentName);
  }
  function commitEdit(i) {
    const trimmed = editValue.trim();
    if (trimmed) setEdits(e => ({ ...e, [i]: trimmed }));
    setEditingIndex(null);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const confirmed = (extraction?.suggestions || [])
      .map((s, i) => ({ ...s, skillName: edits[i] || s.skillName, _index: i }))
      .filter((_, i) => decisions[i] === 'accept')
      .map(s => ({ skillName: s.skillName, category: s.category }));

    if (confirmed.length === 0) {
      navigate('/dashboard');
      return;
    }

    setPhase('saving');
    try {
      const result = await confirmSkills(confirmed);
      setSaveResult(result);
      setPhase('done');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save skills');
      setPhase('error');
    }
  }

  // ── Derived counts ──────────────────────────────────────────────────────────
  const accepted = Object.values(decisions).filter(d => d === 'accept').length;
  const rejected = Object.values(decisions).filter(d => d === 'reject').length;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary text-sm font-medium">Analysing your profile…</p>
          <p className="text-text-muted text-xs mt-1">This may take a few seconds.</p>
        </div>
      </PageShell>
    );
  }

  if (phase === 'error') {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
          <h2 className="text-lg font-semibold mb-2">Extraction failed</h2>
          <p className="text-text-secondary text-sm mb-5">{errorMsg}</p>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </PageShell>
    );
  }

  if (phase === 'done') {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto py-16 text-center">
          <CheckCircle2 className="mx-auto text-brand-green mb-3" size={36} />
          <h2 className="text-xl font-bold mb-2">Skills saved!</h2>
          <p className="text-text-secondary text-sm mb-1">
            <strong>{saveResult?.inserted}</strong> skill{saveResult?.inserted !== 1 ? 's' : ''} added to your profile.
            {saveResult?.skipped > 0 && ` ${saveResult.skipped} already existed and were kept.`}
          </p>
          <p className="text-text-muted text-xs mb-6">
            Only skills you accepted were saved. Rejected suggestions were discarded.
          </p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Continue to Dashboard <ArrowRight size={15} />
          </Button>
        </div>
      </PageShell>
    );
  }

  const suggestions = extraction?.suggestions || [];
  const method      = extraction?.method;
  const modelId     = extraction?.modelId;
  const methodCopy  = METHOD_COPY[method] || METHOD_COPY.keyword_match;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <p className="section-label">AI Skill Analysis</p>
          <h1 className="text-2xl font-bold">Review your skill suggestions</h1>
          <p className="text-text-secondary text-sm mt-1">
            Accept, edit, or reject each suggestion. Only accepted skills will be saved.
          </p>
        </div>

        {/* Method banner */}
        <div className="card mb-5 flex items-start gap-3 py-3.5">
          {methodCopy.icon}
          <div>
            <p className="text-sm font-medium text-text-primary">{methodCopy.label}</p>
            <p className="text-xs text-text-muted mt-0.5">{methodCopy.note}</p>
            {modelId && (
              <p className="text-xs text-text-muted mt-0.5">Model: <code className="bg-gray-100 px-1 rounded text-xs">{modelId}</code></p>
            )}
          </div>
        </div>

        {/* Warning */}
        {warning && (
          <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}

        {/* Existing skills notice */}
        {existingSkills.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-surface border border-border rounded-lg text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{existingSkills.length} skill{existingSkills.length !== 1 ? 's' : ''}</span>
            {' '}already in your profile were excluded from suggestions.
          </div>
        )}

        {/* No suggestions */}
        {suggestions.length === 0 && (
          <Card className="text-center py-10">
            <p className="text-text-muted text-sm mb-3">No additional skills were found in your profile.</p>
            <p className="text-xs text-text-muted mb-5">
              Try adding more detail to your projects, certifications, or experience sections.
            </p>
            <Button variant="secondary" onClick={() => navigate('/onboarding')}>
              Update profile
            </Button>
          </Card>
        )}

        {/* Suggestions list */}
        {suggestions.length > 0 && (
          <>
            {/* Bulk actions */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-text-muted">
                {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} · {accepted} accepted · {rejected} rejected
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={acceptAll}
                  className="text-xs text-brand-green hover:underline font-medium"
                >
                  Accept all
                </button>
                <span className="text-text-muted text-xs">·</span>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Reject all
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {suggestions.map((s, i) => {
                const decision     = decisions[i] || 'accept';
                const displayName  = edits[i] || s.skillName;
                const isEditing    = editingIndex === i;
                const isAccepted   = decision === 'accept';
                const isRejected   = decision === 'reject';
                const showConf     = method === 'ai_extraction' && typeof s.confidence === 'number';

                return (
                  <div
                    key={i}
                    className={`card flex items-start gap-3 py-3.5 transition-opacity
                      ${isRejected ? 'opacity-40 line-through-none' : ''}
                    `}
                  >
                    {/* Accept/Reject toggle */}
                    <button
                      type="button"
                      onClick={() => isAccepted ? reject(i) : accept(i)}
                      className={`flex-shrink-0 mt-0.5 transition-colors rounded-full
                        ${isAccepted ? 'text-brand-green' : 'text-gray-300 hover:text-gray-400'}`}
                      aria-label={isAccepted ? 'Click to reject' : 'Click to accept'}
                      title={isAccepted ? 'Accepted — click to reject' : 'Rejected — click to accept'}
                    >
                      {isAccepted
                        ? <CheckCircle2 size={20} />
                        : <XCircle size={20} />
                      }
                    </button>

                    {/* Skill details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Skill name — editable */}
                        {isEditing ? (
                          <input
                            autoFocus
                            className="form-input py-1 text-sm font-medium w-40"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(i)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitEdit(i);
                              if (e.key === 'Escape') { setEditingIndex(null); }
                            }}
                          />
                        ) : (
                          <span className={`text-sm font-medium ${isRejected ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                            {displayName}
                          </span>
                        )}

                        {/* Category badge */}
                        <Badge variant={CATEGORY_BADGE[s.category] || 'gray'}>
                          {CATEGORY_LABELS[s.category] || s.category}
                        </Badge>

                        {/* Method label */}
                        {method === 'keyword_match' && (
                          <span className="text-xs text-text-muted">keyword match</span>
                        )}

                        {/* Confidence — only for AI extraction */}
                        {showConf && (
                          <span className={`text-xs ${s.confidence >= 0.8 ? 'text-brand-green' : 'text-text-muted'}`}>
                            {Math.round(s.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>

                      {/* Evidence */}
                      <p className="text-xs text-text-muted mt-1 truncate">
                        <span className="font-medium">From: </span>
                        {s.evidence || 'Profile text'}
                        {s.evidenceVerified === false && (
                          <span className="text-amber-600 ml-1">(section reference)</span>
                        )}
                      </p>
                    </div>

                    {/* Edit button — only when accepted */}
                    {isAccepted && !isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(i, displayName)}
                        className="flex-shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors rounded"
                        aria-label="Edit skill name"
                        title="Edit skill name"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Save footer */}
            <div className="sticky bottom-4 flex items-center justify-between gap-3 bg-white border border-border rounded-xl px-4 py-3 shadow-md">
              <div className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{accepted}</span> skill{accepted !== 1 ? 's' : ''} will be saved
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Skip
                </Button>
                <Button
                  variant="primary"
                  loading={phase === 'saving'}
                  onClick={handleSave}
                >
                  {phase === 'saving' ? 'Saving…' : 'Save Confirmed Skills'}
                  {phase !== 'saving' && <CheckCircle2 size={15} />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
