import { useState } from 'react';
import { X } from 'lucide-react';
import { JOB_ROLE_SUGGESTIONS, DOMAIN_SUGGESTIONS, WORK_ARRANGEMENT_OPTIONS } from '../../data/skillSuggestions';

/**
 * Step 2 — Career Interests
 */
export function StepCareerInterests({ data, onChange }) {
  const ci = data.career_interests || {};

  function update(field, value) {
    onChange({ ...data, career_interests: { ...ci, [field]: value } });
  }

  return (
    <div className="space-y-6">
      {/* Preferred roles */}
      <div>
        <label className="form-label">Preferred job roles</label>
        <p className="text-xs text-text-muted mb-2">Add the types of roles you want to apply for.</p>
        <ChipInput
          items={ci.preferredRoles || []}
          onChange={val => update('preferredRoles', val)}
          suggestions={JOB_ROLE_SUGGESTIONS}
          placeholder="e.g. Frontend Developer"
        />
      </div>

      {/* Preferred domains */}
      <div>
        <label className="form-label">Career domains of interest</label>
        <p className="text-xs text-text-muted mb-2">Which fields or industries interest you?</p>
        <ChipInput
          items={ci.preferredDomains || []}
          onChange={val => update('preferredDomains', val)}
          suggestions={DOMAIN_SUGGESTIONS}
          placeholder="e.g. Web Development"
        />
      </div>

      {/* Career goals / interests free text */}
      <div>
        <label className="form-label" htmlFor="careerGoals">
          Career goals <span className="text-text-muted text-xs font-normal">(optional)</span>
        </label>
        <textarea
          id="careerGoals"
          className="form-input resize-none"
          rows={3}
          placeholder="Briefly describe what you're looking for in your first role or what you hope to achieve…"
          maxLength={600}
          value={ci.goals || ''}
          onChange={e => update('goals', e.target.value)}
        />
        <p className="text-xs text-text-muted mt-1">{(ci.goals || '').length}/600</p>
      </div>

      {/* Work arrangement */}
      <div>
        <label className="form-label">Preferred work arrangement</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {WORK_ARRANGEMENT_OPTIONS.map(o => {
            const selected = ci.workArrangement === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => update('workArrangement', o.value)}
                className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors
                  ${selected
                    ? 'border-brand-green bg-brand-green-lt text-green-800 font-medium'
                    : 'border-border bg-white text-text-secondary hover:border-gray-300'
                  }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Reusable simple chip input (string arrays, no categories) ─────────────────

function ChipInput({ items, onChange, suggestions = [], placeholder }) {
  const [inputValue, setInputValue] = useState('');
  const [showDrop, setShowDrop] = useState(false);

  const lower = new Set(items.map(i => i.toLowerCase()));
  const filtered = suggestions
    .filter(s => !lower.has(s.toLowerCase()) && (!inputValue || s.toLowerCase().includes(inputValue.toLowerCase())))
    .slice(0, 8);

  function add(val) {
    const t = val.trim();
    if (!t || lower.has(t.toLowerCase())) return;
    onChange([...items, t]);
    setInputValue('');
    setShowDrop(false);
  }

  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <div
        className="min-h-[44px] w-full bg-white border border-border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-brand-green focus-within:border-transparent"
      >
        {items.map((item, i) => (
          <span key={i} className="badge badge-green pr-1 gap-1">
            {item}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hover:opacity-70 transition-opacity"
              aria-label={`Remove ${item}`}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setShowDrop(true); }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(inputValue); }
            else if (e.key === 'Backspace' && !inputValue && items.length > 0) remove(items.length - 1);
          }}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          placeholder={items.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] outline-none text-sm text-text-primary placeholder-text-muted bg-transparent"
        />
      </div>

      {showDrop && filtered.length > 0 && (
        <div className="bg-white border border-border rounded-lg shadow-md py-1 max-h-44 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); add(s); }}
              className="w-full text-left px-3.5 py-2 text-sm hover:bg-surface transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick-add chips */}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.filter(s => !lower.has(s.toLowerCase())).slice(0, 10).map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => add(s)}
            className="px-2.5 py-1 text-xs bg-surface border border-border rounded-full text-text-secondary hover:border-brand-green hover:text-brand-green transition-colors"
          >
            + {s}
          </button>
        ))}
      </div>
    </div>
  );
}
