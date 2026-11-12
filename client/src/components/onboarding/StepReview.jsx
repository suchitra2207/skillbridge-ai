import { Edit2, User, Target, Code2, Briefcase, Award, CheckCircle } from 'lucide-react';
import { EXPERIENCE_TYPES, WORK_ARRANGEMENT_OPTIONS, CURRENT_STATUS_OPTIONS } from '../../data/skillSuggestions';

/**
 * Step 6 — Review Profile
 * Shows a clean summary of all entered information.
 * Allows navigation back to any section to edit.
 */
export function StepReview({ data, onEditStep }) {
  const pi = data.personal_info || {};
  const ci = data.career_interests || {};
  const skills = data.skills || [];
  const experience = data.experience || [];
  const certs = data.certifications || [];

  const statusLabel = v => CURRENT_STATUS_OPTIONS.find(o => o.value === v)?.label || v;
  const arrangementLabel = v => WORK_ARRANGEMENT_OPTIONS.find(o => o.value === v)?.label || v;
  const typeLabel = v => EXPERIENCE_TYPES.find(t => t.value === v)?.label || v;

  const technical    = skills.filter(s => s.category === 'technical');
  const soft         = skills.filter(s => s.category === 'soft');
  const transferable = skills.filter(s => s.category === 'transferable' || s.category === 'domain');

  return (
    <div className="space-y-5">
      {/* Completion message */}
      <div className="flex items-start gap-3 p-4 bg-brand-green-lt border border-green-200 rounded-lg">
        <CheckCircle className="text-brand-green flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-semibold text-green-800">Your profile is ready to save!</p>
          <p className="text-xs text-green-700 mt-0.5">
            Review the information below. Click any section's edit button to go back and make changes.
          </p>
        </div>
      </div>

      {/* Personal */}
      <ReviewSection
        icon={<User size={15} />}
        title="Personal information"
        onEdit={() => onEditStep(0)}
        empty={!pi.fullName}
      >
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <ReviewItem label="Name"         value={pi.fullName} />
          <ReviewItem label="Status"       value={statusLabel(pi.currentStatus)} />
          <ReviewItem label="Location"     value={pi.location} />
          <ReviewItem label="Email"        value={pi.email} />
          <ReviewItem label="Qualification" value={pi.qualification} />
          <ReviewItem label="Institution"  value={pi.institution} />
          <ReviewItem label="Grad year"    value={pi.graduationYear} />
        </dl>
        {data.headline && (
          <p className="mt-3 text-sm text-text-secondary italic border-t border-border pt-3">
            "{data.headline}"
          </p>
        )}
      </ReviewSection>

      {/* Career interests */}
      <ReviewSection
        icon={<Target size={15} />}
        title="Career interests"
        onEdit={() => onEditStep(1)}
        empty={!(ci.preferredRoles?.length || ci.preferredDomains?.length)}
      >
        {ci.preferredRoles?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Preferred roles</p>
            <ChipList items={ci.preferredRoles} />
          </div>
        )}
        {ci.preferredDomains?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Domains</p>
            <ChipList items={ci.preferredDomains} />
          </div>
        )}
        {ci.workArrangement && (
          <p className="text-sm text-text-secondary">
            Preferred work: <strong className="text-text-primary">{arrangementLabel(ci.workArrangement)}</strong>
          </p>
        )}
        {ci.goals && (
          <p className="text-sm text-text-secondary mt-2 border-t border-border pt-2">{ci.goals}</p>
        )}
      </ReviewSection>

      {/* Skills */}
      <ReviewSection
        icon={<Code2 size={15} />}
        title={`Skills (${skills.length})`}
        onEdit={() => onEditStep(2)}
        empty={skills.length === 0}
      >
        {technical.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Technical</p>
            <ChipList items={technical.map(s => s.skillName)} variant="green" />
          </div>
        )}
        {soft.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Soft skills</p>
            <ChipList items={soft.map(s => s.skillName)} />
          </div>
        )}
        {transferable.length > 0 && (
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Transferable</p>
            <ChipList items={transferable.map(s => s.skillName)} variant="amber" />
          </div>
        )}
      </ReviewSection>

      {/* Experience */}
      <ReviewSection
        icon={<Briefcase size={15} />}
        title={`Projects & Experience (${experience.length})`}
        onEdit={() => onEditStep(3)}
        empty={experience.length === 0}
        emptyNote="No projects or experience added — that's okay, you can add them later."
      >
        <div className="space-y-3">
          {experience.map((e, i) => (
            <div key={i} className="border-l-2 border-brand-green pl-3">
              <p className="text-sm font-medium text-text-primary">{e.title}</p>
              <p className="text-xs text-text-muted">{typeLabel(e.type)}{e.organisation ? ` · ${e.organisation}` : ''}{e.duration ? ` · ${e.duration}` : ''}</p>
              {e.description && <p className="text-sm text-text-secondary mt-1 line-clamp-2">{e.description}</p>}
              {e.skills?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {e.skills.map((s, si) => (
                    <span key={si} className="badge badge-gray text-xs">
                      {typeof s === 'string' ? s : s.skillName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ReviewSection>

      {/* Certifications */}
      <ReviewSection
        icon={<Award size={15} />}
        title={`Certifications & Learning (${certs.length})`}
        onEdit={() => onEditStep(4)}
        empty={certs.length === 0}
        emptyNote="No certifications added — you can add them later."
      >
        <div className="space-y-2">
          {certs.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-primary">{c.name}</p>
                <p className="text-xs text-text-muted">{c.issuer}{c.year ? ` · ${c.year}` : ''}</p>
                {c.skills && <p className="text-xs text-text-secondary mt-0.5">{c.skills}</p>}
              </div>
            </div>
          ))}
        </div>
      </ReviewSection>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReviewSection({ icon, title, onEdit, children, empty, emptyNote }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-brand-green">{icon}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-brand-green transition-colors"
        >
          <Edit2 size={12} /> Edit
        </button>
      </div>
      {empty ? (
        <p className="text-sm text-text-muted italic">
          {emptyNote || 'Not filled in yet — click Edit to add information.'}
        </p>
      ) : children}
    </div>
  );
}

function ReviewItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-sm text-text-primary font-medium">{value}</dd>
    </div>
  );
}

function ChipList({ items, variant = 'gray' }) {
  const cls = { green: 'badge-green', amber: 'badge-amber', gray: 'badge-gray' }[variant];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`badge ${cls}`}>{item}</span>
      ))}
    </div>
  );
}
