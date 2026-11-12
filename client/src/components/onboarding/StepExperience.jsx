import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { EXPERIENCE_TYPES, TECHNICAL_SKILLS } from '../../data/skillSuggestions';
import { SkillTagInput } from '../ui/SkillTagInput';

const TECH_SUGGESTIONS = TECHNICAL_SKILLS.map(s => ({ label: s, category: 'technical' }));

const EMPTY_ENTRY = {
  title: '', type: 'personal_project', organisation: '',
  description: '', skills: [], duration: '',
};

/**
 * Step 4 — Projects & Experience
 *
 * Supports multiple entries: academic projects, personal projects,
 * internships, freelance work, volunteer work, other experience.
 * Work experience is NOT mandatory.
 */
export function StepExperience({ data, onChange }) {
  const entries = data.experience || [];
  const [expanded, setExpanded] = useState(entries.length === 0 ? null : 0);

  function addEntry() {
    const next = [...entries, { ...EMPTY_ENTRY, id: Date.now() }];
    onChange({ ...data, experience: next });
    setExpanded(next.length - 1);
  }

  function removeEntry(i) {
    const next = entries.filter((_, idx) => idx !== i);
    onChange({ ...data, experience: next });
    setExpanded(next.length > 0 ? Math.max(0, i - 1) : null);
  }

  function updateEntry(i, field, value) {
    const next = entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e);
    onChange({ ...data, experience: next });
  }

  const typeLabel = v => EXPERIENCE_TYPES.find(t => t.value === v)?.label || v;

  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-surface border border-border rounded-lg text-sm text-text-secondary">
        Add academic projects, personal projects, internships, freelance work, or any other practical experience.
        <strong className="text-text-primary"> Work experience is not required.</strong>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm border-2 border-dashed border-border rounded-lg">
          No entries yet. Click the button below to add your first project or experience.
        </div>
      )}

      {entries.map((entry, i) => (
        <div key={entry.id || i} className="card p-0 overflow-hidden">
          {/* Accordion header */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-surface transition-colors"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div>
              <p className="text-sm font-medium text-text-primary">
                {entry.title || 'Untitled entry'}
              </p>
              <p className="text-xs text-text-muted">
                {typeLabel(entry.type)}{entry.organisation ? ` · ${entry.organisation}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeEntry(i); }}
                className="p-1.5 text-text-muted hover:text-red-500 transition-colors rounded"
                aria-label="Remove this entry"
              >
                <Trash2 size={14} />
              </button>
              {expanded === i
                ? <ChevronUp size={16} className="text-text-muted" />
                : <ChevronDown size={16} className="text-text-muted" />
              }
            </div>
          </button>

          {/* Accordion body */}
          {expanded === i && (
            <div className="px-5 pb-5 border-t border-border space-y-4 pt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor={`exp-title-${i}`}>
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`exp-title-${i}`}
                    type="text"
                    className="form-input"
                    placeholder="e.g. E-commerce Website, Python Data Dashboard"
                    value={entry.title}
                    onChange={e => updateEntry(i, 'title', e.target.value)}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="form-label" htmlFor={`exp-type-${i}`}>Type</label>
                  <select
                    id={`exp-type-${i}`}
                    className="form-input"
                    value={entry.type}
                    onChange={e => updateEntry(i, 'type', e.target.value)}
                  >
                    {EXPERIENCE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Organisation / Client */}
                <div>
                  <label className="form-label" htmlFor={`exp-org-${i}`}>
                    Organisation / Client <span className="text-text-muted text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    id={`exp-org-${i}`}
                    type="text"
                    className="form-input"
                    placeholder="e.g. College name, client name"
                    value={entry.organisation}
                    onChange={e => updateEntry(i, 'organisation', e.target.value)}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="form-label" htmlFor={`exp-dur-${i}`}>
                    Duration <span className="text-text-muted text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    id={`exp-dur-${i}`}
                    type="text"
                    className="form-input"
                    placeholder="e.g. 3 months, Jan–Mar 2025"
                    value={entry.duration}
                    onChange={e => updateEntry(i, 'duration', e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor={`exp-desc-${i}`}>
                    Description <span className="text-text-muted text-xs font-normal">(what did you do, what did you build?)</span>
                  </label>
                  <textarea
                    id={`exp-desc-${i}`}
                    className="form-input resize-none"
                    rows={3}
                    maxLength={800}
                    placeholder="Describe what you built, your role, the problem you solved, or what you learned."
                    value={entry.description}
                    onChange={e => updateEntry(i, 'description', e.target.value)}
                  />
                  <p className="text-xs text-text-muted mt-1">{(entry.description || '').length}/800</p>
                </div>

                {/* Technologies / skills used */}
                <div className="sm:col-span-2">
                  <label className="form-label">Technologies / skills used</label>
                  <SkillTagInput
                    skills={(entry.skills || []).map(s =>
                      typeof s === 'string' ? { skillName: s, category: 'technical' } : s
                    )}
                    onChange={updated => updateEntry(i, 'skills', updated)}
                    suggestions={TECH_SUGGESTIONS}
                    category="technical"
                    placeholder="e.g. React, Python, Figma"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addEntry}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg text-sm text-text-secondary hover:border-brand-green hover:text-brand-green transition-colors"
      >
        <Plus size={16} />
        Add project or experience
      </button>
    </div>
  );
}
