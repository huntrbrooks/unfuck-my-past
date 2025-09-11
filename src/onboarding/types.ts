export type ChoiceField = {
  id: string;
  label: string;
  multi: boolean;
  options: string[];
  type: "choice";
  subheading?: string;
  descriptions?: Record<string, string>;
  warnings?: Record<string, string>;
};

export type TextField = {
  id: string;
  label: string;
  type: "text" | "longtext";
  placeholder?: string;
  optional?: boolean;
  subheading?: string;
};

export type ScaleField = {
  id: string;
  label: string;
  type: "scale";
  min: number;
  max: number;
  step?: number;
  subheading?: string;
  suffix?: string; // e.g., /10
  minLabel?: string;
  maxLabel?: string;
  valueLabels?: Record<number, string>; // optional exact labels for values
};

export type Field = ChoiceField | TextField | ScaleField;

export type Step = {
  id: string;
  title: string;
  subheading?: string;
  helper?: string | null;
  optional?: boolean;
  final?: boolean;
  fields: Field[];
};

export type Flow = {
  steps: Step[];
};

export type OnboardingPayload = Record<string, string | string[] | undefined>;
