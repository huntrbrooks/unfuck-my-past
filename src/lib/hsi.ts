export type HSIQuestion = {
  id: number;
  text: string;
};

export const HSI_QUESTIONS: HSIQuestion[] = [
  { id: 1, text: "I often feel like I’m carrying responsibilities that no one else sees." },
  { id: 2, text: "I’ve hidden parts of myself out of fear of being judged." },
  { id: 3, text: "I find it easier to help others with their problems than to face my own." },
  { id: 4, text: "A past mistake still influences how I see myself today." },
  { id: 5, text: "I sometimes chase achievements just to feel worthy." },
  { id: 6, text: "I often feel lonelier in a crowd than when I’m alone." },
  { id: 7, text: "I’ve said “I’m fine” when I was nowhere near fine." },
  { id: 8, text: "I avoid things I know I should do because the thought of failing is worse than not trying." },
  { id: 9, text: "I’ve questioned whether I’m living life the way I truly want, or just following expectations." },
  { id: 10, text: "I believe people would be surprised if they knew what really goes on in my head." }
];

export type HSIScoreCategory = "Surface Swimmer" | "Balancer" | "Quiet Fighter" | "Buried Self";

export type HSIPatterns = {
  socialStruggle: boolean; // #1, #6, #7
  selfWorthStruggle: boolean; // #4, #5, #8
  fearDrivenStruggle: boolean; // #2, #8, #9
  secretKeeperStruggle: boolean; // #3, #10
};

export type HSIResult = {
  totalTrue: number;
  category: HSIScoreCategory;
  patterns: HSIPatterns;
  trueIds: number[];
  falseIds: number[];
};

export function scoreHSI(trueIds: number[]): HSIResult {
  const set = new Set(trueIds);
  const totalTrue = trueIds.length;
  const category: HSIScoreCategory = totalTrue <= 2
    ? "Surface Swimmer"
    : totalTrue <= 5
    ? "Balancer"
    : totalTrue <= 8
    ? "Quiet Fighter"
    : "Buried Self";

  const patterns: HSIPatterns = {
    socialStruggle: [1,6,7].some(id => set.has(id)),
    selfWorthStruggle: [4,5,8].some(id => set.has(id)),
    fearDrivenStruggle: [2,8,9].some(id => set.has(id)),
    secretKeeperStruggle: [3,10].some(id => set.has(id))
  };

  const allIds = new Set(HSI_QUESTIONS.map(q => q.id));
  const falseIds = Array.from(allIds).filter(id => !set.has(id));
  return { totalTrue, category, patterns, trueIds: Array.from(set).sort((a,b)=>a-b), falseIds: falseIds.sort((a,b)=>a-b) };
}


