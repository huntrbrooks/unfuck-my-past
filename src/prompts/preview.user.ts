export function previewUserMsg(payload: {
  onboarding: any;
  levers: any;
  questions: { id: string; prompt: string }[];
  answers: { id: string; text: string }[];
  miniSummaries?: string[];
}) {
  return {
    role: "user",
    content: JSON.stringify({
      schema: "PreviewSchema",
      onboarding: payload.onboarding,
      levers: payload.levers,
      questions: payload.questions,
      answers: payload.answers,
      miniSummaries: payload.miniSummaries ?? []
    })
  };
}
