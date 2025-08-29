export interface ExportData {
  user: {
    id: string
    preferences: {
      tone: string
      voice: string
      rawness: string
      depth: string
      learning: string
      engagement: string
    }
  }
  diagnostic: {
    responses: Array<{
      question: string
      response: string
      insight: string
      timestamp: string
    }>
    summary: string
  }
  program: {
    progress: {
      completed: number
      total: number
      percentage: number
      currentDay: number
      streak: number
    }
    completedDays: Array<{
      day: number
      title: string
      completedAt: string
    }>
  }
  purchases: Array<{
    product: string
    purchasedAt: string
    active: boolean
  }>
}

export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

export function exportToCSV(data: ExportData): string {
  const csvRows: string[] = []
  
  // User preferences
  csvRows.push('Section,Field,Value')
  csvRows.push('User,ID,' + data.user.id)
  csvRows.push('User,Tone,' + data.user.preferences.tone)
  csvRows.push('User,Voice,' + data.user.preferences.voice)
  csvRows.push('User,Rawness,' + data.user.preferences.rawness)
  csvRows.push('User,Depth,' + data.user.preferences.depth)
  csvRows.push('User,Learning,' + data.user.preferences.learning)
  csvRows.push('User,Engagement,' + data.user.preferences.engagement)
  
  // Diagnostic responses
  csvRows.push('')
  csvRows.push('Diagnostic Responses')
  csvRows.push('Question,Response,Insight,Timestamp')
  data.diagnostic.responses.forEach(response => {
    csvRows.push(`"${response.question}","${response.response}","${response.insight}","${response.timestamp}"`)
  })
  
  // Program progress
  csvRows.push('')
  csvRows.push('Program Progress')
  csvRows.push('Day,Title,Completed At')
  data.program.completedDays.forEach(day => {
    csvRows.push(`${day.day},"${day.title}","${day.completedAt}"`)
  })
  
  // Purchases
  csvRows.push('')
  csvRows.push('Purchases')
  csvRows.push('Product,Purchased At,Active')
  data.purchases.forEach(purchase => {
    csvRows.push(`"${purchase.product}","${purchase.purchasedAt}","${purchase.active}"`)
  })
  
  return csvRows.join('\n')
}

export function exportToPDF(data: ExportData): string {
  // This would typically use a library like jsPDF
  // For now, we'll return a simple HTML representation
  return `
    <html>
      <head>
        <title>Unfuck Your Past - Data Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-bottom: 2px solid #007bff; }
          .field { margin: 10px 0; }
          .field strong { display: inline-block; width: 150px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f8f9fa; }
        </style>
      </head>
      <body>
        <h1>Unfuck Your Past - Data Export</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        
        <div class="section">
          <h2>User Preferences</h2>
          <div class="field"><strong>User ID:</strong> ${data.user.id}</div>
          <div class="field"><strong>Tone:</strong> ${data.user.preferences.tone}</div>
          <div class="field"><strong>Voice:</strong> ${data.user.preferences.voice}</div>
          <div class="field"><strong>Rawness:</strong> ${data.user.preferences.rawness}</div>
          <div class="field"><strong>Depth:</strong> ${data.user.preferences.depth}</div>
          <div class="field"><strong>Learning:</strong> ${data.user.preferences.learning}</div>
          <div class="field"><strong>Engagement:</strong> ${data.user.preferences.engagement}</div>
        </div>
        
        <div class="section">
          <h2>Diagnostic Summary</h2>
          <p>${data.diagnostic.summary}</p>
        </div>
        
        <div class="section">
          <h2>Program Progress</h2>
          <div class="field"><strong>Completed:</strong> ${data.program.progress.completed}/${data.program.progress.total} days</div>
          <div class="field"><strong>Percentage:</strong> ${data.program.progress.percentage}%</div>
          <div class="field"><strong>Current Day:</strong> ${data.program.progress.currentDay}</div>
          <div class="field"><strong>Streak:</strong> ${data.program.progress.streak} days</div>
        </div>
        
        <div class="section">
          <h2>Completed Days</h2>
          <table>
            <thead>
              <tr><th>Day</th><th>Title</th><th>Completed At</th></tr>
            </thead>
            <tbody>
              ${data.program.completedDays.map(day => 
                `<tr><td>${day.day}</td><td>${day.title}</td><td>${day.completedAt}</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Purchases</h2>
          <table>
            <thead>
              <tr><th>Product</th><th>Purchased At</th><th>Active</th></tr>
            </thead>
            <tbody>
              ${data.purchases.map(purchase => 
                `<tr><td>${purchase.product}</td><td>${purchase.purchasedAt}</td><td>${purchase.active ? 'Yes' : 'No'}</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
