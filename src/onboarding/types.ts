export type ChoiceField = {
  id: string;
  label: string;
  multi: boolean;
  options: string[];
  type: "choice";
};

export type TextField = {
  id: string;
  label: string;
  type: "text" | "longtext";
  placeholder?: string;
  optional?: boolean;
};

export type Field = ChoiceField | TextField;

export type Step = {
  id: string;
  title: string;
  helper?: string | null;
  optional?: boolean;
  final?: boolean;
  fields: Field[];
};

export type Flow = {
  steps: Step[];
};

export type OnboardingPayload = Record<string, string | string[] | undefined>;
