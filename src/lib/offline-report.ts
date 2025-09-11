type Resp = { question: string; response: string; insight: string }

function u(h: string) { return '='.repeat(h.length) }
function H(h: string) { return h.toUpperCase() }
function bullets(items: string[]) { return items.map(x => `• ${x}`).join('\n') }

export function buildOfflineReport(responses: Resp[], prefs?: { tone?: string; voice?: string }) {
  const tone = prefs?.tone || 'gentle'
  const voice = prefs?.voice || 'friend'
  const sample = responses.slice(0, 3)
  const sampleQuotes = sample.map(r => `“${(r.response || '').slice(0, 120)}”`).filter(Boolean)

  const execH = H('Executive Summary')
  const exec = [
    execH,
    u(execH),
    `We analyzed your ${responses.length} responses in a ${tone} tone and ${voice} voice. This offline summary highlights recurring patterns, likely stress points, and the fastest levers to regain momentum. It is a temporary report generated while AI is unavailable, but it still offers useful clarity and next steps.`
  ].join('\n')

  const traumaH = H('Trauma Analysis')
  const trauma = [
    traumaH,
    u(traumaH),
    bullets([
      'Recurring friction shows up around self-criticism and avoidance cycles.',
      'Emotional spikes appear to be triggered by perceived rejection or performance pressure.',
      'Somatic cues likely include shallow breathing and jaw tension during stress.'
    ])
  ].join('\n')

  const toxH = H('Toxicity Score & Confidence')
  const tox = [
    toxH,
    u(toxH),
    bullets([
      'Overall Toxicity Score: 5/10 (offline estimate)',
      'Confidence: Medium (offline estimate)',
      'Justification: Markers of rumination, avoidance, and self-criticism present but likely workable with consistency.'
    ])
  ].join('\n')

  const strengthsH = H('How To Lean Into Your Strengths')
  const strengths = [
    strengthsH,
    u(strengthsH),
    [
      ['1. Consistency', '• Why it matters: builds safety and momentum', '• How to apply: short daily actions at the same time'],
      ['2. Self-awareness', '• Why it matters: reduces blind reactions', '• How to apply: 60‑second check-ins before decisions'],
      ['3. Courage', '• Why it matters: interrupts avoidance loops', '• How to apply: choose the smallest honest action visible now']
    ].map(block => block.join('\n')).join('\n')
  ].join('\n')

  const mostH = H('Most Important To Address')
  const most = [
    mostH,
    u(mostH),
    bullets([
      'Primary blocker: avoidance + harsh self-talk after perceived mistakes.',
      'First step: 5‑minute “micro‑repair” after any slip (name it, breathe, restart).'
    ])
  ].join('\n')

  const patternsH = H('Behavioral Patterns')
  const patterns = [
    patternsH,
    u(patternsH),
    [
      ['1. The Tightening Loop', '• Trigger: fear of criticism', '• Cycle: delay → guilt → more delay', '• Impact: low momentum', '• Break point: 2‑minute start timer'],
      ['2. The Overload Loop', '• Trigger: too many open tabs/commitments', '• Cycle: jump tasks → fatigue → shutdown', '• Impact: scattered progress', '• Break point: pick one task, 10‑minute sprint']
    ].map(block => block.join('\n')).join('\n\n')
  ].join('\n')

  const roadH = H('Healing Roadmap')
  const road = [
    roadH,
    u(roadH),
    '1) 60‑second breath + name the pattern → 2) 2‑minute micro‑start → 3) 10‑minute focus sprint → 4) quick win logged → 5) one message of support'
  ].join('\n')

  const recH = H('Actionable Recommendations')
  const recs = [
    recH,
    u(recH),
    [
      ['1. Box Breathing (3 min)', 'Why it works: lowers arousal and widens perspective'],
      ['2. Two‑Minute Start (2 min)', 'Why it works: breaks inertia and reduces avoidance'],
      ['3. Single‑Task Sprint (10 min)', 'Why it works: creates quick, bankable wins'],
      ['4. Micro‑Repair Script (2 min)', 'Why it works: prevents shame spirals after slips'],
      ['5. Support Ping (2 min)', 'Why it works: reduces isolation, increases accountability']
    ].map(block => block.join('\n')).join('\n\n')
  ].join('\n')

  const resH = H('Resources And Next Steps')
  const resources = [
    resH,
    u(resH),
    'Apps/Tools:\n• Breathwrk\n• Notion or Apple Notes (Daily Wins)',
    'Books/Articles:\n• Atomic Habits — tiny behaviors, big change',
    'Services:\n• Local therapist or coach (brief, skills‑based)',
    sampleQuotes.length ? `Quotes Noted:\n${bullets(sampleQuotes)}` : ''
  ].filter(Boolean).join('\n')

  return [exec, trauma, tox, strengths, most, patterns, road, recs, resources].join('\n\n')
}


