import AIFlow from '@/components/AIFlow'

export default function Page() {
  const seed = {
    topic: 'Bounce Back Blueprint',
    stages: ['Trigger', 'Pause', 'Choose', 'Act', 'Review'],
    checklist: [
      '2 minute breath',
      'Text accountability buddy',
      'Walk 10 minutes',
      'Log one sentence in journal'
    ]
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Flow Preview</h1>
      <AIFlow seed={seed} />
    </main>
  )
}


