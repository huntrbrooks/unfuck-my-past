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
}> = ({ active, onClick, children, ariaLabel, hasWarning }) => {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition ${
        active 
          ? "bg-black text-white border-black" 
          : hasWarning 
            ? "bg-red-50 text-red-700 border-red-300 hover:border-red-500" 
            : "bg-white text-black border-gray-300 hover:border-gray-500"
      }`}
    >
      {children}
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
      className="w-full rounded-xl border border-gray-300 p-3 min-h-[120px]"
    />
  ) : (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-gray-300 p-3"
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
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900">Age Restriction Notice</h3>
        </div>
        <div className="text-sm text-gray-700 mb-6 whitespace-pre-line">
          {warning}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
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
      <div className="mb-4 text-sm text-gray-600">Step {index + 1} of {total}</div>
      <h2 className="text-2xl font-semibold mb-2">{step.title}</h2>
      {helper ? <p className="text-gray-700 mb-4">{helper}</p> : null}
      <div className="space-y-6">
        {step.fields.map((field) => {
          if (isChoice(field)) {
            const current = values[field.id] ?? (field.multi ? [] : "");
            const isMulti = field.multi;
            return (
              <div key={field.id}>
                <div className="mb-2 font-medium">{field.label}{isMulti ? " (Choose all that apply)" : " (Select one)"}</div>
                {field.subheading && (
                  <p className="text-sm text-gray-600 mb-3 italic">{field.subheading}</p>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {field.options.map((opt) => {
                    const active = isMulti ? (current as string[]).includes(opt) : current === opt;
                    const hasWarning = field.warnings && field.warnings[opt];
                    return (
                      <ToggleButton 
                        key={opt} 
                        active={active} 
                        onClick={() => handleChoiceClick(field, opt)} 
                        ariaLabel={`${field.label}: ${opt}`}
                        hasWarning={!!hasWarning}
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
                <div className="mb-2 font-medium">{field.label}</div>
                <TextInput value={val} onChange={(v) => setValues({ ...values, [field.id]: v })} placeholder={field.placeholder} long={long} />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={prev} className="rounded-lg border px-4 py-2">Previous</button>
        {index < total - 1 ? (
          <button type="button" onClick={next} className="rounded-lg bg-black text-white px-4 py-2">Next</button>
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
    <div className="p-6">
      <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
        <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${((stepIndex + 1) / total) * 100}%` }} />
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
          <button type="button" onClick={() => onComplete(values)} className="rounded-lg bg-black text-white px-4 py-2">
            Complete Setup
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Onboarding;
