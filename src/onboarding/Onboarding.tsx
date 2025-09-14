import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import flowConfig from "./flow.json";
import type { Flow, Step, Field, ChoiceField, TextField, ScaleField } from "./types";

type Props = {
  onComplete: (payload: Record<string, string | string[] | undefined>) => void;
  onChange?: (partial: Record<string, string | string[] | undefined>) => void;
};

const isChoice = (f: Field): f is ChoiceField => f.type === "choice";
const isText = (f: Field): f is TextField => f.type === "text" || f.type === "longtext";
const isScale = (f: Field): f is ScaleField => f.type === "scale";

const ToggleButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  hasWarning?: boolean;
  description?: string;
}> = ({ active, onClick, children, ariaLabel, hasWarning, description }) => {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-200 ${
        active 
          ? "bg-primary text-primary-foreground border-primary shadow-lg" 
          : hasWarning 
            ? "bg-destructive/10 text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/20" 
            : "bg-card text-card-foreground border-border hover:border-primary/50 hover:bg-primary/5"
      }`}
    >
      {children}
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </button>
  );
};

const TextInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  long?: boolean;
}> = ({ value, onChange, placeholder, long }) => (
  long ? (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-background text-foreground p-3 min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
    />
  ) : (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-background text-foreground p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
    />
  )
);

const WarningModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  warning: string;
}> = ({ isOpen, onClose, warning }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground">Age Restriction Notice</h3>
        </div>
        <div className="text-sm text-muted-foreground mb-6 whitespace-pre-line">
          {warning}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-destructive text-destructive-foreground py-2 px-4 rounded-lg hover:bg-destructive/90 transition-colors"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

const CrisisModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🛟</div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="text-sm text-muted-foreground mb-6 whitespace-pre-line">
          {message}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="tel:000"
            className="w-full text-center bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Call 000
          </a>
          <a
            href="tel:131114"
            className="w-full text-center border border-border bg-background text-foreground py-2 px-4 rounded-lg hover:bg-muted/50 transition-colors"
          >
            Lifeline 13 11 14
          </a>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-lg border border-border bg-background text-foreground hover:bg-muted/50 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

const StepView: React.FC<{
  step: Step;
  values: Record<string, string | string[] | undefined>;
  setValues: (v: Record<string, string | string[] | undefined>) => void;
  index: number;
  total: number;
  next: () => void;
  prev: () => void;
  errors: Record<string, string>;
  canProceed: boolean;
}> = ({ step, values, setValues, index, total, next, prev, errors, canProceed }) => {
  const helper = step.helper;
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean; warning: string }>({ isOpen: false, warning: '' });
  const [crisisModal, setCrisisModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

  const handleChoiceClick = (field: ChoiceField, option: string) => {
    // Check if this option has a warning
    if (field.warnings && field.warnings[option]) {
      setWarningModal({ isOpen: true, warning: field.warnings[option] });
      return;
    }

    // Normal selection logic
    const current = values[field.id] ?? (field.multi ? [] : "");
    if (field.multi) {
      const cur = new Set(current as string[]);
      if (cur.has(option)) {
        cur.delete(option);
      } else {
        cur.add(option);
      }
      const arr = Array.from(cur);
      setValues({ ...values, [field.id]: arr });
    } else {
      setValues({ ...values, [field.id]: option });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 text-sm text-muted-foreground">Step {index + 1} of {total}</div>
      <h2 className="text-2xl font-semibold mb-2 text-foreground">{step.title}</h2>
      {step.subheading && (
        <p className="text-lg text-muted-foreground mb-4 font-medium">{step.subheading}</p>
      )}
      {helper && helper.trim() !== (step.subheading?.trim() || "") ? (
        <p className="text-muted-foreground mb-6">{helper}</p>
      ) : null}
      <div className="space-y-8">
        {step.fields.map((field) => {
          if (isChoice(field)) {
            const current = values[field.id] ?? (field.multi ? [] : "");
            const isMulti = field.multi;
            return (
              <div key={field.id}>
                <div className="mb-3 font-semibold text-lg text-foreground">{field.label}{isMulti ? " (Choose all that apply)" : " (Select one)"}</div>
                {field.subheading 
                  && field.subheading.trim() !== (step.subheading?.trim() || "")
                  && field.subheading.trim() !== (helper?.trim() || "") && (
                  <p className="text-muted-foreground mb-4">{field.subheading}</p>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {field.options.map((opt) => {
                    const active = isMulti ? (current as string[]).includes(opt) : current === opt;
                    const hasWarning = field.warnings && field.warnings[opt];
                    const description = field.descriptions && field.descriptions[opt];
                    return (
                      <ToggleButton
                        key={opt}
                        active={active}
                        onClick={() => handleChoiceClick(field, opt)}
                        ariaLabel={`${field.label}: ${opt}`}
                        hasWarning={!!hasWarning}
                        description={description}
                      >
                        {opt}
                      </ToggleButton>
                    );
                  })}
                </div>
                {errors[field.id] && (
                  <p className="text-destructive text-sm mt-2">{errors[field.id]}</p>
                )}
              </div>
            );
          } else if (isText(field)) {
            const val = (values[field.id] as string) ?? "";
            const long = field.type === "longtext";
            return (
              <div key={field.id}>
                <div className="mb-3 font-semibold text-lg text-foreground">{field.label}</div>
                {field.subheading 
                  && field.subheading.trim() !== (step.subheading?.trim() || "")
                  && field.subheading.trim() !== (helper?.trim() || "") && (
                  <p className="text-muted-foreground mb-4">{field.subheading}</p>
                )}
                <TextInput value={val} onChange={(v) => setValues({ ...values, [field.id]: v })} placeholder={field.placeholder} long={long} />
                {errors[field.id] && (
                  <p className="text-destructive text-sm mt-2">{errors[field.id]}</p>
                )}
              </div>
            );
          } else if (isScale(field)) {
            const current = Number(values[field.id] ?? field.min);
            const valueLabel = (field.valueLabels && field.valueLabels[current])
              || (current === field.min ? (field.minLabel ?? String(field.min))
              : current === field.max ? (field.maxLabel ?? String(field.max))
              : undefined);
            return (
              <div key={field.id}>
                <div className="mb-3 font-semibold text-lg text-foreground flex items-center justify-between">
                  <span>{field.label}</span>
                  <span className="text-sm text-muted-foreground">{valueLabel ? `${valueLabel} ` : ''}({current}{field.suffix ? `${field.suffix}` : ''})</span>
                </div>
                {field.subheading 
                  && field.subheading.trim() !== (step.subheading?.trim() || "")
                  && field.subheading.trim() !== (helper?.trim() || "") && (
                  <p className="text-muted-foreground mb-4">{field.subheading}</p>
                )}
                <div className="px-1">
                  <Slider
                    min={field.min}
                    max={field.max}
                    value={[current]}
                    onValueChange={(vals) => setValues({ ...values, [field.id]: String(vals[0]) })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{field.minLabel ?? field.min}</span>
                    <span>{field.maxLabel ?? field.max}</span>
                  </div>
                </div>
                {errors[field.id] && (
                  <p className="text-destructive text-sm mt-2">{errors[field.id]}</p>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="flex items-center justify-between mt-8">
        <button 
          type="button" 
          onClick={prev} 
          className="rounded-lg border border-border bg-background text-foreground px-4 py-2 hover:bg-muted/50 transition-colors"
        >
          Previous
        </button>
        {index < total - 1 ? (
          <button 
            type="button" 
            onClick={next} 
            disabled={!canProceed}
            className={`rounded-lg px-4 py-2 transition-colors ${
              canProceed 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            Next
          </button>
        ) : null}
      </div>

      <WarningModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal({ isOpen: false, warning: '' })}
        warning={warningModal.warning}
      />
      <CrisisModal 
        isOpen={crisisModal.isOpen}
        onClose={() => {
          setCrisisModal({ isOpen: false, title: '', message: '' });
          try { window.location.href = '/'; } catch {}
        }}
        title={crisisModal.title}
        message={crisisModal.message}
      />
    </div>
  );
};

const Onboarding: React.FC<Props> = ({ onComplete, onChange }) => {
  const flow = flowConfig as Flow;
  const steps = flow.steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string | string[] | undefined>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [crisisModal, setCrisisModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const total = steps.length;
  const step = steps[stepIndex];
  const [isCompleting, setIsCompleting] = useState(false);

  const computeStepErrors = () => {
    const newErrors: Record<string, string> = {};
    step.fields.forEach(field => {
      if (isChoice(field)) {
        if (!step.optional && (values[field.id] === undefined || values[field.id] === null ||
          (field.multi && (values[field.id] as string[])?.length === 0) ||
          (!field.multi && values[field.id] === ""))) {
          newErrors[field.id] = "This field is required.";
        }
      } else if (isText(field)) {
        if (!field.optional && (values[field.id] === undefined || values[field.id] === null || values[field.id] === "")) {
          newErrors[field.id] = "This field is required.";
        }
      }
    });
    return newErrors;
  };

  const next = () => {
    const newErrors = computeStepErrors();
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) return;
    const isLast = stepIndex >= total - 1 || step.final;
    if (onChange) onChange(values);

    // Special gating for consent & safety step
    if (step.id === 'consent') {
      const is18 = (values['is18OrOver'] as string) === 'Yes';
      const crisis = (values['crisisCheck'] as string) === 'Yes';
      const consent = (values['consentToProceed'] as string) === 'Agree';
      const disclaimer = (values['agreeDisclaimer'] as string) === 'Agree';
      if (!is18 || crisis) {
        setCrisisModal({
          isOpen: true,
          title: !is18 ? 'We care about your safety' : 'If you are in crisis, help is available',
          message: !is18
            ? 'This experience is for adults 18+. Please talk with a trusted adult or a licensed professional. If you need immediate help, call 000 (Australia) or Lifeline 13 11 14.'
            : 'If you are in immediate danger or thinking of harming yourself, please reach out for live support right now. Call 000 (Australia) or Lifeline 13 11 14. You can also visit lifeline.org.au.'
        });
        return;
      }
      if (!consent || !disclaimer) {
        // Block progression if the user does not consent or accept disclaimer
        setErrors({ ...newErrors, consentToProceed: 'You must consent to continue.', agreeDisclaimer: 'You must agree to continue.' });
        return;
      }
    }
    if (isLast) {
      setIsCompleting(true);
      // allow progress bar to render at 100% before navigation
      setTimeout(() => onComplete(values), 0);
    } else {
      setStepIndex(stepIndex + 1);
      try {
        // Smoothly scroll to the top of the questions card instead of page top
        setTimeout(() => {
          const el = document.getElementById('onboarding-card-top');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 0);
      } catch {}
    }
  };

  const prev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const progressValue = isCompleting ? 100 : Math.round(((stepIndex) / total) * 100);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground">Step {Math.min(stepIndex + 1, total)} of {total}</div>
        <div className="text-xs text-muted-foreground">{isCompleting ? 'Complete' : `${progressValue}%`}</div>
      </div>
      <Progress value={progressValue} variant="default" glow className="mb-6 h-2" />
      <StepView
        step={step}
        index={stepIndex}
        total={total}
        values={values}
        setValues={(v) => { setValues(v); if (onChange) onChange(v); }}
        next={next}
        prev={prev}
        errors={{ ...computeStepErrors(), ...errors }}
        canProceed={Object.keys(computeStepErrors()).length === 0}
      />
      {step.final ? (
        <div className="max-w-2xl mx-auto mt-6 flex justify-end">
          <button 
            type="button" 
            onClick={() => { setIsCompleting(true); setTimeout(() => onComplete(values), 0); }} 
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors shadow-lg"
          >
            Complete Setup
          </button>
        </div>
      ) : null}
      <CrisisModal
        isOpen={crisisModal.isOpen}
        onClose={() => setCrisisModal({ isOpen: false, title: '', message: '' })}
        title={crisisModal.title}
        message={crisisModal.message}
      />
    </div>
  );
};

export default Onboarding;
