import { Check } from 'lucide-react';

/**
 * StepProgress — horizontal step indicator for the onboarding wizard.
 *
 * Props:
 *   steps       — array of { label } objects
 *   currentStep — 0-based index of the active step
 */
export function StepProgress({ steps, currentStep }) {
  return (
    <nav aria-label="Onboarding progress" className="w-full">
      {/* Desktop: numbered step indicators */}
      <ol className="hidden sm:flex items-center w-full">
        {steps.map((step, i) => {
          const done   = i < currentStep;
          const active = i === currentStep;
          const last   = i === steps.length - 1;

          return (
            <li key={i} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors
                    ${done   ? 'bg-brand-green border-brand-green text-white'          : ''}
                    ${active ? 'bg-white border-brand-green text-brand-green'          : ''}
                    ${!done && !active ? 'bg-white border-border text-text-muted'     : ''}
                  `}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap max-w-[80px] text-center leading-tight
                  ${active ? 'text-brand-green font-medium' : done ? 'text-text-secondary' : 'text-text-muted'}
                `}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!last && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors
                  ${i < currentStep ? 'bg-brand-green' : 'bg-border'}
                `} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: simple "Step X of N" + label */}
      <div className="flex sm:hidden items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">
            Step {currentStep + 1} of {steps.length}
          </p>
          <p className="text-sm font-semibold text-text-primary">
            {steps[currentStep]?.label}
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </nav>
  );
}
