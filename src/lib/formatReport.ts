import type { FullReport } from '@/lib/fullReportSchema'

function underline(header: string) {
  return '='.repeat(header.length)
}

function toUpperHeader(s: string) {
  return s.toUpperCase()
}

function dotBullets(items: string[]) {
  return items.map(s => `• ${s}`).join('\n')
}

export function formatReportMarkdown(r: FullReport) {
  // Format each section as a distinct block for card rendering
  const sections: string[] = []

  // 1) MOST TELLING QUOTE
  const quoteHeader = toUpperHeader('Most Telling Quote')
  const cleanQuote = r.mostTellingQuote?.quote
    ?.replace(/^[=\-\s]*"?/g, '')
    ?.replace(/"?\s*$/g, '')
    ?.trim() || ''
  if (cleanQuote) {
    sections.push(`${quoteHeader}\n${underline(quoteHeader)}\n"${cleanQuote}"`)
  }

  // 2) EXECUTIVE SUMMARY (lime)
  const executiveHeader = toUpperHeader('Executive Summary')
  sections.push(`${executiveHeader}\n${underline(executiveHeader)}\n${r.executiveSummary}`)

  // 3) YOUR COLOUR (handled by UI card)
  const colorHeader = toUpperHeader('Your Colour')
  sections.push(`${colorHeader}\n${underline(colorHeader)}\nPrimary: ${r.colorProfile.primary}${r.colorProfile.secondary ? ` | Secondary: ${r.colorProfile.secondary}` : ''}\n${r.colorProfile.story}`)

  // 4) YOUR SIX SCORES — removed from text output (shown as 6 cards in UI)

  // 5) TRAUMA ANALYSIS (orange)
  const traumaHeader = toUpperHeader('Trauma Analysis')
  const evidenceBlock = Array.isArray((r as any).traumaAnalysis?.evidence) && (r as any).traumaAnalysis.evidence.length
    ? `Evidence Quotes:\n${dotBullets((r as any).traumaAnalysis.evidence.map((e: any) => `"${e.quote}" (${e.questionId})`))}` 
    : ''
  sections.push([
    `${traumaHeader}\n${underline(traumaHeader)}`,
    `Root Causes & Triggers:\n${dotBullets(r.traumaAnalysis.rootCauses)}`,
    `How Past Events Shaped Patterns:\n${dotBullets(r.traumaAnalysis.shapedPatterns)}`,
    `Blind Spots:\n${dotBullets(r.traumaAnalysis.blindSpots)}`,
    `Contradictions:\n${dotBullets(r.traumaAnalysis.contradictions)}`,
    evidenceBlock
  ].filter(Boolean).join('\n\n'))

  // 6) TOXICITY SCORE (pink)
  const toxHeader = toUpperHeader('Toxicity Score')
  sections.push([
    toxHeader,
    underline(toxHeader),
    `Overall Score: ${r.toxicity.overall}/10`,
    `Confidence: ${r.toxicity.confidence.toUpperCase()} — ${r.toxicity.justification}`,
    '',
    dotBullets([
      `Self-Criticism: ${r.toxicity.subscales.selfCriticism}/10`,
      `Avoidance: ${r.toxicity.subscales.avoidance}/10`, 
      `Anxiety: ${r.toxicity.subscales.anxiety}/10`,
      `External Pressures: ${r.toxicity.subscales.externalPressures}/10`
    ])
  ].join('\n'))

  // 7) HOW TO LEAN INTO YOUR STRENGTHS (cyan)
  const strengthsHeader = toUpperHeader('How To Lean Into Your Strengths')
  sections.push([
    `${strengthsHeader}\n${underline(strengthsHeader)}`,
    ...r.strengths.map((s, i) => [
      `${s.name}`,
      `Why it matters: ${s.whyItMatters}`,
      `How to apply: ${s.howToApply}`
    ].join('\n'))
  ].join('\n\n'))

  // 8) MOST IMPORTANT TO ADDRESS (purple)
  const importantHeader = toUpperHeader('Most Important To Address')
  sections.push([
    importantHeader,
    underline(importantHeader),
    `${r.coreBlocker.label}`,
    `Impact now: ${r.coreBlocker.impactNow}`,
    `First step: ${r.coreBlocker.firstStep}`
  ].join('\n'))

  // 9) HIERARCHY OF AVOIDANCE (handled by UI chart)

  // 10) BEHAVIORAL PATTERNS (blue)
  const loopsHeader = toUpperHeader('Behavioral Patterns')
  sections.push([
    `${loopsHeader}\n${underline(loopsHeader)}`,
    ...r.behavioralPatterns.map((l, i) => [
      `Loop ${i + 1}: ${l.name}`,
      `Trigger: ${l.trigger}`,
      `Cycle: ${l.cycle}`, 
      `Impact: ${l.impact}`,
      `Break Point: ${l.breakPoint}`
    ].join('\n'))
  ].join('\n\n'))

  // 11) HEALING ROADMAP (green)
  const roadmapHeader = toUpperHeader('Healing Roadmap')
  const stageLabels = { immediate: 'Today', shortTerm: 'This Week', medium: 'This Month', longTerm: '3 Months', aspirational: '1 Year' }
  sections.push([
    `${roadmapHeader}\n${underline(roadmapHeader)}`,
    ...r.roadmap.map((step, idx) => {
      const stageLabel = stageLabels[step.stage as keyof typeof stageLabels] || step.stage
      return `${idx + 1}. ${stageLabel}: ${step.action}\n   Success: ${step.successMarker}`
    })
  ].join('\n\n'))

  // 12) ACTIONABLE RECOMMENDATIONS (red)
  const recHeader = toUpperHeader('Actionable Recommendations')
  sections.push([
    `${recHeader}\n${underline(recHeader)}`,
    ...r.recommendations.map((x, i) => [
      `${i + 1}. ${x.action} (${x.durationMin} min)`,
      `Why it works: ${x.whyItWorks}`,
      `Habit stack: ${x.habitStack}`,
      `Tags: ${x.tags.join(', ')}`
    ].join('\n'))
  ].join('\n\n'))



  // 13) NEXT STEPS (orange)
  const nextStepsHeader = toUpperHeader('Next Steps')
  if (Array.isArray((r as any).nextSteps) && (r as any).nextSteps.length) {
    sections.push(`${nextStepsHeader}\n${underline(nextStepsHeader)}\n${dotBullets((r as any).nextSteps as string[])}`)
  }

  // 14) RESOURCES (teal)
  const resHeader = toUpperHeader('Resources')
  const apps = r.resources.filter(x => x.type === 'app').map(x => `${x.name}${x.note ? `: ${x.note}` : ''}`)
  const books = r.resources.filter(x => x.type === 'book').map(x => `${x.name}${x.note ? `: ${x.note}` : ''}`)
  const articles = r.resources.filter(x => x.type === 'article').map(x => `${x.name}${x.note ? `: ${x.note}` : ''}`)
  const podcasts = r.resources.filter(x => x.type === 'podcast').map(x => `${x.name}${x.note ? `: ${x.note}` : ''}`)
  
  const resourceContent = [
    apps.length ? `Apps:\n${dotBullets(apps)}` : '',
    books.length ? `Books:\n${dotBullets(books)}` : '',
    articles.length ? `Articles:\n${dotBullets(articles)}` : '',
    podcasts.length ? `Podcasts:\n${dotBullets(podcasts)}` : ''
  ].filter(Boolean).join('\n\n')
  
  sections.push(`${resHeader}\n${underline(resHeader)}\n${resourceContent}`)

  // 15) PROFESSIONAL HELP (blue)
  const proHeader = toUpperHeader('Professional Help')
  const proMsg = r.toxicity.overall >= 8
    ? 'Recommended: Consider professional support to stabilise daily function.'
    : r.toxicity.overall >= 6
    ? 'Beneficial: Short-term guidance can accelerate practice and provide role-play support.'
    : 'Optional: Helpful if shame spirals become daily or boundaries collapse into panic.'
  
  sections.push(`${proHeader}\n${underline(proHeader)}\n${proMsg}`)

  // Return all 15 sections as separate blocks for card rendering
  return sections.join('\n\n')
}



