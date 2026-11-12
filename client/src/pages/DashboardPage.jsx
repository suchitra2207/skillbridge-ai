import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, CheckCircle } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { Button }    from '../components/ui/Button';
import { getProfile } from '../services/api';

/**
 * DashboardPage — overview / home after onboarding.
 * Full implementation: Day 7.
 * Today: shows a profile summary and next-step CTAs.
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(({ profile }) => setProfile(profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="py-20 text-center">
          <div className="inline-block w-7 h-7 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  const pi       = profile?.personalInfo  || {};
  const skills   = profile?.skills        || [];
  const name     = pi.fullName || profile?.fullName || 'Demo User';

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        {/* Welcome banner */}
        <div className="card mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-green-lt flex items-center justify-center text-brand-green font-bold text-lg flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm text-text-muted">Welcome back</p>
            <h1 className="text-xl font-bold text-text-primary">{name}</h1>
            {profile?.headline && (
              <p className="text-sm text-text-secondary mt-0.5">{profile.headline}</p>
            )}
          </div>
          <Button variant="secondary" onClick={() => navigate('/onboarding')}>
            <User size={14} /> Edit Profile
          </Button>
        </div>

        {/* Profile completion banner */}
        <div className="card bg-brand-green-lt border-green-200 mb-6 flex items-start gap-3">
          <CheckCircle className="text-brand-green mt-0.5 flex-shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-green-800">Profile saved successfully!</p>
            <p className="text-sm text-green-700 mt-0.5">
              You have <strong>{skills.length} skill{skills.length !== 1 ? 's' : ''}</strong> in your profile.
              Next: discover matched opportunities and check your skill gaps.
            </p>
          </div>
        </div>

        {/* Next steps */}
        <h2 className="text-base font-semibold mb-3">What's next</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <NextStepCard
            step="Day 3"
            title="AI Skill Analysis"
            description="Let AI analyse your profile and identify transferable skills."
            onClick={() => navigate('/skills/review')}
          />
          <NextStepCard
            step="Day 4"
            title="Discover Opportunities"
            description="See matched job listings ranked by your skill fit."
            onClick={() => navigate('/opportunities')}
          />
          <NextStepCard
            step="Day 5"
            title="Skill Gap Analysis"
            description="Understand what's present, missing, and transferable."
            coming
          />
          <NextStepCard
            step="Day 6"
            title="Learning Roadmap"
            description="Get a personalised plan with free learning resources."
            coming
          />
        </div>

        {/* Skills summary */}
        {skills.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Your skills ({skills.length})</h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => {
                const cls = s.category === 'technical'    ? 'badge-green'
                          : s.category === 'soft'         ? 'badge-gray'
                          : s.category === 'transferable' ? 'badge-amber'
                          : 'badge-amber'; // legacy 'domain'
                return <span key={i} className={`badge ${cls}`}>{s.skillName}</span>;
              })}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function NextStepCard({ step, title, description, coming, onClick }) {
  return (
    <div className={`card flex flex-col gap-2 ${coming ? 'opacity-60' : ''}`}>
      <p className="section-label">{step}</p>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-text-secondary flex-1">{description}</p>
      {!coming && (
        <Button variant="secondary" className="self-start mt-1" onClick={onClick}>
          Get started <ArrowRight size={13} />
        </Button>
      )}
      {coming && (
        <span className="text-xs text-text-muted">Coming soon in this hackathon</span>
      )}
    </div>
  );
}
