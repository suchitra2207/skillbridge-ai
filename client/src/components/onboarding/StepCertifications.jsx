import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const EMPTY_CERT = {
  name: '', issuer: '', year: '', skills: '',
};

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => 2026 - i);

/**
 * Step 5 — Certifications & Learning
 *
 * Supports: online courses, certifications, bootcamps, workshops.
 * Self-learning and MOOCs are explicitly encouraged.
 */
export function StepCertifications({ data, onChange }) {
  const certs = data.certifications || [];
  const [expanded, setExpanded] = useState(certs.length === 0 ? null : 0);

  function addCert() {
    const next = [...certs, { ...EMPTY_CERT, id: Date.now() }];
    onChange({ ...data, certifications: next });
    setExpanded(next.length - 1);
  }

  function removeCert(i) {
    const next = certs.filter((_, idx) => idx !== i);
    onChange({ ...data, certifications: next });
    setExpanded(next.length > 0 ? Math.max(0, i - 1) : null);
  }

  function updateCert(i, field, value) {
    const next = certs.map((c, idx) => idx === i ? { ...c, [field]: value } : c);
    onChange({ ...data, certifications: next });
  }

  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-surface border border-border rounded-lg text-sm text-text-secondary">
        Include online courses, certifications, bootcamps, workshops, and self-study.
        Platforms like <strong className="text-text-primary">Coursera, NPTEL, freeCodeCamp, Udemy, LinkedIn Learning</strong> all count.
      </div>

      {certs.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm border-2 border-dashed border-border rounded-lg">
          No certifications added yet.
        </div>
      )}

      {certs.map((cert, i) => (
        <div key={cert.id || i} className="card p-0 overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-surface transition-colors"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div>
              <p className="text-sm font-medium text-text-primary">
                {cert.name || 'Untitled certification'}
              </p>
              <p className="text-xs text-text-muted">
                {cert.issuer || 'No issuer'}{cert.year ? ` · ${cert.year}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeCert(i); }}
                className="p-1.5 text-text-muted hover:text-red-500 transition-colors rounded"
                aria-label="Remove certification"
              >
                <Trash2 size={14} />
              </button>
              {expanded === i
                ? <ChevronUp size={16} className="text-text-muted" />
                : <ChevronDown size={16} className="text-text-muted" />
              }
            </div>
          </button>

          {expanded === i && (
            <div className="px-5 pb-5 border-t border-border space-y-4 pt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Certificate name */}
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor={`cert-name-${i}`}>
                    Certificate / Course name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`cert-name-${i}`}
                    type="text"
                    className="form-input"
                    placeholder="e.g. React – The Complete Guide, AWS Cloud Practitioner"
                    value={cert.name}
                    onChange={e => updateCert(i, 'name', e.target.value)}
                  />
                </div>

                {/* Issuer */}
                <div>
                  <label className="form-label" htmlFor={`cert-issuer-${i}`}>
                    Issuing organisation / platform
                  </label>
                  <input
                    id={`cert-issuer-${i}`}
                    type="text"
                    className="form-input"
                    placeholder="e.g. Coursera, Udemy, NPTEL, freeCodeCamp"
                    value={cert.issuer}
                    onChange={e => updateCert(i, 'issuer', e.target.value)}
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="form-label" htmlFor={`cert-year-${i}`}>
                    Completion year <span className="text-text-muted text-xs font-normal">(optional)</span>
                  </label>
                  <select
                    id={`cert-year-${i}`}
                    className="form-input"
                    value={cert.year}
                    onChange={e => updateCert(i, 'year', e.target.value)}
                  >
                    <option value="">Select year…</option>
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                    <option value="before_2016">Before 2016</option>
                  </select>
                </div>

                {/* Skills learned */}
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor={`cert-skills-${i}`}>
                    Key skills learned <span className="text-text-muted text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    id={`cert-skills-${i}`}
                    type="text"
                    className="form-input"
                    placeholder="e.g. React, Redux, Hooks, JavaScript"
                    value={cert.skills}
                    onChange={e => updateCert(i, 'skills', e.target.value)}
                  />
                  <p className="text-xs text-text-muted mt-1">Comma-separated</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addCert}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg text-sm text-text-secondary hover:border-brand-green hover:text-brand-green transition-colors"
      >
        <Plus size={16} />
        Add certification or course
      </button>
    </div>
  );
}
