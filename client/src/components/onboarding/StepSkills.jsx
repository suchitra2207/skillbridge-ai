import { SkillTagInput } from '../ui/SkillTagInput';
import {
  TECHNICAL_SKILLS, SOFT_SKILLS, TRANSFERABLE_SKILLS,
} from '../../data/skillSuggestions';

const TECH_SUGGESTIONS         = TECHNICAL_SKILLS.map(s    => ({ label: s, category: 'technical'    }));
const SOFT_SUGGESTIONS         = SOFT_SKILLS.map(s         => ({ label: s, category: 'soft'         }));
const TRANSFERABLE_SUGGESTIONS = TRANSFERABLE_SKILLS.map(s => ({ label: s, category: 'transferable' }));

/**
 * Step 3 — Skills
 *
 * Three separate tag inputs: technical, soft, and transferable skills.
 * Categories: technical | soft | transferable (standardised throughout the app).
 * Users must explicitly add each skill — suggestions are never auto-selected.
 */
export function StepSkills({ data, onChange }) {
  const allSkills = data.skills || [];

  const technical    = allSkills.filter(s => s.category === 'technical');
  const soft         = allSkills.filter(s => s.category === 'soft');
  // Accept both 'transferable' and legacy 'domain' from saved profiles
  const transferable = allSkills.filter(s => s.category === 'transferable' || s.category === 'domain');

  function replaceCategory(category, updated) {
    // Remove both 'transferable' and 'domain' when replacing transferable
    const removeCategories = category === 'transferable'
      ? (s) => s.category !== 'transferable' && s.category !== 'domain'
      : (s) => s.category !== category;
    const others = allSkills.filter(removeCategories);
    onChange({ ...data, skills: [...others, ...updated] });
  }

  return (
    <div className="space-y-7">
      {/* Notice */}
      <div className="p-3.5 bg-brand-green-lt border border-green-200 rounded-lg text-sm text-green-800">
        <strong>Tip:</strong> Include skills from projects, coursework, self-learning, or any practical context —
        not just paid work experience. AI will help identify additional skills on the next screen.
      </div>

      {/* Technical skills */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-0.5">Technical skills</h3>
        <p className="text-xs text-text-muted mb-3">
          Programming languages, frameworks, tools, platforms.
        </p>
        <SkillTagInput
          skills={technical}
          onChange={updated => replaceCategory('technical', updated)}
          suggestions={TECH_SUGGESTIONS}
          category="technical"
          placeholder="e.g. JavaScript, Python, React…"
        />
      </section>

      {/* Soft skills */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-0.5">Soft skills</h3>
        <p className="text-xs text-text-muted mb-3">
          Communication, teamwork, leadership, problem-solving, and other interpersonal skills.
        </p>
        <SkillTagInput
          skills={soft}
          onChange={updated => replaceCategory('soft', updated)}
          suggestions={SOFT_SUGGESTIONS}
          category="soft"
          placeholder="e.g. Communication, Teamwork…"
        />
      </section>

      {/* Transferable skills */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-0.5">Transferable &amp; professional skills</h3>
        <p className="text-xs text-text-muted mb-3">
          Methodologies, business practices, design, and domain knowledge that apply across roles.
        </p>
        <SkillTagInput
          skills={transferable}
          onChange={updated => replaceCategory('transferable', updated)}
          suggestions={TRANSFERABLE_SUGGESTIONS}
          category="transferable"
          placeholder="e.g. Agile, UI/UX Design, Business Analysis…"
        />
      </section>

      {/* Summary */}
      {allSkills.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-text-muted">
            <span className="font-medium text-text-secondary">
              {allSkills.length} skill{allSkills.length !== 1 ? 's' : ''} added
            </span>
            {' '}— {technical.length} technical, {soft.length} soft, {transferable.length} transferable
          </p>
        </div>
      )}
    </div>
  );
}
