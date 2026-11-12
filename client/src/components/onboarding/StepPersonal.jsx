import { QUALIFICATION_OPTIONS, CURRENT_STATUS_OPTIONS } from '../../data/skillSuggestions';

/**
 * Step 1 — Personal Information
 */
export function StepPersonal({ data, onChange }) {
  const pi = data.personal_info || {};

  function update(field, value) {
    onChange({ ...data, personal_info: { ...pi, [field]: value } });
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Full name */}
        <div>
          <label className="form-label" htmlFor="fullName">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            className="form-input"
            placeholder="e.g. Priya Sharma"
            value={pi.fullName || ''}
            onChange={e => update('fullName', e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="form-label" htmlFor="email">
            Email <span className="text-text-muted text-xs font-normal">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={pi.email || ''}
            onChange={e => update('email', e.target.value)}
            autoComplete="email"
          />
        </div>

        {/* Location */}
        <div>
          <label className="form-label" htmlFor="location">
            Current location
          </label>
          <input
            id="location"
            type="text"
            className="form-input"
            placeholder="Bengaluru, Karnataka"
            value={pi.location || ''}
            onChange={e => update('location', e.target.value)}
          />
        </div>

        {/* Current status */}
        <div>
          <label className="form-label" htmlFor="currentStatus">
            Current status <span className="text-red-500">*</span>
          </label>
          <select
            id="currentStatus"
            className="form-input"
            value={pi.currentStatus || ''}
            onChange={e => update('currentStatus', e.target.value)}
            required
          >
            <option value="">Select your status…</option>
            {CURRENT_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Qualification */}
        <div>
          <label className="form-label" htmlFor="qualification">
            Highest qualification
          </label>
          <select
            id="qualification"
            className="form-input"
            value={pi.qualification || ''}
            onChange={e => update('qualification', e.target.value)}
          >
            <option value="">Select qualification…</option>
            {QUALIFICATION_OPTIONS.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        {/* Institution */}
        <div>
          <label className="form-label" htmlFor="institution">
            College / University
          </label>
          <input
            id="institution"
            type="text"
            className="form-input"
            placeholder="e.g. BMS College of Engineering"
            value={pi.institution || ''}
            onChange={e => update('institution', e.target.value)}
          />
        </div>

        {/* Graduation year */}
        <div>
          <label className="form-label" htmlFor="graduationYear">
            Graduation year
          </label>
          <select
            id="graduationYear"
            className="form-input"
            value={pi.graduationYear || ''}
            onChange={e => update('graduationYear', e.target.value)}
          >
            <option value="">Select year…</option>
            {Array.from({ length: 8 }, (_, i) => 2026 - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
            <option value="2019">2019 or earlier</option>
          </select>
        </div>

        {/* Headline */}
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="headline">
            One-line professional headline <span className="text-text-muted text-xs font-normal">(optional)</span>
          </label>
          <input
            id="headline"
            type="text"
            className="form-input"
            placeholder="e.g. Final-year CS student passionate about web development"
            maxLength={140}
            value={data.headline || ''}
            onChange={e => onChange({ ...data, headline: e.target.value })}
          />
          <p className="text-xs text-text-muted mt-1">
            {(data.headline || '').length}/140 characters
          </p>
        </div>
      </div>
    </div>
  );
}
