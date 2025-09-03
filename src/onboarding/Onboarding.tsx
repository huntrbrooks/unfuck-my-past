import React, { useMemo, useState } from "react";
import flowConfig from "./flow.json";
import type { Flow, Step, Field, ChoiceField, TextField } from "./types";

type Props = {
  onComplete: (payload: Record<string, any>) => void;
  onChange?: (partial: Record<string, any>) => void;
};

const isChoice = (f: Field): f is ChoiceField => f.type === "choice";
const isText = (f: Field): f is TextField => f.type === "text" || f.type === "longtext";

const ToggleButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  hasWarning?: boolean;
  description?: string;
}> = ({ active, onClick, children, ariaLabel, hasWarning, description }) => {
  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-pressed={active}
        aria-label={ariaLabel}
        onClick={onClick}
        className={`w-full text-left rounded-xl border px-4 py-3 transition ${
          active 
            ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" 
            : hasWarning 
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:border-red-500 dark:hover:border-red-400" 
              : "bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400"
        }`}
      >
        {children}
      </button>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-1">{description}</p>
      )}
    </div>
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
      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 p-3 min-h-[120px] bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
    />
  ) : (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 p-3 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Age Restriction Notice</h3>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">
          {warning}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition"
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

const StepView: React.FC<{
  step: Step;
  values: Record<string, any>;
  setValues: (v: Record<string, any>) => void;
  index: number;
  total: number;
  next: () => void;
  prev: () => void;
}> = ({ step, values, setValues, index, total, next, prev }) => {
  const helper = step.helper;
  const [warningModal, setWarningModal] = useState<{ isOpen: boolean; warning: string }>({ isOpen: false, warning: '' });

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
      cur.has(option) ? cur.delete(option) : cur.add(option);
      const arr = Array.from(cur);
      setValues({ ...values, [field.id]: arr });
    } else {
      setValues({ ...values, [field.id]: option });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">Step {index + 1} of {total}</div>
      <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">{step.title}</h2>
      {step.subheading && (
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 font-medium">{step.subheading}</p>
      )}
      {helper ? <p className="text-gray-600 dark:text-gray-400 mb-6">{helper}</p> : null}
      <div className="space-y-8">
        {step.fields.map((field) => {
          if (isChoice(field)) {
            const current = values[field.id] ?? (field.multi ? [] : "");
            const isMulti = field.multi;
            return (
              <div key={field.id}>
                <div className="mb-3 font-semibold text-lg text-gray-900 dark:text-white">{field.label}{isMulti ? " (Choose all that apply)" : " (Select one)"}</div>
                {field.subheading && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{field.subheading}</p>
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
              </div>
            );
          } else if (isText(field)) {
            const long = field.type === "longtext";
            const val = values[field.id] ?? "";
            return (
              <div key={field.id}>
                <div className="mb-3 font-semibold text-lg text-gray-900 dark:text-white">{field.label}</div>
                {field.subheading && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{field.subheading}</p>
                )}
                <TextInput value={val} onChange={(v) => setValues({ ...values, [field.id]: v })} placeholder={field.placeholder} long={long} />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={prev} className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">Previous</button>
        {index < total - 1 ? (
          <button type="button" onClick={next} className="rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition">Next</button>
        ) : null}
      </div>

      <WarningModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal({ isOpen: false, warning: '' })}
        warning={warningModal.warning}
      />
    </div>
  );
};

const Onboarding: React.FC<Props> = ({ onComplete, onChange }) => {
  const flow = flowConfig as Flow;
  const steps = flow.steps;
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});

  const total = steps.length;
  const step = steps[stepIndex];

  const next = () => {
    const isLast = stepIndex >= total - 1 || step.final;
    if (onChange) onChange(values);
    if (isLast) {
      onComplete(values);
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const prev = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-6">
        <div className="bg-black dark:bg-white h-2 rounded-full transition-all" style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
      </div>
      <StepView
        step={step}
        index={stepIndex}
        total={total}
        values={values}
        setValues={(v) => { setValues(v); if (onChange) onChange(v); }}
        next={next}
        prev={prev}
      />
      {step.final ? (
        <div className="max-w-2xl mx-auto mt-6 flex justify-end">
          <button type="button" onClick={() => onComplete(values)} className="rounded-lg bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition">
            Complete Setup
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Onboarding;
