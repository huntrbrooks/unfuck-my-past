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

export type Field = ChoiceField | TextField;

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
