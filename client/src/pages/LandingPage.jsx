import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Target, BookOpen, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { startDemoSession } from '../services/api';

/**
 * LandingPage — the public-facing product page.
 *
 * Contains:
 * - Hero section with tagline and CTA
 * - How it works (3-step flow)
 * - Key features
 * - Footer disclaimer
 *
 * The "Start Demo" button calls POST /api/session/start to reset the demo
 * state, then navigates to /onboarding.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleStartDemo() {
    setLoading(true);
    setError(null);
    try {
      await startDemoSession();
      navigate('/onboarding');
    } catch (err) {
      setError('Could not connect to the server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Minimal top bar ─────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-brand-green flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 13L8 3L13 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 9.5H11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="text-[15px] font-semibold text-text-primary">
              SkillBridge <span className="text-brand-green">AI</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto">
          {/* Location badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green-lt text-green-800 text-xs font-medium mb-6">
            <span>📍</span>
            <span>Built for Bengaluru · IBM Bobathon 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
            Your Skills Are Worth<br />
            <span className="text-brand-green">More Than Your CV.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-xl mx-auto">
            SkillBridge AI connects your existing capabilities to the right opportunities —
            explains exactly what's missing, and builds a personalised learning path to get you there.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleStartDemo}
              aria-label="Start the SkillBridge AI demo"
            >
              {loading ? 'Starting…' : 'Start Demo'}
              {!loading && <ArrowRight size={18} aria-hidden="true" />}
            </Button>
            <p className="text-xs text-text-muted">
              No account needed · Demo data only · Free to explore
            </p>
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-md mx-auto">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-surface border-t border-border py-16 px-4" aria-labelledby="how-it-works-heading">
        <div className="max-w-4xl mx-auto">
          <p className="section-label text-center">How it works</p>
          <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold text-center mb-10">
            From profile to opportunity in four steps
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="card flex flex-col gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-green-lt flex items-center justify-center text-brand-green">
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    Step {i + 1}
                  </p>
                  <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key features ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4" aria-labelledby="features-heading">
        <div className="max-w-4xl mx-auto">
          <p className="section-label text-center">What makes it different</p>
          <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Opportunity readiness intelligence
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-card border border-border bg-white">
                <CheckCircle size={18} className="text-brand-green mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold mb-0.5">{f.title}</p>
                  <p className="text-sm text-text-secondary">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="bg-surface border-t border-border py-14 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Ready to discover your opportunities?</h2>
          <p className="text-text-secondary mb-6">
            Build your profile and let AI map your skills to the right roles in Bengaluru.
          </p>
          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleStartDemo}
          >
            {loading ? 'Starting…' : 'Get Started'}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </Button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <p className="m-0">© 2026 SkillBridge AI · Built for IBM Bobathon: Build for Bengaluru</p>
          <p className="m-0 text-center">
            ⚠️ All opportunities are <strong className="text-text-secondary">DEMO DATA</strong> — fictional listings only. Not a recruitment service.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Static content ─────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    title:       'Build your profile',
    description: 'Tell us about your education, projects, certifications, and career interests.',
  },
  {
    icon: <Zap size={18} />,
    title:       'AI extracts your skills',
    description: 'Our AI identifies your transferable skills from your profile. You review and confirm.',
  },
  {
    icon: <Target size={18} />,
    title:       'Discover matched roles',
    description: 'See opportunities ranked by how well your skills align — with a plain-English explanation.',
  },
  {
    icon: <BookOpen size={18} />,
    title:       'Follow your roadmap',
    description: 'Get a personalised learning path to close skill gaps with free, curated resources.',
  },
];

const FEATURES = [
  {
    title:       'Explainable match scores',
    description: 'Every match score is computed from your actual skills — not a black box.',
  },
  {
    title:       'Transferable skill recognition',
    description: 'Your experience in one area often applies to another. We surface those connections.',
  },
  {
    title:       'Skill gap breakdown',
    description: "See exactly what's present, what's missing, and what counts as transferable.",
  },
  {
    title:       'Personalised learning roadmap',
    description: 'Ordered, actionable steps with links to free, high-quality learning resources.',
  },
  {
    title:       'Progress tracking',
    description: 'Mark steps complete and watch your readiness score improve over time.',
  },
  {
    title:       'You stay in control',
    description: 'Review and edit every AI-extracted skill before it affects your matches.',
  },
];
