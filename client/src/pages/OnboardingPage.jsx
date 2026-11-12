import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, CheckCircle2 } from 'lucide-react';

import { PageShell }        from '../components/layout/PageShell';
import { Button }           from '../components/ui/Button';
import { StepProgress }     from '../components/onboarding/StepProgress';
import { StepPersonal }     from '../components/onboarding/StepPersonal';
import { StepCareerInterests } from '../components/onboarding/StepCareerInterests';
import { StepSkills }       from '../components/onboarding/StepSkills';
import { StepExperience }   from '../components/onboarding/StepExperience';
import { StepCertifications } from '../components/onboarding/StepCertifications';
import { StepReview }       from '../components/onboarding/StepReview';

import { getProfile, updateProfile } from '../services/api';

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Personal'      },
  { label: 'Interests'     },
  { label: 'Skills'        },
  { label: 'Experience'    },
  { label: 'Certifications' },
  { label: 'Review'        },
];

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  personal_info:   {},
  headline:        '',
  career_interests: {},
  skills:          [],
  experience:      [],
  certifications:  [],
};

/**
 * OnboardingPage — the multi-step profile builder.
 *
 * State management:
 * - `formData` holds the entire form state in memory during the session.
 * - On mount, we load any existing profile from the backend and pre-populate it.
 * - Each step saves to the backend before advancing (or on explicit "Save").
 * - The final "Save My Profile" on the Review step saves the complete profile.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();

  const [currentStep,   setCurrentStep]   = useState(0);
  const [formData,      setFormData]      = useState(EMPTY_FORM);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ── Load existing profile on mount ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      try {
        const { profile } = await getProfile();
        if (!cancelled) {
          setFormData(mapProfileToForm(profile));
          // Resume from last saved step, but cap at Review (step 5)
          const resumeStep = Math.min(profile.onboardingStep ?? 0, STEPS.length - 1);
          setCurrentStep(resumeStep);
          setProfileLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          // No profile yet or server error — start from scratch
          setProfileLoaded(true);
          if (err.message !== 'Profile not found') {
            setError('Could not load existing profile. Starting fresh.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  // ── Save current step data to backend ──────────────────────────────────────
  const saveProgress = useCallback(async (data, step) => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ ...mapFormToApi(data), onboarding_step: step });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────────
  async function handleNext() {
    if (!validateStep(currentStep, formData)) return;
    const nextStep = currentStep + 1;
    await saveProgress(formData, nextStep);
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleBack() {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleEditStep(step) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleFinalSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ ...mapFormToApi(formData), onboarding_step: STEPS.length - 1 });
      navigate('/dashboard');
    } catch (err) {
      setError(`Could not save profile: ${err.message}`);
      setSaving(false);
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateStep(step, data) {
    if (step === 0) {
      const pi = data.personal_info || {};
      if (!pi.fullName?.trim()) {
        setError('Please enter your full name before continuing.');
        return false;
      }
      if (!pi.currentStatus) {
        setError('Please select your current status before continuing.');
        return false;
      }
    }
    setError(null);
    return true;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell noFooter>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary text-sm">Loading your profile…</p>
        </div>
      </PageShell>
    );
  }

  const isFirstStep = currentStep === 0;
  const isLastStep  = currentStep === STEPS.length - 1;

  return (
    <PageShell noFooter>
      <div className="max-w-2xl mx-auto py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <p className="section-label">Build your profile</p>
          <h1 className="text-2xl font-bold text-text-primary">
            Let's get to know you
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            The more you share, the better we can match you with relevant opportunities.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <StepProgress steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step card */}
        <div className="card mb-5">
          {/* Step heading */}
          <div className="mb-5 pb-4 border-b border-border">
            <h2 className="text-lg font-semibold">{STEP_TITLES[currentStep]}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{STEP_SUBTITLES[currentStep]}</p>
          </div>

          {/* Step content */}
          {currentStep === 0 && <StepPersonal         data={formData} onChange={setFormData} />}
          {currentStep === 1 && <StepCareerInterests  data={formData} onChange={setFormData} />}
          {currentStep === 2 && <StepSkills           data={formData} onChange={setFormData} />}
          {currentStep === 3 && <StepExperience       data={formData} onChange={setFormData} />}
          {currentStep === 4 && <StepCertifications   data={formData} onChange={setFormData} />}
          {currentStep === 5 && <StepReview           data={formData} onEditStep={handleEditStep} />}
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Saved indicator */}
        {saved && (
          <div className="mb-4 flex items-center gap-2 text-sm text-brand-green">
            <CheckCircle2 size={16} />
            Progress saved
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={isFirstStep || saving}
          >
            <ArrowLeft size={16} /> Back
          </Button>

          {isLastStep ? (
            <Button
              variant="primary"
              size="lg"
              loading={saving}
              onClick={handleFinalSave}
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save My Profile'}
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={saving}
              onClick={handleNext}
            >
              {saving ? 'Saving…' : 'Next'}
              {!saving && <ArrowRight size={16} />}
            </Button>
          )}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-text-muted mt-4">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </PageShell>
  );
}

// ── Step copy ─────────────────────────────────────────────────────────────────

const STEP_TITLES = [
  'Personal information',
  'Career interests',
  'Your skills',
  'Projects & experience',
  'Certifications & learning',
  'Review your profile',
];

const STEP_SUBTITLES = [
  'Tell us about yourself and your educational background.',
  'What kind of roles and domains are you looking for?',
  'Add your technical, soft, and domain skills — from any source of learning.',
  'Add academic projects, personal projects, internships, or any practical work.',
  'Include online courses, certifications, bootcamps, or self-study.',
  'Everything looks good? Save your profile to start discovering opportunities.',
];

// ── Data mapping helpers ──────────────────────────────────────────────────────

/**
 * Map API profile response → flat form state
 */
function mapProfileToForm(profile) {
  return {
    personal_info:    profile.personalInfo || {},
    headline:         profile.headline     || '',
    career_interests: profile.careerInterests || {},
    skills:           (profile.skills || []).map(s => ({
                        skillName: s.skillName,
                        category:  s.category,
                      })),
    experience:       (profile.experience || []).map((e, i) => ({ ...e, id: e.id || Date.now() + i })),
    certifications:   (profile.certifications || []).map((c, i) => ({ ...c, id: c.id || Date.now() + i })),
  };
}

/**
 * Map flat form state → API PUT body
 * Normalises experience skills to plain strings for storage.
 */
function mapFormToApi(formData) {
  return {
    personal_info:    formData.personal_info,
    headline:         formData.headline,
    location:         formData.personal_info?.location || undefined,
    career_interests: formData.career_interests,
    skills:           formData.skills,
    experience:       (formData.experience || []).map(e => ({
                        ...e,
                        skills: (e.skills || []).map(s =>
                          typeof s === 'string' ? { skillName: s, category: 'technical' } : s
                        ),
                      })),
    certifications:   formData.certifications,
  };
}
