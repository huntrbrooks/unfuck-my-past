export type MiniResp = { question: string; response: string; insight: string; questionId?: string }

function scoreQuote(text: string): number {
  let s = 0
  if (!text) return 0
  const t = text.toLowerCase()
  if (/(i feel|i felt|i think|it feels|it felt|i always|i never)/.test(t)) s += 2
  if (/(ashamed|guilty|afraid|anxious|stuck|overwhelmed|numb|angry)/.test(t)) s += 2
  if (/(should|must|have to|supposed to)/.test(t)) s += 1
  if (t.length > 60) s += 1
  return s
}

export function extractHighSignal(responses: MiniResp[], limitQuotes: number = 3) {
  const quotes = responses
    .map(r => ({ qid: r.questionId || '', text: (r.response || '').trim(), score: scoreQuote(r.response || '') }))
    .filter(x => x.text)
    .sort((a, b) => b.score - a.score)
    .slice(0, limitQuotes)
    .map(x => ({ questionId: x.qid, quote: x.text.slice(0, 180) }))

  const joined = responses.map(r => `${r.response} ${r.insight}`).join(' ').toLowerCase()
  const contradiction = /i (can|will).+but.+(can'?t|won'?t|don'?t)/.test(joined)
    ? 'States desire to change but predicts failure in same breath'
    : 'Wants change but avoids first small step'

  const avoidance = /(later|tomorrow|when i have time|scroll|netflix|sleep it off)/.test(joined)
    ? 'Defers action to later or numbs via scrolling/TV'
    : 'Keeps busy with low-impact tasks to dodge discomfort'

  const somatic = /(tight|chest|stomach|gut|breath|breathing|jaw|shoulder)/.test(joined)
    ? 'Reports tightness in chest/jaw and shallow breathing under stress'
    : 'Likely shallow breathing and muscle tension during spikes'

  return { quotes, contradiction, avoidance, somatic }
}


