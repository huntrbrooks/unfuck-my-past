'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, History, Settings } from 'lucide-react'
import { PrefsSchema, type PrefsUpdate } from '@/lib/prefsSchema'
import { analytics } from '@/lib/analytics'
import { toast } from 'sonner'
import { useRequireOnboardingAndDiagnostic } from '@/hooks/use-access-guard'

const TONES = ['gentle','direct','coaching','casual','clinical','spiritual'] as const
const GUIDE_STYLES = ['friend','mentor','therapist-style','coach'] as const
const GUIDANCE = ['mild','moderate','intense'] as const
const DEPTHS = ['surface','moderate','deep','profound'] as const
const PRIMARY_FOCUS = ['sleep','anxiety','confidence','relationships','trauma-processing','habits/consistency','purpose/direction','money/behavior','mood regulation','addiction/compulsions'] as const
const GOALS = ['healing','growth','self-discovery','trauma recovery','relationships','confidence','peace','purpose'] as const
const LEARNING = ['text','visual','audio','interactive'] as const
const ENGAGEMENT = ['passive','moderate','active'] as const
const MINUTES = [5,15,30,60] as const
const QUESTION_COUNTS = [3,4,5,6,7,8,9,10] as const
const ATTENTION = ['micro','short','standard'] as const
const INPUT_MODE = ['text','voice','either'] as const
const FLAGS = ['ADHD','ASD','PTSD','depression','anxiety','chronic pain/illness','meds','substance recovery'] as const
const RUMINATION = ['never','monthly','weekly','few times/week','daily'] as const
const TOPICS_AVOID = ['explicit trauma detail','self-harm content','abuse narratives','addiction content','sexual content'] as const
const CHALLENGES = ['stress/anxiety','low confidence','relationship struggles','past trauma','lack of purpose','feeling stuck','procrastination','anger/irritability','financial stress'] as const

const DEFAULT_PREFS: PrefsUpdate = {
  tones: ['gentle'],
  guideStyles: ['friend'],
  guidanceStrength: 'moderate',
  depth: 'moderate',
  primaryFocus: 'anxiety',
  goals: ['healing'],
  learningStyles: ['text'],
  engagement: 'moderate',
  minutesPerDay: 15,
  attentionSpan: 'standard',
  inputMode: 'text',
  flags: [],
  scheduleNote: '',
  stress0to10: 5,
  sleep0to10: 5,
  ruminationFreq: 'weekly',
  topicsToAvoid: [],
  triggerWords: '',
  challenges: [],
  challengeOther: '',
  freeform: '',
  anonymizedDataOK: true,
  exportPromiseShown: true,
  crisisNow: false,
  applyScope: 'future-only',
  preferredQuestionCount: undefined,
}

function computeLevers(form: PrefsUpdate) {
  const tone = form.tones.includes('direct') && !form.tones.includes('gentle') ? 'tough-love'
    : form.tones.includes('clinical') ? 'clinical'
    : form.tones.includes('spiritual') ? 'spiritual'
    : form.tones.includes('gentle') ? 'gentle' : 'neutral'

  const rawness = form.guidanceStrength === 'intense' ? 'high' : form.guidanceStrength === 'moderate' ? 'medium' : 'low'
  const depth = ['deep','profound'].includes(form.depth) ? 'deep' : form.depth === 'moderate' ? 'medium' : 'light'
  const cadence = form.engagement === 'active' ? 'daily' : form.engagement === 'moderate' ? 'weekly' : 'minimal'
  const actionDuration = form.minutesPerDay <= 5 ? 5 : form.minutesPerDay <= 15 ? 10 : 15
  return { tone, rawness, depth, cadence, actionDuration, primaryFocus: form.primaryFocus }
}

export default function PreferencesPage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const { checking, allowed } = useRequireOnboardingAndDiagnostic()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PrefsUpdate>(DEFAULT_PREFS)
  const [savedForm, setSavedForm] = useState<PrefsUpdate | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [audits, setAudits] = useState<Array<{ id: number; createdAt: string; changes: Record<string, unknown> }>>([])
  const prevFormRef = useRef<PrefsUpdate | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings')

  // Crisis banner duration (local)
  const crisisUntil = useMemo(() => {
    if (typeof window === 'undefined') return 0
    const v = window.localStorage.getItem('crisisBannerUntil')
    return v ? Number(v) : 0
  }, [])

  const crisisLockActive = form.crisisNow || (typeof window !== 'undefined' && Date.now() < (Number(window.localStorage.getItem('crisisBannerUntil')) || 0))

  const previewBefore = savedForm ? computeLevers(savedForm) : null
  const previewAfter = form ? computeLevers(form) : null

  useEffect(() => {
    if (!isLoaded) return
    if (!userId) {
      router.push('/sign-in')
      return
    }
    analytics.initialize(userId)
    analytics.trackEvent('prefs_opened')
    ;(async () => {
      try {
        const r = await fetch('/api/me/prefs')
        if (r.ok) {
          const data = await r.json()
          // validate + hydrate
          const parsed = PrefsSchema.safeParse(data)
          const next = parsed.success ? parsed.data : { ...DEFAULT_PREFS, ...data }
          setForm(next)
          setSavedForm(next)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
      try {
        const a = await fetch('/api/preferences/audits')
        if (a.ok) {
          const j = await a.json()
          setAudits(j.audits || [])
        }
      } catch {}
    })()
  }, [isLoaded, userId, router])

  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== JSON.stringify(savedForm))
  }, [form, savedForm])

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [isDirty])

  const toggleMulti = (arr: string[], value: string) => arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]

  const save = async () => {
    try {
      setSaving(true)
      setMessage(null)
      prevFormRef.current = savedForm
      setSavedForm(form) // optimistic

      const res = await fetch('/api/preferences', { method: 'PATCH', body: JSON.stringify(form), headers: { 'content-type': 'application/json' }})
      if (!res.ok) throw new Error('Save failed')

      analytics.trackEvent('prefs_saved', {
        primaryFocus: form.primaryFocus,
        guidanceStrength: form.guidanceStrength,
        depth: form.depth,
        minutesPerDay: form.minutesPerDay,
        engagement: form.engagement,
      })

      if (form.applyScope === 'retune-program') {
        analytics.trackEvent('prefs_retune_program')
      }

      setMessage('Preferences saved.')
      // refresh audits
      try {
        const a = await fetch('/api/preferences/audits')
        if (a.ok) {
          const j = await a.json()
          setAudits(j.audits || [])
        }
      } catch {}
    } catch (e) {
      console.error(e)
      setMessage('Save failed. Restored previous values.')
      if (prevFormRef.current) setSavedForm(prevFormRef.current)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const revertToAudit = async (auditId: number) => {
    const ok = confirm('Revert to this snapshot? This will create a new version you can undo later.')
    if (!ok) return
    try {
      const r = await fetch('/api/preferences/audits', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ auditId }) })
      if (r.ok) {
        const prefs = await fetch('/api/me/prefs')
        if (prefs.ok) {
          const data = await prefs.json()
          const parsed = PrefsSchema.safeParse(data)
          const next = parsed.success ? parsed.data : { ...DEFAULT_PREFS, ...data }
          setForm(next)
          setSavedForm(next)
        }
        const a = await fetch('/api/preferences/audits')
        if (a.ok) setAudits((await a.json()).audits || [])
        toast.success('Reverted to selected snapshot')
      } else {
        toast.error('Revert failed')
      }
    } catch (e) {
      console.error(e)
      toast.error('Revert failed')
    }
  }

  if (loading || checking) {
    return (
      <div className="p-6">Loading…</div>
    )
  }
  if (!allowed) return null

  const disableIntense = crisisLockActive

  return (
    <div className="min-h-screen-dvh bg-background">
      {/* Hero Section with Neon Heading */}
      <div className="relative overflow-hidden bg-background">
        <div className="relative max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="responsive-heading neon-heading key-info mb-4 [text-shadow:0_0_28px_rgba(204,255,0,0.9),0_0_56px_rgba(204,255,0,0.6),1px_1px_0_rgba(0,0,0,0.55),-1px_-1px_0_rgba(0,0,0,0.55)] [-webkit-text-stroke:1px_rgba(0,0,0,0.25)]">
              Your Preferences
            </h1>
            <p className="responsive-body text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Customize your healing journey experience to match your unique needs, 
              comfort level, and goals. These settings help us provide the most 
              effective and supportive experience for you.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex justify-center border-b border-border">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'settings' 
                  ? 'border-[#ccff00] text-[#ccff00] [text-shadow:0_0_14px_rgba(204,255,0,0.9),0_0_28px_rgba(204,255,0,0.6)]' 
                  : 'border-transparent text-muted-foreground hover:text-[#ccff00] hover:[text-shadow:0_0_8px_rgba(204,255,0,0.5)]'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all duration-200 ${
                activeTab === 'history' 
                  ? 'border-[#ccff00] text-[#ccff00] [text-shadow:0_0_14px_rgba(204,255,0,0.9),0_0_28px_rgba(204,255,0,0.6)]' 
                  : 'border-transparent text-muted-foreground hover:text-[#ccff00] hover:[text-shadow:0_0_8px_rgba(204,255,0,0.5)]'
              }`}
            >
              <History className="h-4 w-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
      <form className="lg:col-span-2 space-y-8" onSubmit={(e)=>{ e.preventDefault(); save() }}>
        {/* Communication & Depth */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-cyan">Communication & Depth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Tone</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TONES.map(t => (
                  <label key={t} className="flex items-center gap-2 border rounded-md p-2">
                    <Checkbox checked={form.tones.includes(t)} onCheckedChange={() => setForm({ ...form, tones: toggleMulti(form.tones, t) })} />
                    <span className="text-sm capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Guide style</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GUIDE_STYLES.map(g => (
                  <label key={g} className="flex items-center gap-2 border rounded-md p-2">
                    <Checkbox checked={form.guideStyles.includes(g)} onCheckedChange={() => setForm({ ...form, guideStyles: toggleMulti(form.guideStyles, g) })} />
                    <span className="text-sm capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">Guidance strength</Label>
                <div className="flex gap-3">
                  {GUIDANCE.map(g => (
                    <label key={g} className={`flex items-center gap-2 border rounded-md px-3 py-2 ${disableIntense && g === 'intense' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input type="radio" name="guidance" value={g} disabled={disableIntense && g === 'intense'} checked={form.guidanceStrength === g} onChange={() => setForm({ ...form, guidanceStrength: g as PrefsUpdate['guidanceStrength'] })} />
                      <span className="text-sm capitalize">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Depth</Label>
                <Select value={form.depth} onValueChange={(v)=> setForm({ ...form, depth: v as PrefsUpdate['depth'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPTHS.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="self-end">
                <Button type="button" variant="secondary" onClick={()=> toast.message('Tone sample', { description: sampleTone(previewAfter?.tone || 'gentle') })}>Test my tone</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Focus & Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-pink">Primary Focus & Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1 block">Primary focus</Label>
              <p className="text-xs text-muted-foreground mb-2">Changing focus will adjust the next prognostic questions.</p>
              <Select value={form.primaryFocus} onValueChange={(v)=> setForm({ ...form, primaryFocus: v as PrefsUpdate['primaryFocus'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIMARY_FOCUS.map(f => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Goals</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {GOALS.map(g => (
                  <label key={g} className="flex items-center gap-2 border rounded-md p-2">
                    <Checkbox checked={form.goals.includes(g)} onCheckedChange={() => setForm({ ...form, goals: toggleMulti(form.goals, g) })} />
                    <span className="text-sm capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning & Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-orange">Learning & Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Learning styles</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {LEARNING.map(l => (
                  <label key={l} className="flex items-center gap-2 border rounded-md p-2">
                    <Checkbox checked={form.learningStyles.includes(l)} onCheckedChange={() => setForm({ ...form, learningStyles: toggleMulti(form.learningStyles, l) as PrefsUpdate['learningStyles'] })} />
                    <span className="text-sm capitalize">{l}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2 block">Engagement</Label>
                <Select value={form.engagement} onValueChange={(v)=> setForm({ ...form, engagement: v as PrefsUpdate['engagement'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT.map(e => (<SelectItem key={e} value={e}>{e}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Minutes per day</Label>
                <Select value={String(form.minutesPerDay)} onValueChange={(v)=> setForm({ ...form, minutesPerDay: Number(v) as PrefsUpdate['minutesPerDay'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MINUTES.map(m => (<SelectItem key={m} value={String(m)}>{m}</SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">We’ll cap actions to this time.</p>
              </div>
              <div>
                <Label className="mb-2 block">Prognostic questions</Label>
                <Select value={String(form.preferredQuestionCount || '')} onValueChange={(v)=> setForm({ ...form, preferredQuestionCount: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    {QUESTION_COUNTS.map(q => (<SelectItem key={q} value={String(q)}>{q}</SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Optional: choose how many core questions you prefer.</p>
              </div>
              <div>
                <Label className="mb-2 block">Attention span</Label>
                <Select value={form.attentionSpan} onValueChange={(v)=> setForm({ ...form, attentionSpan: v as PrefsUpdate['attentionSpan'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATTENTION.map(a => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Input mode</Label>
                <Select value={form.inputMode} onValueChange={(v)=> setForm({ ...form, inputMode: v as PrefsUpdate['inputMode'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INPUT_MODE.map(i => (<SelectItem key={i} value={i}>{i}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lived Context & Constraints */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-purple">Lived Context & Constraints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Context flags</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {FLAGS.map(f => (
                  <label key={f} className="flex items-center gap-2 border rounded-md p-2">
                    <Checkbox checked={form.flags.includes(f)} onCheckedChange={() => setForm({ ...form, flags: toggleMulti(form.flags, f) })} />
                    <span className="text-sm capitalize">{f}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Schedule note</Label>
              <Input value={form.scheduleNote || ''} maxLength={120} onChange={(e)=> setForm({ ...form, scheduleNote: e.target.value })} placeholder="e.g., only evenings free, Fridays off" />
            </div>
          </CardContent>
        </Card>

        {/* Baselines */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-blue">Baselines</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Stress 0–10</Label>
              <Input type="number" min={0} max={10} value={form.stress0to10} onChange={(e)=> setForm({ ...form, stress0to10: clampNum(e.target.value, 0, 10) })} />
            </div>
            <div>
              <Label>Sleep quality 0–10</Label>
              <Input type="number" min={0} max={10} value={form.sleep0to10} onChange={(e)=> setForm({ ...form, sleep0to10: clampNum(e.target.value, 0, 10) })} />
            </div>
            <div>
              <Label>Rumination frequency</Label>
              <Select value={form.ruminationFreq} onValueChange={(v)=> setForm({ ...form, ruminationFreq: v as PrefsUpdate['ruminationFreq'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RUMINATION.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Triggers & Boundaries */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-red">Triggers & Boundaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Topics to avoid</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TOPICS_AVOID.map(t => (
                  <label key={t} className="flex items-center gap-2 border rounded-md p-2">
                    <Checkbox checked={form.topicsToAvoid.includes(t)} onCheckedChange={() => setForm({ ...form, topicsToAvoid: toggleMulti(form.topicsToAvoid, t) })} />
                    <span className="text-sm capitalize">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Trigger words (comma-separated)</Label>
              <Input value={form.triggerWords || ''} onChange={(e)=> setForm({ ...form, triggerWords: e.target.value })} placeholder="e.g., needles, hospital, blackout" />
            </div>
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-teal">Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CHALLENGES.map(c => (
                <label key={c} className="flex items-center gap-2 border rounded-md p-2">
                  <Checkbox checked={form.challenges.includes(c)} onCheckedChange={() => setForm({ ...form, challenges: toggleMulti(form.challenges, c) })} />
                  <span className="text-sm capitalize">{c}</span>
                </label>
              ))}
            </div>
            <div>
              <Label className="mb-1 block">Other</Label>
              <Input value={form.challengeOther || ''} onChange={(e)=> setForm({ ...form, challengeOther: e.target.value })} placeholder="Anything else you’re dealing with" />
            </div>
          </CardContent>
        </Card>

        {/* Freeform Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-rose">Freeform Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={5} value={form.freeform || ''} onChange={(e)=> setForm({ ...form, freeform: e.target.value })} placeholder="Anything else that helps tailor your plan?" />
          </CardContent>
        </Card>

        {/* Data & Safety */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-heading">Data & Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 border rounded-md p-3">
              <Checkbox checked={form.crisisNow} onCheckedChange={(v)=> {
                const checked = Boolean(v)
                setForm({ ...form, crisisNow: checked, guidanceStrength: checked ? 'mild' : form.guidanceStrength })
                analytics.trackEvent('prefs_crisis_toggle', { value: checked })
                if (checked && typeof window !== 'undefined') {
                  const until = Date.now() + 24*60*60*1000
                  window.localStorage.setItem('crisisBannerUntil', String(until))
                }
              }} />
              <div>
                <Label className="block">I need urgent help</Label>
                <p className="text-xs text-muted-foreground">If you’re in danger call 000. Lifeline 13 11 14, Beyond Blue 1300 22 4636.</p>
              </div>
            </div>
            {crisisLockActive && (
              <div className="text-sm p-3 rounded-md bg-amber-50 border">
                Safety mode active for 24h. Tough-love tone is disabled and guidance softened.
              </div>
            )}
            <div className="flex items-center gap-3 border rounded-md p-3">
              <Checkbox checked={form.anonymizedDataOK} onCheckedChange={(v)=> setForm({ ...form, anonymizedDataOK: Boolean(v) })} />
              <Label>Opt-in to anonymized data to improve the product</Label>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={async()=> {
                const r = await fetch('/api/preferences/export')
                if (r.ok) {
                  const blob = await r.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'export.json'
                  a.click()
                  URL.revokeObjectURL(url)
                }
              }}>Export my data</Button>
              <Button type="button" variant="destructive" onClick={async()=>{
                const ok = confirm('Delete all my data? This cannot be undone.')
                if (!ok) return
                const r = await fetch('/api/preferences/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirm: true }) })
                if (r.ok) toast.success('Your data has been deleted')
                else toast.error('Delete failed')
              }}>Delete my data</Button>
            </div>
          </CardContent>
        </Card>

        {/* Apply & Versioning */}
        <Card>
          <CardHeader>
            <CardTitle className="neon-glow-cyan">Apply & Versioning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Apply scope</Label>
                <Select value={form.applyScope} onValueChange={(v)=> setForm({ ...form, applyScope: v as PrefsUpdate['applyScope'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="future-only">Apply to future sessions only</SelectItem>
                    <SelectItem value="retune-program">Also retune my 30-day program recommendations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground self-end">Your next report and daily plan will reflect these settings. Past reports stay unchanged.</div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Change log</div>
              <div className="space-y-2 max-h-44 overflow-auto">
                {audits.length === 0 && (<div className="text-sm text-muted-foreground">No changes yet.</div>)}
                {audits.map(a => (
                  <div key={a.id} className="flex items-center justify-between border rounded-md p-2">
                    <div className="text-sm">{new Date(a.createdAt).toLocaleString()}</div>
                    <Button type="button" size="sm" variant="outline" onClick={()=> revertToAudit(a.id)}>Revert</Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving} variant="cta">
            {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>) : (<><Save className="mr-2 h-4 w-4" />Save changes</>)}
          </Button>
          {isDirty && <span className="text-sm text-amber-600">Unsaved changes</span>}
          {message && <span className="text-sm">{message}</span>}
          <Button type="button" variant="outline" onClick={()=> savedForm && setForm(savedForm)}>Revert unsaved</Button>
        </div>
      </form>

      {/* Preview */}
      <aside className="border rounded-xl p-4 space-y-3 h-fit sticky top-6">
        <h3 className="font-semibold neon-glow-pink">Personalization Preview</h3>
        <div className="text-sm space-y-1">
          <div className="flex items-center justify-between"><span className="font-medium">Tone</span><span>{previewAfter?.tone}</span></div>
          <div className="flex items-center justify-between"><span className="font-medium">Rawness</span><span>{previewAfter?.rawness}</span></div>
          <div className="flex items-center justify-between"><span className="font-medium">Depth</span><span>{previewAfter?.depth}</span></div>
          <div className="flex items-center justify-between"><span className="font-medium">Cadence</span><span>{previewAfter?.cadence}</span></div>
          <div className="flex items-center justify-between"><span className="font-medium">Action duration (max)</span><span>{previewAfter?.actionDuration} min</span></div>
          <div className="flex items-center justify-between"><span className="font-medium">Primary focus</span><span>{previewAfter?.primaryFocus}</span></div>
        </div>
        {previewBefore && previewAfter && (
          <div className="text-xs text-muted-foreground">
            Before → After
            <ul className="mt-1 space-y-1">
              <li>Tone: {previewBefore.tone} → {previewAfter.tone}</li>
              <li>Rawness: {previewBefore.rawness} → {previewAfter.rawness}</li>
              <li>Depth: {previewBefore.depth} → {previewAfter.depth}</li>
              <li>Cadence: {previewBefore.cadence} → {previewAfter.cadence}</li>
              <li>Action duration: {previewBefore.actionDuration} → {previewAfter.actionDuration} min</li>
            </ul>
          </div>
        )}
        <hr className="my-3" />
        <p className="text-sm italic text-foreground">"Test my tone"</p>
        <div className="p-3 rounded bg-muted text-sm text-foreground border">
          {sampleTone(previewAfter?.tone || 'gentle')}
        </div>
      </aside>
      </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <HistoryTab audits={audits} onRevert={revertToAudit} />
        </div>
      )}
    </div>
  )
}

// History Tab Component
function HistoryTab({ 
  audits, 
  onRevert 
}: { 
  audits: Array<{ id: number; createdAt: string; changes: Record<string, unknown> }>
  onRevert: (auditId: number) => void
}) {
  const [selectedAudit, setSelectedAudit] = useState<number | null>(null)
  const [comparisonAudit, setComparisonAudit] = useState<number | null>(null)

  const getFieldDisplayName = (field: string): string => {
    const displayNames: Record<string, string> = {
      tones: 'Tone',
      guideStyles: 'Guide Style',
      guidanceStrength: 'Guidance Strength',
      depth: 'Depth',
      primaryFocus: 'Primary Focus',
      goals: 'Goals',
      learningStyles: 'Learning Styles',
      engagement: 'Engagement',
      minutesPerDay: 'Minutes Per Day',
      attentionSpan: 'Attention Span',
      inputMode: 'Input Mode',
      flags: 'Context Flags',
      scheduleNote: 'Schedule Note',
      stress0to10: 'Stress Level',
      sleep0to10: 'Sleep Quality',
      ruminationFreq: 'Rumination Frequency',
      topicsToAvoid: 'Topics to Avoid',
      triggerWords: 'Trigger Words',
      challenges: 'Challenges',
      challengeOther: 'Other Challenges',
      freeform: 'Freeform Notes',
      anonymizedDataOK: 'Anonymized Data OK',
      crisisNow: 'Crisis Mode',
      applyScope: 'Apply Scope'
    }
    return displayNames[field] || field
  }

  const formatValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'number') {
      return value.toString()
    }
    return String(value || '')
  }

  const getChanges = (audit: { changes: Record<string, unknown> }) => {
    return Object.entries(audit.changes).map(([field, value]) => ({
      field,
      displayName: getFieldDisplayName(field),
      value: formatValue(value)
    }))
  }

  const getDiff = (audit1: { changes: Record<string, unknown> }, audit2: { changes: Record<string, unknown> }) => {
    const changes1 = getChanges(audit1)
    const changes2 = getChanges(audit2)
    const allFields = new Set([...changes1.map(c => c.field), ...changes2.map(c => c.field)])
    
    return Array.from(allFields).map(field => {
      const val1 = changes1.find(c => c.field === field)?.value || ''
      const val2 = changes2.find(c => c.field === field)?.value || ''
      return {
        field,
        displayName: getFieldDisplayName(field),
        before: val1,
        after: val2,
        changed: val1 !== val2
      }
    }).filter(diff => diff.changed)
  }

  if (audits.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Your preference changes will appear here once you start customizing your settings.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="neon-heading">Preference History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audits.map((audit, index) => (
              <div key={audit.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">
                      {index === 0 ? 'Current Settings' : `Change #${audits.length - index}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(audit.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAudit(selectedAudit === audit.id ? null : audit.id)}
                    >
                      {selectedAudit === audit.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setComparisonAudit(comparisonAudit === audit.id ? null : audit.id)}
                      >
                        {comparisonAudit === audit.id ? 'Cancel Compare' : 'Compare'}
                      </Button>
                    )}
                    {index > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onRevert(audit.id)}
                      >
                        Revert
                      </Button>
                    )}
                  </div>
                </div>

                {selectedAudit === audit.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h5 className="font-medium mb-3">Changes Made:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getChanges(audit).map((change) => (
                        <div key={change.field} className="text-sm">
                          <span className="font-medium">{change.displayName}:</span>
                          <span className="ml-2 text-muted-foreground">{change.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {comparisonAudit === audit.id && index > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h5 className="font-medium mb-3">Comparison with Previous:</h5>
                    <div className="space-y-2">
                      {getDiff(audit, audits[index - 1]).map((diff) => (
                        <div key={diff.field} className="text-sm p-2 bg-white dark:bg-gray-800 rounded border">
                          <div className="font-medium">{diff.displayName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-red-600 dark:text-red-400 line-through">
                              {diff.before || '(empty)'}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-green-600 dark:text-green-400">
                              {diff.after || '(empty)'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function clampNum(value: string, min: number, max: number): number {
  const n = Number(value)
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function sampleTone(tone: string): string {
  switch (tone) {
    case 'tough-love':
      return "You’re capable of more than you think. Pick one tiny action today—no excuses. We’ll build consistency from there."
    case 'clinical':
      return "We’ll proceed stepwise: track sleep onset latency, then introduce one intervention per day. The aim is measurable progress."
    case 'spiritual':
      return "Breathe in, breathe out. We’ll align small actions with your deeper intentions and meet each moment with compassion."
    case 'gentle':
    default:
      return "You’ve got this. We’ll keep it simple: one tiny win today, then repeat tomorrow."
  }
}

