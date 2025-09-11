// Lightweight post-processor to normalize comprehensive report formatting
// - Converts common markdown headers to plain text underlined headers
// - Normalizes bullets to "•"
// - Ensures each point is on its own line

const KNOWN_SECTIONS = [
  'EXECUTIVE SUMMARY',
  'ROOT CAUSES & EMOTIONAL TRIGGERS',
  'HOW PAST EVENTS SHAPED CURRENT PATTERNS',
  'BLIND SPOTS OR UNRESOLVED NARRATIVES',
  'TOXICITY SCORE & CONFIDENCE',
  'CATEGORY BREAKDOWN',
  'HOW TO LEAN INTO YOUR STRENGTHS',
  'STRENGTHS',
  'MOST IMPORTANT TO ADDRESS',
  'PRIMARY ISSUE',
  'BEHAVIORAL PATTERNS',
  'RECURRING LOOPS',
  'KEY LEVERAGE POINT',
  'HEALING ROADMAP',
  'ACTIONABLE RECOMMENDATIONS',
  'QUICK ACTION PLAN',
  'RESOURCES AND NEXT STEPS',
  'RESOURCES',
  'PROFESSIONAL HELP'
]

function normalizeHeader(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Strip common markdown header tokens and emojis
  const withoutHashes = trimmed.replace(/^#+\s*/, '')
  const withoutEmoji = withoutHashes.replace(/^[^\w\(\[]+\s*/, '')
  const upper = withoutEmoji.toUpperCase()

  // Find a known section contained within the line
  const match = KNOWN_SECTIONS.find(section => upper.includes(section))
  if (!match) return null

  const header = match
  const underline = '='.repeat(header.length)
  return [header, underline]
}

function normalizeBullet(line: string): string {
  // Convert -, *, • to a single dot bullet
  const m = line.match(/^\s*([\-*•])\s+(.*)$/)
  if (m) {
    return `• ${m[2].trim()}`
  }
  // Convert list-like "1." or "- " inside sections like Category Breakdown to plain bullets
  const n = line.match(/^\s*\d+\.\s+(.*)$/)
  if (n) {
    return `• ${n[1].trim()}`
  }
  return line
}

export function formatComprehensiveReport(content: string): string {
  if (!content) return content

  const lines = content.split(/\r?\n/)
  const output: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\s+$/g, '')

    // Normalize header
    const header = normalizeHeader(line)
    if (header) {
      // Avoid duplicating underline if the next line is already an underline
      const next = lines[i + 1]?.trim() || ''
      const isAlreadyUnderlined = /^=+$/.test(next)
      output.push(header[0])
      output.push(isAlreadyUnderlined ? next : header[1])
      if (isAlreadyUnderlined) i += 1
      continue
    }

    // Normalize bullets
    line = normalizeBullet(line)

    // Ensure single spacing between blocks: collapse multiple blank lines
    if (line.trim() === '') {
      const last = output[output.length - 1] || ''
      if (last.trim() === '') continue
      output.push('')
      continue
    }

    output.push(line)
  }

  return output.join('\n')
}

export default formatComprehensiveReport



